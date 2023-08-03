# UWE Contract

## Config file .env

**MIN_COLLATERAL_RATIO = 150 means 150%**

**MAX_COLLATERAL_RATIO = 1000 means 1000%**

**UPDATE_PRICE_CYCLE=86400 means 1 day**

**LOCK_TIME=1209600 means 2 weeks**

**ROYALTY_FEE_RATIO = 100 means 1%**

**INITIAL_SUPPLY is in ether unit**

**KASSET_PER_POOL is in ether unit**


## Deploy contracts

> npm run deploy:*network name*:controller

> npm run deploy:*network name*:minter

> npm run deploy:*network name*:offer


## Deploy tokens

**To deploy specific tokens, input the name of the token in the variable array in the file deployTokens.js** 

**If the array is empty, it will deploy all the tokens in the scripts/data/*network name*/deployedToken.json**

**Default discount rate for each token is 10%**

>   npm run deploy:*network name*:token


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