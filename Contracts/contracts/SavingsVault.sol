// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./tokens/GMFOTToken.sol";

contract SavingsVault is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    GMFOTToken public immutable gftToken;

    address public protocolTreasury;

    uint256 public constant BASIS_POINTS = 10000;

    uint256 public constant ANNUAL_INTEREST_RATE = 200;

    uint256 public constant QUARTERLY_PERIOD = 90 days;
    uint256 public constant SEMI_ANNUAL_PERIOD = 180 days;
    uint256 public constant ANNUAL_PERIOD = 365 days;

    uint256 public quarterlyGftReward = 1000 * 10**18; // 1000 GFT
    uint256 public semiAnnualGftReward = 1000 * 10**18; // 1000 GFT
    uint256 public annualGftReward = 1000 * 10**18; // 1000 GFT

    uint256 public earlyWithdrawalPenalty = 1000;

    uint256 public minimumDeposit = 100 * 10**18;

    mapping(address => bool) public supportedStablecoins;

    mapping(address => SavingsPosition[]) public userPositions;

    mapping(address => uint256) public totalSavings;

    uint256 public totalUsers;

    uint256 public totalPositions;

    enum LockPeriod {
        QUARTERLY,    // 3 months
        SEMI_ANNUAL,  // 6 months
        ANNUAL        // 12 months
    }

    struct SavingsPosition {
        uint256 positionId;
        address stablecoin;
        uint256 principal;
        uint256 depositTime;
        uint256 lockEndTime;
        LockPeriod lockPeriod;
        bool withdrawn;
        uint256 stablecoinInterest;
        uint256 gftReward;
    }

    // Events
    event Deposited(
        address indexed user,
        uint256 indexed positionId,
        address indexed stablecoin,
        uint256 amount,
        LockPeriod lockPeriod,
        uint256 lockEndTime
    );
    
    event Withdrawn(
        address indexed user,
        uint256 indexed positionId,
        uint256 principal,
        uint256 stablecoinInterest,
        uint256 gftReward,
        bool isEarlyWithdrawal
    );
    
    event StablecoinAdded(address indexed stablecoin);
    event StablecoinRemoved(address indexed stablecoin);
    event GftRewardsUpdated(uint256 quarterly, uint256 semiAnnual, uint256 annual);
    event EarlyWithdrawalPenaltyUpdated(uint256 newPenalty);

    // Errors
    error SavingsVault__UnsupportedStablecoin();
    error SavingsVault__InsufficientAmount();
    error SavingsVault__InvalidLockPeriod();
    error SavingsVault__PositionNotFound();
    error SavingsVault__PositionAlreadyWithdrawn();
    error SavingsVault__LockPeriodNotExpired();
    error SavingsVault__InsufficientTreasuryBalance();
    error SavingsVault__ZeroAddress();
    error SavingsVault__InvalidPenalty();

    constructor(address _gftToken, address _protocolTreasury) Ownable(msg.sender) {
        if (_gftToken == address(0) || _protocolTreasury == address(0)) {
            revert SavingsVault__ZeroAddress();
        }
        gftToken = GMFOTToken(_gftToken);
        protocolTreasury = _protocolTreasury;
    }

    function addStablecoin(address stablecoin) external onlyOwner {
        if (stablecoin == address(0)) revert SavingsVault__ZeroAddress();
        supportedStablecoins[stablecoin] = true;
        emit StablecoinAdded(stablecoin);
    }

    function removeStablecoin(address stablecoin) external onlyOwner {
        supportedStablecoins[stablecoin] = false;
        emit StablecoinRemoved(stablecoin);
    }


    function updateGftRewards(
        uint256 _quarterly,
        uint256 _semiAnnual,
        uint256 _annual
    ) external onlyOwner {
        quarterlyGftReward = _quarterly;
        semiAnnualGftReward = _semiAnnual;
        annualGftReward = _annual;
        emit GftRewardsUpdated(_quarterly, _semiAnnual, _annual);
    }

    function updateEarlyWithdrawalPenalty(uint256 _penalty) external onlyOwner {
        if (_penalty > 5000) revert SavingsVault__InvalidPenalty(); // Max 50%
        earlyWithdrawalPenalty = _penalty;
        emit EarlyWithdrawalPenaltyUpdated(_penalty);
    }

    function setProtocolTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert SavingsVault__ZeroAddress();
        protocolTreasury = _treasury;
    }

    function deposit(
        address stablecoin,
        uint256 amount,
        LockPeriod lockPeriod
    ) external nonReentrant whenNotPaused {
        if (!supportedStablecoins[stablecoin]) revert SavingsVault__UnsupportedStablecoin();
        if (amount < minimumDeposit) revert SavingsVault__InsufficientAmount();

        // Calculate lock end time
        uint256 lockDuration = _getLockDuration(lockPeriod);
        uint256 lockEndTime = block.timestamp + lockDuration;

        // Calculate rewards
        (uint256 stablecoinInterest, uint256 gftReward) = _calculateRewards(amount, lockPeriod);

        // Create position
        uint256 positionId = totalPositions++;
        SavingsPosition memory position = SavingsPosition({
            positionId: positionId,
            stablecoin: stablecoin,
            principal: amount,
            depositTime: block.timestamp,
            lockEndTime: lockEndTime,
            lockPeriod: lockPeriod,
            withdrawn: false,
            stablecoinInterest: stablecoinInterest,
            gftReward: gftReward
        });

        // Track if this is user's first position
        if (userPositions[msg.sender].length == 0) {
            totalUsers++;
        }

        userPositions[msg.sender].push(position);
        totalSavings[stablecoin] += amount;

        // Transfer stablecoin from user
        IERC20(stablecoin).safeTransferFrom(msg.sender, address(this), amount);

        emit Deposited(msg.sender, positionId, stablecoin, amount, lockPeriod, lockEndTime);
    }

    function withdraw(uint256 positionIndex) external nonReentrant whenNotPaused {
        if (positionIndex >= userPositions[msg.sender].length) revert SavingsVault__PositionNotFound();

        SavingsPosition storage position = userPositions[msg.sender][positionIndex];
        if (position.withdrawn) revert SavingsVault__PositionAlreadyWithdrawn();

        bool isEarlyWithdrawal = block.timestamp < position.lockEndTime;
        uint256 principalToReturn = position.principal;
        uint256 stablecoinInterest = 0;
        uint256 gftReward = 0;

        if (isEarlyWithdrawal) {
            // Apply early withdrawal penalty
            uint256 penalty = (principalToReturn * earlyWithdrawalPenalty) / BASIS_POINTS;
            principalToReturn -= penalty;
            // No interest or GFT rewards for early withdrawal
        } else {
            // Full withdrawal with rewards
            stablecoinInterest = position.stablecoinInterest;
            gftReward = position.gftReward;
        }

        // Mark position as withdrawn
        position.withdrawn = true;
        totalSavings[position.stablecoin] -= position.principal;

        // Transfer principal back to user
        IERC20(position.stablecoin).safeTransfer(msg.sender, principalToReturn);

        // Transfer stablecoin interest if applicable (from treasury)
        if (stablecoinInterest > 0) {
            if (IERC20(position.stablecoin).balanceOf(protocolTreasury) < stablecoinInterest) {
                revert SavingsVault__InsufficientTreasuryBalance();
            }
            IERC20(position.stablecoin).safeTransferFrom(protocolTreasury, msg.sender, stablecoinInterest);
        }

        // Mint GFT rewards if applicable
        if (gftReward > 0) {
            gftToken.mint(msg.sender, gftReward);
        }

        emit Withdrawn(
            msg.sender,
            position.positionId,
            principalToReturn,
            stablecoinInterest,
            gftReward,
            isEarlyWithdrawal
        );
    }

    function emergencyWithdraw(address user, uint256 positionIndex) external onlyOwner {
        if (positionIndex >= userPositions[user].length) revert SavingsVault__PositionNotFound();

        SavingsPosition storage position = userPositions[user][positionIndex];
        if (position.withdrawn) revert SavingsVault__PositionAlreadyWithdrawn();

        // Mark position as withdrawn
        position.withdrawn = true;
        totalSavings[position.stablecoin] -= position.principal;

        // Return full principal (no penalty in emergency)
        IERC20(position.stablecoin).safeTransfer(user, position.principal);

        emit Withdrawn(user, position.positionId, position.principal, 0, 0, true);
    }


    function getUserPositions(address user) external view returns (SavingsPosition[] memory positions) {
        return userPositions[user];
    }

    function getUserActivePositionsCount(address user) external view returns (uint256 count) {
        SavingsPosition[] memory positions = userPositions[user];
        for (uint256 i = 0; i < positions.length; i++) {
            if (!positions[i].withdrawn) {
                count++;
            }
        }
    }

    function getTotalValueLocked(address stablecoin) external view returns (uint256 tvl) {
        return totalSavings[stablecoin];
    }

    function getProtocolStats() external view returns (
        uint256 users,
        uint256 positions,
        uint256 activePositions
    ) {
        // Count active positions across all users
        uint256 active = 0;
        // Note: This is a simplified implementation
        // In production, you'd want to track this more efficiently

        return (totalUsers, totalPositions, active);
    }


    function _calculateRewards(uint256 amount, LockPeriod lockPeriod)
        internal
        view
        returns (uint256 stablecoinInterest, uint256 gftReward)
    {
        if (lockPeriod == LockPeriod.QUARTERLY) {
            stablecoinInterest = 0; // No stablecoin interest for quarterly
            gftReward = quarterlyGftReward;
        } else if (lockPeriod == LockPeriod.SEMI_ANNUAL) {
            stablecoinInterest = 0; // No stablecoin interest for semi-annual
            gftReward = semiAnnualGftReward;
        } else if (lockPeriod == LockPeriod.ANNUAL) {
            // 2% annual interest
            stablecoinInterest = (amount * ANNUAL_INTEREST_RATE) / BASIS_POINTS;
            gftReward = annualGftReward;
        }
    }

    function _getLockDuration(LockPeriod lockPeriod) internal pure returns (uint256 duration) {
        if (lockPeriod == LockPeriod.QUARTERLY) {
            return QUARTERLY_PERIOD;
        } else if (lockPeriod == LockPeriod.SEMI_ANNUAL) {
            return SEMI_ANNUAL_PERIOD;
        } else if (lockPeriod == LockPeriod.ANNUAL) {
            return ANNUAL_PERIOD;
        } else {
            revert SavingsVault__InvalidLockPeriod();
        }
    }

    function pause() external onlyOwner {
        _pause();
    }

  
    function unpause() external onlyOwner {
        _unpause();
    }
}
