const BitQuery = require('./bitQuery')
const axios = require('axios')

const getTotalSupply = async (address, network='bsc') => {
  try {
    result = await BitQuery.sendRequest(BitQuery.makeQueryTotalSupplies(address, network))
    if (result.data.ethereum.transfers) {
        return result.data.ethereum.transfers[0].amount
    }
  } catch(e) {
    console.error('[Token] Error while fetching total supply of ', address, ' in ', network)
  }
  return 0
}

const getBurnedAmount = async (address, network='bsc') => {
  try {
    result = await BitQuery.sendRequest(BitQuery.makeQueryBurnedTokens(address, network))
    if (result.data.ethereum.transfers) {
        return result.data.ethereum.transfers[0].amount
    }
  } catch(e) {
    console.error('[Token] Error while fetching burned amount of ', address, ' in ', network)
  }
  return 0
}

const fetchEthPrice = async (network) => {
  let url = ''
  if(network === 'bsc') {
    url = `https://api.bscscan.com/api?module=stats&action=bnbprice&apikey=${process.env.BSCSCAN_API_KEY}`
  } else {
    url = `https://api.etherscan.io/api?module=stats&action=ethprice&apikey=${process.env.ETHSCAN_API_KEY}`
  }

  const {data} = await axios.get(url);
  return data.result.ethusd
}

module.exports = {
  getTotalSupply,
  getBurnedAmount,
  fetchEthPrice,
}
