const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config();

async function main() {
    [deployer] = await ethers.getSigners();

    console.log(`Deploying contracts with the account: ${deployer.address}`);
    console.log(`Balance: ${(await deployer.getBalance()).toString()}`);

    EURB = await ethers.getContractFactory("EURB");
    eurb = await EURB.deploy();
    await eurb.deployed();

    console.log("EURB deployed: " + eurb.address);

    ProxyEURB = await ethers.getContractFactory("ProxyEURB");
    proxyEURB = await ProxyEURB.attach(process.env.EURB_ADDRESS);
    await proxyEURB.deployed();

    upgrade = await proxyEURB.upgradeTo(eurb.address);
    await upgrade.wait();

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
