const throng = require('throng')
const Queue = require("bull")
const axios = require('axios')
const mongoose = require('mongoose')
const redis = require('./redis')

const {isValidAddress, isActiveAddress, readFromRedisAsync} = require('./utils')

const BitQuery = require('./lib/bitQuery')
const TokenStore = require('./lib/tokenStore')
const TokenLib = require('./lib/token')
const HoldersLib = require('./lib/holders')
const Web3Lib = require('./lib/web3')

const { getInfoFromSourceCode } = require('./lib/contractSource')
const { isHoneyPot, getHoneyPotTesting } = require('./lib/honeypot')

const Config = require('./conf')
const ExceptionsData = require('./data/scanExceptions.json')

/*
* mongo connection
*/
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
if(!Config.isProduction && !Config.isStaging) {
  mongoose.set('debug', true)
}
require('./models/Token')
require('./models/TokenFix')

const Token = mongoose.model('Token')
const TokenFix = mongoose.model('TokenFix')
const {castValueTypeFromString} = require('./data/tokenFields')

const workers = Number(process.env.WEB_CONCURRENCY) || 2
const maxJobsPerWorker = Number(process.env.SUB_SCANNER_CONCURRENCY) || 10

console.log('\n\n[SUB-SCANNER] Start worker ... (process: ', process.pid, ')')

/**
 *  Get all tokens info, and caching for further request
 *  [IMPORTANT] Do not remove it!
*/
TokenStore.refreshTokensFromCoingecko()

const delayMs = async (interval) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true)
    }, interval)
  })
}

function start() {
  /**
   * Scanner Worker
   */
  Config.subScannerQueue.process(maxJobsPerWorker, async (job, done) => {
    let token, result, liquidityPairsList = [], liquidityPools = []

    if (!job.data.savedToken) {
      console.log('[SUB-SCANNER] Invalid scan request')
      return done()
    }

    // delay the job, to prevent massive scanning to bitquery
    await delayMs(500)

    token = job.data.savedToken
    console.log('[SUB-SCANNER] New request of ', token.address, '  dyno: ', process.env.DYNO)

    if (token.scannedAt && token.scannedAt > Date.now() - Config.TS_INTERVAL_FOR_DAILY_SCANNING) {
      // If scanned recently, then quit
      // console.log('[SUB-SCANNER] Scanned already ', token.address)
      return done()
    }

    job.progress(10)

    let totalSupply = await TokenLib.getTotalSupply(token.address, token.network)
    let burnedAmount = await TokenLib.getBurnedAmount(token.address, token.network)
    job.progress(20)

    /**
     * Get liquidity pairs list
    */
    try {
      result = await BitQuery.sendRequest(
        BitQuery.makeQueryTokenPairs(token.address, token.network)
      )
      liquidityPairsList = result.data.ethereum.dexTrades
        .filter(trade => Config.MAIN_LP_PAIRS.find(stable => stable === trade.pair.symbol))
        .filter(trade => trade.trades > 100)
        .map(trade => ({
          pairSymbol: trade.pair.symbol,  /* pair symbol, WBNB */
          pairAddress: trade.pair.address,  /* address, WBNB address */
          poolAddress: trade.poolToken.address.address, /* liquidity pair address */
        }))
    } catch(e) {
      // console.error('[SUB-SCANNER] Error while fetching liquidity pairs.', token.address, token.symbol, token.network)
      done(new Error('error-while-fetching-lp'))
      return
    }
    job.progress(30)

    /**
     * get major liquidity pools info
     *
    */
    const tokenContract = Web3Lib.createERC20Contract(token.address, token.network)

    for (let pair of liquidityPairsList) {
      try {
        const pairContract = Web3Lib.createERC20Contract(pair.pairAddress, token.network)
        const tokenHoldings = await tokenContract.methods.balanceOf(pair.poolAddress).call()
        const pairHoldings = await pairContract.methods.balanceOf(pair.poolAddress).call()
        const pairDecimals = await pairContract.methods.decimals().call()

        const balances = [
          {
            symbol: token.symbol,
            holdings: tokenHoldings / (10 ** token.decimals),
            price: null
          },
          {
            symbol: pair.pairSymbol,
            holdings: pairHoldings / (10 ** pairDecimals),
            price: null
          }
        ]

        let poolInfo = {...pair, tokens: balances}
        // get holders of LP token
        let lpHolders = await HoldersLib.fetchHolders(pair.poolAddress, token.network, 40, 9)
        poolInfo['totalLpTokens'] = 0
        for (let holder of lpHolders) {
          poolInfo['totalLpTokens'] += Number(holder.TokenHolderQuantity)
        }
        let orderedLpHolders = lpHolders.slice(0, 20)
        // Filter contracts entity from holders
        let [contractLpHolders, nonContractLpHolders] = await HoldersLib.splitTokenHolders(orderedLpHolders, token.network)
        let sumOfLpLockedTokens = 0
        for (let holder of contractLpHolders) {
          sumOfLpLockedTokens += Number(holder.TokenHolderQuantity)
        }
        poolInfo['lockedLpTokensRate'] = (sumOfLpLockedTokens / poolInfo['totalLpTokens']) || 0
        poolInfo['totalLpTokens'] /= 1000000000000000000

        liquidityPools.push(poolInfo)
      } catch(e) {
        // console.error('[SUB-SCANNER] Error while fetching liquidity pool info. ', token.address, token.symbol, pair.pairSymbol, token.network)
        done(new Error('error-while-fetching-lp'))
        return
      }
    }
    job.progress(50)

    /**
     *  Get all related tokens price
     */
    let prices = {
      BUSD: 1,
      USDC: 1,
      USDT: 1,
    }
    try {
      prices['WBNB'] = Number(await TokenLib.fetchEthPrice('bsc'))
      prices['WETH'] = Number(await TokenLib.fetchEthPrice('eth'))
    } catch(e) {
      done(new Error('error-while-fetching-eth-price'))
      return
    }

    let pairTokens = liquidityPairsList.slice(0, 2).map(pair => ({symbol: pair.pairSymbol, address: pair.pairAddress}))
    for (let item of [...pairTokens, {symbol: token.symbol, address: token.address}]) {
      if (prices[item.symbol]) continue

      try {
        result = await BitQuery.sendRequest(BitQuery.makeQueryLatestPriceByETH(item.address, token.network))
        if (result.data.ethereum.dexTrades && result.data.ethereum.dexTrades.length) {
          prices[item.symbol] = result.data.ethereum.dexTrades[0]["quotePrice"] * prices[Config.MAIN_TOKEN[token.network]]
        }
      } catch(e) {
        // console.error('[SUB-SCANNER] Error while fetching token price by ETH.', item.symbol)
        done(new Error('error-while-fetching-price'))
        return
      }
    
      if (!prices[item.symbol]) {
        try {
          result = await BitQuery.sendRequest(BitQuery.makeQueryLatestPrice(token.address, token.network))
          if (result.data.ethereum.dexTrades && result.data.ethereum.dexTrades.length) {
            prices[item.symbol] = result.data.ethereum.dexTrades[0]["quotePrice"]
          }
        } catch(e) {
          console.error('[SUB-SCANNER] Error while fetching token price by USD.', item.symbol)
          done(new Error('error-while-fetching-price'))
          return
        }
      }
    }

    // update liquidity pools with prices
    liquidityPools.forEach(pool => {
      pool.tokens.forEach(poolToken => {
        poolToken.price = prices[poolToken.symbol]
      })
    })
    job.progress(60)

    /**
     *  Get Top 5 Holders
     */  
    let totalHolders = await HoldersLib.fetchHoldersCount(token.address, token.network)
    if (totalHolders < 0 || isNaN(totalHolders)) {
      console.log('[SUB-SCANNER] Error while fetching holders count ...')
      done(new Error('error-while-fetching-holders'))
      return
    }
    let top20Holders = await HoldersLib.fetchHolders(token.address, token.network, 20, token.decimals)

    let contractHolders, nonContractHolders, top5NonContractHolders, top5Holders
    try {
      [contractHolders, nonContractHolders] = await HoldersLib.splitTokenHolders(top20Holders, token.network)
      top5NonContractHolders = nonContractHolders.filter(item => isActiveAddress(item.TokenHolderAddress)).slice(0, 5)
      top5Holders = top5NonContractHolders.map(
        holder => ({
          holderAddress: holder.TokenHolderAddress,
          quantity: holder.TokenHolderQuantity,
          percent: holder.TokenHolderQuantity / totalSupply,
          value: prices[token.symbol] ? (holder.TokenHolderQuantity * prices[token.symbol]) : -1
        })
      )
    } catch(e) {
      done(new Error('error-in-top5-holders'))
      return
    }

    let top5Percent = 0, top5PercentBurnAdjusted = 0
    for (let holder of top5Holders) {
      top5Percent += holder.percent
      top5PercentBurnAdjusted += holder.quantity / (totalSupply - burnedAmount)
    }
    job.progress(90)

    /**
     *  Detect mint() feature
     */
    let mintEnabled, compilerVersion
    try {
      let [_mintEnabled, _compilerVersion] = await getInfoFromSourceCode(token.address, token.network)
      mintEnabled = _mintEnabled
      compilerVersion = _compilerVersion
    } catch(e) {
      done(new Error('error-while-fetching-source'))
      return
    }

    /**
     *  Detect renouncedOwnership
     */
    result = null
    let renouncedOwnership = false
    try {
      result = await BitQuery.sendRequest(BitQuery.makeQueryRenouncedInfo(token.address, token.network))

      if (result && (result.data.ethereum.smartContractCalls.length > 0)) {
        renouncedOwnership = true
      }
    } catch(e) {
      // console.error('[SUB-SCANNER] Error while fetching renouncedOwnership.', token.address, token.symbol, token.network)
      return done(new Error('error-while-fetching-renounced'))
    }
    /**
     *  Honeypot Testing
     */
    let honeypot
    if (token.network !== 'ethereum') {
      honeypot = await getHoneyPotTesting(token.address, token.network)

      // there is some error in honeypot API
       // so in case of error, resume the old result
      if (honeypot === 'UNKNOWN' && job.data.savedToken && job.data.savedToken.scannedAt) {
        console.log('\n\n[HONEYPOT] Roll back from previous result: ', job.data.savedToken.honeypot)
        honeypot = job.data.savedToken.honeypot
      }
    }

    /**
     *  Calculate Risk Rating
     * 
     *  if unlocked LP > 50%, then fail to rate risk
     *  if there is mint(), and not renounced ownership, then also fail to rate risk
     * 
     */
    let riskRating = 0
    if (
      (totalSupply > burnedAmount) &&
      (liquidityPools.length > 0) && 
      ((token.network === 'ethereum') || !isHoneyPot(honeypot))
    ) {
      // top 5 holders
      if (top5PercentBurnAdjusted < 0.04) {
        riskRating = 5
      } else if (top5PercentBurnAdjusted < 0.075) {
        riskRating = 4
      } else if (top5PercentBurnAdjusted < 0.1) {
        riskRating = 3
      } else if (top5PercentBurnAdjusted < 0.15) {
        riskRating = 2
      } else if (top5PercentBurnAdjusted < 0.2) {
        riskRating = 1
      }

      // locked lp, +3 point
      if ((token.network === 'ethereum') || (liquidityPools[0].lockedLpTokensRate > 0.5)) {
        riskRating += 3
      }

      // renounce
      riskRating += (renouncedOwnership ? 2 : 1)
    } else if ((totalSupply > burnedAmount) && (liquidityPools.length === 0)) {
      // top 5 holders
      if (top5PercentBurnAdjusted < 0.04) {
        riskRating = 5
      } else if (top5PercentBurnAdjusted < 0.075) {
        riskRating = 4
      } else if (top5PercentBurnAdjusted < 0.1) {
        riskRating = 3
      } else if (top5PercentBurnAdjusted < 0.15) {
        riskRating = 2
      } else if (top5PercentBurnAdjusted < 0.2) {
        riskRating = 1
      }

      // renounce
      riskRating += (renouncedOwnership ? 2 : 1)
    }

    // console.log('[SUB-SCANNER] Fetch finished. Risk Rate: ', riskRating, token.symbol, '/', token.address)
 
    let jsonResponse = {
      ...token, 

      compilerVersion,

      price: prices[token.symbol],
      totalSupply, 
      burnedAmount,
      
      totalHolders,
      top5Holders,
      top5Percent,
      top5PercentBurnAdjusted,

      mintEnabled,
      renouncedOwnership,
      honeypot,
      
      liquidityPools,
      otherPrices: prices,
      
      riskRating,
      scannedAt: Date.now(),
      unLaunched: liquidityPools.length === 0,
    }

    // update by manual exceptions data
    let manualUpdateFields = await TokenFix.find({address: token.address.toLowerCase()})
    manualUpdateFields.forEach(_manualFix => {
      jsonResponse[_manualFix.fieldName] = castValueTypeFromString(_manualFix.fieldName, _manualFix.value)
    })

    // save into database
    try {
      await Token.updateOne({address: token.address}, jsonResponse)
      console.log('[SUB-SCANNER] >> Succeed ', token.address, token.network)
    } catch(e) {
      // console.log('[SUB-SCANNER] Failed to updated database.', token.address)
    }
    job.progress(100)
    done()
  })
}

throng({
  workers, start
})
