const redis = require('../redis')

const isValidAddress = (address) => {
  return address && address.length === 42 && address.substring(0,2) === '0x'
}

const isActiveAddress = (address) => (address != "0x0000000000000000000000000000000000000000") &&
  (address != "0x0000000000000000000000000000000000000001") &&
  (address != "0x000000000000000000000000000000000000dead") &&
  (address !="0x0000000000000000000000000000000000001004") &&
  (address !="0x0000000000000000000000000000000000000002")

const readFromRedisAsync = (key) => {
    return new Promise((resolve) => {
      redis.get(key, function(err, reply) {
        if (err) {
          return resolve(null)
        }
        resolve(reply)
      })
    })
  }

module.exports = {
  isValidAddress,
  isActiveAddress,
  readFromRedisAsync,
}
