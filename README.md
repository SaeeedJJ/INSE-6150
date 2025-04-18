#  Cross-Contract Reentrancy Attack – InsecureMoonVault

This example demonstrates a **cross-contract reentrancy attack**, where two attacker contracts call each other recursively during the `fallback()` or `receive()` phase, exploiting a vulnerable vault contract that sends Ether before updating internal state.

---

##  1. Concept

Cross-contract reentrancy occurs when an attacker uses **multiple contracts that reenter each other** during an external call.

In this case, `Attack1` and `Attack2` act as partners:
- `Attack1` receives Ether from the vault, then calls `Attack2` to trigger another vault withdrawal
- `Attack2` does the same back to `Attack1`
- This loop continues until the vault is drained

---

## 2. Contract Architecture

###  Vulnerable Contract: `InsecureMoonVault.sol`
- Accepts deposits and allows withdrawals
- Sends Ether using `call{value:}` before updating balances
- Uses a `MoonToken` to mint and burn tokens per user

###  Attacker Contracts:
- `Attack1.sol`: initiates the attack and reenters via `fallback()`
- `Attack2.sol`: reenters back to `Attack1` to continue the loop

A shared token contract (`MoonToken.sol`) tracks fake balances and acts as the medium for mint/burn mechanics.

---

## 3. Attack Walkthrough

### Step-by-step:
1. User1 and User2 deposit 3 and 2 ETH → vault holds 5 ETH
2. `Attack1` deposits 1 ETH
3. `Attack1.attackInit()` calls `withdrawAll()`
4. Vault sends ETH → triggers `Attack1.receive()`
5. `Attack1` calls `MoonToken.transfer()` to `Attack2`
6. `Attack2.receive()` is triggered → calls `withdrawAll()` again
7. This loop continues between both attackers

Execution Output:
```
1st withdrawal by Attack1
2nd withdrawal by Attack2
3rd withdrawal by Attack1
...
 All ETH stolen
```

---

## 4. Vulnerability Detection

The vulnerability is caused by:
- `call{value:}` before state update
- Use of shared token `transfer()` that allows recursive calls
- No reentrancy lock or state freeze between transfers

 This bypasses normal single-contract protection — because the entry points vary.

---

##  5. Fix and Prevention

### ReentrancyGuard
```solidity
function withdrawAll() external nonReentrant {
    ...
}
```

### Lock state before sending funds
```solidity
uint256 balance = balances[msg.sender];
balances[msg.sender] = 0; // ✅ effect first
(bool sent, ) = msg.sender.call{value: balance}("");
require(sent);
```

---

##  6. How to Run the Demo

### 🧪 Prerequisites:
- Node.js & npm
- Hardhat

```bash
git clone https://github.com/your-repo/cross-contract-reentrancy
cd cross-contract
npm install
npx hardhat compile
npx hardhat run scripts/exec-attack.js
```

---

## 7. File Structure

| File                  | Description                           |
|-----------------------|---------------------------------------|
| `InsecureMoonVault.sol` | Vulnerable vault contract             |
| `Attack1.sol`         | First attacker, reenters `Attack2`    |
| `Attack2.sol`         | Second attacker, reenters `Attack1`   |
| `MoonToken.sol`       | Shared token contract used for trigger|
| `scripts/exec-attack.js` | Hardhat deployment & test runner      |

---

##  8. Screenshots

- `Attack Output.png` – Shows alternating withdrawal loop
- `Vulberable Structure.JPG` – (Optional) Add logic diagram

---

##  Summary

Cross-contract reentrancy shows how attackers can **split reentry logic** across contracts to bypass normal protection. Even if each function seems safe alone, their interaction causes an exploit.

Always update state **before external calls**, and protect all public functions using a reentrancy guard.
