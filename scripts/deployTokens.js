const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config();

async function main() {
    [deployer] = await ethers.getSigners();

    console.log(`Deploying contracts with the account: ${deployer.address}`);
    console.log(`Balance: ${(await deployer.getBalance()).toString()}`);

    array = ["uBVS"]; // list of name of tokens

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

    var tokens;
    var oracles;

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
    infoMap = new Map(oracles);
    supply = ethers.utils.parseEther(process.env.INITIAL_SUPPLY).toString();

    if (array.length > 0) {
        for (i = 0; i < array.length; i++) {
            if (tokenMap.get(array[i]) == 0) {
                tokenMap.set(array[i], 1);
                Token = await ethers.getContractFactory("ERC20Token");
                token = await Token.deploy(
                    'k' + array[i].substring(1),
                    'k' + array[i].substring(1),
                    supply,
                    contracts.minter
                );
                await token.deployed();

                infoMap.set(array[i], [
                    `${token.address}`,
                    "",
                    "",
                    process.env.EURB_ADDRESS,
                    10,
                ]);
                console.log(`${array[i]} : ` + token.address);
            }
        }

        array = Array.from(tokenMap);
    } else {
        array = Array.from(tokenMap);
        for (i = 0; i < array.length; i++) {
            if (array[i][1] == 0) {
                array[i][1] = 1;
                Token = await ethers.getContractFactory("ERC20Token");
                token = await Token.deploy(
                    array[i][0],
                    array[i][0],
                    supply,
                    contracts.minter
                );
                await token.deployed();
                infoMap.set(array[i][0], [
                    `${token.address}`,
                    "",
                    "",
                    process.env.EURB_ADDRESS,
                    10,
                ]);

                console.log(`${array[i][0]} : ` + token.address);
            }
        }
    }

    info = Array.from(infoMap);

    switch (currentProvider) {
        case 1:
            fs.writeFileSync(
                "./scripts/data/mainnet/ethereum/infoToken.json",
                JSON.stringify(info)
            );
            fs.writeFileSync(
                "./scripts/data/mainnet/ethereum/deployedToken.json",
                JSON.stringify(array)
            );
            break;
        case 43113:
            fs.writeFileSync(
                "./scripts/data/testnet/fuji/infoToken.json",
                JSON.stringify(info)
            );
            fs.writeFileSync(
                "./scripts/data/testnet/fuji/deployedToken.json",
                JSON.stringify(array)
            );
            break;
        case 43114:
            fs.writeFileSync(
                "./scripts/data/mainnet/avalanche/infoToken.json",
                JSON.stringify(info)
            );
            fs.writeFileSync(
                "./scripts/data/mainnet/avalanche/deployedToken.json",
                JSON.stringify(array)
            );
            break;
        case 56:
            fs.writeFileSync(
                "./scripts/data/mainnet/bsc/infoToken.json",
                JSON.stringify(info)
            );
            fs.writeFileSync(
                "./scripts/data/mainnet/bsc/deployedToken.json",
                JSON.stringify(array)
            );
            break;
        case 97:
            fs.writeFileSync(
                "./scripts/data/testnet/bsc/infoToken.json",
                JSON.stringify(info)
            );
            fs.writeFileSync(
                "./scripts/data/testnet/bsc/deployedToken.json",
                JSON.stringify(array)
            );
            break;
        case 80001:
            fs.writeFileSync(
                "./scripts/data/testnet/polygon/infoToken.json",
                JSON.stringify(info)
            );
            fs.writeFileSync(
                "./scripts/data/testnet/polygon/deployedToken.json",
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
