// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
// import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
// import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
// import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// import {ExtendSafeERC20} from "./ExtendSafeERC20.sol";
// import {IController} from "./interfaces/IController.sol";
// import {IOracle} from "./interfaces/IOracle.sol";
// import {ILock} from "./interfaces/ILock.sol";
// import {Ownable} from "./Ownable.sol";

// contract Minter is Ownable, Initializable, ReentrancyGuard {
//     using ExtendSafeERC20 for IERC20;
//     using SafeERC20 for IERC20;
    

//     address public controllerAddress;
//     address public lockAddress;

//     // mapping token address to target priceAPIConsumer
//     mapping(address => uint256) public targetPrices;

//     mapping(address=> mapping(address => uint256)) public borrowBalances;
//     mapping(address=> mapping(address => uint256)) public collateralBalances;

//     event BorrowAsset(
//         address indexed userAddress,
//         address indexed uAssetAddress,
//         uint256 uAssetAmount,
//         address collateralAddress,
//         uint256 collateralAmount,
//         uint256 timestamp
//     );

//     event Withdrawal(
//         address indexed userAddress,
//         address indexed uAssetAddress,
//         uint256 uAssetAmount,
//         address collateralAddress,
//         uint256 collateralAmount,
//         uint256 timestamp
//     );

//     event Short(
//         address indexed userAddress,
//         address indexed uAssetAddress,
//         uint256 uAssetAmount,
//         address collateralAddress,
//         uint256 collateralAmount,
//         uint256 timestamp
//     );

//     event Liquidation (
//         address indexed buyer,
//         address indexed account,
//         address indexed uAssetAddress,
//         uint256 uAssetAmount,
//         address collateralAddress,
//         uint256 collateralAmount,
//         uint256 timestamp
//     );

//     constructor() {
//     }

//     function initialize(address _controllerAddress, address _lockAddress) external onlyOwner initializer {
//         controllerAddress = _controllerAddress;
//         lockAddress = _lockAddress;
//     }

//     function updateTargetPrice(address tokenAddress, uint256 targetPrice) external nonReentrant {
//         targetPrices[tokenAddress] = targetPrice;
//     }

//     function borrow(address uAssetAddress, uint256 uAssetAmount, uint256 collateralAmount) external nonReentrant {
//         uint256 ttl = IController(controllerAddress).ttl();
//         uint16 minCollateralRatio = IController(controllerAddress).minCollateralRatio();
//         // uint16 maxCollateralRatio = IController(controllerAddress).maxCollateralRatio();
//         uint16 calculationDecimal = IController(controllerAddress).calculationDecimal();

//         address oracleAddress = IController(controllerAddress).oracles(uAssetAddress);
//         // require(oracleAddress != address(0), "Oracle address is 0");
//         address collateralAddress = IController(controllerAddress).collateralForToken(uAssetAddress);
//         // require(collateralAddress != address(0), "Collateral address is 0");

//         (uint256 targetPrice, uint256 updatedTime, uint16 oracleDecimal) = IOracle(oracleAddress).getTargetValue();
//         require(block.timestamp - updatedTime <= ttl, "Target price is not updated");
        
//         // uint16 oracleDecimal = IOracle(oracleAddress).oracleDecimal();
//         uint256 realCollateralAmount = (targetPrice * uAssetAmount) / (10**oracleDecimal);
//         require(realCollateralAmount * minCollateralRatio <= collateralAmount * (10**calculationDecimal), "less than min collateral ratio");
//         // require(realCollateralAmount * maxCollateralRatio >= collateralAmount * (10**calculationDecimal), "greater than max collateral ratio");
//         IERC20(collateralAddress).safeTransferFrom(msg.sender, address(this), collateralAmount);
//         IERC20(uAssetAddress).safeMint(msg.sender, uAssetAmount);
//         borrowBalances[msg.sender][uAssetAddress] += uAssetAmount;
//         collateralBalances[msg.sender][uAssetAddress] += collateralAmount;
//         emit BorrowAsset(msg.sender, uAssetAddress, uAssetAmount, collateralAddress, collateralAmount, block.timestamp);
//     }

//     function addMoreCollateralAmount(address uAssetAddress, uint256 collateralAmount) external nonReentrant {
//         address collateralAddress = IController(controllerAddress).collateralForToken(uAssetAddress);
//         IERC20(collateralAddress).safeTransferFrom(msg.sender, address(this), collateralAmount);
//         collateralBalances[msg.sender][uAssetAddress] += collateralAmount;
//         emit BorrowAsset(msg.sender, uAssetAddress, 0, collateralAddress, collateralAmount, block.timestamp);
//     }

//     function withdraw(address uAssetAddress) external nonReentrant {
//         uint256 uAssetAmount = borrowBalances[msg.sender][uAssetAddress];
//         if (uAssetAmount > 0) {
//             IERC20(uAssetAddress).safeTransferFrom(msg.sender, address(this), uAssetAmount);
//             IERC20(uAssetAddress).safeBurn(uAssetAmount);
//         }
        
//         address collateralAddress = IController(controllerAddress).collateralForToken(uAssetAddress);
//         require(collateralAddress != address(0), "Collateral address is 0");
//         uint256 collateralAmount = collateralBalances[msg.sender][uAssetAddress];
//         IERC20(collateralAddress).safeTransfer(msg.sender, collateralAmount);

//         borrowBalances[msg.sender][uAssetAddress] = 0;
//         collateralBalances[msg.sender][uAssetAddress] = 0;
        
//         emit Withdrawal(msg.sender, uAssetAddress, uAssetAmount, collateralAddress, collateralAmount, block.timestamp);
//     }

//     function short(address uAssetAddress, uint256 uAssetAmount, uint256 collateralAmount) external nonReentrant {
//         address collateralAddress = IController(controllerAddress).collateralForToken(uAssetAddress);
//         require(collateralAddress != address(0), "Collateral address is 0");
//         {
//             uint256 ttl = IController(controllerAddress).ttl();
//             uint16 minCollateralRatio = IController(controllerAddress).minCollateralRatio();
//             uint16 maxCollateralRatio = IController(controllerAddress).maxCollateralRatio();
//             uint16 calculationDecimal = IController(controllerAddress).calculationDecimal();
//             address oracleAddress = IController(controllerAddress).oracles(uAssetAddress);
//             // require(oracleAddress != address(0), "Oracle address is 0");

//             (uint256 targetPrice, uint256 updatedTime, uint16 oracleDecimal) = IOracle(oracleAddress).getTargetValue();
//             require(block.timestamp - updatedTime <= ttl, "Target price is not updated");
//             uint256 realCollateralAmount = targetPrice * uAssetAmount / (10 ** oracleDecimal);
//             require(realCollateralAmount * minCollateralRatio <= collateralAmount * (10**calculationDecimal), "less than min collateral ratio");
//             require(realCollateralAmount * maxCollateralRatio >= collateralAmount * (10**calculationDecimal), "greater than max collateral ratio");

//             IERC20(collateralAddress).safeTransferFrom(msg.sender, address(this), collateralAmount);
//             IERC20(uAssetAddress).safeMint(address(this), uAssetAmount);
//             borrowBalances[msg.sender][uAssetAddress] += uAssetAmount;
//             collateralBalances[msg.sender][uAssetAddress] += collateralAmount;
//         }
//         {
//             address poolAddress = IController(controllerAddress).pools(uAssetAddress);
//             address token0 = IUniswapV2Pair(poolAddress).token0();
//             address token1 = IUniswapV2Pair(poolAddress).token1();
//             address[] memory path = new address[](2);
//             path[0] = uAssetAddress;
//             path[1] = token1;
//             if (token1 == uAssetAddress) {
//                 path[1] = token0;
//             }
//             address routerAddress = IController(controllerAddress).router();
//             IERC20(uAssetAddress).safeApprove(routerAddress, uAssetAmount);
//             uint[] memory amountOuts = IUniswapV2Router02(routerAddress).swapExactTokensForTokens(uAssetAmount, 0, path, lockAddress, block.timestamp + 60);
//             ILock(lockAddress).lock(msg.sender, path[1], amountOuts[1]);
//             emit Short(msg.sender, uAssetAddress, uAssetAmount, collateralAddress, collateralAmount, block.timestamp);
//         }
//     }

//     function liquidation(address userAddress, address uAssetAddress, uint256 uAssetAmount) external nonReentrant {
//         require(borrowBalances[userAddress][uAssetAddress] >= uAssetAmount, "Over liquidation");
//         uint16 calculationDecimal = IController(controllerAddress).calculationDecimal();
//         uint16 discountRate = IController(controllerAddress).minCollateralRatio() - (uint16(10)**calculationDecimal);
//         {
//             uint16 configDiscountRate = IController(controllerAddress).discountRates(uAssetAddress);
//             if (configDiscountRate < discountRate) {
//                 discountRate = configDiscountRate;
//             }
//         }
//         (uint256 targetPrice, uint256 updatedTime, uint16 oracleDecimal) = IOracle(IController(controllerAddress).oracles(uAssetAddress)).getTargetValue();
//         {
//             uint256 ttl = IController(controllerAddress).ttl();
//             require(block.timestamp - updatedTime <= ttl, "Target price is not updated");
//         }
//         uint256 discountedCollateralValue = 
//             (uAssetAmount * targetPrice / (10**oracleDecimal))
//             * (10**calculationDecimal)
//             / (10**calculationDecimal - discountRate);
//         // uint256 userCollateral = collateralBalances[userAddress][uAssetAddress];
//         address collateralAddress = IController(controllerAddress).collateralForToken(uAssetAddress);
//         if (discountedCollateralValue <= collateralBalances[userAddress][uAssetAddress]) {
//             IERC20(uAssetAddress).safeTransferFrom(msg.sender, address(this), uAssetAmount);
//             IERC20(collateralAddress).safeTransfer(msg.sender, discountedCollateralValue);
//             borrowBalances[userAddress][uAssetAddress] -= uAssetAmount;
//             collateralBalances[userAddress][uAssetAddress] -= discountedCollateralValue;
//             emit Liquidation(msg.sender, userAddress, uAssetAddress, uAssetAmount, collateralAddress, discountedCollateralValue, block.timestamp);
//         } else {
//             uint256 redundant = discountedCollateralValue - collateralBalances[userAddress][uAssetAddress];
//             uint256 refundUAssetAmount = redundant * (10**calculationDecimal - discountRate) * (10**oracleDecimal) / ((10**calculationDecimal) * targetPrice);
//             IERC20(uAssetAddress).safeTransferFrom(msg.sender, address(this), uAssetAmount - refundUAssetAmount);
//             IERC20(collateralAddress).safeTransfer(msg.sender, collateralBalances[userAddress][uAssetAddress]);
//             borrowBalances[userAddress][uAssetAddress] -= (uAssetAmount - refundUAssetAmount);
//             collateralBalances[userAddress][uAssetAddress] = 0;
//             emit Liquidation(msg.sender, userAddress, uAssetAddress, uAssetAmount - refundUAssetAmount, collateralAddress, discountedCollateralValue - redundant, block.timestamp);
//         }
//     }

// }