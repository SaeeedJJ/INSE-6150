# Cross-Contract Reentrancy Attack

## Summary

This project demonstrates a **cross-contract reentrancy attack**, where two attacker contracts exploit a vulnerability in a vault contract using token logic spread across multiple contracts. The attack allows them to recursively drain all Ether stored in the `InsecureMoonVault`.

---

## Vulnerable Design

The `InsecureMoonVault` interacts with a separate `MoonToken` contract. During the withdrawal process, the vault uses `msg.sender.call{value: balance}("")` before updating internal balances, and then calls `burnAccount()` in `MoonToken`, which is reentrant through `transfer()`.

### Key Mistakes:

- **Reentrancy enabled via another contract**: `MoonToken` is separate but interacts with `vault`.
- **State updates after external calls**: Ether is sent and token logic is triggered before balance is cleared.
- **No reentrancy guard** on `withdrawAll()` or `burnAccount()`.

---

## Attack Flow

1. Two contracts `Attack1` and `Attack2` are deployed.
2. Each sets the other as its peer.
3. The attack starts by calling `attackInit()` in `Attack1`.
4. This triggers `withdrawAll()` and initiates a chain of callbacks between the two attacker contracts.
5. Each fallback triggers the peer’s next withdrawal, repeating recursively.
6. The entire vault balance is drained.

---

## Attack Output

![Attack Output](attack-output.png)

- The vault’s balance went from `4 ETH` to `0`
- `Attack1` stole `3 ETH`, `Attack2` stole `1 ETH`

---

## Code Diagram

![Attack Structure](Cross%20contract%20Reentrancy%20diagram.png)

This diagram shows how the attacker alternates between contracts using the fallback to recurse into the vulnerable vault.

---

## Slither Analysis

![Slither](Cross%20contract%20Reentrancy%20analyze.JPG)

**Findings:**
- Reentrancy in `withdrawAll()`
- External low-level call before state change
- Multiple functions (`burnAccount`, `transfer`) used in the reentrancy path
- Several style and security issues flagged

---

## Fixed Version

The fixed version applies:

- `nonReentrant` modifier using `ReentrancyGuard`
- Balance state update **before** sending ETH
- Removed callback-unsafe token interactions during withdrawal

See: [`FixedVault.sol`](Fixed%20Vault.sol)

---

## How to Run

```bash
npx hardhat compile
npx hardhat run scripts/exec-attack.js
