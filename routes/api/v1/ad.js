const mongoose = require('mongoose')
const router = require('express').Router()
const Cors = require('../../../conf/cors')

const AdsRequest = mongoose.model('AdsRequest')

router.get('/', Cors, async function(req, res, next) {
  let approvedAds = await AdsRequest.find({approved: true}).sort({approvedAt: 'desc'}).exec()
  return res.json(approvedAds)
})

module.exports = router
