const got = require('got')
const axios = require('axios')

function sendRequest(query) {
  return new Promise((resolve, reject) => {
    got.post("https://graphql.bitquery.io/",
    {
      json: {
        query: query,
        mode: 'cors',
      },
      responseType: 'json',
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-API-KEY': process.env.BITQUERY_API_KEY,
      },
    })
    .then(json => {
      resolve(json.body)
    })
    .catch((e) => {
      reject(e)
    })
  })
}

function sendRequest2(query) {
  return new Promise((resolve, reject) => {
    axios.post("https://graphql.bitquery.io/", 
      {
        query: query,
        variables: "{}"
      },
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-API-KEY': process.env.BITQUERY_API_KEY, 
        },      
      })
    .then(json => {
      resolve(json.data)
    })
    .catch((e) => {
      reject(e)
    })
  })
}


function makeQueryTokenInfo(token, network) {
return `
{
  ethereum(network: ${network}) {
    smartContractCalls(
      smartContractMethod: {is: "Contract Creation"}
      smartContractAddress: {is: "${token}"}
    ) {
      block {
        timestamp {
          time
        }
      }
      smartContract {
        contractType
        currency {
          name
          symbol
          tokenType
          decimals
        }
      }
      smartContractMethod {
        name
      }
    }
  }
}`
}

function makeQueryTokensInfo(tokens, network) {
return `
{
  ethereum(network: ${network}) {
    smartContractCalls(
      smartContractMethod: {is: "Contract Creation"}
      smartContractAddress: {in: [${tokens.map(t => '\"'+t+'\"').join(',')}]}
    ) {
      block {
        timestamp {
          time
        }
      }
      smartContract {
        contractType
        currency {
          name
          symbol
          tokenType
        }
        address {
          address
        }
      }
      smartContractMethod {
        name
      }
    }
  }
}`
}

function makeQueryTotalSupplies(token, network){
  return `
  {
      ethereum(network: ${network}) {
      transfers(
      currency: {is: "${token}"}
      sender: {is: "0x0000000000000000000000000000000000000000"}
      ) {
      amount
      }
      }
  }
  `
}

function makeQueryBurnedTokens(token, network='bsc') {
  return `
  {
      ethereum(network: ${network}) {
      transfers(
      currency: {is: "${token}"}
      receiver: {
      in: ["0x0000000000000000000000000000000000000000",
      "0x000000000000000000000000000000000000dead",
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000002"]
      }
      ) {
      amount
      }
      }
  }
  `
}

function makeQueryTokenPairs(token, network='bsc') {
return `
  {
    ethereum(network: ${network}) {
      dexTrades(
        baseCurrency: {is: "${token}"}
        options: {desc: "trades", limit: 10}
      ) {
        poolToken: smartContract {
          address {
            address
          }
        }
        exchange {
          fullName
        }
        pair: quoteCurrency {
          symbol
          address
        }
        trades: count
        quotePrice
      }
    }
  }
`
}

function makeQueryBalances(address, network) {
return `
  {
    ethereum(network: ${network}) {
      address(address: {is: "${address}"}) {
        balances {
          currency {
            symbol
          }
          value
        }
      }
    }
  }
`
}

function makeQueryLatestPrice(address, network = 'bsc') {
  // busd or usdc
  if (network === 'bsc') {
    return `
    {
      ethereum(network: ${network}) {
        dexTrades(
          options: {desc: ["block.height", "tradeIndex"], limit: 1}
          exchangeName: {in: ["Pancake", "Pancake v2"]}
          baseCurrency: {is: "${address}"}
          quoteCurrency: {is: "0xe9e7cea3dedca5984780bafc599bd69add087d56"}
        ) {
          transaction {
            hash
          }
          tradeIndex
          smartContract {
            address {
              address
            }
            contractType
            currency {
              name
            }
          }
          tradeIndex
          block {
            height
          }
          baseCurrency {
            symbol
            address
          }
          quoteCurrency {
            symbol
            address
          }
          quotePrice
        }
      }
    }  
    `
  }
  return `
  {
    ethereum(network: ${network}) {
      dexTrades(
        options: {desc: ["block.height", "tradeIndex"], limit: 1}
        exchangeName: {in: ["Uniswap"]}
        baseCurrency: {is: "${address}"}
        quoteCurrency: {is: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"}
      ) {
        transaction {
          hash
        }
        tradeIndex
        smartContract {
          address {
            address
          }
          contractType
          currency {
            name
          }
        }
        tradeIndex
        block {
          height
        }
        baseCurrency {
          symbol
          address
        }
        quoteCurrency {
          symbol
          address
        }
        quotePrice
      }
    }
  }  
  `
}

function makeQueryLatestPriceByETH(address, network = 'bsc') {
  // wbnb or weth
  if (network === 'bsc') {
    return `
    {
      ethereum(network: ${network}) {
        dexTrades(
          options: {desc: ["block.height", "tradeIndex"], limit: 1}
          exchangeName: {in: ["Pancake", "Pancake v2"]}
          baseCurrency: {is: "${address}"}
          quoteCurrency: {is: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"}
        ) {
          transaction {
            hash
          }
          tradeIndex
          smartContract {
            address {
              address
            }
            contractType
            currency {
              name
            }
          }
          tradeIndex
          block {
            height
          }
          baseCurrency {
            symbol
            address
          }
          quoteCurrency {
            symbol
            address
          }
          quotePrice
        }
      }
    }  
    `
  }

  return `
    {
      ethereum(network: ${network}) {
        dexTrades(
          options: {desc: ["block.height", "tradeIndex"], limit: 1}
          exchangeName: {in: ["Uniswap"]}
          baseCurrency: {is: "${address}"}
          quoteCurrency: {is: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"}
        ) {
          transaction {
            hash
          }
          tradeIndex
          smartContract {
            address {
              address
            }
            contractType
            currency {
              name
            }
          }
          tradeIndex
          block {
            height
          }
          baseCurrency {
            symbol
            address
          }
          quoteCurrency {
            symbol
            address
          }
          quotePrice
        }
      }
    }  
    `
}

function makeQueryRenouncedInfo(address, network = 'bsc') {
  return `
  {
    ethereum(network: ${network}) {
      smartContractCalls(
        smartContractMethod: {is: "renounceOwnership"}
        smartContractAddress: {is: "${address}"}
      ) {
        block {
          timestamp {
            time
          }
        }
        smartContract {
          contractType
          currency {
            name
            symbol
            tokenType
            decimals
          }
        }
        smartContractMethod {
          name
        }
      }
    }
  }`
}

function makeQueryLatestCreatedTokens(since, till, network = 'bsc') {
  return `
    {
      ethereum(network: ${network}) {
        smartContractCalls(
          smartContractMethod: {is: "Contract Creation"}
          smartContractType: {is: Token}
          time: {since: "${since}", till: "${till}"}
        ) {
          block {
            height
            timestamp {
              time
            }
          }
          smartContract {
            contractType
            address {
              address
            }
            currency {
              name
              symbol
              tokenType
              decimals
            }
          }
        }
      }
    } 
  `
}

function makeTransactionsQuery(token, network='bsc'){
  return `
    {
      ethereum(network: ${network}) {
        dexTrades(
          options: {desc: "block.timestamp.time", limit: 10}
          quoteCurrency: {is: "${token}"}
        ) {
          block {
            timestamp {
              time(format: "%Y-%m-%d %H:%M:%S GMT")
            }
          }
          transaction {
            hash
            gasPrice
            gasValue
          }
          baseCurrency {
            symbol
          }
          quoteCurrency {
            symbol
          }
          sellCurrency {
            name
            symbol
          }
          buyCurrency {
            name
            symbol
          }
          tradeAmount(in: USD)
          side
          buyAmount
          sellAmount
          quoteAmount
          quotePrice
          exchange {
            name
          }
        }
      }
    }`
}

module.exports = {
  sendRequest,
  sendRequest2,

  makeQueryTokenInfo,
  makeQueryTokensInfo,

  makeQueryBurnedTokens,
  makeQueryTotalSupplies,

  makeQueryTokenPairs,
  makeQueryBalances,
  
  makeQueryLatestPrice,
  makeQueryLatestPriceByETH,

  makeQueryRenouncedInfo,
  makeQueryLatestCreatedTokens,

  makeTransactionsQuery
}
