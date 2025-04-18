## Regular Reentrancy Attack — Solidity Security Example

This project demonstrates a classic **reentrancy attack** in Solidity smart contracts. A malicious contract repeatedly calls the vulnerable `withdrawAll()` function **before** the state (user balance) is updated, draining all the ETH from the vault.

---

### Vulnerable Scenario

We have two contracts:
- `InsecureEtherVault`: A vault contract allowing deposits and withdrawals.
- `Attack`: An attacker contract exploiting the vulnerability via the `receive()` function.

---

### Attack Flow

![attack-diagram](reentrancy%201.png)

1. `User1` deposits 3 ETH and `User2` deposits 2 ETH into the vault.
2. The attacker deposits 1 ETH and immediately invokes `withdrawAll()`.
3. The fallback `receive()` function is triggered upon ETH reception, which **recursively calls** `withdrawAll()` before the victim contract sets the user's balance to zero.
4. This results in **multiple unauthorized withdrawals**, draining the full 5 ETH vault balance.

---

### Vulnerability Highlighted by Slither

![slither-analysis](Slither%20analyze.JPG)

The static analysis tool [Slither](https://github.com/crytic/slither) detects:
- `msg.sender.call.value()` used before balance update.
- Multiple reentrancy paths, including cross-function vulnerability.
- Unsafe low-level calls and incorrect version usage.

---

### Attack Output

![attack-output](attack-output.png)

The attacker successfully:
- Called `withdrawAll()` once intentionally.
- Reentered **5 more times** recursively.
- Drained the vault from `5 ETH` to `0 ETH`.

---

### How to Run

```bash
# Clone and install dependencies
git clone https://github.com/your-repo/reentrancy-attack-demo
cd reentrancy-attack-demo
npm install

# Compile and execute
npx hardhat compile
npx hardhat run scripts/exec-attack.js
```

---

### Project Structure

```
.
├── contracts/
│   ├── Insecure.sol              # The vulnerable vault
│   └── Attack.sol                # The reentrancy attacker
├── scripts/
│   └── exec-attack.js            # Deployment and execution logic
├── images/
    ├── attack-output.png
    └── reentrancy 1.png
```

---

### Mitigation

Replace the call order in `withdrawAll()`:

```solidity
userBalances[msg.sender] = 0; // move this before the external call
(bool success, ) = msg.sender.call{value: balance}("");
require(success, "Transfer failed");
```

Also consider using:
- Reentrancy guards (`nonReentrant` modifier).
- Checks-Effects-Interactions pattern.

---

### Conclusion

This example shows how a simple misuse of the call order in Solidity can lead to devastating reentrancy vulnerabilities. It highlights why **state updates must precede external calls**.
