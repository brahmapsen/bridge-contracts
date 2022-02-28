This application sends ERC20 to Algorand as wrapped token, takes ASA from Algorand and deposits wrapped token on Ethereum. Uses pubsub to validate transactions based on threshold signatures.

## Background
User calls the "LockAsset" method on the Bridge smart contract. All smart contracts are in ethereum directory. They can be deployed to Ganache cli as localhost or any Testnet like Ropsten.
      
Currently, the transfer of ERC20 from ethereum wallet to Bridge smart contract is commented out. The LockAsset method only emits a LockAssetLog event.

At least two event trackers are running which instantiates libp2p peer nodes. The event tracker traps the event, builds a multisig account based on the number of validators and other parameters. It then publishes the message to the pubsub network with empty signature which then gets signed by receiving nodes until the threshold signature number is reached. At this point, the pubsub network sends the transaction for minting i.e. transfers the ASA from the multisig owner to the Algorand receiving address. 

## Install

In terminal `1`:

```
git clone git@github.com:ZeroBridge/zerobridge-smart-contracts.git
cd zerobridge-smart-contracts
npm install -g truffle
npm i
```
## To compile and deploy solidity contracts to Ropsten Testnet

## udpate .env file

```
cp .example.env .env
```

> provide Infura provider address for TestNet in the .env file
> update Mnemonics value in the .env file

## truffle compile

```
truffle compile
```

## Running ethereum smart contract from Ganache

In terminal `2`:  

```
npm install -g ganache-cli
``` 

>> install Ganache-cli if not installed

```
ganache-cli --i 3
```

>> the "i" parameter allows to look up contract address with network ID 3 so the script will work
 for both localhost and Ropsten without having to hard code Bridge contract code in the script

In terminal `1`: 

> from project directory

```
truffle migrate
```
>>  will deploy contracts to Ganache

```
truffle test 
```
>> test run test for bridge.sol
