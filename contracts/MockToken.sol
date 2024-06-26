// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import { ITokenMinter } from "./interfaces/ITokenMinter.sol";


contract MockToken is ITokenMinter, ERC20Burnable, Ownable {
    
    address public controllers;

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address controller
    ) ERC20(name, symbol) Ownable() {
        _mint(msg.sender, initialSupply);
        setControllers(controller);
    }
    
    modifier onlyControllers() {
        require(msg.sender == owner() || msg.sender == controllers, "Require owner or controller");
        _;
    }

    function decimals() public view virtual override returns(uint8) {
        return 0;
    }
    
    function setControllers(address _controller) public onlyOwner {
        controllers = _controller;
    }

    function mint(address receiver, uint256 amount) external override {
        _mint(receiver, amount);
    }   
}