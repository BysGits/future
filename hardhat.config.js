require("@nomiclabs/hardhat-waffle");
const config = require("hardhat/config");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("solidity-coverage");
require("dotenv").config();
/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const PROJECT_ID = process.env.PROJECT_ID;
const FORK_FUJI = true;
const FORK_MAINNET = false;
// const forkingData = FORK_FUJI
//     ? {
//           url: "https://api.avax-test.network/ext/bc/C/rpc",
//       }
//     : FORK_MAINNET
//     ? {
//           url: "https://api.avax.network/ext/bc/C/rpc",
//       }
//     : undefined;

// config.task("accounts", "Prints the list of accounts", async (args, hre) => {
//     const accounts = await hre.ethers.getSigners();
//     accounts.forEach((account) => {
//         console.log(account.address);
//     });
// });

// config.task(
//     "balances",
//     "Prints the list of AVAX account balances",
//     async (args, hre) => {
//         const accounts = await hre.ethers.getSigners();
//         for (const account of accounts) {
//             const balance = await hre.ethers.provider.getBalance(
//                 account.address
//             );
//             console.log(`${account.address} has balance ${balance.toString()}`);
//         }
//     }
// );

module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.5.16",
                settings: {
                    optimizer: {
                        enabled: true,
                    },
                },
            },
            {
                version: "0.6.6",
                settings: {
                    optimizer: {
                        enabled: true,
                    },
                },
            },
            {
                version: "0.8.7",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    networks: {
        // hardhat: {
        //     gasPrice: 225000000000,
        //     chainId: !forkingData ? 43112 : undefined, //Only specify a chainId if we are not forking
        //     forking: forkingData,
        // },
        // local: {
        //     url: "http://localhost:9650/ext/bc/C/rpc",
        //     gasPrice: 225000000000,
        //     chainId: 43112,
        //     accounts: [
        //         "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027",
        //         "0x7b4198529994b0dc604278c99d153cfd069d594753d471171a1d102a10438e07",
        //         "0x15614556be13730e9e8d6eacc1603143e7b96987429df8726384c2ec4502ef6e",
        //         "0x31b571bf6894a248831ff937bb49f7754509fe93bbd2517c9c73c4144c0e97dc",
        //         "0x6934bef917e01692b789da754a0eae31a8536eb465e7bff752ea291dad88c675",
        //         "0xe700bdbdbc279b808b1ec45f8c2370e4616d3a02c336e68d85d4668e08f53cff",
        //         "0xbbc2865b76ba28016bc2255c7504d000e046ae01934b04c694592a6276988630",
        //         "0xcdbfd34f687ced8c6968854f8a99ae47712c4f4183b78dcc4a903d1bfe8cbf60",
        //         "0x86f78c5416151fe3546dece84fda4b4b1e36089f2dbc48496faf3a950f16157c",
        //         "0x750839e9dbbd2a0910efe40f50b2f3b2f2f59f5580bb4b83bd8c1201cf9a010a",
        //     ],
        // },
        auroraTestnet: {
            url: `https://aurora-testnet.infura.io/v3/${PROJECT_ID}`,
            accounts: [process.env.PRIVATE_KEY],
            gasPrice: 40000000000,
        },
        goerli: {
            url: `https://goerli.blockpi.network/v1/rpc/public`,
            accounts: [process.env.PRIVATE_KEY],
        },
        fuji: {
            url: "https://api.avax-test.network/ext/bc/C/rpc",
            accounts: [process.env.PRIVATE_KEY],
        },
        avalanche: {
            url: "https://api.avax.network/ext/bc/C/rpc",
            gasPrice: 30000000000,
            accounts: [process.env.PRIVATE_KEY],
        },
        bscTestnet: {
            url: "https://data-seed-prebsc-1-s1.binance.org:8545",
            chainId: 97,
            gasPrice: 10000000000,
            accounts: [process.env.PRIVATE_KEY],
        },
        bscMainnet: {
            url: "https://bsc-dataseed.binance.org/",
            chainId: 56,
            gasPrice: 7000000000,
            accounts: [process.env.PRIVATE_KEY],
        },
        ethereum_mainnet: {
            url: `https://mainnet.infura.io/v3/${PROJECT_ID}`,
            gasPrice: 100000000000,
            accounts: [process.env.PRIVATE_KEY],
        },
    },

    etherscan: {
        apiKey: {
            mainnet: process.env.ETHERSCAN_API,
            goerli: process.env.ETHERSCAN_API,
            bscTestnet: process.env.BSCSCAN_API,
            polygonMumbai: process.env.POLYGON_API,
            avalancheFujiTestnet: process.env.AVALANCHE_API,
            avalanche: process.env.AVALANCHE_API,
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};
