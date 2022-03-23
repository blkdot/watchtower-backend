const axios = require('axios')

// it is only for ETH tokens
const fetchHolders = async (token, count = 5, decimals) => {
  let url = `https://api.ethplorer.io/getTopTokenHolders/${token}?limit=${count}&apiKey=${process.env.ETHPLORER_API_KEY}`

  try {
    const {data} = await axios.get(url)
    return data.holders.map(holder => (
      {
        TokenHolderAddress: holder.address,
        TokenHolderQuantity: holder.balance / (10**decimals),
      }
    ))
  } catch(e) {
    console.error('[Token] Error while fetching holders of ', token, ' from api.ethplorer.io!')
  }
  return []
}

const fetchHoldersCount = async (token) => {
  let url = `https://api.ethplorer.io/getTokenInfo/${token}?&apiKey=${process.env.ETHPLORER_API_KEY}`

  try {
    const {data} = await axios.get(url)
    return data.holdersCount
  } catch(e) {
    console.error('[Token] Error while fetching holders count of ', token, ' from api.ethplorer.io!')
  }
  return 0
}

module.exports = {
  fetchHolders,
  fetchHoldersCount
}

