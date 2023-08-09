const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config();

async function main() {
    [deployer] = await ethers.getSigners();

    console.log(`Deploying contracts with the account: ${deployer.address}`);
    console.log(`Balance: ${(await deployer.getBalance()).toString()}`);

    Offer = await ethers.getContractFactory("LimitOffer");
    offer = await Offer.deploy();
    await offer.deployed();

    console.log("Offer deployed: " + offer.address);

    ProxyOffer = await ethers.getContractFactory("Proxy");
    proxyOffer = await ProxyOffer.deploy(offer.address);
    await proxyOffer.deployed();

    offer = await Offer.attach(proxyOffer.address);
    await offer.deployed();

    console.log("Proxy Offer deployed: " + offer.address);

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

    initializing = await offer
        .connect(deployer)
        .setControllerAddress(contracts.controller);
    await initializing.wait();

    console.log("Offer initialized");

    Controller = await ethers.getContractFactory("Controller");
    controller = await Controller.attach(contracts.controller);
    await controller.deployed();

    set = await controller
        .connect(deployer)
        .setLimitOfferContract(offer.address);
    await set.wait();

    console.log("Offer address set in Controller");

    contracts.offer = offer.address;

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
