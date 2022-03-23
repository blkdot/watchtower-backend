const router = require('express').Router()

router.use('/token', require('./token'))
router.use('/external', require('./external'))
router.use('/audit', require('./audit'))
router.use('/subscribe', require('./subscribe'))
router.use('/attachment', require('./attachment'))
router.use('/admin', require('./admin'))
router.use('/banner', require('./ad'))

module.exports = router
