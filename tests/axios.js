const axios = require('axios')
const cheerio = require('cheerio')

let holders = []

axios
  .get(
    'https://bscscan.com/token/generic-tokenholders2?m=normal&a=0x0eD7e52944161450477ee417DE9Cd3a859b14fD0',
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36'
      }
    }
  )
  .then(({data}) => {
    const $ = cheerio.load(data)
    $('table tbody').find('tr').slice(0, 5).each(function (rowId, row) {
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

    console.log('holders: ', holders)
  })
  .catch(e => {
    console.log('error here')
    console.log(e)
  })
