// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IUniversalOracle.sol";


contract ChainlinkOracle is IUniversalOracle, Ownable {

    uint256 public constant PRICE_STALENESS_THRESHOLD = 1 hours;

    mapping(address => address) public tokenToAggregator;

    error ChainlinkOracle__PriceNotSet();
    error ChainlinkOracle__StalePrice();
    error ChainlinkOracle__InvalidPrice();
    error ChainlinkOracle__AggregatorNotSet();

    event AggregatorSet(address indexed token, address indexed aggregator);

    constructor() Ownable(msg.sender) {}

    function setAggregator(address token, address aggregator) external onlyOwner {
        tokenToAggregator[token] = aggregator;
        emit AggregatorSet(token, aggregator);
    }

    function getPrice(address token) external view override returns (uint256 price, uint256 timestamp) {
        address aggregator = tokenToAggregator[token];
        if (aggregator == address(0)) revert ChainlinkOracle__AggregatorNotSet();

        // Chainlink aggregator interface
        (, int256 answer, , uint256 updatedAt, ) = AggregatorV3Interface(aggregator).latestRoundData();
        
        if (answer <= 0) revert ChainlinkOracle__InvalidPrice();
        if (block.timestamp - updatedAt > PRICE_STALENESS_THRESHOLD) {
            revert ChainlinkOracle__StalePrice();
        }

        // Convert to 18 decimals (Chainlink typically uses 8 decimals)
        uint8 decimals = AggregatorV3Interface(aggregator).decimals();
        uint256 adjustedPrice = uint256(answer) * (10 ** (18 - decimals));

        return (adjustedPrice, updatedAt);
    }

    function hasPrice(address token) external view override returns (bool) {
        address aggregator = tokenToAggregator[token];
        if (aggregator == address(0)) return false;

        try AggregatorV3Interface(aggregator).latestRoundData() returns (
            uint80, int256 answer, uint256, uint256 updatedAt, uint80
        ) {
            return answer > 0 && (block.timestamp - updatedAt <= PRICE_STALENESS_THRESHOLD);
        } catch {
            return false;
        }
    }


    function getPriceStalenessThreshold() external pure override returns (uint256 threshold) {
        return PRICE_STALENESS_THRESHOLD;
    }
}

interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}
