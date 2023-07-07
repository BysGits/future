// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import {IController} from "./interfaces/IController.sol";
import {Ownable} from "./Ownable.sol";

contract Controller is Ownable, IController, Initializable {
    uint16 public override minCollateralRatio;
    uint16 public override maxCollateralRatio;
    uint16 public constant override calculationDecimal = 2;
    uint16 public constant override royaltyDecimal = 4;

    uint256 public override lockTime;
    uint256 public override royaltyFeeRatio;

    address public override mintContract;
    address public override router;
    address public override receiverAddress;
    address public override limitOfferContract;
    address public override signer;

    // mapping token address to AMM pool address
    mapping(address => address) public override pools;

    // mapping listing token to collateral token
    mapping(address => address) public override collateralForToken;

    mapping(address => bool) public override acceptedCollateral;

    mapping(address => address) public tokenOwners;

    mapping(address => uint16) public override discountRates;

    mapping(address => bool) public override admins;

    event ListingToken(address indexed tokenAddress, uint256 timestamp);
    event DelistingToken(address indexed tokenAddress, uint256 timestamp);

    constructor() {}

    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner(), "Only admin");
        _;
    }

    modifier notZeroAddress(address _addr) {
        require(_addr != address(0), "Not zero address");
        _;
    }

    function initialize(
        uint16 _minCollateralRatio,
        uint16 _maxCollateralRatio,
        uint256 _lockTime,
        uint256 _royaltyFeeRatio,
        address _router,
        address _receiverAddress,
        address _signer
    ) external onlyOwner initializer {
        minCollateralRatio = _minCollateralRatio;
        maxCollateralRatio = _maxCollateralRatio;
        royaltyFeeRatio = _royaltyFeeRatio;
        lockTime = _lockTime;
        router = _router;
        receiverAddress = _receiverAddress;
        signer = _signer;
    }

    function setSigner(address _addr) public onlyOwner notZeroAddress(_addr) {
        signer = _addr;
    }

    function setAdmin(address _addr) public onlyOwner notZeroAddress(_addr) {
        admins[_addr] = true;
    }

    function revokeAdmin(address _addr) public onlyOwner notZeroAddress(_addr) {
        admins[_addr] = false;
    }

    function setRoyaltyFeeRatio(uint256 _fee) public onlyOwner {
        royaltyFeeRatio = _fee;
    }

    function setRecieverAddress(address _addr) public onlyOwner notZeroAddress(_addr) {
        receiverAddress = _addr;
    }

    function setMinCollateralRatio(
        uint16 _minCollateralRatio
    ) external onlyOwner {
        minCollateralRatio = _minCollateralRatio;
    }

    function setMaxCollateralRatio(
        uint16 _maxCollateralRatio
    ) external onlyOwner {
        maxCollateralRatio = _maxCollateralRatio;
    }

    function setRouter(address _router) external onlyOwner notZeroAddress(_router) {
        router = _router;
    }

    function setLockTime(uint256 _lockTime) external onlyOwner {
        require(_lockTime >= 300, "Lock time must be at least 5 minutes");
        lockTime = _lockTime;
    }

    function setMintContract(address _mintAddress) external onlyOwner notZeroAddress(_mintAddress) {
        mintContract = _mintAddress;
    }

    function setLimitOfferContract(
        address _limitOfferContract
    ) external onlyOwner notZeroAddress(_limitOfferContract) {
        limitOfferContract = _limitOfferContract;
    }

    function setDiscountRate(
        address _tokenAddress,
        uint16 _rate
    ) external onlyOwner notZeroAddress(_tokenAddress) {
        discountRates[_tokenAddress] = _rate;
    }

    function registerIDOTokens(
        address[] memory tokenAddresses,
        address[] memory poolAddresses,
        address[] memory collateralTokens,
        uint16[] memory discountRate
    ) public onlyAdmin {
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            registerIDOToken(
                tokenAddresses[i],
                poolAddresses[i],
                collateralTokens[i],
                discountRate[i]
            );
        }
    }

    function registerIDOToken(
        address tokenAddress,
        address poolAddress,
        address collateralToken,
        uint16 discountRate
    ) public onlyAdmin {
        require(tokenAddress != collateralToken, "Duplicate token addresses");
        require(
            collateralForToken[tokenAddress] == address(0),
            "Token is already registered"
        );
        require(acceptedCollateral[collateralToken], "Invalid colateral token");
        collateralForToken[tokenAddress] = collateralToken;
        address token0 = IUniswapV2Pair(poolAddress).token0();
        address token1 = IUniswapV2Pair(poolAddress).token1();
        require(
            token0 == tokenAddress || token1 == tokenAddress,
            "Missing token address"
        );
        require(
            token0 == collateralToken || token1 == collateralToken,
            "Missing collateral address"
        );
        pools[tokenAddress] = poolAddress;
        tokenOwners[tokenAddress] = msg.sender;
        discountRates[tokenAddress] = discountRate;
        emit ListingToken(tokenAddress, block.timestamp);
    }

    function unregisterToken(address tokenAddress) public onlyAdmin {
        require(
            collateralForToken[tokenAddress] != address(0),
            "Token have not been registered"
        );
        collateralForToken[tokenAddress] = address(0);
        pools[tokenAddress] = address(0);
        tokenOwners[tokenAddress] = address(0);
        emit DelistingToken(tokenAddress, block.timestamp);
    }

    function updateIDOToken(
        address tokenAddress,
        address poolAddress,
        address collateralToken
    ) public onlyAdmin {
        require(
            collateralForToken[tokenAddress] != address(0),
            "Token have not been registered"
        );
        require(
            acceptedCollateral[collateralToken],
            "Invalid collateral token"
        );
        pools[tokenAddress] = poolAddress;
    }

    function registerCollateralAsset(
        address collateralAsset,
        bool value
    ) public onlyOwner {
        acceptedCollateral[collateralAsset] = value;
    }
}
