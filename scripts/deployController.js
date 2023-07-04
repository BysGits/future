const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config();

async function main() {
    [deployer] = await ethers.getSigners();

    console.log(`Deploying contracts with the account: ${deployer.address}`);
    console.log(`Balance: ${(await deployer.getBalance()).toString()}`);

    Controller = await ethers.getContractFactory("Controller");
    controller = await Controller.deploy();
    await controller.deployed();

    console.log("Controller deployed: " + controller.address);

    ProxyController = await ethers.getContractFactory("Proxy");
    proxyController = await ProxyController.deploy(controller.address);
    await proxyController.deployed();

    controller = await Controller.attach(proxyController.address);
    await controller.deployed();

    console.log("Proxy Controller deployed: " + controller.address);

    initializing = await controller
        .connect(deployer)
        .initialize(
            process.env.MIN_COLLATERAL_RATIO,
            process.env.MAX_COLLATERAL_RATIO,
            process.env.UPDATE_PRICE_CYCLE,
            process.env.SUSHISWAP_V2_ROUTER_FUJI
        );
    await initializing.wait();

    console.log("Controller initialized");

    lockTime = await controller
        .connect(deployer)
        .setLockTime(process.env.LOCK_TIME);
    await lockTime.wait();

    console.log("Lock time set");

    royalty = await controller
        .connect(deployer)
        .setRoyaltyFeeRatio(process.env.ROYALTY_FEE_RATIO);
    await royalty.wait();

    console.log("Royalty fee ratio set");

    register = await controller
        .connect(deployer)
        .registerCollateralAsset(process.env.EURB_ADDRESS, true);
    await register.wait();

    console.log("EURB registered");

    admins = JSON.parse(fs.readFileSync("./scripts/data/adminList.json"));

    if (admins.length > 0) {
        for (i = 0; i < admins.length; i++) {
            set = await controller
                .connect(deployer)
                .setAdmin(admins[i].toString());
            await set.wait();
        }

        console.log("Admin list set");
    }

    const currentProvider = (
        await (await ethers.getSigner()).provider.getNetwork()
    ).chainId;

    console.log("Chain ID: " + currentProvider);

    switch (currentProvider) {
        case 1:
            console.log("ethereum mainnet");
            contracts = JSON.parse(
                fs.readFileSync(
                    "./scripts/data/mainnet/ethereum/contracts.json"
                )
            );
            contracts.controller = controller.address;
            fs.writeFileSync(
                "./scripts/data/mainnet/ethereum/contracts.json",
                JSON.stringify(contracts)
            );
            break;
        case 43113:
            console.log("fuji");
            contracts = JSON.parse(
                fs.readFileSync("./scripts/data/testnet/fuji/contracts.json")
            );
            contracts.controller = controller.address;
            fs.writeFileSync(
                "./scripts/data/testnet/fuji/contracts.json",
                JSON.stringify(contracts)
            );
            break;
        case 43114:
            console.log("avalanche");
            contracts = JSON.parse(
                fs.readFileSync(
                    "./scripts/data/mainnet/avalanche/contracts.json"
                )
            );
            contracts.controller = controller.address;
            fs.writeFileSync(
                "./scripts/data/mainnet/avalanche/contracts.json",
                JSON.stringify(contracts)
            );
            break;
        case 56:
            console.log("bsc mainnet");
            contracts = JSON.parse(
                fs.readFileSync("./scripts/data/mainnet/bsc/contracts.json")
            );
            contracts.controller = controller.address;
            fs.writeFileSync(
                "./scripts/data/mainnet/bsc/contracts.json",
                JSON.stringify(contracts)
            );
            break;
        case 97:
            console.log("bsc testnet");
            contracts = JSON.parse(
                fs.readFileSync("./scripts/data/testnet/bsc/contracts.json")
            );
            contracts.controller = controller.address;
            fs.writeFileSync(
                "./scripts/data/testnet/bsc/contracts.json",
                JSON.stringify(contracts)
            );
            break;
        case 80001:
            console.log("polygon testnet");
            contracts = JSON.parse(
                fs.readFileSync("./scripts/data/testnet/polygon/contracts.json")
            );
            contracts.controller = controller.address;
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
