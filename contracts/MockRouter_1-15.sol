// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockRouter1_15 {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external pure returns (uint[] memory amounts) {
        amounts = new uint[](2);
        amounts[0] = amountIn;
        amounts[1] = 15;
    }
}

