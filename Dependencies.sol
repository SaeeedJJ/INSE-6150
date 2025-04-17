// SPDX-License-Identifier: BSL-1.0 (Boost Software License 1.0)
pragma solidity 0.8.13;

interface IAirdropReceiver {
    function canReceiveAirdrop() external returns (bool);
}