const mongoose = require('mongoose')
const router = require('express').Router()
const mailgun = require('mailgun-js')
const mailer = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
})

const Cors = require('../../../conf/cors')
const slowDown = require('../../../conf/slowdown')

const Audit = mongoose.model('Audit')

const {
  isValidAddress, 
  isActiveAddress, 
  readFromRedisAsync
} = require('../../../utils')

/**
 *  Return all approved audits list
 */
router.get('/', slowDown, Cors, async function(req, res, next) {
  let allAudits = await Audit.find({approved: true}).sort({utility: 'asc'}).exec()
  return res.json(allAudits)
})


/**
 * New Audit Request subscription
 */
router.post('/', slowDown, Cors, async function(req, res, next) {
  try {
    let newRequest = await Audit.create(req.body)
    console.log('created result: ', newRequest)

    // send email by mail gun
    const data = {
      from: 'noreply@cryptowatchtower.io',
      to: process.env.ADMIN_CONTACT_ADDRESS || 'admin@cryptowatchtower.io',
      subject: 'Audit request arrived.',
      text: 
`
Contract address: ${newRequest.contractAddress}
Utility: ${newRequest.utility}
Owner Address(Wallet): ${newRequest.ownerAddress}
Owner Name: ${newRequest.ownerName}
Liquidity Pool: ${newRequest.liquidityPool}
Email: ${newRequest.email}
Site: ${newRequest.siteLink}

Details: ${newRequest.details}
`
    }

    mailer.messages().send(data, function(error, body) {
      console.log('[MAILGUN] ', body, error)
    })

    return res.json({
      result: 'OK'
    })
  } catch(e) {
    res.sendStatus(400)
  }
})

module.exports = router
