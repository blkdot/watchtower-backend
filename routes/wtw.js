const router = require('express').Router()
const {readFromRedisAsync} = require('../utils')
const Config = require('../conf')

router.get('/total-supply', async function (req, res, next) {
  const totalSupply = await readFromRedisAsync(Config.WTW_TOTAL_SUPPLY_AMOUNT)
  return res.json(Number(totalSupply))
})

router.get('/circulating-supply', async function (req, res, next) {
  const circulatingSupply = await readFromRedisAsync(Config.WTW_CIRCULATING_SUPPLY_AMOUNT)
  return res.json(Number(circulatingSupply))
})

module.exports = router