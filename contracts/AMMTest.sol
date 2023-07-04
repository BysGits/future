// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
// import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';

// contract AMMTest {

//     using SafeERC20 for IERC20;

//     event AMMSwap(address indexed token0, uint256 amount0, address indexed token1, uint256 amount1);

//     function swap(address routerAddress, address poolAddress, address uAssetAddress, uint256 uAssetAmount) external {
//         address token0 = IUniswapV2Pair(poolAddress).token0();
//         address token1 = IUniswapV2Pair(poolAddress).token1();
//         require(token0 == uAssetAddress || token1 == uAssetAddress, "Invalid pool");
        
//         address[] memory path = new address[](2);
//         path[0] = uAssetAddress;
//         path[1] = token1;
//         if (token1 == uAssetAddress) {
//             path[1] = token0;
//         }
//         IERC20(uAssetAddress).safeApprove(routerAddress, uAssetAmount);
//         uint[] memory amountOuts = IUniswapV2Router02(routerAddress).swapExactTokensForTokens(uAssetAmount, 0, path, address(this), block.timestamp + 60);
//         emit AMMSwap(uAssetAddress, uAssetAmount, path[0], amountOuts[1]);
//     }
// }