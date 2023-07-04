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
        await getDataFromUrl("https://api.dillibits.com/uPrice/")
    );

    // console.log(result.master[0].value);

    var array = result.master.map((obj) => {
        return [obj.key, [obj.value[0].value, obj.value[1].value]];
    });

    fs.writeFileSync("./scripts/data/price.json", JSON.stringify(array));

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
