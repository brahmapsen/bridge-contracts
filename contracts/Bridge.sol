// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IBridgeState.sol";
import "./SignatureValidator.sol";

contract Bridge is Pausable, Ownable, SignatureValidator {
    // Mapping of  processed root chain transactions by root chain ID and txn hash. We follow official EVM Chain Id Standards.
    // e.g:
    // 1 is Ethereum Mainnet
    // 4 is Rinkeby
    mapping(uint32 => mapping(string => Transaction)) public transactions;

    // This variable ensures the bridge contract can check its own ID is equal to destinationChainId inside release tokens logic.
    uint32 public thisChainId; // Ethereum Mainnet Chain is Id'd 1;

    address public stateContract; // This address is basically of BridgeState which contains all the verifying methods and governance methods of the bridge.

    uint256 public bridgeFee = 1;

    struct Transaction {
        bool processed;
        mapping(address => bool) signers;
    }

    // To make things ready-to-run. Deployer provides 3 Soldier addresses in constructor. Deployer is automatically bridge admin, owner, and pauser role.
    constructor(uint32 chainId, address _stateAddress) {
        thisChainId = chainId;
        stateContract = _stateAddress;
    }

    // Events to monitor the bridge.

    event Lock(
        address fromAddr,
        string toAddr,
        uint32 rootChainId,
        uint32 destinationChainId,
        address tokenAddr,
        uint256 amount,
        uint8 signatureThreshold,
        uint256 timestamp
    );

    event BridgeSuccess(
        address toAddr,
        uint32 rootChainId,
        uint32 destinationChainId,
        address tokenAddr,
        string rootTxnId,
        uint256 amount,
        uint256 timestamp
    );

    // Release Tokens.
    function releaseTokens(
        address tokenAddr,
        address toAddr,
        uint32 rootChainId,
        uint32 destinationChainId,
        string memory rootTxnId,
        uint256 amount,
        bytes[] memory signatures
    ) public whenNotPaused returns (bool) {
        require(
            IBridgeState(stateContract).isTokenValid(tokenAddr),
            "Trying to release non existent token."
        );
        // Require that you have enough signature to run the validation scheme.
        require(
            signatures.length >=
                IBridgeState(stateContract).getSignaturesThreshold(),
            "Length of signatures array is smaller than the required threshold"
        );
        // Check that this transaction has never been processed before.
        Transaction storage transaction = transactions[rootChainId][rootTxnId];
        require(
            transaction.processed != true,
            "Transaction ID already processed"
        );
        transaction.processed = true;

        // Reconstruct the hash that the soldiers signed using the function parameters.
        bytes32 reconstructedHash = reconstructMessageHash(
            toAddr,
            rootChainId,
            destinationChainId,
            tokenAddr,
            rootTxnId,
            amount
        );
        validateSignatures(
            stateContract,
            reconstructedHash,
            signatures,
            transaction.signers
        );

        // Emit success event.
        require(
            destinationChainId == thisChainId,
            "Destination Chain Id not equal to the Blockchain hosting this function call"
        );

        // Transfer.
        IERC20(tokenAddr).transfer(toAddr, amount);

        emit BridgeSuccess(
            toAddr,
            rootChainId,
            destinationChainId,
            tokenAddr,
            rootTxnId,
            amount,
            block.timestamp
        );
        return true;
    }

    // Lock tokens inside the bridge.
    // Root chain will automatically be the ID of the chain where this contract is deployed to.
    // tokenAddr will be checked against Whitelist.
    function lockTokens(
        string memory toAddr,
        uint32 destinationChainId,
        address tokenAddr,
        uint256 amount
    ) public whenNotPaused returns (bool) {
        require(
            IBridgeState(stateContract).isTokenValid(tokenAddr),
            "Trying to bridge non existent token."
        );
        IERC20(tokenAddr).transferFrom(
            msg.sender,
            address(this),
            amount + bridgeFee
        );
        // Lock event accounts with rootChainId = thisChainId.
        emit Lock(
            msg.sender,
            toAddr,
            thisChainId,
            destinationChainId,
            tokenAddr,
            amount,
            IBridgeState(stateContract).getSignaturesThreshold(),
            block.timestamp
        );
        return true;
    }

    function changeFee(uint256 newFeeValue) public {
        // placeholder, until we have dao dashboard multi-sig
        require(IBridgeState(stateContract).soldiers[msg.sender]);
        bridgeFee = newFeeValue;
    }

    // Utils.
    function reconstructMessageHash(
        address toAddr,
        uint32 rootChainId,
        uint32 destinationChainId,
        address tokenAddr,
        string memory rootTxnId,
        uint256 amount
    ) public pure returns (bytes32) {
        return
            prefixed(
                keccak256(
                    abi.encodePacked(
                        toAddr,
                        rootChainId,
                        destinationChainId,
                        tokenAddr,
                        rootTxnId,
                        amount
                    )
                )
            );
    }
}
