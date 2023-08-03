# UWE Contract

## Config file .env

**MIN_COLLATERAL_RATIO = 150 means 150%**

**MAX_COLLATERAL_RATIO = 1000 means 1000%**

**UPDATE_PRICE_CYCLE=86400 means 1 day**

**LOCK_TIME=1209600 means 2 weeks**

**ROYALTY_FEE_RATIO = 100 means 1%**

**INITIAL_SUPPLY is in ether unit**

**UASSET_PER_POOL is in ether unit**

## Networks

[Rinkeby]:

Uniswap router: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D

Uniswap factory: 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f

Proxy Controller:
0xD0e28a6F4c63D9C63A41b043a2d6317c1dE56781

Proxy MintContract:
0x4D41849156E15D6e948DEFe3B3B9F64F192b8731

Proxy LimitOffer:
0xF49AB7883b007BC141A65af116C32C9f30BD05b5


EURB: 0xBee09d881765668BC192A7944b3E4FB91498Bd4e

uTSLA: 0x33E9cE246eB369e1ecC8bcf8aCd5E8223A22b8A4

uAAPL: 0x0559e84a82d5a9Ea0a37c1935f3Ce37A107562EF


[Ethereum_Mainnet]:

Uniswap router: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D

Uniswap factory: 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f


## Deploy contracts

> npm run deploy:*network name*:controller

> npm run deploy:*network name*:minter

> npm run deploy:*network name*:offer


## Deploy tokens

**To deploy specific tokens, input the name of the token in the variable array in the file deployTokens.js** 

**If the array is empty, it will deploy all the tokens in the scripts/data/*network name*/deployedToken.json**

**Default discount rate for each token is 10%**

>   npm run deploy:*network name*:token


## Deploy oracles

**To deploy specific oracles of tokens, input the name of the token in the variable array in the file deployOracles.js**

**If the array is empty, it will deploy all the oracles of each tokens in the scripts/data/*network name*/deployedToken.json**

>   npm run deploy:*network name*:oracle


## Update prices

>   npm run fetch_data

**To update prices of specific tokens, input the name of the token in the variable array in the file updatePrices.js**

**If the array is empty, it will update prices of all tokens in the scripts/data/*network name*/deployedToken.json**

>   npm run update_prices:*network name*


## Deploy pools

**To deploy specific pools of tokens, input the name of the token in the variable array in the file deployPools.js**

**If the array is empty, it will deploy all the pools of each tokens in the scripts/data/*network name*/deployedToken.json**

>   npm run deploy:*network name*:pool


## Register Tokens

**To register specific tokens, input the name of the token in the variable array in the file registerTokens.js**

**If the array is empty, it will register all tokens in the scripts/data/*network name*/deployedToken.json**

>   npm run register_tokens:*network name*


## Upgrade contracts

> npm run upgrade:*network name*:controller

> npm run upgrade:*network name*:minter

> npm run upgrade:*network name*:offer


## Verify contracts

### Verify Controller

> npx hardhat verify --network *network name* *address of the deployed proxy* *address of the deployed controller*

> npx hardhat verify --network *network name* *address of the deployed controller*

### Verify Minter

> npx hardhat verify --network *network name* *address of the deployed proxy* *address of the deployed minter*

> npx hardhat verify --network *network name* *address of the deployed minter*

### Verify Offer

> npx hardhat verify --network *network name* *address of the deployed proxy* *address of the deployed offer*

> npx hardhat verify --network *network name* *address of the deployed offer*