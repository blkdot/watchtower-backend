const Web3 = require('web3')
const ethWeb3Provider = new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161")
const ethWeb3 = new Web3(ethWeb3Provider)

const bscWeb3Provider = new Web3.providers.HttpProvider("https://bsc-dataseed.binance.org/")
const bscWeb3 = new Web3(bscWeb3Provider)

const ERC20_ABI = require('../data/erc20.json')

const createERC20Contract = (address, network) => {
  return network === 'bsc' ?
    new bscWeb3.eth.Contract(ERC20_ABI, address) :
    new ethWeb3.eth.Contract(ERC20_ABI, address)
}

module.exports = {
  ethWeb3,
  bscWeb3,
  ERC20_ABI,
  createERC20Contract
}