// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IUniversalOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Minimal interface for the existing Manual PriceOracle (PriceOracle.sol)
interface IPriceOracleV1 {
    // Returns price with 18 decimals or reverts if not set
    function getPrice(address token) external view returns (uint256);
}

// Adapter that makes a PriceOracle (which returns only uint256) compatible with IUniversalOracle
contract ManualOracleAdapter is IUniversalOracle, Ownable {
    IPriceOracleV1 public priceOracle;

    uint256 public constant PRICE_STALENESS_THRESHOLD = 24 hours;

    event PriceOracleUpdated(address indexed oracle);

    constructor(address _priceOracle) Ownable(msg.sender) {
        require(_priceOracle != address(0), "Adapter: zero oracle");
        priceOracle = IPriceOracleV1(_priceOracle);
        emit PriceOracleUpdated(_priceOracle);
    }

    function setPriceOracle(address _priceOracle) external onlyOwner {
        require(_priceOracle != address(0), "Adapter: zero oracle");
        priceOracle = IPriceOracleV1(_priceOracle);
        emit PriceOracleUpdated(_priceOracle);
    }

    // IUniversalOracle
    function getPrice(address token) external view override returns (uint256 price, uint256 timestamp) {
        uint256 p = priceOracle.getPrice(token);
        require(p > 0, "Adapter: price not set");
        return (p, block.timestamp);
    }

    // IUniversalOracle
    function hasPrice(address token) external view override returns (bool) {
        try priceOracle.getPrice(token) returns (uint256 p) {
            return p > 0;
        } catch {
            return false;
        }
    }

    // IUniversalOracle
    function getPriceStalenessThreshold() external pure override returns (uint256 threshold) {
        return PRICE_STALENESS_THRESHOLD;
    }
}