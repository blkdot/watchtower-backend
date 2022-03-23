const mongoose = require('mongoose')
const redis = require('../redis')
const Config = require('../conf')

const Token = mongoose.model('Token')

const {
  isValidAddress, 
  isActiveAddress, 
  readFromRedisAsync
} = require('../utils')

const TokenStore = require('../lib/tokenStore')

async function processSearchTokenRequest(tokenId, req, res, keys=[], updateSearchCount=true) {
  if (!tokenId || !isValidAddress(tokenId.toLowerCase())) {
    console.error('[TOKEN] Empty request! ')
    return res.sendStatus(404)
  }

  /**
   * Search token from DB
   */
  // let tokenRegex = new RegExp(tokenId, 'i')
  let token0 = await Token.findOne({address: tokenId.toLowerCase()})
  let address

  if (token0) {
    /**
     * Check last updated timestamp
     */
    const now = Date.now()
    let updateTsInterval
    if (token0.totalHolders > Config.HOLDERS_LIMIT_OF_SMALL_TOKENS) {
      updateTsInterval = Config.TS_INTERVAL_FOR_BIG_TOKENS
    } else if(token0.createdAt > now - Config.TS_INTERVAL_LIMIT_OF_NEW_TOKENS) {
      updateTsInterval = Config.TS_INTERVAL_FOR_NEW_TOKENS
    } else {
      updateTsInterval = Config.TS_INTERVAL_FOR_SMALL_TOKENS
    }

    // if it is latest, then return
    if ((token0.scannedAt + updateTsInterval) >= now) {
      console.log('[TOKEN] Trying to update token in DB')
      if (updateSearchCount) {
        await Token.updateOne({address: token0.address}, {searches: token0.searches + 1})
      }

      console.log('\n\n[TOKEN] Return saved token: ', JSON.stringify(token0))

      let filteredResult = {}
      if (keys.length > 0) {
        keys.forEach(key => {
          filteredResult[key] = token0[key]
        })
      } else {
        filteredResult = token0
      }

      return res.json({
        state: 'completed',
        result: filteredResult
      })
    }
    address = token0.address
  } else {
    /**
     * Search token from coingecko list
     */
    let token1 = TokenStore.searchTokenFromCoingecko(tokenId)
    if (!token1 && (!isValidAddress(tokenId) || !isActiveAddress(tokenId))) {
      console.error('[TOKEN] Not found! ', tokenId)
      return res.sendStatus(404)
    }

    address = token1 ? token1.address.toLowerCase() : tokenId
  }

  console.log('\n[TOKEN] Address: ', address)

  /**
   * Check if already searched before
   */
  let prevJobID = await readFromRedisAsync(Config.SCAN_WORKER_ID(address))

  if (prevJobID) {
    /**
     * If already searched, then get the old result
     */
    console.log('[TOKEN] This is not first request. Job ID: ', prevJobID)

    let job, state
    job = await Config.mainScannerQueue.getJob(prevJobID)
    if (job) {
      state = await job.getState()

      if (state !== 'failed') {
        return res.json({
          state,
          progress: job._progress,
          reason: job.failedReason,
          result: {}
        })
      } else {
        // if failed in the last time, but it is old, then re-scan
        // or else, return the faild result again
        let prevScanTimestamp = Number(await readFromRedisAsync(Config.SCAN_TIME_ID(address)))
        if (prevScanTimestamp + Config.TS_INTERVAL_FOR_SMALL_TOKENS >= Date.now()) {
          // if token exists, then return the old result
          if (token0 && token0.scannedAt) {
            let filteredResult = {}
            if (keys.length > 0) {
              keys.forEach(key => {
                filteredResult[key] = token0[key]
              })
            } else {
              filteredResult = token0
            }

            console.log('[Token] Return old result in failed status ...')
            return res.json({
              state: 'completed',
              result: filteredResult
            })
          }
          console.log('[Token] Return failed status directly')

          return res.json({
            state,
            progress: job._progress,
            reason: job.failedReason,
            result: {}
          })
        }

        console.log('[TOKEN] Retry scanning for the previous failed response: ', address)
      }
    }
  }

  /**
   * Add search request into queue, and background worker will execute immediately.
   */
  let job = await Config.mainScannerQueue.add({
    token: tokenId, 
    address, 
    savedToken: token0,
    updateSearchCount
  })

  redis.set(Config.SCAN_WORKER_ID(address), job.id)
  redis.set(Config.SCAN_TIME_ID(address), Date.now())

  console.log('[TOKEN] Registered new job : ', job.id)

  res.json({
    state: 'pending',
    result: {}
  })
}


module.exports = processSearchTokenRequest
