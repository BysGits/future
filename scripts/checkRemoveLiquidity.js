const { ethers } = require("hardhat");
const csv = require("csv-parser");
const fs = require("fs");
let csvToJson = require("convert-csv-to-json");
const ObjectsToCsv = require("objects-to-csv");
const { info } = require("console");
const axios = require("axios").default;

require("dotenv").config();

Number.prototype.before = function () {
    var value = parseInt(this.toString().split(".")[0], 10); //before
    return value ? value : 0;
};

var ListModel = function (jsonData) {
    var self = this;

    self.master = [];

    function nestedMapping(data, level) {
        var key, value, type;

        for (key in data) {
            if (data.hasOwnProperty(key)) {
                if (data[key] instanceof Object) {
                    type = "array";
                    value = [];
                    nestedMapping(data[key], value);
                } else {
                    type = "simple";
                    value = data[key];
                }
                level.push({ key: key, type: type, value: value });
            }
        }
    }

    nestedMapping(jsonData, self.master);
};

async function main() {
    [deployer] = await ethers.getSigners();

    console.log(`Deploying contracts with the account: ${deployer.address}`);
    console.log(`Balance: ${(await deployer.getBalance()).toString()}`);

    // array = ["uTSLA","uAAPL","uMSFT","uDIS","uAMZN","uNVDA","uBA","uAMD","uMETA"]  // list of name of tokens

    var Router = await ethers.getContractFactory("UniswapV2Router02");
    var router = await Router.attach(process.env.UNISWAP_V2_ROUTER_FUJI);
    await router.deployed();

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
    Token = await ethers.getContractFactory("ERC20Token");
    token = await Token.attach("0xf7c7f7b6d6cb42492dd6bddc416d5cac4a402907");
    await token.deployed();

    Pool = await ethers.getContractFactory(
        "contracts/UniswapV2Pair.sol:UniswapV2Pair"
    );
    pool = await Pool.attach("0xDc88ce832cD3B921C647c7b2881d5977E5052940");
    await pool.deployed();

    console.log(await token.balanceOf(pool.address));
    console.log(await pool.totalSupply());
    uToken =
        (parseInt("4176793706739187") *
            parseInt(await token.balanceOf(pool.address))) /
        parseInt(await pool.totalSupply());

    console.log(uToken);
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
