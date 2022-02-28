// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IBridgeState.sol";

contract SignatureValidator {
    function validateSignatures(
        address stateContract,
        bytes32 message,
        bytes[] memory signatures,
        mapping(address => bool) storage signedBy
    ) internal {
        uint8 threshold = IBridgeState(stateContract).getSignaturesThreshold();
        require(signatures.length >= threshold, "Not enough signatures");
        for (uint256 i = 0; i < threshold; i++) {
            address recoveredAddress = recoverSigner(message, signatures[i]);
            bool isSoldier = IBridgeState(stateContract).isSoldier(
                recoveredAddress
            );

            require(isSoldier, "Invalid signature");
            require(!signedBy[recoveredAddress], "Duplicated signature");

            signedBy[recoveredAddress] = true;
        }
    }

    function recoverSigner(bytes32 message, bytes memory sig)
        internal
        pure
        returns (address)
    {
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);
        return ecrecover(message, v, r, s);
    }

    function splitSignature(bytes memory sig)
        internal
        pure
        returns (
            uint8,
            bytes32,
            bytes32
        )
    {
        require(sig.length == 65);

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }

        return (v, r, s);
    }

    function prefixed(bytes32 message) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", message)
            );
    }
}
