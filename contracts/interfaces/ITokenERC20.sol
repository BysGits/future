// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ITokenERC20 is IERC20{
    function decimals() external view returns(uint8);
    function mint(address,uint256) external;
    function burn(uint256) external;
}