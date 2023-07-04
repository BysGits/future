const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config();

Number.prototype.before = function () {
    var value = parseInt(this.toString().split(".")[0], 10); //before
    return value ? value : 0;
};

async function main() {
    [deployer] = await ethers.getSigners();

    console.log(`Deploying contracts with the account: ${deployer.address}`);
    console.log(`Balance: ${(await deployer.getBalance()).toString()}`);

    var array = ["uBVS", "uONON", "uAESI", "uINCY", "uCTKB"]; // list of name of tokens

    var Router = await ethers.getContractFactory("UniswapV2Router02");
    var router = await Router.attach(process.env.SUSHISWAP_V2_ROUTER_FUJI);
    await router.deployed();

    var prices = JSON.parse(fs.readFileSync("./scripts/data/price.json"));

    const currentProvider = (
        await (await ethers.getSigner()).provider.getNetwork()
    ).chainId;

    console.log(currentProvider);

    var oracles;

    switch (currentProvider) {
        case 1:
            console.log("ethereum mainnet");
            oracles = JSON.parse(
                fs.readFileSync(
                    "./scripts/data/mainnet/ethereum/infoToken.json"
                )
            );
            break;
        case 43113:
            console.log("fuji");
            oracles = JSON.parse(
                fs.readFileSync("./scripts/data/testnet/fuji/infoToken.json")
            );
            break;
        case 43114:
            console.log("avalanche");
            oracles = JSON.parse(
                fs.readFileSync(
                    "./scripts/data/mainnet/avalanche/infoToken.json"
                )
            );
            break;
        case 56:
            console.log("bsc mainnet");
            oracles = JSON.parse(
                fs.readFileSync("./scripts/data/mainnet/bsc/infoToken.json")
            );
            break;
        case 97:
            console.log("bsc testnet");
            oracles = JSON.parse(
                fs.readFileSync("./scripts/data/testnet/bsc/infoToken.json")
            );
            break;
        case 80001:
            console.log("polygon testnet");
            oracles = JSON.parse(
                fs.readFileSync("./scripts/data/testnet/polygon/infoToken.json")
            );
            break;
        default:
            break;
    }

    var priceMap = new Map(prices);
    var oracleMap = new Map(oracles);

    console.log("Pool of: ");
    if (array.length > 0) {
        for (i = 0; i < array.length; i++) {
            if (
                oracleMap.get(array[i])[0] != "" &&
                oracleMap.get(array[i])[2] === ""
            ) {
                tokenAddress = oracleMap.get(array[i])[0];

                // get usd price
                targetPrice = priceMap.get(array[i])[0].toString();

                // get euro price
                //targetPrice = priceMap.get(array[i])[1].toString()

                eurbAmount = ethers.utils
                    .parseEther(targetPrice)
                    .mul(process.env.UASSET_PER_POOL)
                    .toString();
                uAssetAmount = ethers.utils
                    .parseEther(process.env.UASSET_PER_POOL)
                    .toString();

                time = (new Date().getTime() / 1000).before() + 100000;

                Token = await ethers.getContractFactory("ERC20Token");
                token = await Token.attach(oracleMap.get(array[i])[0]);
                await token.deployed();

                approve = await token.increaseAllowance(
                    router.address,
                    uAssetAmount
                );
                await approve.wait();

                Eurb = await ethers.getContractFactory("ERC20Token");
                eurb = await Eurb.attach(process.env.EURB_ADDRESS);
                await eurb.deployed();

                approve = await eurb.increaseAllowance(
                    router.address,
                    eurbAmount
                );
                await approve.wait();

                addLiquidity = await router.addLiquidity(
                    tokenAddress,
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
                factory = await Factory.attach(
                    process.env.SUSHISWAP_V2_FACTORY_FUJI
                );
                await factory.deployed();

                pool = await factory.getPair(
                    tokenAddress,
                    process.env.EURB_ADDRESS
                );
                console.log(`--- ${array[i]} : ` + pool);

                oracleMap.set(array[i], [
                    `${oracleMap.get(array[i])[0]}`,
                    `${oracleMap.get(array[i])[1]}`,
                    `${pool}`,
                    `${oracleMap.get(array[i])[3]}`,
                    `${oracleMap.get(array[i])[4]}`,
                ]);
            }
        }
        array = Array.from(oracleMap);
    } else {
        array = Array.from(oracleMap);
        for (i = 0; i < array.length; i++) {
            if (array[i][1][0] != "" && array[i][1][2] === "") {
                tokenAddress = array[i][1][0];

                // get usd price
                targetPrice = priceMap.get(array[i][0])[0];

                // get euro price
                //targetPrice = priceMap.get(array[i][0])[1]

                uAssetAmount = ethers.utils
                    .parseEther(process.env.UASSET_PER_POOL)
                    .mul(targetPrice)
                    .toString();
                time = new Date().getTime() / 1000 + 100000;
                addLiquidity = await router.addLiquidity(
                    tokenAddress,
                    process.env.EURB_ADDRESS,
                    uAssetAmount,
                    process.env.EURB_PER_POOL,
                    0,
                    0,
                    deployer.address,
                    time
                );
                await addLiquidity.wait();

                Factory = await ethers.getContractFactory("UniswapV2Factory");
                factory = await Factory.attach(
                    process.env.UNISWAP_V2_FACTORY_FUJI
                );
                await factory.deployed();

                pool = await factory.getPair(
                    tokenAddress,
                    process.env.EURB_ADDRESS
                );
                console.log(`${array[i][0]} : ` + pool);

                array[i][1][2] = `${pool}`;
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
