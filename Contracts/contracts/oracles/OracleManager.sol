// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IUniversalOracle.sol";

contract OracleManager is Ownable {
    IUniversalOracle public primaryOracle;
    
    IUniversalOracle public secondaryOracle;
    
    IUniversalOracle public manualOracle;

    uint256 public constant MAX_PRICE_DEVIATION = 1000; // 10% in basis points
    uint256 public constant BASIS_POINTS = 10000;

    error OracleManager__NoPriceAvailable();
    error OracleManager__PriceDeviationTooHigh();
    error OracleManager__InvalidOracle();

    event PrimaryOracleSet(address indexed oracle);
    event SecondaryOracleSet(address indexed oracle);
    event ManualOracleSet(address indexed oracle);
    event PriceRetrieved(address indexed token, uint256 price, uint8 oracleUsed);

    constructor() Ownable(msg.sender) {}

    function setPrimaryOracle(address oracle) external onlyOwner {
        if (oracle == address(0)) revert OracleManager__InvalidOracle();
        primaryOracle = IUniversalOracle(oracle);
        emit PrimaryOracleSet(oracle);
    }

    function setSecondaryOracle(address oracle) external onlyOwner {
        if (oracle == address(0)) revert OracleManager__InvalidOracle();
        secondaryOracle = IUniversalOracle(oracle);
        emit SecondaryOracleSet(oracle);
    }

    function setManualOracle(address oracle) external onlyOwner {
        if (oracle == address(0)) revert OracleManager__InvalidOracle();
        manualOracle = IUniversalOracle(oracle);
        emit ManualOracleSet(oracle);
    }

    function getPrice(address token) external returns (uint256 price) {
        // Try primary oracle first
        if (address(primaryOracle) != address(0)) {
            try primaryOracle.getPrice(token) returns (uint256 primaryPrice, uint256) {
                if (primaryPrice > 0) {
                    emit PriceRetrieved(token, primaryPrice, 1);
                    return primaryPrice;
                }
            } catch {}
        }

        // Try secondary oracle
        if (address(secondaryOracle) != address(0)) {
            try secondaryOracle.getPrice(token) returns (uint256 secondaryPrice, uint256) {
                if (secondaryPrice > 0) {
                    emit PriceRetrieved(token, secondaryPrice, 2);
                    return secondaryPrice;
                }
            } catch {}
        }

        // Try manual oracle as last resort
        if (address(manualOracle) != address(0)) {
            try manualOracle.getPrice(token) returns (uint256 manualPrice, uint256) {
                if (manualPrice > 0) {
                    emit PriceRetrieved(token, manualPrice, 3);
                    return manualPrice;
                }
            } catch {}
        }

        revert OracleManager__NoPriceAvailable();
    }

    function getValidatedPrice(address token) external returns (uint256 price) {
        uint256 primaryPrice = 0;
        uint256 secondaryPrice = 0;
        bool hasPrimary = false;
        bool hasSecondary = false;

        // Get primary price
        if (address(primaryOracle) != address(0)) {
            try primaryOracle.getPrice(token) returns (uint256 p, uint256) {
                if (p > 0) {
                    primaryPrice = p;
                    hasPrimary = true;
                }
            } catch {}
        }

        // Get secondary price
        if (address(secondaryOracle) != address(0)) {
            try secondaryOracle.getPrice(token) returns (uint256 s, uint256) {
                if (s > 0) {
                    secondaryPrice = s;
                    hasSecondary = true;
                }
            } catch {}
        }

        // Validate prices if both available
        if (hasPrimary && hasSecondary) {
            uint256 deviation = _calculateDeviation(primaryPrice, secondaryPrice);
            if (deviation > MAX_PRICE_DEVIATION) {
                revert OracleManager__PriceDeviationTooHigh();
            }
            return primaryPrice; // Use primary if validation passes
        }

        // Return available price or fallback to manual
        if (hasPrimary) return primaryPrice;
        if (hasSecondary) return secondaryPrice;

        // Last resort: manual oracle
        return this.getPrice(token);
    }
on _calculateDeviation(uint256 price1, uint256 price2) internal pure returns (uint256 deviation) {
        uint256 diff = price1 > price2 ? price1 - price2 : price2 - price1;
        uint256 average = (price1 + price2) / 2;
        return (diff * BASIS_POINTS) / average;
    }
}
