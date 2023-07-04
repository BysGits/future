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

    console.log("Deploying pools: ...");

    var prices = JSON.parse(fs.readFileSync("./scripts/data/price.json"));
    var priceMap = new Map(prices);

    for (var i = 0; i < json.length; i++) {
        if (
            json[i].CONTRACTADDRESS != "" &&
            json[i].ORACLEADDRESS != "" &&
            json[i].POOLADDRESS === ""
        ) {
            var eurbAmount;
            if (priceMap.get(json[i].SYMBOL)[1] === 0) {
                console.log("Take USD price");
                eurbAmount = ethers.utils
                    .parseEther(priceMap.get(json[i].SYMBOL)[0].toString())
                    .mul(json[i].UASSETPERPOOL)
                    .toString();
            } else {
                console.log("Take EUR price");
                eurbAmount = ethers.utils
                    .parseEther(priceMap.get(json[i].SYMBOL)[1].toString())
                    .mul(json[i].UASSETPERPOOL)
                    .toString();
            }
            uAssetAmount = ethers.utils
                .parseEther(json[i].UASSETPERPOOL)
                .toString();
            time = (new Date().getTime() / 1000).before() + 100000;

            Token = await ethers.getContractFactory("ERC20Token");
            token = await Token.attach(json[i].CONTRACTADDRESS);
            await token.deployed();

            if (
                (await token.allowance(deployer.address, router.address)) <
                uAssetAmount
            ) {
                approve = await token.increaseAllowance(
                    router.address,
                    uAssetAmount
                );
                await approve.wait();
            }

            Eurb = await ethers.getContractFactory("ERC20Token");
            eurb = await Eurb.attach(process.env.EURB_ADDRESS);
            await eurb.deployed();

            if (
                (await eurb.allowance(deployer.address, router.address)) <
                eurbAmount
            ) {
                approve = await token.increaseAllowance(
                    router.address,
                    eurbAmount
                );
                await approve.wait();
            }

            addLiquidity = await router.addLiquidity(
                token.address,
                process.env.EURB_ADDRESS,
                uAssetAmount,
                eurbAmount,
                0,
                0,
                deployer.address,
                time
            );
            await addLiquidity.wait();

            Factory = await ethers.getContractFactory("UniswapV2Factory");
            factory = await Factory.attach(process.env.UNISWAP_V2_FACTORY_FUJI);
            await factory.deployed();

            pool = await factory.getPair(
                token.address,
                process.env.EURB_ADDRESS
            );

            json[i].POOLADDRESS = pool;
            console.log(`${json[i].SYMBOL} : ${pool}`);
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
