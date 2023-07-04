const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config();

async function main() {
    [deployer] = await ethers.getSigners();

    console.log(`Deploying contracts with the account: ${deployer.address}`);
    console.log(`Balance: ${(await deployer.getBalance()).toString()}`);

    array = ["uBVS", "uONON", "uAESI", "uINCY", "uCTKB"]; // list of name of tokens

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

    var oracles;
    var tokens;

    switch (currentProvider) {
        case 1:
            console.log("ethereum mainnet");
            tokens = JSON.parse(
                fs.readFileSync(
                    "./scripts/data/mainnet/ethereum/deployedToken.json"
                )
            );
            oracles = JSON.parse(
                fs.readFileSync(
                    "./scripts/data/mainnet/ethereum/infoToken.json"
                )
            );
            break;
        case 43113:
            console.log("fuji");
            tokens = JSON.parse(
                fs.readFileSync(
                    "./scripts/data/testnet/fuji/deployedToken.json"
                )
            );
            oracles = JSON.parse(
                fs.readFileSync("./scripts/data/testnet/fuji/infoToken.json")
            );
            break;
        case 43114:
            console.log("avalanche");
            tokens = JSON.parse(
                fs.readFileSync(
                    "./scripts/data/mainnet/avalanche/deployedToken.json"
                )
            );
            oracles = JSON.parse(
                fs.readFileSync(
                    "./scripts/data/mainnet/avalanche/infoToken.json"
                )
            );
            break;
        case 56:
            console.log("bsc mainnet");
            tokens = JSON.parse(
                fs.readFileSync("./scripts/data/mainnet/bsc/deployedToken.json")
            );
            oracles = JSON.parse(
                fs.readFileSync("./scripts/data/mainnet/bsc/infoToken.json")
            );
            break;
        case 97:
            console.log("bsc testnet");
            tokens = JSON.parse(
                fs.readFileSync("./scripts/data/testnet/bsc/deployedToken.json")
            );
            oracles = JSON.parse(
                fs.readFileSync("./scripts/data/testnet/bsc/infoToken.json")
            );
            break;
        case 80001:
            console.log("polygon testnet");
            tokens = JSON.parse(
                fs.readFileSync(
                    "./scripts/data/testnet/polygon/deployedToken.json"
                )
            );
            oracles = JSON.parse(
                fs.readFileSync("./scripts/data/testnet/polygon/infoToken.json")
            );
            break;
        default:
            break;
    }

    tokenMap = new Map(tokens);
    oracleMap = new Map(oracles);

    console.log("Oracle of: ");
    if (array.length > 0) {
        for (i = 0; i < array.length; i++) {
            if (
                tokenMap.get(array[i]) === 1 &&
                oracleMap.get(array[i])[1] === ""
            ) {
                Oracle = await ethers.getContractFactory("Oracle");
                oracle = await Oracle.deploy(contracts.controller);
                await oracle.deployed();

                oracleMap.set(array[i], [
                    `${oracleMap.get(array[i])[0]}`,
                    `${oracle.address}`,
                    `${oracleMap.get(array[i])[2]}`,
                    `${oracleMap.get(array[i])[3]}`,
                    `${oracleMap.get(array[i])[4]}`,
                ]);

                console.log(`${array[i]} : ` + oracle.address);
            }
        }

        array = Array.from(oracleMap);
    } else {
        array = Array.from(oracleMap);
        for (i = 0; i < array.length; i++) {
            if (tokenMap.get(array[i][0]) === 1 && array[i][1][1] === "") {
                Oracle = await ethers.getContractFactory("Oracle");
                oracle = await Oracle.deploy(contracts.controller);
                await oracle.deployed();

                array[i][1][1] = `${oracle.address}`;

                console.log(`${array[i][0]} : ` + oracle.address);
            }
        }
    }

    switch (currentProvider) {
        case 1:
            fs.writeFileSync(
                "./scripts/data/mainnet/ethereum/infoToken.json",
                JSON.stringify(array)
            );
            break;
        case 43113:
            fs.writeFileSync(
                "./scripts/data/testnet/fuji/infoToken.json",
                JSON.stringify(array)
            );
            break;
        case 43114:
            fs.writeFileSync(
                "./scripts/data/mainnet/avalanche/infoToken.json",
                JSON.stringify(array)
            );
            break;
        case 56:
            fs.writeFileSync(
                "./scripts/data/mainnet/bsc/infoToken.json",
                JSON.stringify(array)
            );
            break;
        case 97:
            fs.writeFileSync(
                "./scripts/data/testnet/bsc/infoToken.json",
                JSON.stringify(array)
            );
            break;
        case 80001:
            fs.writeFileSync(
                "./scripts/data/testnet/polygon/infoToken.json",
                JSON.stringify(array)
            );
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
