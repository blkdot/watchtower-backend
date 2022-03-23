const axios = require('axios')
const slugify = require('slugify')
const sizeof = require('object-sizeof')

const {isValidAddress} = require('../utils')
const BitQuery = require('./bitQuery')

const BSC_DEXS = ['Pancake v2', 'Pancake']
const ETH_DEXS = ['Uniswap']

// it is global scope variable to keep tokens list data
// it will be initialized at once while restarting every dyno
let TOKENS_CACHE = []

// global scope variable to keep token detail
// {[symbol]: value}
let TOKEN_DETAILS_CACHE = {}

const refreshTokensFromCoingecko = async () => {
  console.log('[TokenStore] Fetching all coins info ...')
  const url = "https://api.coingecko.com/api/v3/coins/list?include_platform=true"
  try {
    let {data} = await axios.get(url)
    TOKENS_CACHE = data
    console.log('[TokenStore] Fetched ', data.length, ' coins info. Allocated memory size: ', sizeof(TOKENS_CACHE).toLocaleString())
  } catch(e) {
    console.error('[TokenStore] Error while fetching tokens list from coingecko.')
  }
}

const searchTokenFromCoingecko = (toSearchKey) => {
  let network, address, dexTitle, mainToken
  let toSearch = toSearchKey.toLowerCase()

  if (!TOKENS_CACHE.length) {
    return null
  }

  for (let i=0; i<TOKENS_CACHE.length; i++) {
    if (TOKENS_CACHE[i].symbol.toLowerCase() == toSearch ||
      TOKENS_CACHE[i].name.toLowerCase() == toSearch ||
      (TOKENS_CACHE[i].platforms.ethereum && 
      (TOKENS_CACHE[i].platforms.ethereum.toLowerCase() == toSearch)) ||
      (TOKENS_CACHE[i].platforms['binance-smart-chain'] && 
      (TOKENS_CACHE[i].platforms['binance-smart-chain'].toLowerCase() == toSearch))) {

      if (!isValidAddress(toSearch)) {
        if (TOKENS_CACHE[i].platforms['binance-smart-chain']) {
          network = 'bsc'
          address = TOKENS_CACHE[i].platforms['binance-smart-chain']
        } else if (TOKENS_CACHE[i].platforms.ethereum) {
          network = 'ethereum'
          address = TOKENS_CACHE[i].platforms.ethereum
        } else {
          return null
        }
      } else {
        if (TOKENS_CACHE[i].platforms['binance-smart-chain'] && 
        TOKENS_CACHE[i].platforms['binance-smart-chain'].toLowerCase() == toSearch) {
          network = 'bsc'
        } else {
          network = 'ethereum'
        }
        address = toSearch
      }

      return {
        id: TOKENS_CACHE[i].id,
        name: TOKENS_CACHE[i].name,
        symbol: TOKENS_CACHE[i].symbol.toUpperCase(),
        decimals: 0,  /* not supported by coingecko */
        address,
        network,
      }
    }
  }

  return null
}

/**
 * Get token info, like name, address, symbol from bscscan or ethscan
 * @param {*} toSearch : token address
 */
const searchTokenFromBitQuery = async (toSearch) => {
  let result, contract
  if (!isValidAddress(toSearch)) {
    return null
  }

  // 1st: trying to get info from BitQuery(BSC Network)
  try {
    result = await BitQuery.sendRequest(BitQuery.makeQueryTokenInfo(toSearch, 'bsc'))
  } catch(e) {
    console.error('[TokenStore] Error while fetching token info from BitQuery(BSC Network)')
  }

  if (result.data && result.data.ethereum.smartContractCalls && result.data.ethereum.smartContractCalls.length > 0) {
    contract = result.data.ethereum.smartContractCalls[0]
    return {
      id: slugify(contract.smartContract.currency.name, {lower: true}),
      name: contract.smartContract.currency.name,
      symbol: contract.smartContract.currency.symbol,
      decimals: contract.smartContract.currency.decimals,
      createdAt: contract.block.timestamp.time,
      address: toSearch,
      network: 'bsc',
      mainToken: 'WBNB',
      dexTitles: BSC_DEXS
    }
  }

  // 2nd: trying to get info from BitQuery(ETH Network)
  try {
    result = await BitQuery.sendRequest(BitQuery.makeQueryTokenInfo(toSearch, 'ethereum'))
  } catch(e) {
    console.error('[TokenStore] Error while fetching token info from BitQuery(ETH Network)')
  }

  if (result.data && result.data.ethereum.smartContractCalls && result.data.ethereum.smartContractCalls.length > 0) {
    contract = result.data.ethereum.smartContractCalls[0]
    return {
      id: slugify(contract.smartContract.currency.name, {lower: true}),
      name: contract.smartContract.currency.name,
      symbol: contract.smartContract.currency.symbol,
      decimals: contract.smartContract.currency.decimals,
      createdAt: contract.block.timestamp.time,
      address: toSearch,
      network: 'ethereum',
      mainToken: 'WETH',
      dexTitles: ETH_DEXS
    }
  }

  return null
}

const getTokenDetailByIDFromCoingecko = async (id) => {
  // check if already exists on cache
  if (TOKEN_DETAILS_CACHE[id]) {
    return TOKEN_DETAILS_CACHE[id]
  }

  let url = "https://api.coingecko.com/api/v3/coins/"+id+"?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false"
  try {
    let {data} = await axios.get(url)
    if (data.error) {
      return null;
    }

    TOKEN_DETAILS_CACHE[id] = data
    console.log('[TokenStore] Fetched ', id, ' detail. Allocated memory size: ', sizeof(TOKEN_DETAILS_CACHE).toLocaleString())
    return data;
  } catch(e) {
    console.error('[TokenStore] Error while fetching token detail of ', id)
    return null
  }
}

/**
 * [CRITICAL] It can be failed in case of many requests per second...
 * 
 * Because the API endpoint is throttled to 2 calls/second regardless of API Pro tier.
 * @param {*} token 
 */

const getTokenDetailFromBscscan = async (token, network) => {
  let url = ''
  if(network === 'bsc') {
    url = `https://api.bscscan.com/api?module=token&action=tokeninfo&contractaddress=${token}&apikey=${process.env.BSCSCAN_API_KEY}`
  } else {
    url = `https://api.etherscan.io/api?module=token&action=tokeninfo&contractaddress=${token}&apikey=${process.env.ETHSCAN_API_KEY}`
  }

  try {
    const {data} = await axios.get(url);
    if (data.status == '0') {
      return {}
    }
    return {
      description: {
        en: data.result[0].description,
      },
      links: {
        homepage: [data.result[0].website]
      }
    }
  } catch(e) {
    console.error('[TokenStore] Error while fetching token detail of ', token, '. Due to **API THROTTLE**')
    return {}
  }
}

module.exports = {
  refreshTokensFromCoingecko,

  searchTokenFromCoingecko,
  searchTokenFromBitQuery,

  getTokenDetailByIDFromCoingecko,
  getTokenDetailFromBscscan,
}
