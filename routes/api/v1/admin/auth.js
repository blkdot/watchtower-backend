const router = require('express').Router(),
  mongoose = require('mongoose'),
  passport = require('passport'),
  Admin = mongoose.model('Admin')

router.post('/login', async function(req, res, next) {
  if(!req.body.admin.email) {
    return res.status(422).json({errors: {email: "can't be blank"}})
  }
  if(!req.body.admin.password) {
    return res.status(422).json({errors: {password: "can't be blank"}})
  }
  
  passport.authenticate('local', {session: false}, function(err, admin, info) {
    if (err) { return next(err) }

    if (admin) {
      console.log('\n\n[Admin] succeed to login by admin account.')
      admin.lastLoggedIn = new Date()
      admin.save().then(() => {
        return res.json({admin: admin.toAuthJSON()})
      })
    } else {
      return res.status(422).json(info)
    }
  })(req, res, next);
})

module.exports = router
