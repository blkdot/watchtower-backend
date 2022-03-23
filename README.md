# CRYPTOWATCHTOWER.IO Backend API

## End points
- /api/v1/token/{token symbol or address}

description: performing rug-pull-scanning for the specified token, and returns the results.

If not found the token name or not valid address, then rejects with 404 Error.

example:

/api/v1/token/shark

/api/v1/token/0x7040E822bB833EE6A5B69229D3560c418B1619C7

response:
```
{
  "state": "pending",
  "result": {
  }
}
```

```
{
  "state": "active",
  "progress": 50,
  "result": {
  }
}
```

```
{
  "state": "failed",
  "progress": 50,
  "reason": "error-while-fetching-price",
  "result": {
  }
}
```

```
{
  "state": "completed",
  "result": {
    "_id": "616818f2819a21b3b75e7af8",
    "address": "0xb7dba4c673bedb174dc3ff7ec65d17c863d39b16",
    "network": "bsc",
    "name": "FatCake",
    "symbol": "FATCAKE",
    "decimals": 18,
    "created": "2021-07-24T17:12:35.000Z",
    "description": "Fat Coin is the first token to be used as an investor position into a business, Frosting Social. Taxes and fees from Frosting will pay Fat Coin holders daily, making it the first community owned social media. \r\n\r\nContent creators can set subscription fees, receive donations, and gain full control of their content and profits. You earn 100% of your revenue! \r\n\r\nFrosting is made for gamers, streamers, or anyone who wants to monetize their following!",
    "homepage": "https://fatcake.club/",
    "imageURL": "https://assets.coingecko.com/coins/images/17400/large/Copy-of-Untitled-6.png?1631512375",
    "compilerVersion": "v0.6.12+commit.27d51765",
    "price": 0.000008841454980400247,
    "totalSupply": 99999999999.99998,
    "burnedAmount": 500000000,
    "totalHolders": 4862,
    "top5Holders": [
      {
        "holderAddress": "0xf4d98fc86ea90e786184b2332aa8d5b01e581762",
        "quantity": 3083915721.1851573,
        "percent": 0.030839157211851577,
        "value": 27266.30201220713,
        "_id": "616818f2819a21b3b75e7af9"
      },
      {
        "holderAddress": "0xc819a2787ecacb7d50cedd34dfb93cb8dc6e340d",
        "quantity": 1778524990.5,
        "percent": 0.017785249905,
        "value": 15724.748635022528,
        "_id": "616818f2819a21b3b75e7afa"
      },
      {
        "holderAddress": "0xbe45cb044c8627105cf3f76db6329bcb5cef3f95",
        "quantity": 1592524941.8367581,
        "percent": 0.015925249418367583,
        "value": 14080.237578414219,
        "_id": "616818f2819a21b3b75e7afb"
      },
      {
        "holderAddress": "0xf1b59b1c84d69f42bd40fe5013455dfc47adaaae",
        "quantity": 1517234273.2987027,
        "percent": 0.015172342732987029,
        "value": 13414.558522090765,
        "_id": "616818f2819a21b3b75e7afc"
      },
      {
        "holderAddress": "0x8a75647729dcdbeb03fc8cb375bcf1c1e380c23e",
        "quantity": 1500771220.4846976,
        "percent": 0.015007712204846977,
        "value": 13269.001181795787,
        "_id": "616818f2819a21b3b75e7afd"
      }
    ],
    "top5Percent": 0.09472971147305316,
    "top5PercentBurnAdjusted": 0.09520574017392279,
    "mintEnabled": false,
    "honeypot": "MEDIUM_FEE",
    "liquidityPools": [
      {
        "pairSymbol": "WBNB",
        "pairAddress": "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
        "poolAddress": "0x6612879d031846723ecf7322afb4f3a97a045dc2",
        "tokens": [
          {
            "symbol": "FATCAKE",
            "holdings": 26261958117.349407,
            "price": 0.000008841454980400247,
            "_id": "616818f2819a21b3b75e7aff"
          },
          {
            "symbol": "WBNB",
            "holdings": 482.4726324092786,
            "price": 480.07,
            "_id": "616818f2819a21b3b75e7b00"
          }
        ],
        "totalLpTokens": 3.44342133186392e-12,
        "lockedLpTokensRate": 0.9909065715460923,
        "_id": "616818f2819a21b3b75e7afe"
      },
      {
        "pairSymbol": "BUSD",
        "pairAddress": "0xe9e7cea3dedca5984780bafc599bd69add087d56",
        "poolAddress": "0x90d82162f2c6f8dd7ea335809a7b96110f0f29c3",
        "tokens": [
          {
            "symbol": "FATCAKE",
            "holdings": 16145683.959590029,
            "price": 0.000008841454980400247,
            "_id": "616818f2819a21b3b75e7b02"
          },
          {
            "symbol": "BUSD",
            "holdings": 137.1132674042164,
            "price": 1,
            "_id": "616818f2819a21b3b75e7b03"
          }
        ],
        "totalLpTokens": 3.120128955239963e-14,
        "lockedLpTokensRate": 0.8649650009947369,
        "_id": "616818f2819a21b3b75e7b01"
      }
    ],
    "riskRating": 7,
    "scannedAt": 1634212082332,
    "unLaunched": false,
    "isScammer": false,
    "searches": 5,
    "__v": 0
  }
}
```

## History

- v0.8    08/16/2021  by @allmysmarts
- v1.0    09/01/2021  by @allmysmarts (v1 Beta Release)
- v1.0.2  10/04/2021  by @allmysmarts
```
External APIs added for 3rd party service buyers.
```

- v1.1    10/14/2021 by @allmysmarts
```
Save token into MongoDB database.
And add sync-tokens-worker to feed latest launched tokens regularly.
```
