const mongoose = require('mongoose')

const SubscriptionSchema = new mongoose.Schema({
  utility: String,
  name: String,
  email: String,
  details: String
}, {timestamps: true})

mongoose.model('Subscription', SubscriptionSchema)
