const axios = require('axios')
const parser = require('@solidity-parser/parser')

/**
 *  example mint patterns

_totalSupply = _totalSupply . add ( _amount ) ; _balances [ _to ] = _balances [ _to ] . add ( _amount ) ;
emit Mint ( user , value ) ;
emit Transfer ( address( 0 ), _to , _amount ) ;
*/
const FUZZY_MINT_PATTERNS = [
  /(_)?totalsupply = (_)?totalsupply . add \( \w+ \) ; (_)?balances \[ \w+ \] \= (_)?balances \[ \w+ \] . add \( \w+ \) ;/i,
  /(_)?totalsupply \+\= \w+ ; (_)?balances \[ \w+ \] \+\= \w+ ;/i,
  /emit Mint \( \w+ , \w+ \) ;/,
/*  /emit Transfer \( address \( 0 \) , \w+ , \w+ \) ;/, // double occurrence */
]

/**
 *  Detect mint(), and get compiler version from contract source.
 * 
 *  - 1st: Search 'mint' function from contract ABI
 *    I think, searching fixed string of 'mint()' is not effective than this.
 * 
 *  - 2nd: Analysis mint code pattern from contract source code
 * 
 *  @returns mintEnabled, and compiler version, as an array
 */
const getInfoFromSourceCode = async (tokenAddress, network='bsc') => {
  let startAt = Date.now()
  let url
  if (network === 'bsc')
  {
    url = `https://api.bscscan.com/api?module=contract&action=getsourcecode&address=${tokenAddress}&apikey=${process.env.BSCSCAN_API_KEY}`
  } else {
    url = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${tokenAddress}&apikey=${process.env.ETHSCAN_API_KEY}`
  }

  let {data} = await axios.get(url)

  if (!data || data.status === '0') {
    console.log('Unable to fetch contract source code for ', tokenAddress)
    return [false, null]
  }
  let contractSourceCode = data.result[0].SourceCode
  let contractABI = data.result[0].ABI
  let compilerVersion = data.result[0].CompilerVersion

  if (contractSourceCode === '') {
    console.log('Invalid token address')
    return [false, null]
  }

  /**
   *  search mint from ABI
   */
  let result = contractABI.search(/\"mint\"/)
  if (result >= 0) {
    return [true, compilerVersion]
  }

  /**
   *  Normalize contract source
   *  just removing all comments, and joining with space only
   */
  let tokenizedContract = parser
    .tokenize(contractSourceCode)
    .filter(token => token.value.substring(0, 2) !== '//' && token.value.substring(0, 2) !== '/*')
  let normalizedContract = tokenizedContract.map(token => token.value).join(' ')

  /**
   *  Search mint() pattern
   */
  for (let item of FUZZY_MINT_PATTERNS) {
    if (normalizedContract.search(item) >= 0) {
      return [true, compilerVersion]
    }
  }

  return [false, compilerVersion]
}

module.exports = {
  getInfoFromSourceCode
}
