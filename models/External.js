const mongoose = require('mongoose'),
  uniqueValidator = require('mongoose-unique-validator'),
  crypto = require('crypto')

const ExternalSchema = new mongoose.Schema({
  apiKey: {type: String, unique: true, required: true},
  plan: {type: Number, default: 10000},
  left: {type: Number, default: 10000},
  activated: {type: Date}
}, {timestamps: true})

ExternalSchema.plugin(uniqueValidator, {message: 'is already taken'})

ExternalSchema.methods.generateKey = function() {
  this.apiKey = crypto.randomBytes(32).toString('hex')
}

mongoose.model('External', ExternalSchema)
