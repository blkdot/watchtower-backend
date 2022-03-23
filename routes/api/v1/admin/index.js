const router = require('express').Router()
const Cors = require('../../../../conf/cors')

router.use(Cors)

router.use('/auth', require('./auth'))
router.use('/external', require('./external'))
router.use('/token', require('./token'))
router.use('/tokenfix', require('./tokenfix'))
router.use('/audit', require('./audit'))
router.use('/ads', require('./ads'))

module.exports = router
