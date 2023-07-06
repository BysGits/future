// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {ExtendSafeERC20} from "./ExtendSafeERC20.sol";
import {Ownable} from "./Ownable.sol";

contract V1 is Ownable {
    using ExtendSafeERC20 for IERC20;

    address public myAddress;
    address public myAddress1;

    uint256 value;
    
    constructor() {
    }

    function test(uint256 v) external {
        require(v > 10, "v <= 10");
        value = v;
    }

    function test1(uint256 v) external {
        value = v;
    }

    function mint(address tokenAddress, address to, uint256 amount) external {
        IERC20(tokenAddress).safeMint(to, amount);
    }

    function burn(address tokenAddress, uint256 amount) external {
        IERC20(tokenAddress).safeBurn(amount);
    }

    function mul(uint256 a, uint8 b) external pure returns(uint256) {
        return a * b;
    }

    function getTime() external view returns(uint256) {
        return block.timestamp;
    }
}