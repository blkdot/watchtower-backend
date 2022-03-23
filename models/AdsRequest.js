const mongoose = require('mongoose')

const AdsRequestSchema = new mongoose.Schema({
  email: {type: String, required: true},
  name: {type: String, required: true},
  siteLink: String,
  transactionLink: {type: String},
  files: [String],
  approved: {type: Boolean, default: false},
  approvedAt: Date,
  activeDates: Number,  // if it is zero, then infinite
}, {timestamps: true})

mongoose.model('AdsRequest', AdsRequestSchema)
