const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config();

async function main() {
    [deployer] = await ethers.getSigners();

    console.log(`Deploying contracts with the account: ${deployer.address}`);
    console.log(`Balance: ${(await deployer.getBalance()).toString()}`);

    var array = ["kTSLA"]; // list of name of tokens

    var contracts;

    const currentProvider = (
        await (await ethers.getSigner()).provider.getNetwork()
    ).chainId;

    console.log(currentProvider);

    switch (currentProvider) {
        case 1:
            console.log("ethereum mainnet");
            contracts = JSON.parse(
                fs.readFileSync(
                    "./scripts/data/mainnet/ethereum/contracts.json"
                )
            );
            break;
        case 43113:
            console.log("fuji");
            contracts = JSON.parse(
                fs.readFileSync("./scripts/data/testnet/fuji/contracts.json")
            );
            break;
        case 43114:
            console.log("avalanche");
            contracts = JSON.parse(
                fs.readFileSync(
                    "./scripts/data/mainnet/avalanche/contracts.json"
                )
            );
            break;
        case 56:
            console.log("bsc mainnet");
            contracts = JSON.parse(
                fs.readFileSync("./scripts/data/mainnet/bsc/contracts.json")
            );
            break;
        case 97:
            console.log("bsc testnet");
            contracts = JSON.parse(
                fs.readFileSync("./scripts/data/testnet/bsc/contracts.json")
            );
            break;
        case 80001:
            console.log("polygon testnet");
            contracts = JSON.parse(
                fs.readFileSync("./scripts/data/testnet/polygon/contracts.json")
            );
            break;
        default:
            break;
    }

    var Controller = await ethers.getContractFactory("Controller");
    var controller = await Controller.attach(contracts.controller);
    await controller.deployed();

    var oracles;

    switch (currentProvider) {
        case 1:
            console.log("ethereum mainnet");
            oracles = JSON.parse(
                fs.readFileSync(
                    "./scripts/data/mainnet/ethereum/infoToken.json"
                )
            );
            break;
        case 43113:
            console.log("fuji");
            oracles = JSON.parse(
                fs.readFileSync("./scripts/data/testnet/fuji/infoToken.json")
            );
            break;
        case 43114:
            console.log("avalanche");
            oracles = JSON.parse(
                fs.readFileSync(
                    "./scripts/data/mainnet/avalanche/infoToken.json"
                )
            );
            break;
        case 56:
            console.log("bsc mainnet");
            oracles = JSON.parse(
                fs.readFileSync("./scripts/data/mainnet/bsc/infoToken.json")
            );
            break;
        case 97:
            console.log("bsc testnet");
            oracles = JSON.parse(
                fs.readFileSync("./scripts/data/testnet/bsc/infoToken.json")
            );
            break;
        case 80001:
            console.log("polygon testnet");
            oracles = JSON.parse(
                fs.readFileSync("./scripts/data/testnet/polygon/infoToken.json")
            );
            break;
        default:
            break;
    }

    var oracleMap = new Map(oracles);

    var tokenAddresses = [];
    // var oracleAddresses = [];
    var poolAddresses = [];
    var collateralTokens = [];
    var discountRates = [];

    console.log("Registering tokens: ");
    if (array.length > 0) {
        for (i = 0; i < array.length; i++) {
            if (
                oracleMap.get(array[i])[0] != "" &&
                oracleMap.get(array[i])[2] != ""
            ) {
                tokenAddress = oracleMap.get(array[i])[0];
                // oracleAddress = oracleMap.get(array[i])[1];
                poolAddress = oracleMap.get(array[i])[2];
                collateralToken = oracleMap.get(array[i])[3];
                discountRate = oracleMap.get(array[i])[4];
                tokenAddresses.push(tokenAddress);
                // oracleAddresses.push(oracleAddress);
                poolAddresses.push(poolAddress);
                collateralTokens.push(collateralToken);
                discountRates.push(discountRate);
            }
        }
    } else {
        array = Array.from(oracleMap);
        for (i = 0; i < array.length; i++) {
            if (array[i][1][0] != "" && array[i][1][2] != "") {
                tokenAddress = array[i][1][0];
                // oracleAddress = array[i][1][1];
                poolAddress = array[i][1][2];
                collateralToken = array[i][1][3];
                discountRate = array[i][1][4];
                tokenAddresses.push(tokenAddress);
                // oracleAddresses.push(oracleAddress);
                poolAddresses.push(poolAddress);
                collateralTokens.push(collateralToken);
                discountRates.push(discountRate);
            }
        }
    }

    register = await controller.registerIDOTokens(
        tokenAddresses,
        // oracleAddresses,
        poolAddresses,
        collateralTokens,
        discountRates
    );
    await register.wait();

    console.log("Done");
}

main()
    .then(async () => {
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
