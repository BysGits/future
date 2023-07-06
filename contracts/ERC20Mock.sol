// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mock is ERC20 {
    constructor(string memory name_,string memory sign_) ERC20(name_, sign_) {}

    function mint(address receiver_, uint256 amount_) external {
        // require(totalSupply() + amount_ < 10**27);
        _mint(receiver_, amount_);
    }

    function decimals() public view virtual override returns (uint8) {
        return 18;
    }
}