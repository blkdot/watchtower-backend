const mongoose = require('mongoose')
const router = require('express').Router()
const mailgun = require('mailgun-js')
const mailer = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
})

const Cors = require('../../../conf/cors')
const slowDown = require('../../../conf/slowdown')

const Subscription = mongoose.model('Subscription')
const AdsRequest = mongoose.model('AdsRequest')

/**
 *  API Subscription
 */
router.post('/api', slowDown, Cors, async function(req, res, next) {
  try {
    let newRequest = await Subscription.create(req.body)
    console.log('created result: ', newRequest)

    // send email by mail gun
    const data = {
      from: 'noreply@cryptowatchtower.io',
      to: process.env.ADMIN_CONTACT_ADDRESS || 'admin@cryptowatchtower.io',
      subject: 'API subscription request arrived.',
      text: 
`
Utility: ${newRequest.utility}
Name: ${newRequest.name}
Email: ${newRequest.email}

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

/**
 * Advertising Subscription
 */
router.post('/ads', slowDown, Cors, async function(req, res, next) {
  try {
    let newAdsRequest = await AdsRequest.create(req.body)
    console.log('created result: ', newAdsRequest)

    // send email by mail gun
    const data = {
      from: 'noreply@cryptowatchtower.io',
      to: process.env.ADMIN_CONTACT_ADDRESS || 'admin@cryptowatchtower.io',
      subject: 'Advertising request arrived.',
      text: 
`
Email: ${newAdsRequest.email}
Name: ${newAdsRequest.name}
Ads Link: ${newAdsRequest.siteLink}
Transaction Link: ${newAdsRequest.transactionLink}

Ads Files: ${newAdsRequest.files[0]}
          ${newAdsRequest.files[1] ? newAdsRequest.files[1] : ''}
          ${newAdsRequest.files[2] ? newAdsRequest.files[2] : ''}
`
    }

    mailer.messages().send(data, function(error, body) {
      console.log('[MAILGUN] ', body, error)
    })

    return res.json({
      result: 'OK'
    })
  } catch(e) {

  }
})

module.exports = router
