const { ethers } = require("hardhat");
const fs = require("fs");
const axios = require('axios').default;
require("dotenv").config();

var ListModel = function(jsonData) {
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
                level.push({key: key, type: type, value: value});
            }
        }
    }
 
    nestedMapping(jsonData, self.master);
    
}

async function main() {
    const getDataFromUrl = async (url) => {
        const response = await axios.get(url);
        return response.data.result;
    };

    result = await getDataFromUrl("https://api.etherscan.io/api?module=account&action=txlist&address=0xB504715f7240297F9771a8C1E75DFdB9cB481230&startblock=15190127&endblock=15294768&page=1&offset=100&sort=asc&apikey=2UR784WKFTQUCUFC99ZCCNJBKM4YGQBTQN")

    console.log();

    var total = 0;
    for(let i = 0; i < result.length; i++) {
        total += parseInt(result[i].gasUsed) * parseInt(result[i].gasPrice)
    }

    console.log(total * 1e-18)

    // var array = result.master.map(obj => {
    //     return [obj.key, [obj.value[0].value, obj.value[1].value]]
    // })



    // fs.writeFileSync(
    //     "./scripts/data/price.json",
    //     JSON.stringify(array)
    // );



    // price = JSON.parse(
    //     fs.readFileSync("./scripts/data/price.json")
    // );

    // map = new Map(price)

    // console.log(map.get(array[array.length-1][0])[1])

    console.log("Done")
}


main()
  .then(async () => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });