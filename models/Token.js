const mongoose = require('mongoose'),
  uniqueValidator = require('mongoose-unique-validator')

const LiquidityPoolHoldingSchema = new mongoose.Schema({
  symbol: String,
  holdings: Number,
  price: Number,
})

const LiquidityPoolSchema = new mongoose.Schema({
  pairSymbol: String,
  pairAddress: {type: String, lowercase: true, trim: true, length: 42},
  poolAddress: {type: String, lowercase: true, trim: true, length: 42},
  tokens: [LiquidityPoolHoldingSchema],
  totalLpTokens: Number,
  lockedLpTokensRate: Number
})

const HolderDetailSchema = new mongoose.Schema({
  holderAddress: {type: String, lowercase: true, trim: true, length: 42},
  quantity: Number,
  percent: Number,
  value: Number
})

const TokenSchema = new mongoose.Schema({
  address: {type: String, lowercase: true, trim: true, length: 42, unique: true, index: true},
  network: {type: String, lowercase: true, trim: true, enum: ['bsc', 'ethereum']},

  name: String,
  symbol: String,
  decimals: Number,
  created: Date,
 
  description: String,
  homepage: String,
  imageURL: String,
  compilerVersion: String,

  price: Number,
  totalSupply: Number,
  burnedAmount: Number,
  
  totalHolders: Number,
  top5Holders: [HolderDetailSchema],
  top5Percent: Number,
  top5PercentBurnAdjusted: Number,
  
  mintEnabled: Boolean,
  renouncedOwnership: Boolean,
  honeypot: String,

  liquidityPools: [LiquidityPoolSchema],
  riskRating: Number,
  scannedAt: Number,
  unLaunched: Boolean,

  // community feedback
  isScammer: {type: Boolean, default: false},
  searches: Number,
  blockHeight: Number,
}, {timestamps: true})

TokenSchema.plugin(uniqueValidator, {message: 'is already taken.'})
const Token = mongoose.model('Token', TokenSchema)

Token.on('index', (err) => {
  console.log(err)
})
