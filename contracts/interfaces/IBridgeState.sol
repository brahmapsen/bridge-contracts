// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IBridgeState {
    function addSoldier(address soldierAdd) external;

    function removeSoldier(address soldierAdd) external;

    function addToken(address _address) external;

    function removeToken(address _address) external;

    function isSoldier(address _msgSender) external view returns (bool);

    function isTokenValid(address _address) external view returns (bool);

    function getSignaturesThreshold() external view returns (uint8);

    function getNonce() external view returns (uint256);
}
