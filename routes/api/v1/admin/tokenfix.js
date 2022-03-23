const router = require('express').Router()
const mongoose = require('mongoose')
const Token = mongoose.model('Token')
const TokenFix = mongoose.model('TokenFix')

const {auth} = require('../../../../conf/auth-admin')
const {isValidAddress, isActiveAddress} = require('../../../../utils')
const {isValidFields, isValidValueFormat} = require('../../../../data/tokenFields')

const Config = require('../../../../conf')

router.get('/', auth.required, async function(req, res, next) {
  let query = {}
  if (req.query.address && isValidAddress(req.query.address.toLowerCase())) {
    query.address = req.query.address.toLowerCase()
  }
  let allRecords = await TokenFix.find(query).sort({address: 'asc'}).exec()

  return res.json(allRecords)
})

router.post('/', auth.required, async function(req, res, next) {
  if (!req.body.address) {
    return res.sendStatus(400)
  }
  const address = req.body.address.toLowerCase()
  if (!isValidAddress(address) || 
    !isActiveAddress(address)) {
    return res.sendStatus(400)
  }
  if (!req.body.field || !isValidFields(req.body.field)) {
    return res.sendStatus(400)
  }
  if (req.body.value == null || req.body.value == undefined) {
    return res.sendStatus(400)
  }

  let prevRecord = await TokenFix.findOne({
    address,
    fieldName: req.body.field
  })

  if (prevRecord) {
    prevRecord.value = `${req.body.value}`
    await prevRecord.save()
  } else {
    let newRecord = new TokenFix()
    newRecord.address = address
    newRecord.fieldName = req.body.field
    newRecord.value = `${req.body.value}`
    await newRecord.save()
  }

  // re-scan the token to take effect of updates
  let token = await Token.findOne({address})
  if (token) {
    // force to re-scan by updating scanned at
    await Token.updateOne({address}, {scannedAt: token.scannedAt - 25 * 60 * 60 * 1000})
  }

  await Config.mainScannerQueue.add({
    token: address
  })
  res.json('OK')
})

module.exports = router
