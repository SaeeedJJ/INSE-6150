# 🔁 Regular Reentrancy Attack (Fallback-Based)

## ✅ What is it?

This attack happens when a vulnerable contract sends Ether to an external contract **before updating its internal state**. If the receiver is a contract with a `fallback()` or `receive()` function, it can call back into the vulnerable contract **before the balance is updated**.

## 🔍 How It Works

- Victim contract calls `msg.sender.call{value: amount}("")`
- Attacker contract’s `fallback()` is triggered
- `fallback()` calls `withdrawAll()` again
- The balance has not been reset → funds are drained recursively

## ⚠️ Why It’s Dangerous

Attackers can reenter multiple times, withdrawing more ETH than they deposited — until the contract is emptied.

## 🛡️ How to Fix

- ✅ Use **Checks-Effects-Interactions** pattern
- ✅ Apply `ReentrancyGuard` (`nonReentrant`) from OpenZeppelin

## ▶️ How to Run

```bash
git clone <this-repo>
cd regular-reentrancy
npx hardhat compile
npx hardhat run scripts/attack.js
