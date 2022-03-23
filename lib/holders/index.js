const BitQuery = require('../bitQuery')

const ScrapeLib = require('./scrapeHolders')
const EthplorerLib = require('./ethPlorer')
const BscScanLib = require('./bscscanAPI')

const fetchHoldersCount = (address, network='bsc') => {
  if (network === 'bsc') {
    // return ScrapeLib.fetchHoldersCount(address, network)
    return 1000
  }

  return EthplorerLib.fetchHoldersCount(address)
}

const fetchHolders = async (address, network='bsc', limit=5, decimals = 18) => {
  if (network === 'bsc') {
    // rejected by cloudflare site protection
    // return ScrapeLib.fetchHolders(address, network, limit)

    let pageNo = 1, topHolders = [], totalHolders = 0
    while(pageNo < 1000) {
      if (pageNo % 10 === 0) console.log("#")
      let chunk = await BscScanLib.fetchHolders(address, network, pageNo, 10000)
      if (!chunk.length) break

      totalHolders += chunk.length
      topHolders = [...topHolders, ...BscScanLib.pickupTopNHolders(chunk, pageNo === 1 ? 20 : 5)]
      pageNo ++
    }

    topHolders = BscScanLib.pickupTopNHolders(topHolders, limit)
    return topHolders.map(holder => ({
      ...holder,
      TokenHolderQuantity: holder.TokenHolderQuantity / Math.pow(10, decimals)
    }))
  }

  return EthplorerLib.fetchHolders(address, limit, decimals)
}

/**
   * splitTokenHolders()
   * @param {*} holders 
   */
const splitTokenHolders = async (holders, network) => {
  try {
    let result = await BitQuery.sendRequest(
      BitQuery.makeQueryTokensInfo(
        holders.map(holder => holder.TokenHolderAddress),
        network,
      )
    )

    let contractAddresses = 
      result.data && result.data.ethereum && result.data.ethereum.smartContractCalls ?
      result.data.ethereum.smartContractCalls.map(call => call.smartContract.address.address) :
      []
    contractAddresses.push('0x000000000000000000000000000000000000dead')

    let uniqueAddresses = [...new Set(contractAddresses)]

    let contractHolders = holders.filter(holder => {
      return uniqueAddresses.find(address => address === holder.TokenHolderAddress)
    })
    let nonContractHolders = holders.filter(holder => {
      return !uniqueAddresses.find(address => address === holder.TokenHolderAddress)
    })
    return [contractHolders, nonContractHolders]
  } catch(e) {
    console.log('Error while excluding contract addresses: \nHolders: ', holders, "\nError: ", e, "\n----------------")
  }
  return []
}


module.exports = {
  fetchHoldersCount,
  fetchHolders,
  splitTokenHolders
}
