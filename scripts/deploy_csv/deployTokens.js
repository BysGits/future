const { ethers } = require("hardhat");
const csv = require("csv-parser");
const fs = require("fs");
let csvToJson = require("convert-csv-to-json");
const ObjectsToCsv = require("objects-to-csv");

require("dotenv").config();

function convertCSVtoJSON(csv) {
    // Convert the data to String and
    // split it in an array
    var array = csv.toString().split("\r");

    // All the rows of the CSV will be
    // converted to JSON objects which
    // will be added to result in an array
    let result = [];

    // The array[0] contains all the
    // header columns so we store them
    // in headers array
    let headers = array[0].split(", ");

    // Since headers are separated, we
    // need to traverse remaining n-1 rows.
    for (let i = 1; i < array.length - 1; i++) {
        let obj = {};

        // Create an empty object to later add
        // values of the current row to it
        // Declare string str as current array
        // value to change the delimiter and
        // store the generated string in a new
        // string s
        let str = array[i];
        let s = "";

        // By Default, we get the comma separated
        // values of a cell in quotes " " so we
        // use flag to keep track of quotes and
        // split the string accordingly
        // If we encounter opening quote (")
        // then we keep commas as it is otherwise
        // we replace them with pipe |
        // We keep adding the characters we
        // traverse to a String s
        let flag = 0;
        for (let ch of str) {
            if (ch === '"' && flag === 0) {
                flag = 1;
            } else if (ch === '"' && flag == 1) flag = 0;
            if (ch === ", " && flag === 0) ch = "|";
            if (ch !== '"') s += ch;
        }

        // Split the string using pipe delimiter |
        // and store the values in a properties array
        let properties = s.split("|");

        // For each header, if the value contains
        // multiple comma separated data, then we
        // store it in the form of array otherwise
        // directly the value is stored
        for (let j in headers) {
            if (properties[j].includes(", ")) {
                obj[headers[j]] = properties[j]
                    .split(", ")
                    .map((item) => item.trim());
            } else obj[headers[j]] = properties[j];
        }

        // Add the generated object to our
        // result array
        result.push(obj);
    }

    let json = JSON.stringify(result);
    // Convert the resultant array to json and
    // generate the JSON output file.
    return json;
}

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

    console.log("Deploying tokens: ...");
    // info = csv.split(",")
    // console.log(json.length)
    // json[0].SYMBOL = "asdf"
    // csv = new ObjectsToCsv(json)
    // await csv.toDisk('./list.csv')
    // tokenMap = new Map(tokens)
    // infoMap = new Map(oracles)
    // supply = ethers.utils.parseEther(process.env.INITIAL_SUPPLY).toString()

    for (var i = 0; i < json.length; i++) {
        if (
            json[i].CONTRACTADDRESS === "" &&
            json[i].SYMBOL != "" &&
            json[i].UASSET != ""
        ) {
            supply = ethers.utils.parseEther(json[i].INITIALSUPPLY).toString();
            Token = await ethers.getContractFactory("ERC20Token");
            token = await Token.deploy(
                json[i].UASSET,
                json[i].SYMBOL,
                supply,
                contracts.minter
            );
            await token.deployed();

            json[i].CONTRACTADDRESS = token.address;
            console.log(`${json[i].SYMBOL} : ${json[i].CONTRACTADDRESS}`);
        }
    }

    switch (currentProvider) {
        case 1:
            // fs.writeFileSync(
            //     "./scripts/data/mainnet/ethereum/infoToken.json",
            //     JSON.stringify(info)
            // );
            // fs.writeFileSync(
            //     "./scripts/data/mainnet/ethereum/deployedToken.json",
            //     JSON.stringify(array)
            // );
            csv = new ObjectsToCsv(json);
            await csv.toDisk("./scripts/data/mainnet/ethereum/infoToken.csv");
            break;
        case 4:
            csv = new ObjectsToCsv(json);
            await csv.toDisk("./scripts/data/testnet/fuji/infoToken.csv");
            break;
        case 56:
            csv = new ObjectsToCsv(json);
            await csv.toDisk("./scripts/data/mainnet/bsc/infoToken.csv");
            break;
        case 97:
            csv = new ObjectsToCsv(json);
            await csv.toDisk("./scripts/data/testnet/bsc/infoToken.csv");
            break;
        case 80001:
            csv = new ObjectsToCsv(json);
            await csv.toDisk("./scripts/data/testnet/polygon/infoToken.csv");
            break;
        default:
            break;
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
