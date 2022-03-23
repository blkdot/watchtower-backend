const mongoose = require('mongoose')

const AuditSchema = new mongoose.Schema({
  contractAddress: {type: String, lowercase: true, trim: true, length: 42},
  utility: String,
  ownerAddress: {type: String, lowercase: true, trim: true, length: 42},
  ownerName: String,
  liquidityPool: {type: String, lowercase: true, trim: true, length: 42},
  email: String,
  siteLink: String,
  details: String,

  network: {type: String, default: 'bsc', enum: ['bsc', 'ethereum']},
  certLink: String,
  approved: {type: Boolean, default: false}
}, {timestamps: true})

mongoose.model('Audit', AuditSchema)
