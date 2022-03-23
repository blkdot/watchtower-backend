const router = require('express').Router()
const mongoose = require('mongoose')
const Token = mongoose.model('Token')

const {auth} = require('../../../../conf/auth-admin')

/**
 * Token: collections of tokens info
 */

router.get('/', auth.required, async function (req, res, next) {
  let tokens = await Token.countDocuments()
  let bscTokens = await Token.countDocuments({network: 'bsc'})
  let ethTokens = await Token.countDocuments({network: 'ethereum'})

  let newBscTokens = await Token.countDocuments({scannedAt: null, network: 'bsc'})
  let newEthTokens = await Token.countDocuments({scannedAt: null, network: 'ethereum'})

  let unLaunchedBscTokens = await Token.countDocuments({unLaunched: true, network: 'bsc'})
  let unLaunchedEthTokens = await Token.countDocuments({unLaunched: true, network: 'ethereum'})

  let noHoldersBscTokens = await Token.countDocuments({totalHolders: 0, network: 'bsc'})
  let noHoldersEthTokens = await Token.countDocuments({totalHolders: 0, network: 'ethereum'})

  let yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  let newCreatedBscTokens = await Token.countDocuments({createdAt: {$gt: yesterday}, network: 'bsc'})
  let newCreatedEthTokens = await Token.countDocuments({createdAt: {$gt: yesterday}, network: 'ethereum'})

  let ratings = []
  for(let i = 0; i < 11; i++) {
    let bsc = await Token.countDocuments({riskRating: i, network: 'bsc'})
    let eth = await Token.countDocuments({riskRating: i, network: 'ethereum'})
    ratings.push({
      riskRating: i,
      bsc,
      eth
    })
  }

  let highRiskTokens = 0, mediumRiskTokens = 0, lowRiskTokens = 0
  for (let i = 0; i < 4; i++) {
    highRiskTokens += ratings[i].bsc
    highRiskTokens += ratings[i].eth
  }
  for (let i = 4; i < 7; i++) {
    mediumRiskTokens += ratings[i].bsc
    mediumRiskTokens += ratings[i].eth
  }
  for (let i = 7; i <= 10; i++) {
    lowRiskTokens += ratings[i].bsc
    lowRiskTokens += ratings[i].eth
  }

  return res.json({
    tokens: {
      all: tokens,

      bsc: bscTokens,
      eth: ethTokens,

      low: lowRiskTokens,
      medium: mediumRiskTokens,
      high: highRiskTokens
    },
    failed: {
      bsc: newBscTokens,
      eth: newEthTokens
    },
    unLaunched: {
      bsc: unLaunchedBscTokens,
      eth: unLaunchedEthTokens
    },
    noHoldings: {
      bsc: noHoldersBscTokens,
      eth: noHoldersEthTokens
    },
    new: {
      bsc: newCreatedBscTokens,
      eth: newCreatedEthTokens
    },
    ratings,
  })
})

module.exports = router
