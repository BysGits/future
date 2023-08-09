const { ethers } = require("hardhat");
const csv = require("csv-parser");
const fs = require("fs");
let csvToJson = require("convert-csv-to-json");
const ObjectsToCsv = require("objects-to-csv");
const { info } = require("console");

require("dotenv").config();

Number.prototype.before = function () {
    var value = parseInt(this.toString().split(".")[0], 10); //before
    return value ? value : 0;
};

async function main() {
    [deployer] = await ethers.getSigners();

    console.log(`Deploying contracts with the account: ${deployer.address}`);
    console.log(`Balance: ${(await deployer.getBalance()).toString()}`);

    // array = ["uTSLA","uAAPL","uMSFT","uDIS","uAMZN","uNVDA","uBA","uAMD","uMETA"]  // list of name of tokens

    const currentProvider = (
        await (await ethers.getSigner()).provider.getNetwork()
    ).chainId;

    console.log(currentProvider);

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

    console.log("Reserve of each pool:");
    console.log("\t   | EURB | uAsset");

    var prices = JSON.parse(fs.readFileSync("./scripts/data/price.json"));
    var priceMap = new Map(prices);
    var eurbPerPool = 1000;

    for (var i = 0; i < json.length; i++) {
        if (json[i].SYMBOL != "") {
            var eurbAmount = eurbPerPool.toString();
            var uAssetAmount;
            if (priceMap.get(json[i].SYMBOL)[1] === 0) {
                uAssetAmount = (
                    eurbPerPool / priceMap.get(json[i].SYMBOL)[0]
                ).toString();
            } else {
                uAssetAmount = (
                    eurbPerPool / priceMap.get(json[i].SYMBOL)[1]
                ).toString();
            }
            console.log(`${json[i].SYMBOL} | ${eurbPerPool} | ${uAssetAmount}`);
        }
    }

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
