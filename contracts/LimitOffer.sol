// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

import {IController} from "./interfaces/IController.sol";
import {Ownable} from "./Ownable.sol";
import {ITokenERC20} from "./interfaces/ITokenERC20.sol";

contract LimitOffer is Ownable, ReentrancyGuard {
    using SafeERC20 for ITokenERC20;

    uint256 amountToClaim;

    address public controllerAddress;

    struct Order {
        uint256 offerCollateralAmount;
        uint256 offerKAssetAmount;
        address kAssetAddress;
        address userAddress;
    }
    mapping(bytes => Order) public orders;     // id -> order
    mapping(bytes => uint256) public offerFee;


    event Offer(
        address indexed userAddress,
        address indexed kAssetAddress,
        bytes id,
        uint256 kAssetAmount,
        uint256 collateralAmount,
        uint256 timestamp
    );

    event WithDraw(
        address indexed userAddress,
        address indexed kAssetAddress,
        bytes id,
        uint256 kAssetAmount,
        uint256 collateralAmount,
        uint256 timestamp
    );

    event Buy(bytes[] ids);
    event Sell(bytes[] ids);

    constructor() {}
    
    modifier onlyAdmin() {
        require(IController(controllerAddress).admins(msg.sender) || msg.sender == owner(), "Only admin");
        _;
    }

    function getAmountToClaim() external view onlyOwner returns(uint256) {
        return amountToClaim;
    }

    function setControllerAddress(address _controllerAddress) external onlyOwner {
        controllerAddress = _controllerAddress;
    }

    function offerBuy(address kAssetAddress, uint256 kAssetAmount, uint256 collateralAmount, bytes memory id) external nonReentrant {
        Order storage order = orders[id];
        require(order.offerCollateralAmount == 0, "Still being offered to buy");

        address collateralAddress = IController(controllerAddress).collateralForToken(kAssetAddress);

        offerFee[id] = collateralAmount * IController(controllerAddress).royaltyFeeRatio() / (10 ** IController(controllerAddress).royaltyDecimal());
        
        ITokenERC20(collateralAddress).safeTransferFrom(msg.sender, address(this), offerFee[id]);
        ITokenERC20(collateralAddress).safeTransferFrom(msg.sender, address(this), collateralAmount);
        
        order.offerCollateralAmount = collateralAmount;
        
        order.offerKAssetAmount = kAssetAmount;
        order.kAssetAddress = kAssetAddress;
        order.userAddress = msg.sender;

        emit Offer(msg.sender, kAssetAddress, id, kAssetAmount, collateralAmount, block.timestamp);
    }

    function offerSell(address kAssetAddress, uint256 kAssetAmount, uint256 collateralAmount, bytes memory id) external nonReentrant {
        uint256 royaltyFee = IController(controllerAddress).royaltyFeeRatio();
        
        {
            address collateralAddress = IController(controllerAddress).collateralForToken(kAssetAddress);
            offerFee[id] = collateralAmount * royaltyFee / (10 ** IController(controllerAddress).royaltyDecimal());

            ITokenERC20(collateralAddress).safeTransferFrom(msg.sender, address(this), offerFee[id]);

            ITokenERC20(kAssetAddress).safeTransferFrom(msg.sender, address(this), kAssetAmount);
        }
        
        Order storage order = orders[id];
        require(order.offerKAssetAmount == 0, "Still being offered to sell");
        order.offerCollateralAmount = collateralAmount;
        order.offerKAssetAmount = kAssetAmount;
        order.kAssetAddress = kAssetAddress;
        order.userAddress = msg.sender;

        emit Offer(msg.sender, kAssetAddress, id, kAssetAmount, collateralAmount, block.timestamp);
    }
    
    function buy(uint256 deadline, uint256[] memory amountOutMin, bytes[] memory ids) external onlyAdmin {
        for(uint256 i = 0; i < ids.length; i++) {
            buyNow(deadline, amountOutMin[i], ids[i]);
        }

        emit Buy(ids);
    }
    
    function sell(uint256 deadline, uint256[] memory amountOutMin, bytes[] memory ids) external onlyAdmin {
        for(uint256 i = 0; i < ids.length; i++) {
            sellNow(deadline, amountOutMin[i], ids[i]);
        }

        emit Sell(ids);
    }

    function buyNow(uint256 deadline, uint256 amountOutMin, bytes memory id) public nonReentrant onlyAdmin {
        Order storage order = orders[id];
        uint256 collateralAmount = order.offerCollateralAmount;
        // address kAssetAddress = order.kAssetAddress;
        // address user = order.userAddress;
        uint256 amountOut;
        {
            address collateralAddress = IController(controllerAddress).collateralForToken(order.kAssetAddress);
            address[] memory path = new address[](2);
            // uint256 deadline_ = deadline;
            // uint256 amountOutMin_ = amountOutMin;
            {
                address poolAddress = IController(controllerAddress).pools(order.kAssetAddress);
                
                path[0] = collateralAddress;
                path[1] = IUniswapV2Pair(poolAddress).token1();
                if (path[1] == collateralAddress) {
                    path[1] = IUniswapV2Pair(poolAddress).token0();
                }
            }
            {
                ITokenERC20(collateralAddress).safeApprove(IController(controllerAddress).router(), collateralAmount);
            }

            uint256 balanceBefore = ITokenERC20(path[1]).balanceOf(order.userAddress);
            IUniswapV2Router02(IController(controllerAddress).router()).swapExactTokensForTokensSupportingFeeOnTransferTokens(collateralAmount, amountOutMin, path, order.userAddress, deadline);
            amountOut = ITokenERC20(path[1]).balanceOf(order.userAddress) - balanceBefore;
        }
        order.offerCollateralAmount = 0;
        order.offerKAssetAmount = 0;
        amountToClaim += offerFee[id];

        emit Offer(msg.sender, order.kAssetAddress, id, amountOut, collateralAmount, block.timestamp);
    }

    function sellNow(uint256 deadline, uint256 amountOutMin, bytes memory id) public nonReentrant onlyAdmin {
        Order storage order = orders[id];
        uint256 kAssetAmount = order.offerKAssetAmount;
        // address kAssetAddress = order.kAssetAddress;
        // address user = order.userAddress;
        // uint256 deadline_ = deadline;
        uint256 collateralAmount;
        {
            address[] memory path = new address[](2);
            
            {
                address poolAddress = IController(controllerAddress).pools(order.kAssetAddress);
                
                path[0] = order.kAssetAddress;
                path[1] = IUniswapV2Pair(poolAddress).token1();
                if (path[1] == order.kAssetAddress) {
                    path[1] = IUniswapV2Pair(poolAddress).token0();
                }
            }
            ITokenERC20(order.kAssetAddress).safeApprove(IController(controllerAddress).router(), kAssetAmount);

            uint256 balanceBefore = ITokenERC20(path[1]).balanceOf(order.userAddress);
            IUniswapV2Router02(IController(controllerAddress).router()).swapExactTokensForTokensSupportingFeeOnTransferTokens(kAssetAmount, amountOutMin, path, order.userAddress, deadline);
            collateralAmount = ITokenERC20(path[1]).balanceOf(order.userAddress) - balanceBefore;
        }
        order.offerCollateralAmount = 0;
        order.offerKAssetAmount = 0;
        amountToClaim += offerFee[id];

        emit Offer(msg.sender, order.kAssetAddress, id, kAssetAmount, collateralAmount, block.timestamp);
    }

    function withDrawBuy(bytes memory id) external nonReentrant {
        Order storage order = orders[id];
        uint256 collateralAmount = order.offerCollateralAmount;
        uint256 kAssetAmount = order.offerKAssetAmount;
        // address kAssetAddress = order.kAssetAddress;
        // address user = order.userAddress;
        
        require(msg.sender == order.userAddress, "Caller is not the one offered");
        require(collateralAmount > 0 && kAssetAmount > 0, "No offer to be withdrawn");
        
        address collateralAddress = IController(controllerAddress).collateralForToken(order.kAssetAddress);
        ITokenERC20(collateralAddress).safeTransfer(msg.sender, collateralAmount);
        ITokenERC20(collateralAddress).safeTransfer(msg.sender, offerFee[id]);
        order.offerCollateralAmount = 0;
        order.offerKAssetAmount = 0;

        emit WithDraw(msg.sender, order.kAssetAddress, id, kAssetAmount, collateralAmount, block.timestamp);
    }

    function withDrawSell(bytes memory id) external nonReentrant {
        Order storage order = orders[id];
        uint256 collateralAmount = order.offerCollateralAmount;
        uint256 kAssetAmount = order.offerKAssetAmount;
        // address kAssetAddress = order.kAssetAddress;
        // address user = order.userAddress;
        address collateralAddress = IController(controllerAddress).collateralForToken(order.kAssetAddress);
        
        require(msg.sender == order.userAddress, "Caller is not the one offered");
        require(collateralAmount > 0 && kAssetAmount > 0, "No offer to be withdrawn");

        ITokenERC20(order.kAssetAddress).safeTransfer(msg.sender, kAssetAmount);
        ITokenERC20(collateralAddress).safeTransfer(msg.sender, offerFee[id]);
        order.offerCollateralAmount = 0;
        order.offerKAssetAmount = 0;

        emit WithDraw(msg.sender, order.kAssetAddress, id, kAssetAmount, collateralAmount, block.timestamp);
    }

    function claim(address collateralAddress) external onlyOwner {
        ITokenERC20(collateralAddress).safeTransfer(owner(), amountToClaim);
        amountToClaim = 0;
    }

}