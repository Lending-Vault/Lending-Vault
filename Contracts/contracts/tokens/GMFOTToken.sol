// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";


contract GMFOTToken is ERC20, ERC20Burnable, Ownable, Pausable {

    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;

    mapping(address => bool) public authorizedMinters;

    uint256 public totalMinted;

    uint256 public totalBurned;

    // Events
    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);
    event TokensMinted(address indexed to, uint256 amount, address indexed minter);
    event TokensBurned(address indexed from, uint256 amount);

    // Errors
    error GMFOTToken__NotAuthorizedMinter();
    error GMFOTToken__ExceedsMaxSupply();
    error GMFOTToken__ZeroAmount();
    error GMFOTToken__ZeroAddress();

    
    constructor() ERC20("GMFOT Token", "GFT") Ownable(msg.sender) {
        // Initial mint to deployer for testing/initial distribution
        _mint(msg.sender, 1_000_000 * 10**18); // 1M tokens
        totalMinted = 1_000_000 * 10**18;
    }

  
    function authorizeMinter(address minter) external onlyOwner {
        if (minter == address(0)) revert GMFOTToken__ZeroAddress();
        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }

    
    function revokeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRevoked(minter);
    }

    function mint(address to, uint256 amount) external whenNotPaused {
        if (!authorizedMinters[msg.sender]) revert GMFOTToken__NotAuthorizedMinter();
        if (to == address(0)) revert GMFOTToken__ZeroAddress();
        if (amount == 0) revert GMFOTToken__ZeroAmount();
        if (totalSupply() + amount > MAX_SUPPLY) revert GMFOTToken__ExceedsMaxSupply();

        totalMinted += amount;
        _mint(to, amount);
        emit TokensMinted(to, amount, msg.sender);
    }

    function burn(uint256 amount) public override whenNotPaused {
        if (amount == 0) revert GMFOTToken__ZeroAmount();
        totalBurned += amount;
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) public override whenNotPaused {
        if (amount == 0) revert GMFOTToken__ZeroAmount();
        if (account == address(0)) revert GMFOTToken__ZeroAddress();
        totalBurned += amount;
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function getNetSupply() external view returns (uint256 netSupply) {
        return totalSupply();
    }


    function getTokenStats() external view returns (
        uint256 supply,
        uint256 minted,
        uint256 burned,
        uint256 maxSupply
    ) {
        return (totalSupply(), totalMinted, totalBurned, MAX_SUPPLY);
    }

    function transfer(address to, uint256 amount) public override whenNotPaused returns (bool) {
        return super.transfer(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public override whenNotPaused returns (bool) {
        return super.transferFrom(from, to, amount);
    }

    function approve(address spender, uint256 amount) public override whenNotPaused returns (bool) {
        return super.approve(spender, amount);
    }
}
