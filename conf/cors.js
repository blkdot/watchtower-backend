const cors = require('cors')

var whitelist = [
  'https://www.cryptowatchtower.io', 
  'https://cryptowatchtower.io', 
  'https://staging.cryptowatchtower.io', 
  'https://admin.cryptowatchtower.io', 
  'https://swap.cryptowatchtower.io', 
]

var corsOptions = {
  origin: function (origin, callback) {
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true)
    }

    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      console.log('[Request] Rejected by CORS. Origin: ', origin)
      callback(new Error('Not allowed by CORS'))
    }
  }
}

module.exports = cors(corsOptions)
