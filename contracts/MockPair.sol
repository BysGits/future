// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockIPool} from "./interfaces/MockIPool.sol";
import {Ownable} from "./Ownable.sol";

contract MockPair is MockIPool, Ownable  {
    using SafeERC20 for IERC20;
    address public override token0;
    address public override token1;

    uint256 public override reserve0;
    uint256 public override reserve1;

    constructor(address token0_, address token1_) {
        setToken0(token0_);
        setToken1(token1_);
    }

    function initialize(address token0_, address token1_) external override {
        setToken0(token0_);
        setToken1(token1_);
    }

    function getReserves() external view override returns(uint,uint,uint){
        return(reserve0, reserve1, block.timestamp);
    }

    function setToken0(address _token0) public override {
        token0 = _token0;
    }
    function setToken1(address _token1) public override {
        token1 = _token1;
    }

    function increaseReserve0(uint256 _amount) external override {
        reserve0 += _amount;
    }

    function increaseReserve1(uint256 _amount) external override {
        reserve1 += _amount;
    }

    function decreaseReserve0(uint256 _amount) external override {
        reserve0 -= _amount;
    }

    function decreaseReserve1(uint256 _amount) external override {
        reserve1 -= _amount;
    }

    function swap(address to, uint256 amountOut, address tokenOut) external override {
        IERC20(tokenOut).safeTransfer(to, amountOut);
    }
}