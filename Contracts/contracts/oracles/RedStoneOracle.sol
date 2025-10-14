// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IUniversalOracle.sol";

contract RedStoneOracle is IUniversalOracle, Ownable {

    uint256 public constant PRICE_STALENESS_THRESHOLD = 24 hours;

    mapping(address => PriceData) private prices;

    mapping(address => bytes32) public tokenToDataFeedId;

    mapping(address => bool) public authorizedUpdaters;

    struct PriceData {
        uint256 price;
        uint256 timestamp;
        bool isActive;
    }

    error RedStoneOracle__UnauthorizedUpdater();
    error RedStoneOracle__PriceNotSet();
    error RedStoneOracle__StalePrice();
    error RedStoneOracle__InvalidPrice();

    event DataFeedAdded(address indexed token, bytes32 indexed dataFeedId);
    event UpdaterAuthorized(address indexed updater);
    event UpdaterRevoked(address indexed updater);

    constructor() Ownable(msg.sender) {}

   
    function addTokenDataFeed(address token, bytes32 dataFeedId) external onlyOwner {
        tokenToDataFeedId[token] = dataFeedId;
        prices[token].isActive = true;
        emit DataFeedAdded(token, dataFeedId);
    }

    function authorizeUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = true;
        emit UpdaterAuthorized(updater);
    }

    function revokeUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = false;
        emit UpdaterRevoked(updater);
    }

    function updatePrice(address token, uint256 price) external {
        if (!authorizedUpdaters[msg.sender]) revert RedStoneOracle__UnauthorizedUpdater();
        if (price == 0) revert RedStoneOracle__InvalidPrice();
        if (!prices[token].isActive) revert RedStoneOracle__PriceNotSet();

        prices[token].price = price;
        prices[token].timestamp = block.timestamp;

        emit PriceUpdated(token, price, block.timestamp);
    }

    function getPrice(address token) external view override returns (uint256 price, uint256 timestamp) {
        PriceData memory priceData = prices[token];
        
        if (!priceData.isActive) revert RedStoneOracle__PriceNotSet();
        if (block.timestamp - priceData.timestamp > PRICE_STALENESS_THRESHOLD) {
            revert RedStoneOracle__StalePrice();
        }

        return (priceData.price, priceData.timestamp);
    }

    function hasPrice(address token) external view override returns (bool) {
        PriceData memory priceData = prices[token];
        return priceData.isActive && 
               priceData.price > 0 && 
               (block.timestamp - priceData.timestamp <= PRICE_STALENESS_THRESHOLD);
    }

    function getPriceStalenessThreshold() external pure override returns (uint256 threshold) {
        return PRICE_STALENESS_THRESHOLD;
    }
}
