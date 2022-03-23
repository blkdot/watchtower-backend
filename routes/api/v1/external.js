const router = require('express').Router()
const mongoose = require('mongoose')
const External = mongoose.model('External')
const Token = mongoose.model('Token')

const processSearchTokenRequest = require('../../../lib')
const { isHoneyPot } = require('../../../lib/honeypot')
/*
async function consumePlan(req, res, next) {
  console.log('[API] Origin/Host/API-KEY: ', req.headers.origin, req.headers.host, req.headers['x-api-key']) 
  if (!req.headers['x-api-key']) {
    return res.sendStatus(406)
  }

  const account = await External.findOne({apiKey: req.headers['x-api-key']})
  if (account && account.left > 0) {
    console.log('[API] Key: ', req.headers['x-api-key'], ' Left: ', account.left)
    await External.updateOne({apiKey: req.headers['x-api-key']}, {left: account.left - 1})
    return next()
  } else if (account && account.left == 0) {
    console.log('[API] Expired Key: ', req.headers['x-api-key'])
  } else {
    console.log('[API] Not API Key presents from ', req.ip)
  }

  return res.sendStatus(406)
}
*/

/**
 * ===================================================================================
 * 
 *  External API Endpoints for 3rd party platforms
 * 
 * ===================================================================================
 */


/**
 * Individual token scanning
 */
router.post('/request/:token', async function(req, res, next) {
  await processSearchTokenRequest(
    req.params.token, 
    req, 
    res,
    ['address', 'network', 'name', 'symbol', 'decimals', 'created', 'riskRating', 'scannedAt', 'unLaunched', 'isScammer', 'honeypot'],
    false
  )
})

/**
 * Return all risky tokens, just high-risk tokens
 */
router.get('/blacklists', async function(req, res, next) {
  let offset = 0, network = 'bsc'
  let counts, pages, page = 1, perPage = 1000

  if (typeof req.query.network !== 'undefined') {
    network = req.query.network
  }
  if (typeof req.query.perPage !== 'undefined') {
    perPage = Number(req.query.perPage)
  }
  if (perPage > 2000) {
    perPage = 2000
  }
  counts = await Token.countDocuments({network}).where('riskRating').lt(4)
  pages = Math.ceil(counts / perPage)

  if (typeof req.query.page !== 'undefined') {
    page = Number(req.query.page)
  }
  if (page > pages) {
    page = pages
  }
  offset = perPage * (page - 1)
  
  let tokens = await Token.find({network}).where('riskRating').lt(4).sort({createdAt: 'asc'}).limit(perPage).skip(offset).exec()

  return res.json({
    network,
    counts,
    perPage,
    pages,
    page,
    results: tokens.map(t => t.network === 'ethereum' ? ({
      address: t.address,
      riskRating: t.riskRating
    }) : ({
      address: t.address,
      riskRating: t.riskRating,
      honeypot: isHoneyPot(t.honeypot)
    }))
  })
})

/**
 * Return all scammers address
 */
router.get('/scams', async function (req, res, next) {
  let scams = await Token.find({isScammer: true}).sort({createdAt: 'asc'}).exec()

  return res.json(scams.map(token => token.address))
})

module.exports = router
