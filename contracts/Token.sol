// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import { ITokenMinter } from "./interfaces/ITokenMinter.sol";


contract ERC20Token is ITokenMinter, ERC20Burnable, Ownable {
    
    uint8 private _decimals;
    string private _uri;
    string private _name;
    string private _symbol;
    address public controllers;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply,
        address controller
    ) ERC20("", "") Ownable() {
        _mint(msg.sender, initialSupply);
        setControllers(controller);
        setName(name_);
        setSymbol(symbol_);
        setDecimals(18);
    }
    
    modifier onlyControllers() {
        require(msg.sender == owner() || msg.sender == controllers, "Require owner or controller");
        _;
    }

    function name() public view override returns (string memory) {
        return _name;
    }

    function symbol() public view override returns (string memory) {
        return _symbol;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function uri() public view returns (string memory) {
        return _uri;
    }

    function setUri(string memory uri_) public onlyOwner {
        _uri = uri_;
    }

    function setName(string memory name_) public onlyOwner {
        _name = name_;
    }

    function setSymbol(string memory symbol_) public onlyOwner {
        _symbol = symbol_;
    }

    function setDecimals(uint8 decimals_) public onlyOwner {
        _decimals = decimals_;
    }
    
    function setControllers(address _controller) public onlyOwner {
        controllers = _controller;
    }

    function mint(address receiver, uint256 amount) external override onlyControllers {
        _mint(receiver, amount);
    }   
}