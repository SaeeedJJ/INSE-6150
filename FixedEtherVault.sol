// SPDX-License-Identifier: BSL-1.0 (Boost Software License 1.0)
pragma solidity 0.8.13;

import "./Dependencies.sol";

contract FixedEtherVault is ReentrancyGuard {
    mapping (address => uint256) private userBalances;

    function deposit() external payable {
        userBalances[msg.sender] += msg.value;
    }

    function transfer(address _to, uint256 _amount) external {
        if (userBalances[msg.sender] >= _amount) {
           userBalances[_to] += _amount;
           userBalances[msg.sender] -= _amount;
        }
    }

    function withdrawAll() external noReentrant {  // Apply the noReentrant modifier
        uint256 balance = getUserBalance(msg.sender);
        require(balance > 0, "Insufficient balance");  // Check

        // FIX: Apply checks-effects-interactions pattern
        userBalances[msg.sender] = 0;  // Effect

        (bool success, ) = msg.sender.call{value: balance}("");  // Interaction
        require(success, "Failed to send Ether");
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getUserBalance(address _user) public view returns (uint256) {
        return userBalances[_user];
    }
}