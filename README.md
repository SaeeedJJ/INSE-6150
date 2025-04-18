# 🔁 Regular Reentrancy Attack (Fallback-Based)

## ✅ What is it?

This attack happens when a contract **sends Ether before updating its internal state**, like balances. If the receiver is a smart contract with a `fallback()` or `receive()` function, it can **reenter** the function and repeat the withdrawal before the balance is set to zero.

> 💣 This was the same bug used in the 2016 DAO Hack.

---

## 🔍 How It Works

Here’s what happens during the exploit:

1. The attacker sends 1 ETH to the vulnerable contract and calls `withdrawAll()`
2. The contract sends ETH using `call{value: ...}`  
3. This triggers the attacker's `receive()` function  
4. Inside `receive()`, `withdrawAll()` is called again  
5. This continues recursively before `balances[msg.sender] = 0` is reached

📷 See diagram below from the exploit trace:

![Attack Flow](Vulberable%20Structure.JPG)

---

## ⚠️ Why It’s Dangerous

If unchecked, this allows an attacker to **withdraw more ETH than they deposited**, draining the entire contract balance. The vulnerable contract keeps thinking the attacker still has a balance.

---

## 🧪 Demonstration Output

This is a real trace from running `npx hardhat run scripts/SimpleReentrancy/exec-attack.js`:

```plaintext
insecureEtherVault.withdrawAll() invoked
insecureEtherVault.withdrawAll() invoked
insecureEtherVault.withdrawAll() invoked
insecureEtherVault.withdrawAll() invoked
insecureEtherVault.withdrawAll() invoked
