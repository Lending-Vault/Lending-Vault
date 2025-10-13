 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IPriceOracle {
    function getPrice(address token) external view returns (uint256);
}

/**
 * @title VaultManager
 * @notice Manages user collateral and debt positions.
 * @dev Stores collateral, debt, and interest tracking. Uses basis points for ratios.
 */
contract VaultManager is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /**
     * @notice Mapping of user collateral balances per token.
     * @dev user => token => amount
     */
    mapping(address => mapping(address => uint256)) public collateral;

    /**
     * @notice Mapping of user debt balances per stablecoin.
     * @dev user => stablecoin => amount
     */
    mapping(address => mapping(address => uint256)) public debt;

    /**
     * @notice Last timestamp when interest was updated for a user.
     */
    mapping(address => uint256) public lastInterestUpdate;

    /**
     * @notice Accepted collateral tokens.
     * @dev token => accepted
     */
    mapping(address => bool) public acceptedCollateral;

    /**
     * @notice Price oracle address used for valuations.
     */
    address public priceOracle;

    /**
     * @notice Owner address with administrative privileges.
     */
    address public owner;

    // Constants
    /// @notice Loan-to-Value ratio in basis points (e.g., 5000 = 50%)
    uint256 public constant LTV_RATIO = 5000;
    /// @notice Liquidation threshold (health factor) in basis points (e.g., 15000 = 150%)
    uint256 public constant LIQUIDATION_THRESHOLD = 15000;
    /// @notice Liquidation penalty in basis points (e.g., 1000 = 10%)
    uint256 public constant LIQUIDATION_PENALTY = 1000;
    /// @notice Annual interest rate in basis points (e.g., 800 = 8% APR)
    uint256 public constant INTEREST_RATE = 800;
    /// @notice Basis points denominator
    uint256 public constant BASIS_POINTS = 10000;

    // Errors
    error VaultManager__OnlyOwner();
    error VaultManager__ZeroAmount();
    error VaultManager__TokenNotAccepted();
    error VaultManager__InsufficientCollateral();
    error VaultManager__ExceedsBorrowLimit();
    error VaultManager__NoDebt();
    error VaultManager__InsufficientDebt();
    error VaultManager__HealthFactorTooLow();
    error VaultManager__PositionHealthy();
    error VaultManager__TransferFailed();
    error VaultManager__ZeroAddress();

    /**
     * @notice Initializes the contract with a price oracle.
     * @param _priceOracle Address of the price oracle contract.
     * @dev Reverts if the provided oracle address is zero.
     */
    constructor(address _priceOracle) {
        if (_priceOracle == address(0)) revert VaultManager__ZeroAddress();
        priceOracle = _priceOracle;
        owner = msg.sender;
    }

    /**
     * @notice Restricts function execution to the contract owner.
     */
    modifier onlyOwner() {
        if (msg.sender != owner) revert VaultManager__OnlyOwner();
        _;
    }

    /**
     * @notice Adds a token to the accepted collateral set.
     * @param token ERC20 token address to mark as accepted collateral.
     * @dev Callable only by the owner.
     */
    function addCollateral(address token) external onlyOwner {
        acceptedCollateral[token] = true;
    }
    event CollateralDeposited(address indexed user, address indexed token, uint256 amount);
    event Borrowed(address indexed user, address indexed collateralToken, address indexed borrowToken, uint256 amount);
    event Repaid(address indexed user, address indexed token, uint256 amount);
    event CollateralWithdrawn(address indexed user, address indexed token, uint256 amount);
    event Liquidated(
        address indexed user,
        address indexed collateralToken,
        address indexed debtToken,
        uint256 collateralSeized,
        uint256 liquidatorReward
    );

    /**
     * @notice Deposit accepted collateral into the vault.
     * @param token ERC20 token address to deposit as collateral.
     * @param amount Amount of tokens to deposit.
     * @dev Uses SafeERC20.safeTransferFrom. Caller must approve this contract to transfer the specified amount beforehand.
     */
    function deposit(address token, uint256 amount) external nonReentrant {
        if (amount == 0) revert VaultManager__ZeroAmount();
        if (!acceptedCollateral[token]) revert VaultManager__TokenNotAccepted();

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        collateral[msg.sender][token] += amount;

        emit CollateralDeposited(msg.sender, token, amount);
    }

    /**
     * @notice Withdraw collateral from the vault.
     * @param token ERC20 token address to withdraw.
     * @param amount Amount to withdraw.
     * @dev Validates inputs, updates balance, checks health factor if debt exists, and transfers tokens.
     */
    function withdraw(address token, uint256 amount) external nonReentrant {
        if (amount == 0) revert VaultManager__ZeroAmount();
        if (collateral[msg.sender][token] < amount) revert VaultManager__InsufficientCollateral();

        collateral[msg.sender][token] -= amount;

        uint256 currentDebt = debt[msg.sender][token];
        if (currentDebt > 0) {
            uint256 collateralValue = getCollateralValue(msg.sender, token);
            uint256 allowedDebt = (collateralValue * LIQUIDATION_THRESHOLD) / BASIS_POINTS;
            if (currentDebt > allowedDebt) revert VaultManager__HealthFactorTooLow();
        }

        IERC20(token).safeTransfer(msg.sender, amount);

        emit CollateralWithdrawn(msg.sender, token, amount);
    }

    /**
     * @notice Get the USD value of a user's collateral for a specific token using the price oracle.
     * @param user The address of the user whose collateral value is being queried.
     * @param token The ERC20 token address of the collateral.
     * @dev Price is fetched from the oracle and assumed to be 1e18 scaled. Returns amount * price / 1e18.
     */
    function getCollateralValue(address user, address token) public view returns (uint256) {
        uint256 amount = collateral[user][token];
        if (amount == 0) return 0;
        uint256 price = IPriceOracle(priceOracle).getPrice(token);
        return (amount * price) / 1e18;
    }

    /**
     * @notice Compute user's health factor with respect to a specific collateral and debt token.
     * @dev Returns basis points (e.g., 15000 = 150%). No debt => max uint256.
     */
    function getHealthFactor(address user, address collateralToken, address debtToken) public view returns (uint256) {
        uint256 collateralValue = getCollateralValue(user, collateralToken);
        uint256 debtValue = debt[user][debtToken];
        if (debtValue == 0) return type(uint256).max;
        return (collateralValue * BASIS_POINTS) / debtValue;
    }

    /**
     * @notice Accrues simple interest on a user's outstanding debt at a fixed APR.
     * @dev Uses 8% APR (basis points). Skips when no prior borrow, no debt, or less than 1 day elapsed.
     * @param user Address of the user.
     * @param token Borrowed asset token.
     */
    function updateInterest(address user, address token) internal {
        uint256 lastUpdate = lastInterestUpdate[user];
        if (lastUpdate == 0) return;

        uint256 principal = debt[user][token];
        if (principal == 0) return;

        uint256 timeElapsed = block.timestamp - lastUpdate;
        if (timeElapsed < 1 days) return;

        uint256 annualInterest = (principal * INTEREST_RATE) / BASIS_POINTS;
        uint256 interest = (annualInterest * timeElapsed) / 365 days;

        debt[user][token] = principal + interest;
        lastInterestUpdate[user] = block.timestamp;
    }

    /**
     * @notice Borrow against deposited collateral up to the permitted LTV.
     * @param collateralToken The ERC20 token used as collateral.
     * @param borrowToken The ERC20 token to borrow.
     * @param amount The amount of borrowToken to borrow.
     * @dev Enforces LTV-based borrow limits, updates debt and last interest timestamp, and transfers tokens using SafeERC20.
     */
    function borrow(address collateralToken, address borrowToken, uint256 amount) external nonReentrant {
        if (amount == 0) revert VaultManager__ZeroAmount();
        if (!acceptedCollateral[collateralToken]) revert VaultManager__TokenNotAccepted();

        updateInterest(msg.sender, borrowToken);

        uint256 collateralValue = getCollateralValue(msg.sender, collateralToken);
        uint256 maxBorrow = (collateralValue * LTV_RATIO) / BASIS_POINTS;
        uint256 currentDebt = debt[msg.sender][borrowToken];

        if (currentDebt + amount > maxBorrow) revert VaultManager__ExceedsBorrowLimit();

        debt[msg.sender][borrowToken] = currentDebt + amount;
        lastInterestUpdate[msg.sender] = block.timestamp;

        IERC20(borrowToken).safeTransfer(msg.sender, amount);

        emit Borrowed(msg.sender, collateralToken, borrowToken, amount);
    }

    /**
     * @notice Repay outstanding debt for a borrowed token.
     * @param token Borrowed asset token.
     * @param amount Amount to repay.
     * @dev Accrues interest, caps to current debt, transfers funds, updates debt, and resets interest on full repayment.
     */
    function repay(address token, uint256 amount) external nonReentrant {
        updateInterest(msg.sender, token);

        uint256 currentDebt = debt[msg.sender][token];
        if (currentDebt == 0) revert VaultManager__NoDebt();
        if (amount == 0) revert VaultManager__ZeroAmount();

        uint256 repayAmount = amount > currentDebt ? currentDebt : amount;

        IERC20(token).safeTransferFrom(msg.sender, address(this), repayAmount);

        debt[msg.sender][token] = currentDebt - repayAmount;

        if (debt[msg.sender][token] == 0) {
            lastInterestUpdate[msg.sender] = 0;
        }

        emit Repaid(msg.sender, token, repayAmount);
    }

    /**
     * @notice Liquidate an undercollateralized position.
     * @param user The address of the user to liquidate.
     * @param collateralToken The ERC20 collateral token to seize.
     * @param debtToken The ERC20 debt token being repaid via liquidation.
     * @dev Accrues interest, checks health factor, seizes collateral equal to debt plus penalty using oracle prices, clears debt, transfers 5% reward to liquidator, and emits Liquidated event.
     */
    function liquidate(address user, address collateralToken, address debtToken) external nonReentrant {
        updateInterest(user, debtToken);

        uint256 healthFactor = getHealthFactor(user, collateralToken, debtToken);
        if (healthFactor >= LIQUIDATION_THRESHOLD) revert VaultManager__PositionHealthy();

        uint256 debtAmount = debt[user][debtToken];

        uint256 penaltyAmount = (debtAmount * LIQUIDATION_PENALTY) / BASIS_POINTS;
        uint256 totalToSeize = debtAmount + penaltyAmount;

        uint256 collateralPrice = IPriceOracle(priceOracle).getPrice(collateralToken);
        uint256 debtPrice = IPriceOracle(priceOracle).getPrice(debtToken);
        uint256 collateralToSeize = (totalToSeize * debtPrice) / collateralPrice;

        debt[user][debtToken] = 0;
        lastInterestUpdate[user] = 0;

        collateral[user][collateralToken] -= collateralToSeize;

        uint256 liquidatorReward = (collateralToSeize * 500) / BASIS_POINTS;

        IERC20(collateralToken).safeTransfer(msg.sender, liquidatorReward);

        emit Liquidated(user, collateralToken, debtToken, collateralToSeize, liquidatorReward);
    }
}