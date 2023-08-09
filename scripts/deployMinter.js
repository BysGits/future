const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config();

async function main() {
    [deployer] = await ethers.getSigners();

    console.log(`Deploying contracts with the account: ${deployer.address}`);
    console.log(`Balance: ${(await deployer.getBalance()).toString()}`);

    Minter = await ethers.getContractFactory("Minter");
    minter = await Minter.deploy();
    await minter.deployed();

    console.log("Minter deployed: " + minter.address);

    ProxyMinter = await ethers.getContractFactory("Proxy");
    proxyMinter = await ProxyMinter.deploy(minter.address);
    await proxyMinter.deployed();

    minter = await Minter.attach(proxyMinter.address);
    await minter.deployed();

    console.log("Proxy Minter deployed: " + minter.address);

    const currentProvider = (
        await (await ethers.getSigner()).provider.getNetwork()
    ).chainId;

    console.log(currentProvider);

    var contracts;

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

    initializing = await minter
        .connect(deployer)
        .setControllerAddress(contracts.controller);
    await initializing.wait();

    console.log("Minter initialized");

    Controller = await ethers.getContractFactory("Controller");
    controller = await Controller.attach(contracts.controller);
    await controller.deployed();

    set = await controller.connect(deployer).setMintContract(minter.address);
    await set.wait();

    console.log("Minter address set in Controller");

    contracts.minter = minter.address;

    switch (currentProvider) {
        case 1:
            fs.writeFileSync(
                "./scripts/data/mainnet/ethereum/contracts.json",
                JSON.stringify(contracts)
            );
            break;
        case 43113:
            fs.writeFileSync(
                "./scripts/data/testnet/fuji/contracts.json",
                JSON.stringify(contracts)
            );
            break;
        case 43114:
            fs.writeFileSync(
                "./scripts/data/mainnet/avalanche/contracts.json",
                JSON.stringify(contracts)
            );
            break;
        case 56:
            fs.writeFileSync(
                "./scripts/data/mainnet/bsc/contracts.json",
                JSON.stringify(contracts)
            );
            break;
        case 97:
            fs.writeFileSync(
                "./scripts/data/testnet/bsc/contracts.json",
                JSON.stringify(contracts)
            );
            break;
        case 80001:
            fs.writeFileSync(
                "./scripts/data/testnet/polygon/contracts.json",
                JSON.stringify(contracts)
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
