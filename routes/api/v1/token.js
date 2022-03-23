const mongoose = require('mongoose')
const router = require('express').Router()
const redis = require('../../../redis')

const BitQuery = require('../../../lib/bitQuery')
const Cors = require('../../../conf/cors')
const slowDown = require('../../../conf/slowdown')
const processSearchTokenRequest = require('../../../lib')
const Config = require('../../../conf')
const {isValidAddress, readFromRedisAsync} = require('../../../utils')

const Token = mongoose.model('Token')

/**
 *  get most scanned tokens
 */
router.get('/most', Cors, async function(req, res, next) {
  const symbols = await readFromRedisAsync(Config.MOST_SCANNED_TOKENS_SYMBOLS)
  const addresses = await readFromRedisAsync(Config.MOST_SCANNED_TOKENS_ADDRESSES)
  res.json({
    symbols,
    addresses
  })
})

/**
 *  main scanning endpoint
 *  @param token: address
 */
router.get('/:token', Cors, async function(req, res, next) {
  console.log('[Token] Origin / Host : ', req.headers.origin, req.headers.host)
  await processSearchTokenRequest(req.params.token.toLowerCase(), req, res)
})


/**
 * return saved token immediately
 * @param token: address
 */
router.get('/:token/saved', Cors, async function(req, res, next) {
  let tokenId = req.params.token

  if (!tokenId || !isValidAddress(tokenId.toLowerCase())) {
    console.error('[TOKEN] Empty request! ')
    return res.sendStatus(404)
  }

  let token0 = await Token.findOne({address: tokenId.toLowerCase()})
  if (token0) {
    return res.json({
      address: token0.address,
      riskRating: token0.riskRating,
      unLaunched: token0.unLaunched,
      isScammer: token0.isScammer,
      honeypot: token0.honeypot
    })
  }

  return res.sendStatus(404)
})

module.exports = router
