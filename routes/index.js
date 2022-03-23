const router = require('express').Router()

router.use('/api/v1', require('./api/v1'))
router.use('/wtw', require('./wtw'))

module.exports = router
