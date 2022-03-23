const axios = require('axios')
const cheerio = require('cheerio')

/**
 * It fetches holders data from web site (etherscan.io, or bscscan.com).
 * But etherscan.io rejects frequent incoming requests.
 * So it is only useful for bscscan.com
 * 
 * @param {*} address 
 * @param {*} network 
 * @returns 
 */

const fetchHoldersCount = async (address, network='bsc') => {
  if (network === 'bsc') {
    url = `https://bscscan.com/token/${address}`
  } else {
    url = `https://etherscan.io/token/${address}` // not working, due to captcha
  }

  try {
    let {data} = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36'
      }
    })
    const $ = cheerio.load(data)

    let addressesCount = $('#ContentPlaceHolder1_tr_tokenHolders .row .col-md-8 .mr-3').text()
    return parseInt(addressesCount.split(',').join(''))
  } catch(e) {
    console.error('[Token] Error while scraping holders number of ', address, ' in ', network)
    return -1
  }
  return 0
}

const fetchHolders = async (address, network='bsc', n=5) => {
  let url
  let holders = []

  if (network === 'bsc') {
    url = `https://bscscan.com/token/generic-tokenholders2?m=normal&a=${address}`
  } else {
    url = `https://etherscan.io/token/generic-tokenholders2?m=normal&a=${address}`
  }

  try {
    let {data} = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36'
      }
    })
    const $ = cheerio.load(data)

    $('table tbody').find('tr').slice(0, n).each(function (rowId, row) {
      let holder = {}

      $(row).find('td').each(function (cellId, cell) {
        if (cellId == 1) {
          let href = $('span a', cell).attr('href')
          holder.TokenHolderAddress = href.substring(href.length - 42)
        }
        if (cellId === 2) {
          let count = $(cell).text()
          holder.TokenHolderQuantity = count.split(',').join('')
        }
      })
      holders.push(holder)
    });

    return holders
  } catch(e) {
    console.error('[Token] Error while scraping holders of ', address, ' in ', network)
    // console.error('error: ', e)
  }
  return []
}

module.exports = {
  fetchHoldersCount,
  fetchHolders
}
