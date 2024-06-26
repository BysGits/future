// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

import {IController} from "./interfaces/IController.sol";
import {Ownable} from "./Ownable.sol";
import {SignatureUtils} from "./utils/SignatureUtils.sol";
import {ITokenERC20} from "./interfaces/ITokenERC20.sol";

contract Minter is Ownable, ReentrancyGuard, SignatureUtils {
    using SafeERC20 for ITokenERC20;
    
    address public controllerAddress;

    struct Data {
        uint8 typeBorrow;
        uint256 borrowBalance;
        uint256 collateralBalance;
        uint256 userBalance;
        uint256 updatedLockTime;
        uint256 totalClaimed;
        address account;
        address kAssetAddress;
    }

    mapping(bytes => Data) public data;                 // id -> data
    mapping(bytes => bool) public isInvalidSignature;     // signature -> bool    

    event BorrowAsset(
        address indexed userAddress,
        bytes id,
        uint256 kAssetAmount,
        uint256 collateralAmount,
        uint256 timestamp
    );

    event Close(
        address indexed userAddress,
        bytes id,
        uint8 typeId,
        uint256 kAssetAmount,
        uint256 collateralAmount,
        uint256 timestamp
    );

    event Short(
        address indexed userAddress,
        bytes id,
        uint256 kAssetAmount,
        uint256 collateralAmount,
        uint256 timestamp
    );

    event EditShort(
        address indexed userAddress,
        bytes id,
        uint8 isLocked,
        uint256 kAssetAmount,
        uint256 collateralAmount,
        uint256 timestamp
    );

    event Liquidation (
        address indexed buyer,
        address indexed account,
        bytes id,
        uint256 kAssetAmount,
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

    constructor() {}

    modifier onlyAdmin() {
        require(IController(controllerAddress).admins(msg.sender) || msg.sender == owner(), "Only admin");
        _;
    }

    function typeBorrow(bytes memory id) public view returns(uint256) {
        return data[id].typeBorrow;
    }

    function borrowBalances(bytes memory id) public view returns(uint256) {
        return data[id].borrowBalance;
    }

    function collateralBalances(bytes memory id) public view returns(uint256) {
        return data[id].collateralBalance;
    }

    function userBalances(bytes memory id) public view returns(uint256) {
        return data[id].userBalance;
    }

    function updatedLockTime(bytes memory id) public view returns(uint256) {
        return data[id].updatedLockTime;
    }

    function totalClaimedById(bytes memory id) public view returns(uint256) {
        return data[id].totalClaimed;
    }

    function accounts(bytes memory id) public view returns(address) {
        return data[id].account;
    }

    function kAssetAddressById(bytes memory id) public view returns(address) {
        return data[id].kAssetAddress;
    }

    function blockTimestamp() public view returns(uint256) {
        return block.timestamp;
    }

    function setControllerAddress(address _controllerAddress) external onlyOwner {
        controllerAddress = _controllerAddress;
    }

    function addMoreCollateralAmount(address kAssetAddress, uint256 collateralAmount, bytes memory id) external onlyAdmin {
        address collateralAddress = IController(controllerAddress).collateralForToken(kAssetAddress);
        ITokenERC20(collateralAddress).safeTransferFrom(msg.sender, address(this), collateralAmount);
        data[id].collateralBalance += collateralAmount;
    }
    
    function lock(bytes memory id, uint256 tokenAmount) internal {
        data[id].userBalance += tokenAmount;
        data[id].updatedLockTime = block.timestamp;
    } 
    
    function isClaimable(bytes memory id) external view returns (bool){
        uint256 lockTime = IController(controllerAddress).lockTime();
        if(data[id].updatedLockTime == 0) return false;
        return (block.timestamp - data[id].updatedLockTime > lockTime);
    }

    function claimById(bytes memory id) public {
        require(msg.sender == data[id].account);
        uint256 lockTime = IController(controllerAddress).lockTime();
        require((block.timestamp - data[id].updatedLockTime) > lockTime, "locking");
        require(data[id].userBalance > 0);
        uint256 tokenAmount = data[id].userBalance;
        address kAssetAddress = data[id].kAssetAddress;
        address collateralAddress = IController(controllerAddress).collateralForToken(kAssetAddress);
        ITokenERC20(collateralAddress).safeTransfer(msg.sender, tokenAmount);
        data[id].totalClaimed += tokenAmount;
        delete data[id].userBalance;
        delete data[id].updatedLockTime;
        emit ClaimToken(msg.sender, id, tokenAmount, block.timestamp);
    }
    
    function claimAll(bytes[] memory ids) external nonReentrant {
        uint256 lockTime = IController(controllerAddress).lockTime();
        for(uint256 i = 0; i < ids.length; i++) {
            if(block.timestamp - data[ids[i]].updatedLockTime > lockTime && data[ids[i]].userBalance > 0) {
                claimById(ids[i]);
            }
        }
        emit ClaimAll(msg.sender, ids);
    }

    function borrow(
        address kAssetAddress, 
        uint256 kAssetAmount, 
        uint256 collateralAmount, 
        uint256 targetPrice,
        uint256 expiredTime,
        bytes memory id, 
        bytes memory signature
    ) external nonReentrant {
        if(data[id].account == address(0)) data[id].account = msg.sender;
        if(data[id].typeBorrow == 0) data[id].typeBorrow = 1;
        {
            require(msg.sender == data[id].account, "1");
            require(data[id].collateralBalance == 0, "2");
            require(data[id].typeBorrow == 1, "3");
            require(!isInvalidSignature[signature], "4");
            require(expiredTime >= block.timestamp, "5");
        }
        {
            require(
                verifySignature(
                    IController(controllerAddress).signer(),
                    kAssetAddress,
                    targetPrice,
                    expiredTime,
                    id,
                    signature
                ),
                "6"
            );
        }
        {
            data[id].kAssetAddress = kAssetAddress;
        }
        uint16 minCollateralRatio = IController(controllerAddress).minCollateralRatio();
        uint16 calculationDecimal = IController(controllerAddress).calculationDecimal();
        
        address collateralAddress = IController(controllerAddress).collateralForToken(kAssetAddress);
        
        uint256 realCollateralAmount = (targetPrice * kAssetAmount) / (10 ** ITokenERC20(kAssetAddress).decimals());
        require(realCollateralAmount * minCollateralRatio <= collateralAmount * (10**calculationDecimal), "7");
        ITokenERC20(collateralAddress).safeTransferFrom(msg.sender, address(this), collateralAmount);
        ITokenERC20(kAssetAddress).mint(msg.sender, kAssetAmount);
        data[id].borrowBalance = kAssetAmount;
        data[id].collateralBalance = collateralAmount;
        isInvalidSignature[signature] = true;
        emit BorrowAsset(msg.sender, id, kAssetAmount, collateralAmount, block.timestamp);
    }

    function editBorrow(
        address kAssetAddress, 
        uint256 kAssetAmount, 
        uint256 collateralAmount, 
        uint256 targetPrice,
        uint256 expiredTime,
        bytes memory id, 
        bytes memory signature
    ) public nonReentrant {
        {
            require(msg.sender == data[id].account, "1");
            require(data[id].collateralBalance > 0, "2");
            require(data[id].typeBorrow == 1, "3");
            require(!isInvalidSignature[signature], "4");
            require(expiredTime >= block.timestamp, "5");
        }
        address collateralAddress = IController(controllerAddress).collateralForToken(kAssetAddress);
        {
            require(
                verifySignature(
                    IController(controllerAddress).signer(),
                    kAssetAddress,
                    targetPrice,
                    expiredTime,
                    id,
                    signature
                ),
                "6"
            );
        }
        {
            if(kAssetAmount < data[id].borrowBalance) {
                uint256 diff = data[id].borrowBalance - kAssetAmount;
                ITokenERC20(kAssetAddress).safeTransferFrom(msg.sender, address(this), diff);
                ITokenERC20(kAssetAddress).burn(diff);
            } else if (kAssetAmount > data[id].borrowBalance) {
                uint256 diff = kAssetAmount - data[id].borrowBalance;
                ITokenERC20(kAssetAddress).mint(msg.sender, diff);
            }
        }
        {
            uint16 minCollateralRatio = IController(controllerAddress).minCollateralRatio();
            uint16 calculationDecimal = IController(controllerAddress).calculationDecimal();
            
            uint256 realCollateralAmount = (targetPrice * kAssetAmount) / (10 ** ITokenERC20(kAssetAddress).decimals());
            require(realCollateralAmount * minCollateralRatio <= collateralAmount * (10**calculationDecimal), "7");
        }
        
        if(collateralAmount < data[id].collateralBalance) {
            uint256 diff = data[id].collateralBalance - collateralAmount;
            ITokenERC20(collateralAddress).safeTransfer(msg.sender, diff);
            data[id].collateralBalance = collateralAmount;
        } else if(collateralAmount > data[id].collateralBalance){
            uint256 diff = collateralAmount - data[id].collateralBalance;
            ITokenERC20(collateralAddress).safeTransferFrom(msg.sender, address(this), diff);
            data[id].collateralBalance += diff;
        }
        
        data[id].borrowBalance = kAssetAmount;
        isInvalidSignature[signature] = true;
        
        emit BorrowAsset(msg.sender, id, kAssetAmount, collateralAmount, block.timestamp);
    }

    function close(
        address kAssetAddress, 
        uint256 targetPrice, 
        uint256 expiredTime,
        bytes memory id, 
        bytes memory signature
    ) external nonReentrant {
        {
            require(msg.sender == data[id].account, "1");
            require(data[id].collateralBalance > 0, "2");
            require(!isInvalidSignature[signature], "3");
            require(expiredTime >= block.timestamp, "4");
        }
        uint256 kAssetAmount = data[id].borrowBalance;
        uint256 collateralAmount = data[id].collateralBalance;
        {
            require(
                verifySignature(
                    IController(controllerAddress).signer(),
                    kAssetAddress,
                    targetPrice,
                    expiredTime,
                    id,
                    signature
                ),
                "5"
            );
        }
        if (kAssetAmount > 0) {
            ITokenERC20(kAssetAddress).safeTransferFrom(msg.sender, address(this), kAssetAmount);
            ITokenERC20(kAssetAddress).burn(kAssetAmount);
        }
        
        address collateralAddress = IController(controllerAddress).collateralForToken(kAssetAddress);
        uint256 fee = targetPrice * kAssetAmount * 15 / (10 ** ITokenERC20(kAssetAddress).decimals() * 1000);
        if(fee < data[id].collateralBalance) {
            collateralAmount -= fee;
            ITokenERC20(collateralAddress).safeTransfer(msg.sender, collateralAmount);
            ITokenERC20(collateralAddress).safeTransfer(IController(controllerAddress).receiverAddress(), fee);
        }
        
        data[id].borrowBalance = 0;
        data[id].collateralBalance = 0;
        isInvalidSignature[signature] = true;
        
        emit Close(msg.sender, id, data[id].typeBorrow, kAssetAmount, collateralAmount, block.timestamp);
    }

    function short(
        address kAssetAddress, 
        uint256 kAssetAmount, 
        uint256 collateralAmount,
        uint256 targetPrice,
        uint256 expiredTime,
        uint16 slippage, 
        bytes memory id,
        bytes memory signature
    ) external nonReentrant {
        if(data[id].account == address(0)) data[id].account = msg.sender;
        if(data[id].typeBorrow == 0) data[id].typeBorrow = 2;
        {
            require(msg.sender == data[id].account, "1"); 
            require(data[id].collateralBalance == 0, "2");
            require(data[id].typeBorrow == 2, "3");
            require(!isInvalidSignature[signature], "4");
            require(expiredTime >= block.timestamp, "5");
        }
        {
            require(
                verifySignature(
                    IController(controllerAddress).signer(),
                    kAssetAddress,
                    targetPrice,
                    expiredTime,
                    id,
                    signature
                ),
                "6"
            );
        }
        address collateralAddress = IController(controllerAddress).collateralForToken(kAssetAddress);
        {
            data[id].kAssetAddress = kAssetAddress;
        }

        _checkShort(kAssetAddress, targetPrice, kAssetAmount, collateralAmount);
        
        {
            ITokenERC20(collateralAddress).safeTransferFrom(msg.sender, address(this), collateralAmount);
            ITokenERC20(kAssetAddress).mint(address(this), kAssetAmount);
            data[id].borrowBalance = kAssetAmount;
            data[id].collateralBalance = collateralAmount;
            isInvalidSignature[signature] = true;
        }
        {
            ITokenERC20(kAssetAddress).safeApprove(IController(controllerAddress).router(), kAssetAmount);
        }
        {
            address[] memory path = new address[](2);
            uint[] memory reserve = new uint[](2);
            {
                address poolAddress = IController(controllerAddress).pools(kAssetAddress);
                (uint reserve0, uint reserve1,) = IUniswapV2Pair(poolAddress).getReserves();
                
                path[0] = kAssetAddress;
                path[1] = IUniswapV2Pair(poolAddress).token1();
                reserve[0] = reserve0;
                reserve[1] = reserve1;
                if (path[1] == kAssetAddress) {
                    path[1] = IUniswapV2Pair(poolAddress).token0();
                    reserve[0] = reserve1;
                    reserve[1] = reserve0;
                }
            }
            uint256 amountOutMin = IUniswapV2Router02(IController(controllerAddress).router()).getAmountOut(kAssetAmount, reserve[0], reserve[1]) * (10000 - slippage) / 10000;
            uint256 balanceBefore = ITokenERC20(path[1]).balanceOf(address(this));
            IUniswapV2Router02(IController(controllerAddress).router()).swapExactTokensForTokensSupportingFeeOnTransferTokens(kAssetAmount, amountOutMin, path, address(this), expiredTime);
            lock(id, ITokenERC20(path[1]).balanceOf(address(this)) - balanceBefore);
            emit Short(msg.sender, id, kAssetAmount, collateralAmount, block.timestamp);
        }
    }
    
    function editShort(
        address kAssetAddress, 
        uint256 kAssetAmount, 
        uint256 collateralAmount, 
        uint256 targetPrice,
        uint256 expiredTime, 
        uint16 slippage, 
        bytes memory id,
        bytes memory signature
    ) external nonReentrant {
        {
            require(msg.sender == data[id].account, "1"); 
            require(data[id].collateralBalance > 0, "2");
            require(data[id].typeBorrow == 2, "3");
            require(!isInvalidSignature[signature], "4");
            require(expiredTime >= block.timestamp, "5");
        }
        {
            require(
                verifySignature(
                    IController(controllerAddress).signer(),
                    kAssetAddress,
                    targetPrice,
                    expiredTime,
                    id,
                    signature
                ),
                "6"
            );
        }
        uint8 isLocked = 0;
        address collateralAddress = IController(controllerAddress).collateralForToken(kAssetAddress);

        _checkShort(kAssetAddress, targetPrice, kAssetAmount, collateralAmount);

        if(collateralAmount < data[id].collateralBalance) {
            uint256 diff = data[id].collateralBalance - collateralAmount;
            ITokenERC20(collateralAddress).safeTransfer(msg.sender, diff);
            data[id].collateralBalance = collateralAmount;
        } else if(collateralAmount > data[id].collateralBalance){
            uint256 diff = collateralAmount - data[id].collateralBalance;
            ITokenERC20(collateralAddress).safeTransferFrom(msg.sender, address(this), diff);
            data[id].collateralBalance += diff;
        }

        if(kAssetAmount < data[id].borrowBalance) {
            uint256 diff = data[id].borrowBalance - kAssetAmount;
            ITokenERC20(kAssetAddress).safeTransferFrom(msg.sender, address(this), diff);
            ITokenERC20(kAssetAddress).burn(diff);
        } else if (kAssetAmount > data[id].borrowBalance) {
            uint256 diff = kAssetAmount - data[id].borrowBalance;
            {
                ITokenERC20(kAssetAddress).mint(address(this), diff);
            }
            address[] memory path = new address[](2);
            uint[] memory reserve = new uint[](2);
            {
                address poolAddress = IController(controllerAddress).pools(kAssetAddress);
                (uint reserve0, uint reserve1,) = IUniswapV2Pair(poolAddress).getReserves();
                path[0] = kAssetAddress;
                path[1] = IUniswapV2Pair(poolAddress).token1();
                reserve[0] = reserve0;
                reserve[1] = reserve1;
                if (path[1] == kAssetAddress) {
                    path[1] = IUniswapV2Pair(poolAddress).token0();
                    reserve[0] = reserve1;
                    reserve[1] = reserve0;
                }
            }
            {
                ITokenERC20(kAssetAddress).safeApprove(IController(controllerAddress).router(), diff);
            }
            {
                uint256 deadline_ = expiredTime;
                uint256 amountOutMin = IUniswapV2Router02(IController(controllerAddress).router()).getAmountOut(diff, reserve[0], reserve[1]) * (10000 - slippage) / 10000;
                uint256 balanceBefore = ITokenERC20(path[1]).balanceOf(address(this));
                IUniswapV2Router02(IController(controllerAddress).router()).swapExactTokensForTokensSupportingFeeOnTransferTokens(diff, amountOutMin, path, address(this), deadline_);
                lock(id, ITokenERC20(path[1]).balanceOf(address(this)) - balanceBefore);
            }
            isLocked = 1;
        }
        
        data[id].borrowBalance = kAssetAmount;
        isInvalidSignature[signature] = true;
        
        emit EditShort(msg.sender, id, isLocked, kAssetAmount, collateralAmount, block.timestamp);
    }

    function liquidation(
        address kAssetAddress, 
        uint256 kAssetAmount, 
        uint256 targetPrice,
        uint256 expiredTime,
        bytes memory id,
        bytes memory signature
    ) external nonReentrant {
        {
            require(data[id].borrowBalance >= kAssetAmount, "1");
            require(!isInvalidSignature[signature], "2");
            require(expiredTime >= block.timestamp, "3");
            require(
                verifySignature(
                    IController(controllerAddress).signer(),
                    kAssetAddress,
                    targetPrice,
                    expiredTime,
                    id,
                    signature
                ),
                "4"
            );
        }
        
        uint16 calculationDecimal = IController(controllerAddress).calculationDecimal();
        uint16 discountRate = IController(controllerAddress).discountRates(kAssetAddress);
        
        _checkLiquidation(kAssetAddress, data[id].borrowBalance, data[id].collateralBalance, targetPrice, calculationDecimal, discountRate);
        
        uint256 discountedCollateralValue = 
            (kAssetAmount * targetPrice * 985 / 1000) / (10 ** ITokenERC20(kAssetAddress).decimals())
            * (10**calculationDecimal)
            / (10**calculationDecimal - discountRate);
            
        address collateralAddress = IController(controllerAddress).collateralForToken(kAssetAddress);

        {
            isInvalidSignature[signature] = true;
        }

        if (discountedCollateralValue <= data[id].collateralBalance) {
            ITokenERC20(kAssetAddress).safeTransferFrom(msg.sender, address(this), kAssetAmount);
            ITokenERC20(kAssetAddress).burn(kAssetAmount);
            ITokenERC20(collateralAddress).safeTransfer(msg.sender, discountedCollateralValue);
            data[id].borrowBalance -= kAssetAmount;
            data[id].collateralBalance -= discountedCollateralValue;
            if(data[id].borrowBalance == 0) {
                ITokenERC20(collateralAddress).safeTransfer(data[id].account, data[id].collateralBalance);
                data[id].collateralBalance = 0;
            }
            emit Liquidation(msg.sender, data[id].account, id, kAssetAmount, discountedCollateralValue, block.timestamp, discountRate);
        } else {
            uint256 collateralBalance = data[id].collateralBalance;
            uint256 kAssetNeeded =  collateralBalance * ((10**calculationDecimal) - discountRate) * (10 ** ITokenERC20(kAssetAddress).decimals()) / ((10**calculationDecimal) * targetPrice * 985 / 1000);
            {
                ITokenERC20(kAssetAddress).safeTransferFrom(msg.sender, address(this), kAssetNeeded);
                ITokenERC20(kAssetAddress).burn(kAssetNeeded);
                ITokenERC20(collateralAddress).safeTransfer(msg.sender, collateralBalance);
            }
            {
                data[id].borrowBalance -= kAssetNeeded;
                data[id].collateralBalance = 0;
            }
            emit Liquidation(msg.sender, data[id].account, id, kAssetNeeded, collateralBalance, block.timestamp, discountRate);
        }
    }
    
    function _checkShort(
        address kAssetAddress, 
        uint256 targetPrice, 
        uint256 kAssetAmount, 
        uint256 collateralAmount
    ) internal view {
        uint16 minCollateralRatio = IController(controllerAddress).minCollateralRatio();
        uint16 maxCollateralRatio = IController(controllerAddress).maxCollateralRatio();
        uint16 calculationDecimal = IController(controllerAddress).calculationDecimal();
        uint256 realCollateralAmount = targetPrice * kAssetAmount / (10 ** ITokenERC20(kAssetAddress).decimals());
        require(realCollateralAmount * minCollateralRatio <= collateralAmount * (10**calculationDecimal), "less than min");
        require(realCollateralAmount * maxCollateralRatio >= collateralAmount * (10**calculationDecimal), "greater than max");
    }
    
    function _checkLiquidation(
        address kAssetAddress, 
        uint256 borrowBalance, 
        uint256 collateralBalance,
        uint256 targetPrice,
        uint16 calculationDecimal, 
        uint16 discountRate
    ) internal view {
        uint16 minCollateralRatio = IController(controllerAddress).minCollateralRatio();
        uint256 realCollateralAmount = targetPrice * borrowBalance / (10 ** ITokenERC20(kAssetAddress).decimals());
        require(realCollateralAmount * minCollateralRatio > collateralBalance * (10**calculationDecimal), "More than min");
        uint16 configDiscountRate = IController(controllerAddress).discountRates(kAssetAddress);
        if (configDiscountRate < discountRate) {
            discountRate = configDiscountRate;
        }
    }

}