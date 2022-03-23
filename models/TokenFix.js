const mongoose = require('mongoose')

const TokenFixSchema = new mongoose.Schema({
  address: {type: String, lowercase: true, trim: true, length: 42, match: [/0x([0-9,a-f]){40}/i]},
  fieldName: String,
  value: String
}, {timestamp: true})

mongoose.model('TokenFix', TokenFixSchema)
