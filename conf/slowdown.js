const slowDown = require('express-slow-down')

const slowDownLimiter = slowDown({
  windowMs: 1 * 60 * 1000,
  delayAfter: 5,  // allow 5 requests per 1 minutes
  delayMs: 60000 // adding 60000ms delay per request above 5
})

module.exports = slowDownLimiter
