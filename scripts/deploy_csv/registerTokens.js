const { ethers } = require("hardhat");
const csv = require("csv-parser");
const fs = require("fs");
let csvToJson = require("convert-csv-to-json");
const ObjectsToCsv = require("objects-to-csv");

require("dotenv").config();

async function main() {
    [deployer] = await ethers.getSigners();

    console.log(`Deploying contracts with the account: ${deployer.address}`);
    console.log(`Balance: ${(await deployer.getBalance()).toString()}`);

    // array = ["uTSLA","uAAPL","uMSFT","uDIS","uAMZN","uNVDA","uBA","uAMD","uMETA"]  // list of name of tokens

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
        case 4:
            console.log("fuji");
            contracts = JSON.parse(
                fs.readFileSync("./scripts/data/testnet/fuji/contracts.json")
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

    var tokens;
    var oracles;
    var csv, json;

    switch (currentProvider) {
        case 1:
            console.log("ethereum mainnet");
            // tokens = JSON.parse(
            //     fs.readFileSync("./scripts/data/mainnet/ethereum/deployedToken.json")
            // );
            // oracles = JSON.parse(
            //     fs.readFileSync("./scripts/data/mainnet/ethereum/infoToken.json")
            // );
            json = csvToJson
                .fieldDelimiter(",")
                .getJsonFromCsv(
                    "./scripts/data/mainnet/ethereum/infoToken.csv"
                );
            break;
        case 4:
            console.log("fuji");
            json = csvToJson
                .fieldDelimiter(",")
                .getJsonFromCsv("./scripts/data/testnet/fuji/infoToken.csv");
            // csv = fs.readFileSync("./scripts/data/testnet/fuji/infoToken.csv")
            break;
        case 56:
            console.log("bsc mainnet");
            json = csvToJson
                .fieldDelimiter(",")
                .getJsonFromCsv("./scripts/data/mainnet/bsc/infoToken.csv");
            break;
        case 97:
            console.log("bsc testnet");
            json = csvToJson
                .fieldDelimiter(",")
                .getJsonFromCsv("./scripts/data/testnet/bsc/infoToken.csv");
            break;
        case 80001:
            console.log("polygon testnet");
            json = csvToJson
                .fieldDelimiter(",")
                .getJsonFromCsv("./scripts/data/testnet/polygon/infoToken.csv");
            break;
        default:
            break;
    }

    // info = csv.split(",")
    // console.log(json.length)
    // json[0].SYMBOL = "asdf"
    // csv = new ObjectsToCsv(json)
    // await csv.toDisk('./list.csv')
    // tokenMap = new Map(tokens)
    // infoMap = new Map(oracles)
    // supply = ethers.utils.parseEther(process.env.INITIAL_SUPPLY).toString()

    console.log("Registering tokens: ...");

    var tokenAddresses = [];
    var oracleAddresses = [];
    var poolAddresses = [];
    var collateralTokens = [];
    var discountRates = [];

    for (var i = 0; i < json.length; i++) {
        if (
            json[i].CONTRACTADDRESS != "" &&
            json[i].ORACLEADDRESS != "" &&
            json[i].POOLADDRESS != ""
        ) {
            tokenAddress = json[i].CONTRACTADDRESS;
            oracleAddress = json[i].ORACLEADDRESS;
            poolAddress = json[i].POOLADDRESS;
            collateralToken = process.env.USDT_ADDRESS;
            discountRate = 10;
            tokenAddresses.push(tokenAddress);
            oracleAddresses.push(oracleAddress);
            poolAddresses.push(poolAddress);
            collateralTokens.push(collateralToken);
            discountRates.push(discountRate);
        }
    }

    console.log(contracts);

    var Controller = await ethers.getContractFactory("Controller");
    var controller = await Controller.attach(contracts.controller);
    await controller.deployed();

    console.log(controller.address);

    register = await controller.registerIDOTokens(
        tokenAddresses,
        oracleAddresses,
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
