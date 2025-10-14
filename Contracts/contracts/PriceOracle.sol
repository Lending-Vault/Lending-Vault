// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

// Owner-managed price oracle with security controls
contract PriceOracle is Ownable {
    // Token address => price (18 decimals)
    mapping(address => uint256) private prices;

    // Token address => last update timestamp
    mapping(address => uint256) private lastPriceUpdate;

    // Constants
    uint256 public constant MIN_PRICE = 1e12; // $0.000001
    uint256 public constant MAX_PRICE = 1e30; // $1 trillion
    uint256 public constant PRICE_UPDATE_DELAY = 1 hours;
    uint256 public constant MAX_PRICE_CHANGE = 5000; // 50%
    uint256 public constant BASIS_POINTS = 10000;

    // Events
    event PriceUpdated(address indexed token, uint256 oldPrice, uint256 newPrice);

    // Errors
    error PriceOracle__OnlyOwner();
    error PriceOracle__PriceCannotBeZero();
    error PriceOracle__PriceNotSet();
    error PriceOracle__PriceOutOfBounds();
    error PriceOracle__UpdateTooFrequent();
    error PriceOracle__PriceChangeTooLarge();

    // Initialize contract setting deployer as owner
    constructor() Ownable(msg.sender) {}

    // Set price for token with security validations
    function setPrice(address token, uint256 price) external {
        if (msg.sender != owner()) revert PriceOracle__OnlyOwner();
        if (price == 0) revert PriceOracle__PriceCannotBeZero();
        if (price < MIN_PRICE || price > MAX_PRICE) revert PriceOracle__PriceOutOfBounds();

        // Check update frequency (except for first time)
        if (lastPriceUpdate[token] != 0) {
            if (block.timestamp < lastPriceUpdate[token] + PRICE_UPDATE_DELAY) {
                revert PriceOracle__UpdateTooFrequent();
            }

            // Check price change limits (except for first time)
            uint256 currentPrice = prices[token];
            if (currentPrice > 0) {
                uint256 priceChange;
                if (price > currentPrice) {
                    priceChange = ((price - currentPrice) * BASIS_POINTS) / currentPrice;
                } else {
                    priceChange = ((currentPrice - price) * BASIS_POINTS) / currentPrice;
                }

                if (priceChange > MAX_PRICE_CHANGE) {
                    revert PriceOracle__PriceChangeTooLarge();
                }
            }
        }

        uint256 oldPrice = prices[token];
        prices[token] = price;
        lastPriceUpdate[token] = block.timestamp;

        emit PriceUpdated(token, oldPrice, price);
    }

    // Emergency function to set price without restrictions
    function emergencySetPrice(address token, uint256 price) external {
        if (msg.sender != owner()) revert PriceOracle__OnlyOwner();
        if (price == 0) revert PriceOracle__PriceCannotBeZero();
        if (price < MIN_PRICE || price > MAX_PRICE) revert PriceOracle__PriceOutOfBounds();

        uint256 oldPrice = prices[token];
        prices[token] = price;
        lastPriceUpdate[token] = block.timestamp;

        emit PriceUpdated(token, oldPrice, price);
    }

    // Return price for token
    function getPrice(address token) external view returns (uint256 price) {
        price = prices[token];
        if (price == 0) revert PriceOracle__PriceNotSet();
    }
}