const redis = require('redis')
const Config = require('./conf')
const client = redis.createClient(Config.REDIS_URL, {no_ready_check: true})

client.on('ready', () => {
  console.log('REDIS: ready ...\nURL: ', Config.REDIS_URL)
})

client.on('error', err => {
  console.log('REDIS: error ', err)
})

client.on('completed', function (job, result) {
  console.log(`REDIS: job (${job.id}) compoleted. Result: ${result}`)
})

module.exports = client
