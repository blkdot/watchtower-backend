const throng = require('throng')
const mongoose = require('mongoose')
const BigNumber = require('bignumber.js')

const redis = require('./redis')
const BitQuery = require('./lib/bitQuery')
const Config = require('./conf')

const {readFromRedisAsync} = require('./utils')
const { isHoneyPot, getHoneyPotTesting } = require('./lib/honeypot')
const Web3Lib = require('./lib/web3')
const WTW = Web3Lib.createERC20Contract('0x7040E822bB833EE6A5B69229D3560c418B1619C7', 'bsc')

/*
* mongo connection
*/
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
if(!Config.isProduction && !Config.isStaging) {
  mongoose.set('debug', true)
}
require('./models/Token')
require('./models/AdsRequest')

const Token = mongoose.model('Token')
const AdsRequest = mongoose.model('AdsRequest')

const cleanRedis = () => {
  redis.flushdb((err, succeeded) => {
    console.log('===================================================================================')
    console.log('[FLUSH REDIS] Finished.')
    console.log('err: ', err)
    console.log('succeeded: ', succeeded)
    console.log('===================================================================================')
  })
}

cleanRedis()

/**
 * It regularly gets new created tokens list, and add scanner request
 */
function start() {
  Config.syncTokenQueue.process(1, async(job, done) => {
    // disable overdue ads items
    let approvedAds = await AdsRequest.find({approved: true}).sort({approvedAt: 'desc'}).exec()
    approvedAds.forEach(async (ad) => {
      if (ad.activeDates) {
        let approvedAt = new Date(ad.approvedAt)
        approvedAt.setDate(approvedAt.getDate() + ad.activeDates)
        if (approvedAt < new Date()) {
          ad.approved = false
          await ad.save()
          console.log('[SYNC] Disabled the ads of ', ad.name)
        }
      }
    })

    // determine most scanned top5 tokens
    let mostScannedTokens = await Token.find().sort({searches: 'desc'}).limit(5).exec()
    let mostScannedTokensSymbols = mostScannedTokens.map(t => t.symbol).join(",")
    let mostScannedTokensAddresses = mostScannedTokens.map(t => t.address).join(",")
    redis.set(Config.MOST_SCANNED_TOKENS_SYMBOLS, mostScannedTokensSymbols)
    redis.set(Config.MOST_SCANNED_TOKENS_ADDRESSES, mostScannedTokensAddresses)

    console.log('[MOST-SCANNED] ', mostScannedTokensSymbols, mostScannedTokensAddresses)

    // total supply of $WTW
    let totalSupply = new BigNumber(await WTW.methods.totalSupply().call())
    redis.set(Config.WTW_TOTAL_SUPPLY_AMOUNT, totalSupply.dividedBy(10**9).toNumber())

    // calculate circulating supply of $WTW
    let burnedAmount = new BigNumber(await WTW.methods.balanceOf('0x000000000000000000000000000000000000dead').call())
    let lpAmount = new BigNumber(await WTW.methods.balanceOf('0xaf30b1b3f3c1626eb4c814fbd9847bdaa8152731').call())
    let contractAmount = new BigNumber(await WTW.methods.balanceOf('0x7040E822bB833EE6A5B69229D3560c418B1619C7').call())
    let lockedAmount = new BigNumber(await WTW.methods.balanceOf('0x2d045410f002a95efcee67759a92518fa3fce677').call())
    let circulatingAmount = totalSupply.minus(burnedAmount).minus(lpAmount).minus(contractAmount).minus(lockedAmount)
    redis.set(Config.WTW_CIRCULATING_SUPPLY_AMOUNT, circulatingAmount.dividedBy(10**9).toNumber())

    console.log('[WTW Supply] ', totalSupply.dividedBy(10**9).toNumber(), ' / ', circulatingAmount.dividedBy(10**9).toNumber())

    // delete not-scanned tokens
    let bscUnscannedTokens = await Token.countDocuments({scannedAt: null, network: 'bsc'})
    let ethUnscannedTokens = await Token.countDocuments({scannedAt: null, network: 'ethereum'})
    console.log('\n\n[SYNC] previous un-scanned tokens: ', bscUnscannedTokens, ethUnscannedTokens)

    await Token.deleteMany({scannedAt: null, network: 'bsc'})
    await Token.deleteMany({scannedAt: null, network: 'ethereum'})
    console.log('\[SYNC] Deleted un-scanned tokens. ', bscUnscannedTokens + ethUnscannedTokens)

    let since, till, now, repeatTick = 0
    now = new Date()
    till = new Date()
    since = new Date()
    since.setDate(till.getDate() - 2)

    let result, fetchedRecords = {bsc: 0, ethereum: 0}
    console.log('\n[SYNC] Syncing tokens between ', since.toISOString(), till.toISOString(), repeatTick)

    for (const network of ['bsc', 'ethereum']) {
      try {
        result = await BitQuery.sendRequest(
          BitQuery.makeQueryLatestCreatedTokens(since.toISOString(), till.toISOString(), network)
        )

        if (result && result.data.ethereum.smartContractCalls.length > 0) {
          console.log('[SYNC] Network: ', network, result.data.ethereum.smartContractCalls.length)
          fetchedRecords[network]  += result.data.ethereum.smartContractCalls.length

          for (const token of result.data.ethereum.smartContractCalls) {
            let tokenRecord = await Token.findOne({address: token.smartContract.address.address}).exec()
            if (!tokenRecord) {
              console.log('[SYNC] New token in ', network, ' \t', 
              token.smartContract.address.address, ', ', 
              token.smartContract.currency.symbol, ', ', 
              token.smartContract.currency.name, ', ')

              tokenRecord = new Token()
              tokenRecord.address = token.smartContract.address.address
              tokenRecord.network = network
              tokenRecord.name = token.smartContract.currency.name
              tokenRecord.symbol = token.smartContract.currency.symbol
              tokenRecord.decimals = token.smartContract.currency.decimals

              tokenRecord.blockHeight = token.block.height
              tokenRecord.created = token.block.timestamp.time
              tokenRecord.searches = 0

              await tokenRecord.save()
            }
          }
        }
      } catch(e) {
        console.error('[SYNC] Error while fetching newly created tokens in ', network, '\n', e)
        result = null
        continue
      }
    }

    console.log('\n\n[SYNC] Fetched new launched tokens  ', fetchedRecords['bsc'], fetchedRecords['ethereum'])

    // Scan new launched tokens
    let newTokens = await Token.find({scannedAt: null})
    newTokens.forEach(async (t) => {
      await Config.subScannerQueue.add({
        savedToken: t
      })
    })
    console.log('\n\n[SYNC] scanning new tokens ', newTokens.length)


    // Re-scanning latest tokens
    newTokens = await Token.find().sort({created: 'desc'}).skip(10000).limit(2000)
    newTokens.forEach(async (t) => {
      await Config.subScannerQueue.add({
        savedToken: t
      })
    })
    console.log('\n\n[SYNC] Re-scanning new tokens ', newTokens.length)

    // Re-scanning unlaunched tokens
    newTokens = await Token.find({unLaunched: true}).sort({created: 'desc'}).limit(2000)
    newTokens.forEach(async (t) => {
      await Config.subScannerQueue.add({
        savedToken: t
      })
    })
    console.log('\n\n[SYNC] Re-scanning unLaunched tokens ', newTokens.length)

    done()
  })
}

start()
