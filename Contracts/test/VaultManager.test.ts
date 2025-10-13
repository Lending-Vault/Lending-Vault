import { expect } from 'chai';
import { ethers } from 'hardhat';
import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('VaultManager', function () {
  let vault: any, oracle: any, weth: any, usdt: any;
  let owner: HardhatEthersSigner, user1: HardhatEthersSigner, user2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const Oracle = await ethers.getContractFactory('PriceOracle');
    oracle = await Oracle.deploy();
    if ('waitForDeployment' in oracle && typeof oracle.waitForDeployment === 'function') {
      await oracle.waitForDeployment();
    }

    const Vault = await ethers.getContractFactory('VaultManager');
    vault = await Vault.deploy(await oracle.getAddress());
    if ('waitForDeployment' in vault && typeof vault.waitForDeployment === 'function') {
      await vault.waitForDeployment();
    }

    const Token = await ethers.getContractFactory('MockERC20');
    weth = await Token.deploy('Wrapped ETH', 'WETH');
    if ('waitForDeployment' in weth && typeof weth.waitForDeployment === 'function') {
      await weth.waitForDeployment();
    }
    usdt = await Token.deploy('Tether USD', 'USDT');
    if ('waitForDeployment' in usdt && typeof usdt.waitForDeployment === 'function') {
      await usdt.waitForDeployment();
    }

    const wethAddr = await weth.getAddress();
    const usdtAddr = await usdt.getAddress();
    const vaultAddr = await vault.getAddress();

    await oracle.setPrice(wethAddr, ethers.parseEther('2000')); // $2000
    await oracle.setPrice(usdtAddr, ethers.parseEther('1')); // $1

    await vault.addCollateral(wethAddr);

    await weth.mint(user1.address, ethers.parseEther('10'));
    await usdt.mint(vaultAddr, ethers.parseEther('100000')); // Vault liquidity
  });

  it('Should deposit collateral', async function () {
    const amount = ethers.parseEther('1');
    const wethAddr = await weth.getAddress();
    await weth.connect(user1).approve(await vault.getAddress(), amount);
    const tx = await vault.connect(user1).deposit(wethAddr, amount);
    await expect(tx)
      .to.emit(vault, 'CollateralDeposited')
      .withArgs(user1.address, wethAddr, amount);
    const bal = await vault.collateral(user1.address, wethAddr);
    expect(bal).to.equal(amount);
  });

  it('Should borrow against collateral', async function () {
    const wethAddr = await weth.getAddress();
    const usdtAddr = await usdt.getAddress();
    const vaultAddr = await vault.getAddress();
    const depositAmount = ethers.parseEther('10');
    const borrowAmount = ethers.parseEther('5000');

    await weth.connect(user1).approve(vaultAddr, depositAmount);
    await vault.connect(user1).deposit(wethAddr, depositAmount);

    const preBalance = await usdt.balanceOf(user1.address);
    const tx = await vault.connect(user1).borrow(wethAddr, usdtAddr, borrowAmount);
    await expect(tx)
      .to.emit(vault, 'Borrowed')
      .withArgs(user1.address, wethAddr, usdtAddr, borrowAmount);
    const debtVal = await vault.debt(user1.address, usdtAddr);
    expect(debtVal).to.equal(borrowAmount);
    const postBalance = await usdt.balanceOf(user1.address);
    expect(postBalance - preBalance).to.equal(borrowAmount);
  });

  it('Should reject over-borrowing', async function () {
    const wethAddr = await weth.getAddress();
    const usdtAddr = await usdt.getAddress();
    const vaultAddr = await vault.getAddress();
    const depositAmount = ethers.parseEther('1'); // $2000
    const borrowAmount = ethers.parseEther('1500'); // > 50% LTV

    await weth.connect(user1).approve(vaultAddr, depositAmount);
    await vault.connect(user1).deposit(wethAddr, depositAmount);

    await expect(
      vault.connect(user1).borrow(wethAddr, usdtAddr, borrowAmount)
    ).to.be.revertedWithCustomError(vault, 'VaultManager__ExceedsBorrowLimit');
  });

  it('Should repay debt', async function () {
    const wethAddr = await weth.getAddress();
    const usdtAddr = await usdt.getAddress();
    const vaultAddr = await vault.getAddress();
    const depositAmount = ethers.parseEther('10');
    const borrowAmount = ethers.parseEther('5000');

    await weth.connect(user1).approve(vaultAddr, depositAmount);
    await vault.connect(user1).deposit(wethAddr, depositAmount);

    await vault.connect(user1).borrow(wethAddr, usdtAddr, borrowAmount);

    await usdt.connect(user1).approve(vaultAddr, borrowAmount);
    const tx = await vault.connect(user1).repay(usdtAddr, borrowAmount);
    await expect(tx)
      .to.emit(vault, 'Repaid')
      .withArgs(user1.address, usdtAddr, borrowAmount);

    const debtVal = await vault.debt(user1.address, usdtAddr);
    expect(debtVal).to.equal(0n);
    const lastUpdate = await vault.lastInterestUpdate(user1.address);
    expect(lastUpdate).to.equal(0n);
  });

  it('Should withdraw collateral after repayment', async function () {
    const wethAddr = await weth.getAddress();
    const usdtAddr = await usdt.getAddress();
    const vaultAddr = await vault.getAddress();
    const depositAmount = ethers.parseEther('10');
    const borrowAmount = ethers.parseEther('5000');

    const preDepositBal = await weth.balanceOf(user1.address);
    await weth.connect(user1).approve(vaultAddr, depositAmount);
    await vault.connect(user1).deposit(wethAddr, depositAmount);

    await vault.connect(user1).borrow(wethAddr, usdtAddr, borrowAmount);

    await usdt.connect(user1).approve(vaultAddr, borrowAmount);
    await vault.connect(user1).repay(usdtAddr, borrowAmount);

    const tx = await vault.connect(user1).withdraw(wethAddr, depositAmount);
    await expect(tx)
      .to.emit(vault, 'CollateralWithdrawn')
      .withArgs(user1.address, wethAddr, depositAmount);

    const coll = await vault.collateral(user1.address, wethAddr);
    expect(coll).to.equal(0n);
    const postWithdrawBal = await weth.balanceOf(user1.address);
    expect(postWithdrawBal).to.equal(preDepositBal);
  });
});