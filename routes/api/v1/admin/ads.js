const router = require('express').Router()
const mongoose = require('mongoose')
const AdsRequest = mongoose.model('AdsRequest')
const Validator = require('validatorjs')

const {auth} = require('../../../../conf/auth-admin')
const {AdRules} = require('../../../../conf/rules')
const Config = require('../../../../conf')
const {isValidAddress, isActiveAddress} = require('../../../../utils')

// return all AdsRequests
router.get('/', auth.required, async function(req, res, next) {
  let allAds = await AdsRequest.find().sort({createdAt: 'desc'}).exec()

  return res.json(allAds)
})
/*
// create Ads
router.post('/', auth.required, async function(req, res, next) {
  // validation
  const validator = new Validator(req.body, AdRules)
  if (validator.fails()) {
    return res.status(404).send({errors: validator.errors.all()})
  }

  try {
    let _ad = new AdsRequest(req.body)
    await _ad.save()
    console.log('[Admin] Created new ads request.', req.body.email, req.body.siteLink)
  } catch(e) {
    return res.sendStatus(404)
  }

  return res.json('OK')
})
*/
// get ad details
router.get('/:id', auth.required, async function (req, res, next) {
  if (!req.params.id) {
    return res.sendStatus(404)
  }

  let _ad = await AdsRequest.findById(req.params.id)
  if (!_ad) {
    return res.sendStatus(404)
  }

  return res.json(_ad)
})

router.post('/:id', auth.required, async function (req, res, next) {
  if (!req.params.id) {
    return res.sendStatus(404)
  }

  let _ad = await AdsRequest.findById(req.params.id)
  if (!_ad) {
    return res.sendStatus(404)
  }

  console.log('\n\nAd Details: \n', req.body)
  
  // validation
  const validator = new Validator(req.body, AdRules)
  if (validator.fails()) {
    return res.status(404).send({errors: validator.errors.all()})
  }

  let _prevApproved = _ad.approved
  try {
    // update approvedAt
    let body = req.body
    if (!_prevApproved && req.body.approved) {
      body.approvedAt = new Date()
    }
    await AdsRequest.updateOne(
      {
        _id: req.params.id
      },
      body
    )
    console.log('[Admin] Updated ads request.', req.params.id)
  } catch(e) {
    return res.sendStatus(404)
  }

  return res.json('OK')
})

module.exports = router
