const axios = require('axios')

/**
 *  Now etherscan API does not provide holders-list.
 *  So it is only available for BSC Scan API
 * @param {*} token 
 * @param {*} network 
 * @param {*} page 
 * @param {*} offset 
 * @returns 
 */
const fetchHolders = async (token, network, page=1, offset=10000) => {
  let url = ''
  if(network === 'bsc') {
    url = `https://api.bscscan.com/api?module=token&action=tokenholderlist&contractaddress=${token}&apikey=${process.env.BSCSCAN_API_KEY}&page=${page}&offset=${offset}`
  } else {
    url = `https://api.etherscan.io/api?module=token&action=tokenholderlist&contractaddress=${token}&apikey=${process.env.ETHSCAN_API_KEY}&page=${page}&offset=${offset}`
  }

  const {data} = await axios.get(url);
  return data.result
}

/**
 * pickupTopHolders()
 * @param {*} holders 
 * 
 * pickup top n holders without sort, fastest algorithm
 */
 const pickupTopNHolders = (holders, n=5) => {
  let topNs = []
  try {
    topNs = holders.slice(0, n).sort((a, b) => (Number(b.TokenHolderQuantity)) - (Number(a.TokenHolderQuantity)))
    for (let i=n; i<holders.length; i++) {
      let v = Number(holders[i].TokenHolderQuantity)
      if (v < Number(topNs[n-1].TokenHolderQuantity)) continue

      if (v > Number(topNs[0].TokenHolderQuantity)) {
        topNs.unshift(holders[i])
      } else {
        for (let j=0; j<n-1; j++) {
          if ((v < Number(topNs[j].TokenHolderQuantity)) && (v > Number(topNs[j+1].TokenHolderQuantity))) {
            topNs.splice(j+1, 0, holders[i])
            break;
          }
        }
      }
      if (topNs.length > n) {
        topNs = topNs.slice(0, n)
      }
    }
  } catch(e) {
    console.log("[pickupTopNHolders] error with holders: ", holders)
    console.log("#error:", e)
  }
  return topNs
}


module.exports = {
  fetchHolders,
  pickupTopNHolders,
}
