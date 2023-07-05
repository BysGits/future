// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import {IController} from "./interfaces/IController.sol";
import {Ownable} from "./Ownable.sol";
import {IEURB} from "./interfaces/IEURB.sol";


contract Minter is Ownable, ReentrancyGuard {
    using SafeERC20 for IEURB;
    
    address public controllerAddress;
    address public lockAddress;

    // mapping token address to target priceAPIConsumer
    mapping(address => uint256) public targetPrices;

    mapping(bytes =>  uint256) public borrowBalances;          // id -> uAsset ballance
    mapping(bytes =>  uint256) public collateralBalances;      // id -> collateral ballance
    
    mapping(bytes => address) public accounts;                  // id -> account
    mapping(bytes => uint256) public userBalances;              // id -> user balance locked
    mapping(bytes => uint256) public updatedLockTime;           // id -> updated time
    mapping(bytes => uint8) public typeBorrow;                  // id -> 1: borrow, 2: short
    mapping(bytes => uint256) public totalClaimedById;          // id -> total amount claimed
    mapping(bytes => address) public uAssetAddressById;         // id -> uAssetAddress

    event BorrowAsset(
        address indexed userAddress,
        bytes id,
        uint256 uAssetAmount,
        uint256 collateralAmount,
        uint256 timestamp
    );

    event Close(
        address indexed userAddress,
        bytes id,
        uint8 typeId,
        uint256 uAssetAmount,
        uint256 collateralAmount,
        uint256 timestamp
    );

    event Short(
        address indexed userAddress,
        bytes id,
        uint256 uAssetAmount,
        uint256 collateralAmount,
        uint256 timestamp
    );

    event EditShort(
        address indexed userAddress,
        bytes id,
        uint8 isLocked,
        uint256 uAssetAmount,
        uint256 collateralAmount,
        uint256 timestamp
    );

    event Liquidation (
        address indexed buyer,
        address indexed account,
        bytes id,
        uint256 uAssetAmount,
        uint256 collateralAmount,
        uint256 timestamp,
        uint256 discountRate
    );

    event ClaimToken(
        address indexed claimer,
        bytes id,
        uint256 amount, 
        uint256 timestamp
    );

    event ClaimAll(
        address indexed claimer,
        bytes[] ids
    );

    constructor() {
    }

    modifier onlyAdmin() {
        require(IController(controllerAddress).admins(msg.sender) || msg.sender == owner(), "Only admin");
        _;
    }

    function setControllerAddress(address _controllerAddress) external onlyOwner {
        controllerAddress = _controllerAddress;
    }

    function addMoreCollateralAmount(address uAssetAddress, uint256 collateralAmount, bytes memory id) external onlyAdmin {
        address collateralAddress = IController(controllerAddress).collateralForToken(uAssetAddress);
        IEURB(collateralAddress).safeTransferFrom(msg.sender, address(this), collateralAmount);
        collateralBalances[id] += (collateralAmount - IEURB(collateralAddress).getTransactionFee(msg.sender, address(this), collateralAmount));
    }
    
    function lock(bytes memory id, uint256 tokenAmount) internal {
        userBalances[id] += tokenAmount;
        updatedLockTime[id] = block.timestamp;
    } 
    
    function isClaimable(bytes memory id) external view returns (bool){
        uint256 lockTime = IController(controllerAddress).lockTime();
        if(updatedLockTime[id] == 0) return false;
        return (block.timestamp - updatedLockTime[id] > lockTime);
    }

    function claimById(bytes memory id) public {
        require(msg.sender == accounts[id]);
        uint256 lockTime = IController(controllerAddress).lockTime();
        require((block.timestamp - updatedLockTime[id]) > lockTime, "Still locking");
        require(userBalances[id] > 0);
        uint256 tokenAmount = userBalances[id];
        address uAssetAddress = uAssetAddressById[id];
        address collateralAddress = IController(controllerAddress).collateralForToken(uAssetAddress);
        IEURB(collateralAddress).safeTransfer(msg.sender, tokenAmount);
        totalClaimedById[id] += tokenAmount;
        delete userBalances[id];
        delete updatedLockTime[id];
        emit ClaimToken(msg.sender, id, tokenAmount, block.timestamp);
    }
    
    function claimAll(bytes[] memory ids) external nonReentrant {
        uint256 lockTime = IController(controllerAddress).lockTime();
        for(uint256 i = 0; i < ids.length; i++) {
            if(block.timestamp - updatedLockTime[ids[i]] > lockTime && userBalances[ids[i]] > 0) {
                claimById(ids[i]);
            }
        }
        emit ClaimAll(msg.sender, ids);
    }

    function borrow(
        address uAssetAddress, 
        uint256 uAssetAmount, 
        uint256 collateralAmount, 
        uint256 targetPrice, 
        bytes memory id, 
        bytes memory signature
    ) external nonReentrant {
        if(accounts[id] == address(0)) accounts[id] = msg.sender;
        if(typeBorrow[id] == 0) typeBorrow[id] = 1;
        {
            require(msg.sender == accounts[id]);
            require(collateralBalances[id] == 0);
            require(typeBorrow[id] == 1);
        }
        {
            uAssetAddressById[id] = uAssetAddress;
        }
        uint16 minCollateralRatio = IController(controllerAddress).minCollateralRatio();
        uint16 calculationDecimal = IController(controllerAddress).calculationDecimal();
        
        address collateralAddress = IController(controllerAddress).collateralForToken(uAssetAddress);
        
        uint256 realCollateralAmount = (targetPrice * uAssetAmount) / (10 ** IEURB(uAssetAddress).decimals());
        require(realCollateralAmount * minCollateralRatio <= collateralAmount * (10**calculationDecimal), "less than min");
        IEURB(collateralAddress).safeTransferFrom(msg.sender, address(this), collateralAmount);
        IEURB(uAssetAddress).mint(msg.sender, uAssetAmount);
        borrowBalances[id] = uAssetAmount;
        collateralBalances[id] = collateralAmount - IEURB(collateralAddress).getTransactionFee(msg.sender, address(this), collateralAmount);
        emit BorrowAsset(msg.sender, id, uAssetAmount, collateralAmount, block.timestamp);
    }

    function editBorrow(
        address uAssetAddress, 
        uint256 uAssetAmount, 
        uint256 collateralAmount, 
        uint256 targetPrice, 
        bytes memory id, 
        bytes memory signature
    ) public nonReentrant {
        require(msg.sender == accounts[id]);
        require(collateralBalances[id] > 0);
        require(typeBorrow[id] == 1);
        address collateralAddress = IController(controllerAddress).collateralForToken(uAssetAddress);
        
        {
            if(uAssetAmount < borrowBalances[id]) {
                uint256 diff = borrowBalances[id] - uAssetAmount;
                IEURB(uAssetAddress).safeTransferFrom(msg.sender, address(this), diff);
                IEURB(uAssetAddress).burn(diff);
            } else if (uAssetAmount > borrowBalances[id]) {
                uint256 diff = uAssetAmount - borrowBalances[id];
                IEURB(uAssetAddress).mint(msg.sender, diff);
            }
        }
        {
            uint16 minCollateralRatio = IController(controllerAddress).minCollateralRatio();
            uint16 calculationDecimal = IController(controllerAddress).calculationDecimal();
            
            uint256 realCollateralAmount = (targetPrice * uAssetAmount) / (10 ** IEURB(uAssetAddress).decimals());
            require(realCollateralAmount * minCollateralRatio <= collateralAmount * (10**calculationDecimal), "less than min");
        }
        
        if(collateralAmount < collateralBalances[id]) {
            uint256 diff = collateralBalances[id] - collateralAmount;
            IEURB(collateralAddress).safeTransfer(msg.sender, diff);
            collateralBalances[id] = collateralAmount;
        } else if(collateralAmount > collateralBalances[id]){
            uint256 diff = collateralAmount - collateralBalances[id];
            IEURB(collateralAddress).safeTransferFrom(msg.sender, address(this), diff);
            collateralBalances[id] += (diff - IEURB(collateralAddress).getTransactionFee(msg.sender, address(this), diff));
        }
        
        borrowBalances[id] = uAssetAmount;
        
        emit BorrowAsset(msg.sender, id, uAssetAmount, collateralAmount, block.timestamp);
    }

    function close(
        address uAssetAddress, 
        uint256 targetPrice, 
        bytes memory id, 
        bytes memory signature
    ) external nonReentrant {
        require(msg.sender == accounts[id]);
        require(collateralBalances[id] > 0);
        uint256 uAssetAmount = borrowBalances[id];
        uint256 collateralAmount = collateralBalances[id];
        if (uAssetAmount > 0) {
            IEURB(uAssetAddress).safeTransferFrom(msg.sender, address(this), uAssetAmount);
            IEURB(uAssetAddress).burn(uAssetAmount);
        }
        
        address collateralAddress = IController(controllerAddress).collateralForToken(uAssetAddress);
        require(collateralAddress != address(0));
        uint256 fee = targetPrice * uAssetAmount * 15 / (10 ** IEURB(uAssetAddress).decimals() * 1000);
        if(fee < collateralBalances[id]) {
            collateralAmount -= fee;
            IEURB(collateralAddress).safeTransfer(msg.sender, collateralAmount);
            IEURB(collateralAddress).safeTransfer(owner(), fee);
        }
        
        borrowBalances[id] = 0;
        collateralBalances[id] = 0;
        
        emit Close(msg.sender, id, typeBorrow[id], uAssetAmount, collateralAmount, block.timestamp);
    }

    function short(
        address uAssetAddress, 
        uint256 uAssetAmount, 
        uint256 collateralAmount,
        uint256 targetPrice,
        uint256 deadline,
        uint16 slippage, 
        bytes memory id,
        bytes memory signature
    ) external nonReentrant {
        if(accounts[id] == address(0)) accounts[id] = msg.sender;
        if(typeBorrow[id] == 0) typeBorrow[id] = 2;
        {
            require(msg.sender == accounts[id]); 
            require(collateralBalances[id] == 0);
            require(typeBorrow[id] == 2);
        }
        address collateralAddress = IController(controllerAddress).collateralForToken(uAssetAddress);
        {
            uAssetAddressById[id] = uAssetAddress;
        }

        _checkShort(uAssetAddress, targetPrice, uAssetAmount, collateralAmount);
        
        {
            IEURB(collateralAddress).safeTransferFrom(msg.sender, address(this), collateralAmount);
            IEURB(uAssetAddress).mint(address(this), uAssetAmount);
            borrowBalances[id] = uAssetAmount;
            collateralBalances[id] = collateralAmount - IEURB(collateralAddress).getTransactionFee(msg.sender, address(this), collateralAmount);
        }
        {
            IEURB(uAssetAddress).safeApprove(IController(controllerAddress).router(), uAssetAmount);
        }
        {
            address[] memory path = new address[](2);
            uint[] memory reserve = new uint[](2);
            {
                address poolAddress = IController(controllerAddress).pools(uAssetAddress);
                address token0 = IUniswapV2Pair(poolAddress).token0();
                address token1 = IUniswapV2Pair(poolAddress).token1();
                (uint reserve0, uint reserve1,) = IUniswapV2Pair(poolAddress).getReserves();
                
                path[0] = uAssetAddress;
                path[1] = token1;
                reserve[0] = reserve0;
                reserve[1] = reserve1;
                if (token1 == uAssetAddress) {
                    path[1] = token0;
                    reserve[0] = reserve1;
                    reserve[1] = reserve0;
                }
            }
            bytes memory id_ = id;
            uint256 amountOutMin = IUniswapV2Router02(IController(controllerAddress).router()).getAmountOut(uAssetAmount, reserve[0], reserve[1]) * (10000 - slippage) / 10000;
            uint256 balanceBefore = IEURB(path[1]).balanceOf(address(this));
            IUniswapV2Router02(IController(controllerAddress).router()).swapExactTokensForTokensSupportingFeeOnTransferTokens(uAssetAmount, amountOutMin, path, address(this), deadline);
            uint256 amountOut = IEURB(path[1]).balanceOf(address(this)) - balanceBefore;
            lock(id_, amountOut);
            emit Short(msg.sender, id_, uAssetAmount, collateralAmount, block.timestamp);
        }
    }
    
    function editShort(
        address uAssetAddress, 
        uint256 uAssetAmount, 
        uint256 collateralAmount, 
        uint256 targetPrice,
        uint256 deadline, 
        uint16 slippage, 
        bytes memory id,
        bytes memory signature
    ) external nonReentrant {
        {
            require(msg.sender == accounts[id]); 
            require(collateralBalances[id] > 0);
            require(typeBorrow[id] == 2);
        }
        uint8 isLocked = 0;
        address collateralAddress = IController(controllerAddress).collateralForToken(uAssetAddress);

        _checkShort(uAssetAddress, targetPrice, uAssetAmount, collateralAmount);

        if(collateralAmount < collateralBalances[id]) {
            uint256 diff = collateralBalances[id] - collateralAmount;
            IEURB(collateralAddress).safeTransfer(msg.sender, diff);
            collateralBalances[id] = collateralAmount;
        } else if(collateralAmount > collateralBalances[id]){
            uint256 diff = collateralAmount - collateralBalances[id];
            IEURB(collateralAddress).safeTransferFrom(msg.sender, address(this), diff);
            collateralBalances[id] += (diff - IEURB(collateralAddress).getTransactionFee(msg.sender, address(this), diff));
        }

        if(uAssetAmount < borrowBalances[id]) {
            uint256 diff = borrowBalances[id] - uAssetAmount;
            address addr = uAssetAddress;
            IEURB(addr).safeTransferFrom(msg.sender, address(this), diff);
            IEURB(addr).burn(diff);
        } else if (uAssetAmount > borrowBalances[id]) {
            uint256 diff = uAssetAmount - borrowBalances[id];
            address addr = uAssetAddress;
            uint256 deadline_ = deadline;
            {
                IEURB(addr).mint(address(this), diff);
            }
            address[] memory path = new address[](2);
            uint[] memory reserve = new uint[](2);
            {
                (uint reserve0, uint reserve1,) = IUniswapV2Pair(IController(controllerAddress).pools(addr)).getReserves();
                path[0] = addr;
                path[1] = IUniswapV2Pair(IController(controllerAddress).pools(addr)).token1();
                reserve[0] = reserve0;
                reserve[1] = reserve1;
                if (IUniswapV2Pair(IController(controllerAddress).pools(addr)).token1() == addr) {
                    path[1] = IUniswapV2Pair(IController(controllerAddress).pools(addr)).token0();
                    reserve[0] = reserve1;
                    reserve[1] = reserve0;
                }
            }
            {
                IEURB(addr).safeApprove(IController(controllerAddress).router(), diff);
            }
            {
                uint256 amountOutMin = IUniswapV2Router02(IController(controllerAddress).router()).getAmountOut(diff, reserve[0], reserve[1]) * (10000 - slippage) / 10000;
                uint256 balanceBefore = IEURB(path[1]).balanceOf(address(this));
                IUniswapV2Router02(IController(controllerAddress).router()).swapExactTokensForTokensSupportingFeeOnTransferTokens(diff, amountOutMin, path, address(this), deadline_);
                uint256 amountOut = IEURB(path[1]).balanceOf(address(this)) - balanceBefore;
                lock(id, amountOut);
            }
            isLocked = 1;
        }
        
        borrowBalances[id] = uAssetAmount;
        
        emit EditShort(msg.sender, id, isLocked, uAssetAmount, collateralAmount, block.timestamp);
    }

    function liquidation(
        address userAddress, 
        address uAssetAddress, 
        uint256 uAssetAmount, 
        uint256 targetPrice,
        bytes memory id,
        bytes memory signature
    ) external nonReentrant {
        require(userAddress == accounts[id], "Wrong account");
        require(borrowBalances[id] >= uAssetAmount, "Over liquidation");
        
        uint16 calculationDecimal = IController(controllerAddress).calculationDecimal();
        uint16 discountRate = IController(controllerAddress).discountRates(uAssetAddress);
        
        _checkLiquidation(uAssetAddress, borrowBalances[id], collateralBalances[id], targetPrice, calculationDecimal, discountRate);
        
        uint256 discountedCollateralValue = 
            (uAssetAmount * targetPrice * 985 / 1000) / (10 ** IEURB(uAssetAddress).decimals())
            * (10**calculationDecimal)
            / (10**calculationDecimal - discountRate);
            
        address collateralAddress = IController(controllerAddress).collateralForToken(uAssetAddress);
        if (discountedCollateralValue <= collateralBalances[id]) {
            IEURB(uAssetAddress).safeTransferFrom(msg.sender, address(this), uAssetAmount);
            IEURB(uAssetAddress).burn(uAssetAmount);
            IEURB(collateralAddress).safeTransfer(msg.sender, discountedCollateralValue);
            borrowBalances[id] -= uAssetAmount;
            collateralBalances[id] -= discountedCollateralValue;
            if(borrowBalances[id] == 0) {
                IEURB(collateralAddress).safeTransfer(userAddress, collateralBalances[id]);
                collateralBalances[id] = 0;
            }
            emit Liquidation(msg.sender, userAddress, id, uAssetAmount, discountedCollateralValue, block.timestamp, discountRate);
        } else {
            uint256 collateralBalance = collateralBalances[id];
            uint256 uAssetNeeded =  collateralBalance * ((10**calculationDecimal) - discountRate) * (10 ** IEURB(uAssetAddress).decimals()) / ((10**calculationDecimal) * targetPrice * 985 / 1000);
            {
                IEURB(uAssetAddress).safeTransferFrom(msg.sender, address(this), uAssetNeeded);
                IEURB(uAssetAddress).burn(uAssetNeeded);
                IEURB(collateralAddress).safeTransfer(msg.sender, collateralBalance);
            }
            {
                borrowBalances[id] -= uAssetNeeded;
                collateralBalances[id] = 0;
            }
            emit Liquidation(msg.sender, userAddress, id, uAssetNeeded, collateralBalance, block.timestamp, discountRate);
        }
    }
    
    function _checkShort(
        address uAssetAddress, 
        uint256 targetPrice, 
        uint256 uAssetAmount, 
        uint256 collateralAmount
    ) internal view {
        uint16 minCollateralRatio = IController(controllerAddress).minCollateralRatio();
        uint16 maxCollateralRatio = IController(controllerAddress).maxCollateralRatio();
        uint16 calculationDecimal = IController(controllerAddress).calculationDecimal();
        uint256 realCollateralAmount = targetPrice * uAssetAmount / (10 ** IEURB(uAssetAddress).decimals());
        require(realCollateralAmount * minCollateralRatio <= collateralAmount * (10**calculationDecimal), "less than min");
        require(realCollateralAmount * maxCollateralRatio >= collateralAmount * (10**calculationDecimal), "greater than max");
    }
    
    function _checkLiquidation(
        address uAssetAddress, 
        uint256 borrowBalance, 
        uint256 collateralBalance,
        uint256 targetPrice,
        uint16 calculationDecimal, 
        uint16 discountRate
    ) internal view {
        uint16 minCollateralRatio = IController(controllerAddress).minCollateralRatio();
        uint256 realCollateralAmount = targetPrice * borrowBalance / (10 ** IEURB(uAssetAddress).decimals());
        require(realCollateralAmount * minCollateralRatio > collateralBalance * (10**calculationDecimal), "More than min");
        uint16 configDiscountRate = IController(controllerAddress).discountRates(uAssetAddress);
        if (configDiscountRate < discountRate) {
            discountRate = configDiscountRate;
        }
    }

}