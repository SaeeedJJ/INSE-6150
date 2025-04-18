# 🔁 Regular Reentrancy Attack – InsecureEtherVault

This example demonstrates a classic fallback-based **reentrancy attack** in Ethereum smart contracts, where a malicious contract repeatedly reenters the vulnerable function before the state is updated, allowing it to drain all ETH from the vault.

---

## 🧠 1. Concept

Reentrancy occurs when a contract:
1. Sends Ether using `call{value:}` to an external address
2. That address is a contract with a `receive()` or `fallback()` function
3. The fallback re-calls the vulnerable function
4. The original state (like balances) hasn’t been updated yet

This recursive call can continue **until all funds are drained**.

---

## 📦 2. Contract Architecture

### ✅ Vulnerable Contract: `InsecureEtherVault.sol`
- Allows users to deposit and withdraw Ether
- Uses low-level `call{value:}` to send ETH
- Updates balance **after** sending Ether → unsafe!

### 🚨 Attacker Contract: `Attack.sol`
- Calls `vault.deposit()` with 1 ETH
- Calls `vault.withdrawAll()` to start the loop
- `receive()` is triggered and recursively re-calls `withdrawAll()` before balance is zeroed

---

## 🧪 3. Attack Walkthrough

### 🛠 Step-by-step:
1. User1 deposits 3 ETH, User2 deposits 2 ETH → Vault holds 5 ETH
2. Attacker deposits 1 ETH
3. Attacker calls `withdrawAll()`
4. ETH is sent → triggers `receive()` in `Attack.sol`
5. `receive()` calls `withdrawAll()` again
6. Repeats 5 times → All 6 ETH (5 from users + 1 from attacker) are drained

📸 **Attack Trace Screenshot**
```
insecureEtherVault.withdrawAll() invoked  (initial)
insecureEtherVault.withdrawAll() invoked  (reentrant x5)
```
✅ Vault balance after attack: 0 ETH
💰 Attacker balance after attack: 6 ETH

---

## 🧰 4. Vulnerability Detection

Using **Slither**, we detect the following:

- `call{value:}` inside `withdrawAll()` (line 19)
- Balance update occurs **after** the call
- Balance state is accessible by reentrant call

📸 Screenshot:
> See `Slither analyze.JPG`

---

## 🛡 5. Fix and Prevention

### ✅ Checks-Effects-Interactions
```solidity
function withdrawAll() external {
    uint256 balance = userBalances[msg.sender];
    require(balance > 0);
    userBalances[msg.sender] = 0; // ✅ state update first
    (bool sent, ) = msg.sender.call{value: balance}("");
    require(sent);
}
```

### ✅ ReentrancyGuard
Use OpenZeppelin’s modifier to block reentry:
```solidity
function withdrawAll() external nonReentrant {
    ...
}
```

---

## ▶️ 6. How to Run the Demo

### 🧪 Prerequisites:
- Node.js & npm
- Hardhat

```bash
git clone https://github.com/your-repo/reentrancy-demo
cd regular-reentrancy
npm install
npx hardhat compile
npx hardhat run scripts/exec-attack.js
```

---

## 📄 7. File Structure

| File                     | Description                        |
|--------------------------|------------------------------------|
| `InsecureEtherVault.sol`| Vulnerable vault contract          |
| `Attack.sol`            | Attacker with reentrant fallback   |
| `FixedVault.sol`        | Safe version using CEI / Guard     |
| `scripts/exec-attack.js`| Hardhat deployment & attack runner |

---

## 📷 8. Screenshots

- `Vulberable Structure.JPG` – Shows how fallback reentry works
- `Attack Resault.JPG` – Shows vault drained and attacker balance
- `Slither analyze.JPG` – Confirms vulnerability detection

---

## ✅ Summary

This example shows the critical risk of writing to state **after** sending ETH using low-level calls. Reentrancy must be guarded using **Checks-Effects-Interactions** or external libraries like OpenZeppelin’s `ReentrancyGuard`.

A small mistake in function order can allow attackers to drain all funds in seconds.
