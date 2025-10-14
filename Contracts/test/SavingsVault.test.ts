import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { GMFOTToken, SavingsVault, MockERC20 } from "../typechain-types";

describe("SavingsVault", function () {
  let gftToken: GMFOTToken;
  let savingsVault: SavingsVault;
  let usdt: MockERC20;
  let usdc: MockERC20;
  let owner: SignerWithAddress;
  let treasury: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const QUARTERLY = 0;
  const SEMI_ANNUAL = 1;
  const ANNUAL = 2;

  const QUARTERLY_PERIOD = 90 * 24 * 60 * 60; // 90 days
  const ANNUAL_PERIOD = 365 * 24 * 60 * 60; // 365 days

  beforeEach(async function () {
    [owner, treasury, user1, user2] = await ethers.getSigners();

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

    // Deploy mock stablecoins
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdt = await MockERC20.deploy("Tether USD", "USDT");
    usdc = await MockERC20.deploy("USD Coin", "USDC");
    await usdt.waitForDeployment();
    await usdc.waitForDeployment();

    // Setup
    await gftToken.authorizeMinter(await savingsVault.getAddress());
    await savingsVault.addStablecoin(await usdt.getAddress());
    await savingsVault.addStablecoin(await usdc.getAddress());

    // Mint tokens to users
    await usdt.mint(user1.address, ethers.parseEther("10000"));
    await usdt.mint(user2.address, ethers.parseEther("10000"));
    await usdc.mint(user1.address, ethers.parseEther("10000"));

    // Mint USDT to treasury for interest payments
    await usdt.mint(treasury.address, ethers.parseEther("100000"));
    await usdt.connect(treasury).approve(await savingsVault.getAddress(), ethers.parseEther("100000"));
  });

  describe("Deployment", function () {
    it("Should set the correct initial values", async function () {
      expect(await savingsVault.owner()).to.equal(owner.address);
      expect(await savingsVault.protocolTreasury()).to.equal(treasury.address);
      expect(await savingsVault.gftToken()).to.equal(await gftToken.getAddress());
    });

    it("Should have correct GFT token parameters", async function () {
      expect(await gftToken.name()).to.equal("GMFOT Token");
      expect(await gftToken.symbol()).to.equal("GFT");
      expect(await gftToken.totalSupply()).to.equal(ethers.parseEther("1000000"));
    });
  });

  describe("Stablecoin Management", function () {
    it("Should add and remove stablecoins", async function () {
      const newToken = await usdc.getAddress();
      
      expect(await savingsVault.supportedStablecoins(newToken)).to.be.true;
      
      await savingsVault.removeStablecoin(newToken);
      expect(await savingsVault.supportedStablecoins(newToken)).to.be.false;
    });

    it("Should reject deposits with unsupported stablecoins", async function () {
      const unsupportedToken = await ethers.deployContract("MockERC20", ["Fake Token", "FAKE"]);
      await unsupportedToken.mint(user1.address, ethers.parseEther("1000"));
      await unsupportedToken.connect(user1).approve(await savingsVault.getAddress(), ethers.parseEther("1000"));

      await expect(
        savingsVault.connect(user1).deposit(await unsupportedToken.getAddress(), ethers.parseEther("1000"), QUARTERLY)
      ).to.be.revertedWithCustomError(savingsVault, "SavingsVault__UnsupportedStablecoin");
    });
  });

  describe("Quarterly Savings (3 months)", function () {
    it("Should allow quarterly deposits", async function () {
      const depositAmount = ethers.parseEther("1000");
      await usdt.connect(user1).approve(await savingsVault.getAddress(), depositAmount);

      await expect(
        savingsVault.connect(user1).deposit(await usdt.getAddress(), depositAmount, QUARTERLY)
      ).to.emit(savingsVault, "Deposited");

      const positions = await savingsVault.getUserPositions(user1.address);
      expect(positions.length).to.equal(1);
      expect(positions[0].principal).to.equal(depositAmount);
      expect(positions[0].lockPeriod).to.equal(QUARTERLY);
      expect(positions[0].gftReward).to.equal(ethers.parseEther("1000")); // 1000 GFT
      expect(positions[0].stablecoinInterest).to.equal(0); // No stablecoin interest
    });

    it("Should allow withdrawal after quarterly lock period", async function () {
      const depositAmount = ethers.parseEther("1000");
      await usdt.connect(user1).approve(await savingsVault.getAddress(), depositAmount);
      await savingsVault.connect(user1).deposit(await usdt.getAddress(), depositAmount, QUARTERLY);

      // Fast forward 90 days
      await ethers.provider.send("evm_increaseTime", [QUARTERLY_PERIOD]);
      await ethers.provider.send("evm_mine", []);

      const initialGftBalance = await gftToken.balanceOf(user1.address);
      const initialUsdtBalance = await usdt.balanceOf(user1.address);

      await expect(savingsVault.connect(user1).withdraw(0))
        .to.emit(savingsVault, "Withdrawn");

      // Check balances
      expect(await usdt.balanceOf(user1.address)).to.equal(initialUsdtBalance + depositAmount);
      expect(await gftToken.balanceOf(user1.address)).to.equal(initialGftBalance + ethers.parseEther("1000"));
    });
  });

  describe("Annual Savings (12 months)", function () {
    it("Should allow annual deposits with stablecoin interest", async function () {
      const depositAmount = ethers.parseEther("1000");
      await usdt.connect(user1).approve(await savingsVault.getAddress(), depositAmount);

      await savingsVault.connect(user1).deposit(await usdt.getAddress(), depositAmount, ANNUAL);

      const positions = await savingsVault.getUserPositions(user1.address);
      expect(positions[0].principal).to.equal(depositAmount);
      expect(positions[0].lockPeriod).to.equal(ANNUAL);
      expect(positions[0].gftReward).to.equal(ethers.parseEther("1000")); // 1000 GFT
      expect(positions[0].stablecoinInterest).to.equal(ethers.parseEther("20")); // 2% of 1000 = 20
    });

    it("Should pay both stablecoin interest and GFT rewards for annual savings", async function () {
      const depositAmount = ethers.parseEther("1000");
      await usdt.connect(user1).approve(await savingsVault.getAddress(), depositAmount);
      await savingsVault.connect(user1).deposit(await usdt.getAddress(), depositAmount, ANNUAL);

      // Fast forward 365 days
      await ethers.provider.send("evm_increaseTime", [ANNUAL_PERIOD]);
      await ethers.provider.send("evm_mine", []);

      const initialGftBalance = await gftToken.balanceOf(user1.address);
      const initialUsdtBalance = await usdt.balanceOf(user1.address);

      await savingsVault.connect(user1).withdraw(0);

      // Check balances - should receive principal + 2% interest + 1000 GFT
      expect(await usdt.balanceOf(user1.address)).to.equal(
        initialUsdtBalance + depositAmount + ethers.parseEther("20") // 2% interest
      );
      expect(await gftToken.balanceOf(user1.address)).to.equal(
        initialGftBalance + ethers.parseEther("1000") // 1000 GFT reward
      );
    });
  });

  describe("Early Withdrawal", function () {
    it("Should apply penalty for early withdrawal", async function () {
      const depositAmount = ethers.parseEther("1000");
      await usdt.connect(user1).approve(await savingsVault.getAddress(), depositAmount);
      await savingsVault.connect(user1).deposit(await usdt.getAddress(), depositAmount, QUARTERLY);

      // Try to withdraw immediately (early withdrawal)
      const initialUsdtBalance = await usdt.balanceOf(user1.address);
      const initialGftBalance = await gftToken.balanceOf(user1.address);

      await expect(savingsVault.connect(user1).withdraw(0))
        .to.emit(savingsVault, "Withdrawn");

      // Should receive principal minus 10% penalty, no GFT rewards
      const expectedAmount = depositAmount - (depositAmount * 1000n / 10000n); // 10% penalty
      expect(await usdt.balanceOf(user1.address)).to.equal(initialUsdtBalance + expectedAmount);
      expect(await gftToken.balanceOf(user1.address)).to.equal(initialGftBalance); // No GFT rewards
    });
  });

  describe("GFT Token Rewards Management", function () {
    it("Should allow owner to update GFT rewards", async function () {
      await savingsVault.updateGftRewards(
        ethers.parseEther("500"),  // quarterly
        ethers.parseEther("750"),  // semi-annual
        ethers.parseEther("1500")  // annual
      );

      expect(await savingsVault.quarterlyGftReward()).to.equal(ethers.parseEther("500"));
      expect(await savingsVault.semiAnnualGftReward()).to.equal(ethers.parseEther("750"));
      expect(await savingsVault.annualGftReward()).to.equal(ethers.parseEther("1500"));
    });

    it("Should use updated rewards for new deposits", async function () {
      // Update rewards
      await savingsVault.updateGftRewards(
        ethers.parseEther("500"),  // quarterly
        ethers.parseEther("750"),  // semi-annual
        ethers.parseEther("1500")  // annual
      );

      const depositAmount = ethers.parseEther("1000");
      await usdt.connect(user1).approve(await savingsVault.getAddress(), depositAmount);
      await savingsVault.connect(user1).deposit(await usdt.getAddress(), depositAmount, QUARTERLY);

      const positions = await savingsVault.getUserPositions(user1.address);
      expect(positions[0].gftReward).to.equal(ethers.parseEther("500")); // Updated reward
    });
  });

  describe("Protocol Statistics", function () {
    it("Should track total users and positions", async function () {
      const depositAmount = ethers.parseEther("1000");
      
      // User1 makes a deposit
      await usdt.connect(user1).approve(await savingsVault.getAddress(), depositAmount);
      await savingsVault.connect(user1).deposit(await usdt.getAddress(), depositAmount, QUARTERLY);

      // User2 makes a deposit
      await usdt.connect(user2).approve(await savingsVault.getAddress(), depositAmount);
      await savingsVault.connect(user2).deposit(await usdt.getAddress(), depositAmount, ANNUAL);

      expect(await savingsVault.totalUsers()).to.equal(2);
      expect(await savingsVault.totalPositions()).to.equal(2);
      expect(await savingsVault.getTotalValueLocked(await usdt.getAddress())).to.equal(depositAmount * 2n);
    });
  });

  describe("Security Features", function () {
    it("Should pause and unpause correctly", async function () {
      await savingsVault.pause();
      
      const depositAmount = ethers.parseEther("1000");
      await usdt.connect(user1).approve(await savingsVault.getAddress(), depositAmount);
      
      await expect(
        savingsVault.connect(user1).deposit(await usdt.getAddress(), depositAmount, QUARTERLY)
      ).to.be.revertedWithCustomError(savingsVault, "EnforcedPause");

      await savingsVault.unpause();
      
      await expect(
        savingsVault.connect(user1).deposit(await usdt.getAddress(), depositAmount, QUARTERLY)
      ).to.not.be.reverted;
    });

    it("Should reject deposits below minimum amount", async function () {
      const smallAmount = ethers.parseEther("50"); // Below 100 minimum
      await usdt.connect(user1).approve(await savingsVault.getAddress(), smallAmount);

      await expect(
        savingsVault.connect(user1).deposit(await usdt.getAddress(), smallAmount, QUARTERLY)
      ).to.be.revertedWithCustomError(savingsVault, "SavingsVault__InsufficientAmount");
    });
  });
});
