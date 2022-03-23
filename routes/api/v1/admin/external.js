const router = require('express').Router()
const mongoose = require('mongoose')
const External = mongoose.model('External')

const Config = require('../../../../conf/admin')

/**
 * External: model to store external API consumers credential
 */

router.get('/', Config.temporaryAdminAuth, async function (req, res, next) {
  let externals = await External.find({})

  return res.json({
    externals
  })
})

router.post('/', Config.temporaryAdminAuth, async function (req, res, next) {
  let external = new External()
  external.generateKey()
  external.activated = new Date()
  await external.save()

  return res.json({
    external
  })
})

module.exports = router
