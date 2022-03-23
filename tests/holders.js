const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')

// axios
//   .get('bscscan.com/token/0x7040E822bB833EE6A5B69229D3560c418B1619C7#balances')
//   .then(({data}) => {
//     const $ = cheerio.load(data);
//     console.log('ContentPlaceHolder1_maintab: ')
//     console.log($('#ContentPlaceHolder1_maintab').text());
//   })

// https://www.bscscan.com/token/generic-tokenholders2?m=normal&a=0x7040E822bB833EE6A5B69229D3560c418B1619C7&s=1000000000000000000000000&sid=e17024a34e6886a3f4d9cb525c04b8d8&p=1
// https://etherscan.io/token/generic-tokenholders2?m=normal&a=0xeD5212d7587E897655A216B093a27E98B8Aa42f5&s=10000000000000000000000000000&sid=a678a6cef67229edc819071e77128b6f&p=1

let html = fs.readFileSync(path.join(__dirname, './holders/') + 'eth-xhdx-lp.html').toString()
const $ = cheerio.load(html)
let holders = []

$('table tbody').find('tr').slice(0, 6).each(function (rowId, row) {
  let holder = {}

  $(row).find('td').each(function (cellId, cell) {
    if (cellId == 1) {
      let href = $('span a', cell).attr('href')
      holder.address = href.substring(href.length - 42)
    }
    if (cellId === 2) {
      let count = $(cell).text()
      holder.count = count.split(',').join('')
    }
  })
  holders.push(holder)
});

console.log(holders)