let passport = require('passport');
let LocalStrategy = require('passport-local').Strategy;
let mongoose = require('mongoose');
let Admin = mongoose.model('Admin');

passport.use(
  new LocalStrategy({
    usernameField: 'admin[email]',
    passwordField: 'admin[password]'
  },
  function(email, password, done) {
    Admin.findOne({email: email}).then(function(admin) {
      if(!admin || !admin.validPassword(password)){
        return done(null, false, {errors: {'email or password': 'is invalid'}});
      }

      return done(null, admin);
    }).catch(done);
  })
);

