const router = require('express').Router()
const mongoose = require('mongoose')
const Audit = mongoose.model('Audit')
const Validator = require('validatorjs')

const {auth} = require('../../../../conf/auth-admin')
const {AuditRules} = require('../../../../conf/rules')

const Config = require('../../../../conf')
const {isValidAddress, isActiveAddress} = require('../../../../utils')

// return all Audits
router.get('/', auth.required, async function(req, res, next) {
  let allAudits = await Audit.find().sort({utility: 'asc'}).exec()

  return res.json(allAudits)
})

// create Audit
router.post('/', auth.required, async function(req, res, next) {
  // validation
  const validator = new Validator(req.body, AuditRules)
  if (validator.fails()) {
    return res.status(404).send({errors: validator.errors.all()})
  }

  try {
    let _audit = new Audit(req.body)
    await _audit.save()
    console.log('[Admin] Created new audit request.', req.body.contractAddress)
  } catch(e) {
    return res.sendStatus(404)
  }

  return res.json('OK')
})

// get audit details
router.get('/:contractAddress', auth.required, async function (req, res, next) {
  if (!req.params.contractAddress || !isValidAddress(req.params.contractAddress.toLowerCase())) {
    return res.sendStatus(404)
  }

  let _audit = await Audit.findOne({contractAddress: req.params.contractAddress.toLowerCase()})
  if (!_audit) {
    return res.sendStatus(404)
  }

  return res.json(_audit)
})

// update Audit
router.post('/:contractAddress', auth.required, async function(req, res, next) {
  if (!req.params.contractAddress || !isValidAddress(req.params.contractAddress.toLowerCase())) {
    return res.sendStatus(404)
  }

  let _audit = await Audit.findOne({contractAddress: req.params.contractAddress.toLowerCase()})
  if (!_audit) {
    return res.sendStatus(404)
  }

  // validation
  let body = {...req.body, contractAddress: req.params.contractAddress}
  const validator = new Validator(body, AuditRules)
  if (validator.fails()) {
    return res.status(404).send({errors: validator.errors.all()})
  }

  try {
    await Audit.updateOne(
      {
        contractAddress: req.params.contractAddress.toLowerCase()
      },
      req.body
    )
    console.log('[Admin] Updated old audit request.', req.params.contractAddress)
  } catch(e) {
    return res.sendStatus(404)
  }

  return res.json('OK')
})

module.exports = router
