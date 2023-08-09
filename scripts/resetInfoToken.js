const { ethers } = require("hardhat");
const fs = require("fs");
const axios = require("axios").default;
require("dotenv").config();

var ListModel = function (jsonData) {
    var self = this;

    self.master = [];

    function nestedMapping(data, level) {
        var key, value, type;

        for (key in data) {
            if (data.hasOwnProperty(key)) {
                if (data[key] instanceof Object) {
                    type = "array";
                    value = [];
                    nestedMapping(data[key], value);
                } else {
                    type = "simple";
                    value = data[key];
                }
                level.push({ key: key, type: type, value: value });
            }
        }
    }

    nestedMapping(jsonData, self.master);
};

async function main() {
    const getDataFromUrl = async (url) => {
        const response = await axios.get(url);
        return response.data.price;
    };

    result = new ListModel(
        await getDataFromUrl(process.env.API_PRICE)
    );

    var map = new Map(
        result.master.map((obj) => {
            return [obj.key, ["", "", "", "", 0]];
        })
    );

    var array = Array.from(map);

    const currentProvider = (
        await (await ethers.getSigner()).provider.getNetwork()
    ).chainId;

    console.log(currentProvider);

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

    // price = JSON.parse(
    //     fs.readFileSync("./scripts/data/price.json")
    // );

    // map = new Map(price)

    // console.log(map.get(array[array.length-1][0])[1])

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
