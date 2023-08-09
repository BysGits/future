// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface MockIPool {
    function initialize(address, address) external;
    function getReserves() external view returns(uint,uint,uint);
    function token0() external view returns(address);
    function token1() external view returns(address);
    function reserve0() external view returns(uint256);
    function reserve1() external view returns(uint256);
    function setToken0(address) external;
    function setToken1(address) external;
    function increaseReserve0(uint256) external;
    function increaseReserve1(uint256) external;
    function decreaseReserve0(uint256) external;
    function decreaseReserve1(uint256) external;
    function swap(address,uint256,address) external;
}