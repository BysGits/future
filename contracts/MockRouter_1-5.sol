// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockIPool} from "./interfaces/MockIPool.sol";
import {Ownable} from "./Ownable.sol";

contract MockPool is MockIPool, Ownable  {
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


contract MockRouter1_5 {
    using SafeERC20 for IERC20;

    mapping(address => mapping(address => address)) public poolByA;
    mapping(address => mapping(address => address)) public poolByB;
    
    constructor() {}

    function addLiquidity(
        uint amountA,
        uint amountB,
        address tokenA,
        address tokenB
    ) external {
        if(poolByA[tokenA][tokenB] == address(0)) {
            address pair;
            bytes memory bytecode = abi.encodePacked(type(MockPool).creationCode, abi.encode(tokenA, tokenB));
            bytes32 salt = keccak256(abi.encodePacked(tokenA, tokenB));
            assembly {
                pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
                if iszero(extcodesize(pair)) {
                    revert(0, 0)
                }
            }
            MockPool(pair).transferOwnership(msg.sender);
            poolByA[tokenA][tokenB] = pair;
            poolByB[tokenB][tokenA] = pair;
        }

        address pool = poolByA[tokenA][tokenB];
        IERC20(tokenA).safeTransferFrom(msg.sender, pool, amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, pool, amountB);
        if(MockIPool(pool).token0() == tokenA) {
            MockIPool(pool).increaseReserve0(amountA);
            MockIPool(pool).increaseReserve1(amountB);
        } else if(MockIPool(pool).token0() == tokenB){
            MockIPool(pool).increaseReserve0(amountB);
            MockIPool(pool).increaseReserve1(amountA);
        }
    }

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external {
        require(amountIn > 0, "Insufficient amount");
        uint[] memory amounts = new uint[](2);
        address pool = poolByA[path[0]][path[1]];
        if(pool == address(0)) pool = poolByB[path[0]][path[1]];

        if(MockIPool(pool).token0() == path[0]) {
            amounts[0] = amountIn;
            amounts[1] = amountIn / 5;
            MockIPool(pool).increaseReserve0(amounts[0]);
            MockIPool(pool).decreaseReserve1(amounts[1]);
        } else if(MockIPool(pool).token0() == path[1]){
            amounts[0] = amountIn;
            amounts[1] = 5 * amountIn;
            MockIPool(pool).increaseReserve1(amounts[0]);
            MockIPool(pool).decreaseReserve0(amounts[1]);
        }
        IERC20(path[0]).safeTransferFrom(msg.sender, pool, amounts[0]);
        MockIPool(pool).swap(to, amounts[1], path[1]);
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut) {
        amountOut = amountIn * 5;
    }
}


