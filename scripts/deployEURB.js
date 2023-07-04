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
    proxyEURB = await ProxyEURB.deploy(eurb.address);
    await proxyEURB.deployed();

    eurb = await EURB.attach(proxyEURB.address);
    await eurb.deployed();

    console.log("Proxy EURB deployed: " + eurb.address);

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
