if (process.env.NODE_ENV === 'production') require('newrelic')

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const errorhandler = require('errorhandler')
const mongoose = require('mongoose')

const redis = require('./redis')

const {isProduction, isStaging, syncTokenQueue} = require('./conf')
const TokenStore = require('./lib/tokenStore')

const port = isProduction || isStaging ? process.env.PORT : 5050

const app = express()
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use(morgan('combined'))

if (!isProduction) {
  app.use(cors())
  app.use(errorhandler())
} else {
  app.options('*', cors())
}

/*
* mongo connection
*/

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
if(!isProduction && !isStaging) {
  mongoose.set('debug', true)
}

require('./models/Admin')
require('./models/External')
require('./models/Token')
require('./models/Audit')
require('./models/Subscription')
require('./models/TokenFix')
require('./models/AdsRequest')

require('./conf/passport')

const {initDefaultAdminAccount} = require('./conf/admin')
initDefaultAdminAccount()

/**
 *  Get all tokens info, and caching for further request
 *  [IMPORTANT] Do not remove it!
*/
TokenStore.refreshTokensFromCoingecko()

// Add sync-new-token job
syncTokenQueue.add()

app.get('/ping', (req, res) => {
  res.send('pong')
})

app.use(require('./routes'))

app.listen(port, () => {
  console.log(`Listening on port ${port}!`)
})
