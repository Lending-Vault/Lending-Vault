// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PriceOracle
 * @notice Owner-managed price oracle storing manual prices for tokens.
 * @dev Prices are represented with 18 decimals of precision (1e18).
 *      All validations use if/revert with custom errors; no require() statements are used.
 */
contract PriceOracle is Ownable {
    /**
     * @dev token address => price (18 decimals)
     */
    mapping(address => uint256) private prices;

    /**
     * @notice Emitted when a token price is updated.
     * @param token The token address whose price was updated.
     * @param price The new price with 18 decimals.
     */
    event PriceUpdated(address indexed token, uint256 price);

    /**
     * @notice Reverts when a non-owner attempts to perform an owner-only action.
     */
    error PriceOracle__OnlyOwner();

    /**
     * @notice Reverts when attempting to set a price to zero.
     */
    error PriceOracle__PriceCannotBeZero();

    /**
     * @notice Reverts when requesting a price for a token that has not been set.
     */
    error PriceOracle__PriceNotSet();

    /**
     * @notice Initializes the contract setting the deployer as the owner.
     * @dev Uses OpenZeppelin Ownable to set ownership to msg.sender via the OZ v5 pattern.
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @notice Sets the price for a token.
     * @dev Only callable by the owner. The price must be non-zero and uses 18 decimals.
     * @param token The token address to set the price for.
     * @param price The price with 18 decimals (e.g., $2000 = 2000 * 1e18).
     */
    function setPrice(address token, uint256 price) external {
        if (msg.sender != owner()) revert PriceOracle__OnlyOwner();
        if (price == 0) revert PriceOracle__PriceCannotBeZero();

        prices[token] = price;
        emit PriceUpdated(token, price);
    }

    /**
     * @notice Returns the price for a token.
     * @param token The token address to query.
     * @return price The price with 18 decimals.
     * @dev Reverts if a price has not been set for the token.
     */
    function getPrice(address token) external view returns (uint256 price) {
        price = prices[token];
        if (price == 0) revert PriceOracle__PriceNotSet();
    }
}