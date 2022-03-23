const mongoose = require('mongoose'),
  uniqueValidator = require('mongoose-unique-validator'),
  crypto = require('crypto'),
  jwt = require('jsonwebtoken'),
  { SECRET, JWT_TOKEN_EXPIRY } = require('../conf/auth-admin')
  
const AdminSchema = new mongoose.Schema({
  email: {type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/\S+@\S+\.\S+/, 'is invalid']},
  salt: String,
  hash: String,

  lastLoggedIn: {type: Date}
}, {timestamps: true})

AdminSchema.plugin(uniqueValidator, {message: 'is already taken'})

AdminSchema.methods.validPassword = function(password) {
  let hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
  return this.hash === hash;
};

AdminSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

AdminSchema.methods.generateJWT = function() {
  return jwt.sign({
    id: this._id,
    email: this.email,
    exp: parseInt((Date.now() + JWT_TOKEN_EXPIRY) / 1000)
  }, SECRET)
}

AdminSchema.methods.toAuthJSON = function() {
  return {
    email: this.email,
    token: this.generateJWT(),
  }
}

mongoose.model('Admin', AdminSchema)
