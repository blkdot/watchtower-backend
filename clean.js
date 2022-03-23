const redis = require('./redis')

console.log('Cleaning all data from redis ...')

const cleanRedis = () => {
  redis.flushdb((err, succeeded) => {
    console.log('[FLUSH REDIS] Finished.')
    console.log('err: ', err)
    console.log('succeeded: ', succeeded)

    process.exit()
  })
}

cleanRedis()
