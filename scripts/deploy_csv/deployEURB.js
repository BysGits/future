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

    console.log("Deploying EURB: ...");

    supply = ethers.utils.parseEther("1000000").toString();
    Token = await ethers.getContractFactory("ERC20Token");
    token = await Token.deploy("EURB", "EURB", supply, contracts.minter);
    await token.deployed();

    console.log(`${token.address}`);

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
