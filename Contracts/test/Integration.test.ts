import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  GMFOTToken,
  SavingsVault,
  VaultManager,
  PriceOracle,
  MockERC20,
} from "../typechain-types";

describe("LiquidVault Integration Tests", function () {
  let gftToken: GMFOTToken;
  let savingsVault: SavingsVault;
  let vaultManager: VaultManager;
  let oracle: PriceOracle;
  let weth: MockERC20;
  let usdt: MockERC20;
  let usdc: MockERC20;

  let owner: SignerWithAddress;
  let treasury: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const QUARTERLY = 0;
  const ANNUAL = 2;
  const QUARTERLY_PERIOD = 90 * 24 * 60 * 60; // 90 days
  const ANNUAL_PERIOD = 365 * 24 * 60 * 60; // 365 days

  beforeEach(async function () {
    [owner, treasury, user1, user2] = await ethers.getSigners();

    // Deploy Oracle
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    oracle = await PriceOracle.deploy();
    await oracle.waitForDeployment();

    // Deploy VaultManager
    const VaultManager = await ethers.getContractFactory("VaultManager");
    vaultManager = await VaultManager.deploy(
      await oracle.getAddress(),
      treasury.address
    );
    await vaultManager.waitForDeployment();

    // Deploy GMFOT Token
    const GMFOTToken = await ethers.getContractFactory("GMFOTToken");
    gftToken = await GMFOTToken.deploy();
    await gftToken.waitForDeployment();

    // Deploy Savings Vault
    const SavingsVault = await ethers.getContractFactory("SavingsVault");
    savingsVault = await SavingsVault.deploy(
      await gftToken.getAddress(),
      treasury.address
    );
    await savingsVault.waitForDeployment();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    weth = await MockERC20.deploy("Wrapped ETH", "WETH");
    usdt = await MockERC20.deploy("Tether USD", "USDT");
    usdc = await MockERC20.deploy("USD Coin", "USDC");
    await weth.waitForDeployment();
    await usdt.waitForDeployment();
    await usdc.waitForDeployment();

    // Setup prices
    await oracle.emergencySetPrice(
      await weth.getAddress(),
      ethers.parseEther("2000")
    );
    await oracle.emergencySetPrice(
      await usdt.getAddress(),
      ethers.parseEther("1")
    );
    await oracle.emergencySetPrice(
      await usdc.getAddress(),
      ethers.parseEther("1")
    );

    // Configure VaultManager
    await vaultManager.addCollateral(await weth.getAddress());
    await vaultManager.addBorrowToken(await usdt.getAddress());
    await vaultManager.addBorrowToken(await usdc.getAddress());

    // Configure Savings Vault
    await gftToken.authorizeMinter(await savingsVault.getAddress());
    await savingsVault.addStablecoin(await usdt.getAddress());
    await savingsVault.addStablecoin(await usdc.getAddress());

    // Mint tokens to users
    await weth.mint(user1.address, ethers.parseEther("10"));
    await weth.mint(user2.address, ethers.parseEther("10"));
    await usdt.mint(user1.address, ethers.parseEther("10000"));
    await usdt.mint(user2.address, ethers.parseEther("10000"));
    await usdc.mint(user1.address, ethers.parseEther("10000"));

    // Mint liquidity to vault
    await usdt.mint(
      await vaultManager.getAddress(),
      ethers.parseEther("100000")
    );
    await usdc.mint(
      await vaultManager.getAddress(),
      ethers.parseEther("100000")
    );

    // Mint treasury funds for interest payments
    await usdt.mint(treasury.address, ethers.parseEther("10000"));
    await usdc.mint(treasury.address, ethers.parseEther("10000"));
    await usdt
      .connect(treasury)
      .approve(await savingsVault.getAddress(), ethers.parseEther("10000"));
    await usdc
      .connect(treasury)
      .approve(await savingsVault.getAddress(), ethers.parseEther("10000"));
  });

  describe("Complete User Journey", function () {
    it("Should allow user to use both lending and savings features", async function () {
      // === PHASE 1: LENDING ===
      console.log("Phase 1: User deposits collateral and borrows");

      // User1 deposits 1 WETH as collateral
      await weth
        .connect(user1)
        .approve(await vaultManager.getAddress(), ethers.parseEther("1"));
      await vaultManager
        .connect(user1)
        .deposit(await weth.getAddress(), ethers.parseEther("1"));

      // User1 borrows 1000 USDT (50% LTV of $2000 collateral)
      await vaultManager
        .connect(user1)
        .borrow(
          await weth.getAddress(),
          await usdt.getAddress(),
          ethers.parseEther("1000")
        );

      // Verify lending position
      expect(
        await vaultManager.collateral(user1.address, await weth.getAddress())
      ).to.equal(ethers.parseEther("1"));
      expect(
        await vaultManager.debt(user1.address, await usdt.getAddress())
      ).to.equal(ethers.parseEther("1000"));

      // === PHASE 2: SAVINGS ===
      console.log("Phase 2: User puts borrowed funds into savings");

      // User1 puts 500 USDT into quarterly savings
      await usdt
        .connect(user1)
        .approve(await savingsVault.getAddress(), ethers.parseEther("500"));
      await savingsVault
        .connect(user1)
        .deposit(await usdt.getAddress(), ethers.parseEther("500"), QUARTERLY);

      // User1 puts remaining 500 USDT into annual savings
      await usdt
        .connect(user1)
        .approve(await savingsVault.getAddress(), ethers.parseEther("500"));
      await savingsVault
        .connect(user1)
        .deposit(await usdt.getAddress(), ethers.parseEther("500"), ANNUAL);

      // Verify savings positions
      const positions = await savingsVault.getUserPositions(user1.address);
      expect(positions.length).to.equal(2);
      expect(positions[0].principal).to.equal(ethers.parseEther("500"));
      expect(positions[1].principal).to.equal(ethers.parseEther("500"));

      // === PHASE 3: TIME PROGRESSION ===
      console.log("Phase 3: Fast forward time");

      // Record debt before time progression
      const debtBeforeTime = await vaultManager.debt(
        user1.address,
        await usdt.getAddress()
      );
      console.log(
        "Debt before time progression:",
        ethers.formatEther(debtBeforeTime)
      );

      // Fast forward 90 days (quarterly period)
      await ethers.provider.send("evm_increaseTime", [QUARTERLY_PERIOD]);
      await ethers.provider.send("evm_mine", []);

      // === PHASE 4: QUARTERLY WITHDRAWAL ===
      console.log("Phase 4: Withdraw from quarterly savings");

      const initialGftBalance = await gftToken.balanceOf(user1.address);
      const initialUsdtBalance = await usdt.balanceOf(user1.address);

      // Withdraw from quarterly savings (position 0)
      await savingsVault.connect(user1).withdraw(0);

      // Verify quarterly rewards
      expect(await gftToken.balanceOf(user1.address)).to.equal(
        initialGftBalance + ethers.parseEther("1000")
      ); // 1000 GFT reward
      expect(await usdt.balanceOf(user1.address)).to.equal(
        initialUsdtBalance + ethers.parseEther("500")
      ); // Principal returned

      // === PHASE 5: LENDING REPAYMENT ===
      console.log("Phase 5: Repay part of the loan");

      // Check current debt (may have accrued interest)
      const currentDebt = await vaultManager.debt(
        user1.address,
        await usdt.getAddress()
      );
      console.log(
        "Current debt with interest:",
        ethers.formatEther(currentDebt)
      );

      // User1 repays 500 USDT of the loan
      await usdt
        .connect(user1)
        .approve(await vaultManager.getAddress(), ethers.parseEther("500"));
      await vaultManager
        .connect(user1)
        .repay(await usdt.getAddress(), ethers.parseEther("500"));

      // Verify debt is reduced by 500 (regardless of interest)
      const newDebt = await vaultManager.debt(
        user1.address,
        await usdt.getAddress()
      );
      expect(newDebt).to.equal(currentDebt - ethers.parseEther("500"));

      // === PHASE 6: ANNUAL SAVINGS COMPLETION ===
      console.log("Phase 6: Complete annual savings period");

      // Fast forward remaining time to complete 1 year
      await ethers.provider.send("evm_increaseTime", [
        ANNUAL_PERIOD - QUARTERLY_PERIOD,
      ]);
      await ethers.provider.send("evm_mine", []);

      const preAnnualGftBalance = await gftToken.balanceOf(user1.address);
      const preAnnualUsdtBalance = await usdt.balanceOf(user1.address);

      // Withdraw from annual savings (position 1)
      await savingsVault.connect(user1).withdraw(1);

      // Verify annual rewards (principal + 2% interest + 1000 GFT)
      expect(await gftToken.balanceOf(user1.address)).to.equal(
        preAnnualGftBalance + ethers.parseEther("1000")
      ); // Another 1000 GFT
      expect(await usdt.balanceOf(user1.address)).to.equal(
        preAnnualUsdtBalance +
          ethers.parseEther("500") +
          ethers.parseEther("10")
      ); // Principal + 2% interest

      // === PHASE 7: FINAL LOAN REPAYMENT ===
      console.log("Phase 7: Final loan repayment and collateral withdrawal");

      // Get remaining debt amount
      const remainingDebt = await vaultManager.debt(
        user1.address,
        await usdt.getAddress()
      );
      console.log(
        "Remaining debt to repay:",
        ethers.formatEther(remainingDebt)
      );

      // Repay all remaining debt
      await usdt
        .connect(user1)
        .approve(await vaultManager.getAddress(), remainingDebt);
      await vaultManager
        .connect(user1)
        .repay(await usdt.getAddress(), remainingDebt);

      // Withdraw collateral
      await vaultManager
        .connect(user1)
        .withdraw(await weth.getAddress(), ethers.parseEther("1"));

      // Verify final state
      expect(
        await vaultManager.debt(user1.address, await usdt.getAddress())
      ).to.equal(0);
      expect(
        await vaultManager.collateral(user1.address, await weth.getAddress())
      ).to.equal(0);
      expect(await weth.balanceOf(user1.address)).to.equal(
        ethers.parseEther("10")
      ); // Back to original
    });
  });

  describe("Multi-User Scenarios", function () {
    it("Should handle multiple users using both systems simultaneously", async function () {
      // User1: Lending focus
      await weth
        .connect(user1)
        .approve(await vaultManager.getAddress(), ethers.parseEther("2"));
      await vaultManager
        .connect(user1)
        .deposit(await weth.getAddress(), ethers.parseEther("2"));
      await vaultManager
        .connect(user1)
        .borrow(
          await weth.getAddress(),
          await usdt.getAddress(),
          ethers.parseEther("2000")
        );

      // User2: Savings focus
      await usdt
        .connect(user2)
        .approve(await savingsVault.getAddress(), ethers.parseEther("5000"));
      await savingsVault
        .connect(user2)
        .deposit(await usdt.getAddress(), ethers.parseEther("2500"), QUARTERLY);
      await savingsVault
        .connect(user2)
        .deposit(await usdt.getAddress(), ethers.parseEther("2500"), ANNUAL);

      // Verify protocol statistics
      expect(await savingsVault.totalUsers()).to.equal(1); // Only user2 used savings
      expect(await savingsVault.totalPositions()).to.equal(2);
      expect(
        await savingsVault.getTotalValueLocked(await usdt.getAddress())
      ).to.equal(ethers.parseEther("5000"));

      // Both users should be able to operate independently
      expect(
        await vaultManager.debt(user1.address, await usdt.getAddress())
      ).to.equal(ethers.parseEther("2000"));

      const user2Positions = await savingsVault.getUserPositions(user2.address);
      expect(user2Positions.length).to.equal(2);
    });
  });

  describe("Emergency Scenarios", function () {
    it("Should handle emergency pause of savings while lending continues", async function () {
      // Setup initial positions
      await weth
        .connect(user1)
        .approve(await vaultManager.getAddress(), ethers.parseEther("1"));
      await vaultManager
        .connect(user1)
        .deposit(await weth.getAddress(), ethers.parseEther("1"));

      await usdt
        .connect(user1)
        .approve(await savingsVault.getAddress(), ethers.parseEther("1000"));
      await savingsVault
        .connect(user1)
        .deposit(await usdt.getAddress(), ethers.parseEther("1000"), QUARTERLY);

      // Pause savings vault
      await savingsVault.pause();

      // Savings should be paused
      await expect(
        savingsVault
          .connect(user2)
          .deposit(
            await usdt.getAddress(),
            ethers.parseEther("1000"),
            QUARTERLY
          )
      ).to.be.revertedWithCustomError(savingsVault, "EnforcedPause");

      // But lending should still work
      await expect(
        vaultManager
          .connect(user1)
          .borrow(
            await weth.getAddress(),
            await usdt.getAddress(),
            ethers.parseEther("500")
          )
      ).to.not.be.reverted;

      // Unpause and verify savings works again
      await savingsVault.unpause();
      await usdt
        .connect(user2)
        .approve(await savingsVault.getAddress(), ethers.parseEther("1000"));
      await expect(
        savingsVault
          .connect(user2)
          .deposit(
            await usdt.getAddress(),
            ethers.parseEther("1000"),
            QUARTERLY
          )
      ).to.not.be.reverted;
    });
  });

  describe("GFT Token Economics", function () {
    it("Should properly manage GFT token supply and distribution", async function () {
      const initialSupply = await gftToken.totalSupply();

      // Multiple users create savings positions
      await usdt
        .connect(user1)
        .approve(await savingsVault.getAddress(), ethers.parseEther("1000"));
      await savingsVault
        .connect(user1)
        .deposit(await usdt.getAddress(), ethers.parseEther("1000"), QUARTERLY);

      await usdt
        .connect(user2)
        .approve(await savingsVault.getAddress(), ethers.parseEther("1000"));
      await savingsVault
        .connect(user2)
        .deposit(await usdt.getAddress(), ethers.parseEther("1000"), ANNUAL);

      // Fast forward and withdraw
      await ethers.provider.send("evm_increaseTime", [QUARTERLY_PERIOD]);
      await ethers.provider.send("evm_mine", []);

      await savingsVault.connect(user1).withdraw(0);

      // Check GFT distribution
      expect(await gftToken.balanceOf(user1.address)).to.equal(
        ethers.parseEther("1000")
      );
      expect(await gftToken.totalSupply()).to.equal(
        initialSupply + ethers.parseEther("1000")
      );

      // Complete annual savings
      await ethers.provider.send("evm_increaseTime", [
        ANNUAL_PERIOD - QUARTERLY_PERIOD,
      ]);
      await ethers.provider.send("evm_mine", []);

      await savingsVault.connect(user2).withdraw(0);

      // Check final GFT distribution
      expect(await gftToken.balanceOf(user2.address)).to.equal(
        ethers.parseEther("1000")
      );
      expect(await gftToken.totalSupply()).to.equal(
        initialSupply + ethers.parseEther("2000")
      );
    });
  });
});
