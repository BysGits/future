const { ethers, upgrades } = require('hardhat');
const fs = require('fs');
const XLSX = require('xlsx');

require('dotenv').config();

async function main() {
  const contractAddress = "0xf21A094f52F1513B6CFE92CFb7D900f98EEC2E8f";
  const contract = await ethers.getContractAt('ERC20Mock', contractAddress);

  const workbook = XLSX.readFile('scripts/auroraMint.xlsx');
  const sheet_name_list = workbook.SheetNames;
  const xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

  mint_value = ethers.utils.parseEther('100000');

  await contract.mint(xlData[35].address, mint_value);
  await contract.mint(xlData[42].address, mint_value);
  await contract.mint(xlData[51].address, mint_value);
  await contract.mint(xlData[59].address, mint_value);



//   for (let i = 5; i < 508; i++) {
//     console.log("phuong18", xlData[i].address, i)
//     mint = await contract.mint(xlData[i].address, mint_value);
//     await mint.wait()
//     console.log(`Mint ${mint_value} for account ${xlData[i].address} successfully`);
//   }
}

main()
  .then(async () => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });