// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


interface IUniversalOracle {
    
    function getPrice(address token) external view returns (uint256 price, uint256 timestamp);

    function hasPrice(address token) external view returns (bool hasPrice);

    function getPriceStalenessThreshold() external view returns (uint256 threshold);

    event PriceUpdated(address indexed token, uint256 price, uint256 timestamp);
}
