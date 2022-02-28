// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./SignatureValidator.sol";

contract BridgeState is SignatureValidator {

    struct Info {
        bool active;
        mapping(uint256 => mapping(address => bool)) signers;
    }

    uint256 private _soldierCount;
    uint256 private _nonce = 0;
    uint8 private _signaturesThreshold = 2;

    mapping(address => Info) public soldiers;
    mapping(address => Info) public tokens;

    event LogTokenAdded(address tokenAddress);
    event LogTokenRemoved(address tokenAddress);
    event LogSoldierAdded(address soldierAddress);
    event LogSoldierRemoved(address soldierAddress);

    constructor(address[] memory initialSoldiers, address[] memory initialTokens) {
        require(initialSoldiers.length >= _signaturesThreshold, "Not enough soldiers");
        for (uint8 i = 0; i < initialSoldiers.length; i++) {
            Info storage soldierInfo = soldiers[initialSoldiers[i]];
            require(!soldierInfo.active, "Soldier already added");
            soldierInfo.active = true;
            soldierInfo.signers[_nonce][msg.sender] = true;
        }
        _soldierCount = initialSoldiers.length;

        for (uint8 i = 0; i < initialTokens.length; i++) {
            Info storage tokenInfo = tokens[initialTokens[i]];
            require(!tokenInfo.active, "Token already added");
            tokenInfo.active = true;
            tokenInfo.signers[_nonce][msg.sender] = true;
        }
        _nonce++;
    }

    modifier onlySoldier() {
        require(soldiers[msg.sender].active, "caller is not one of the soldiers");
        _;
    }

    modifier validNonce(uint nonce) {
        require(nonce == _nonce, "Invalid nonce");
        _;
        _nonce++;
    }

    function addToken(address tokenAddress, uint256 nonce, bytes[] memory signatures) public onlySoldier validNonce(nonce) {
        Info storage tokenInfo = tokens[tokenAddress];
        require(!tokenInfo.active, "Token already active");
        validateSignatures(address(this), reconstructMessage(tokenAddress, nonce), signatures, tokenInfo.signers[nonce]);
        tokenInfo.active = true;
        emit LogTokenAdded(tokenAddress);
    }

    function removeToken(address tokenAddress, uint256 nonce, bytes[] memory signatures) public onlySoldier validNonce(nonce) {
        Info storage tokenInfo = tokens[tokenAddress];
        require(tokenInfo.active, "Token already not active");
        validateSignatures(address(this), reconstructMessage(tokenAddress, nonce), signatures, tokenInfo.signers[nonce]);
        delete tokens[tokenAddress];
        emit LogTokenRemoved(tokenAddress);
    }

    function addSoldier(address soldierAddress, uint256 nonce, bytes[] memory signatures) public onlySoldier validNonce(nonce) {
        Info storage soldierInfo = soldiers[soldierAddress];
        require(!soldierInfo.active, "Soldier already active");
        validateSignatures(address(this), reconstructMessage(soldierAddress, nonce), signatures, soldierInfo.signers[nonce]);
        soldiers[soldierAddress].active = true;
        _soldierCount++;
        emit LogSoldierAdded(soldierAddress);
    }

    function removeSoldier(address soldierAddress, uint256 nonce, bytes[] memory signatures) public onlySoldier validNonce(nonce) {
        require(_soldierCount > _signaturesThreshold, "Not enough soldiers");
        Info storage soldierInfo = soldiers[soldierAddress];
        require(soldierInfo.active, "Not a solider");
        validateSignatures(address(this), reconstructMessage(soldierAddress, nonce), signatures, soldierInfo.signers[nonce]);
        delete soldiers[soldierAddress];
        _soldierCount--;
        emit LogSoldierRemoved(soldierAddress);
    }

    function isSoldier(address _msgSender) public view returns (bool) {
        return soldiers[_msgSender].active;
    }

    function isTokenValid(address _address) public view returns (bool) {
        return tokens[_address].active;
    }

    function getSignaturesThreshold() public view returns (uint8) {
        return _signaturesThreshold;
    }

    function getNonce() public view returns (uint) {
        return _nonce;
    }

    function reconstructMessage(address addressToAdd, uint256 nonce) private pure returns (bytes32) {
        return prefixed(keccak256(abi.encodePacked(addressToAdd, nonce)));
    }
}
