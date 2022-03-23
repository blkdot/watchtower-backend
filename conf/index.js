const isProduction = process.env.NODE_ENV === 'production'
const isStaging = process.env.NODE_ENV === 'staging'

const Queue = require("bull")

const REDIS_URL = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379'

const MAIN_SCANNER_QUEUE_NAME = 'watchtower-1'
const mainScannerQueue = new Queue(MAIN_SCANNER_QUEUE_NAME, REDIS_URL)

const SUB_SCANNER_QUEUE_NAME = 'watchtower-2'
const subScannerQueue = new Queue(SUB_SCANNER_QUEUE_NAME, REDIS_URL)

const SYNC_TOKEN_QUEUE_NAME = 'sync-token'
const syncTokenQueue = new Queue(SYNC_TOKEN_QUEUE_NAME, REDIS_URL)

const SCAN_WORKER_ID = (address) => `v5-${address.toLowerCase()}`
const SCAN_TIME_ID = (address) => `v5-scan-at-${address.toLowerCase()}`

const HOLDERS_LIMIT_OF_SMALL_TOKENS = 200000  // under 200k holders, we assume as small coin
const TS_INTERVAL_FOR_NEW_TOKENS = 1000 * 60 * 5  // 5mins
const TS_INTERVAL_FOR_SMALL_TOKENS = 1000 * 60 * 30 // 30 mins
const TS_INTERVAL_FOR_BIG_TOKENS = 1000 * 60 * 60 * 24 // 1 day

const TS_INTERVAL_LIMIT_OF_NEW_TOKENS = 1000 * 60 * 60 * 48 // it is new token, before over 48h creation
const TS_INTERVAL_FOR_DAILY_SCANNING = 1000 * 60 * 60 * 24 // 1 day

const MAIN_DEXS = {
  bsc: ['Pancake v2', 'Pancake'],
  ethereum: ['Uniswap']
}

const MAIN_LP_PAIRS = ['WBNB', 'WETH', 'USDT', 'USDC', 'BUSD', 'CAKE', 'UNI']

const MAIN_TOKEN = {
  bsc: 'WBNB',
  ethereum: 'WETH'
}

const MOST_SCANNED_TOKENS_SYMBOLS = 'watchtower-most-scanned-top5-symbols'
const MOST_SCANNED_TOKENS_ADDRESSES = 'watchtower-most-scanned-top5-addresses'

const WTW_TOTAL_SUPPLY_AMOUNT = 'wtw-total-supply'
const WTW_CIRCULATING_SUPPLY_AMOUNT = 'wtw-circulating-supply'

module.exports = {
  isProduction,
  isStaging,

  REDIS_URL,
  mainScannerQueue,
  subScannerQueue,
  SCAN_WORKER_ID,
  SCAN_TIME_ID,

  syncTokenQueue,

  HOLDERS_LIMIT_OF_SMALL_TOKENS,
  TS_INTERVAL_FOR_NEW_TOKENS,
  TS_INTERVAL_FOR_SMALL_TOKENS,
  TS_INTERVAL_FOR_BIG_TOKENS,

  TS_INTERVAL_LIMIT_OF_NEW_TOKENS,
  TS_INTERVAL_FOR_DAILY_SCANNING,

  MAIN_DEXS,
  MAIN_TOKEN,
  MAIN_LP_PAIRS,

  MOST_SCANNED_TOKENS_SYMBOLS,
  MOST_SCANNED_TOKENS_ADDRESSES,

  WTW_TOTAL_SUPPLY_AMOUNT,
  WTW_CIRCULATING_SUPPLY_AMOUNT
}
