const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')

let html = fs.readFileSync(path.join(__dirname, './holders/') + 'eth-hyco-holders.html').toString()
const $ = cheerio.load(html)

console.log('total holders: ', $('#ContentPlaceHolder1_tr_tokenHolders .row .col-md-8 .mr-3').text())
