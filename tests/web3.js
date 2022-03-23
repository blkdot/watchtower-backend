console.log('web3 testing')

const WEB3 = require('../lib/web3')

WEB3.bscWeb3.eth.getBlockNumber()
  .then(
    (result) => {
      console.log("BSC Latest Block is ", result)
    }
  )

WEB3.ethWeb3.eth.getBlockNumber()
  .then(
    (result) => {
      console.log("Ethereum Latest Block is ", result)
    }
  )

WEB3.createERC20Contract('0x7040E822bB833EE6A5B69229D3560c418B1619C7', 'bsc')
  .methods.balanceOf("0x620dc94C842817d5d8b8207aa2DdE4f8C8b73415")
  .call()
  .then(balance => {
    console.log('Balance: ', balance)
  })

WEB3.createERC20Contract('0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', 'bsc')
  .methods.decimals()
  .call()
  .then(decimals => {
    console.log('Decimals: ', decimals)
  })

/*
const abi = require('../data/erc20.json')
const contract = new web3.eth.Contract(abi, "0x7040E822bB833EE6A5B69229D3560c418B1619C7")
contract.methods.balanceOf("0x620dc94C842817d5d8b8207aa2DdE4f8C8b73415").call()
  .then(balance => {
    console.log('Balance: ', balance)
  })
*/