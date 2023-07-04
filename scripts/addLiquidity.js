const { ethers } = require("hardhat");

const router ="0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

async function main() {
  [account] = await ethers.getSigners();

  const Contract = await ethers.getContractFactory("UniswapV2Router02");
  const contract = await Contract.attach(router);
  (amount0, amount1, liquidity) = await contract.addLiquidity("0xBee09d881765668BC192A7944b3E4FB91498Bd4e","0x33E9cE246eB369e1ecC8bcf8aCd5E8223A22b8A4","300000","100000","0","0","0x5Bc7984921E0a1e3cDc9849B32c534acB2387704","20000000000000")

  console.log(amount0)
  console.log(amount1)
  console.log(liquidity)
}

main()
  .then(async () => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
