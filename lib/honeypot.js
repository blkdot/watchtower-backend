const axios = require('axios')

/**
 * HoneyPot Testing.
 * Below texts are reference only.
 */
 const HONEYPOT_INTERPRETATIONS = {
  "UNKNOWN": "The status of this token is unknown. This is usually a system error but could also be a bad sign for the token. Be careful.", // 0, unknown
  "OK": "Honeypot tests passed</b>. Our program was able to buy and sell it succesfully. This however does not guarantee that it is not a honeypot.", // 1, no issues
  "NO_PAIRS": "Could not find any trading pair for this token on the default router and could thus not test it.", // 2, no pairs found
  "SEVERE_FEE": "A <b>severely high trading fee</b> (over 50%) was detected when selling or buying this token.", //  3, fee > 50%
  "HIGH_FEE": "A <b>high trading fee</b> (Between 20% and 50%) was detected when selling or buying this token. Our system was however able to sell the token again.", //  4, fee > 20%
  "MEDIUM_FEE": "A <b>trading fee of over 10%</b> but less then 20% was detected when selling or buying this token. Our system was however able to sell the token again.", // 5, fee > 10%
  "APPROVE_FAILED": "Failed to approve the token. This is very likely a <b>honeypot</b>.", // 6, approval failed
  "SWAP_FAILED": "Failed to sell the token. This is very likely a <b>honeypot</b>." // 7, swap failed
}

const getHoneyPotTesting = async (address, network='bsc') => {
  let url
  if (network === 'bsc') {
    url = `https://honeypot.api.rugdoc.io/api/honeypotStatus.js?address=${address}&chain=bsc`
  } else {
    url = `https://honeypot.api.rugdoc.io/api/honeypotStatus.js?address=${address}&chain=eth`
  }
  
  try {
    const {data} = await axios.get(url);
    return data.status || "OK"
  } catch(e) {
    console.error('[Token] Error while fetching honeypot result of ', address, ' in ', network)
    console.log(e)
    return 'UNKNOWN'
  }
}

const isHoneyPot = (status) => {
  return status === "APPROVE_FAILED" || status === "SWAP_FAILED" || status === "NO_PAIRS" || status === "UNKNOWN"
}

module.exports = {
  getHoneyPotTesting,
  isHoneyPot,
}