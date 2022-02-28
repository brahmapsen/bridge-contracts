const Bridge = artifacts.require("Bridge");
const TestERC20 = artifacts.require("TestERC20");
const ZB2Token = artifacts.require("ZB2Token");
const BridgeState = artifacts.require("BridgeState");
const BigNumber = require("bignumber.js");

const ENV = require("../ENV.json");

module.exports = async function (deployer, network, accounts) {
  // These are hardcoded initial soldiers as per Testnet Impl. The private keys of these soldiers are public. These are meant for testing purposes.
  const soldiers = ENV.soldiers;
  let networkId;

  if (network in ENV.networks) {
    networkId = ENV.networks[network];
  } else {
    console.error("please configure network " + network);
    process.exit(1);
  }
  console.log(`Trying to deploy to ${network} with network id ${networkId}`);
  console.log("soldiers", soldiers);
  console.log("ZB1Token start");
  await deployer.deploy(TestERC20, "ZB1 Token", "ZB1");
  const token1 = await TestERC20.deployed();
  console.log("ZB2Token start");
  await deployer.deploy(ZB2Token, "ZB2 Token", "ZB2");
  const token2 = await ZB2Token.deployed();

  console.log("Deploying BridgeState start");
  await deployer.deploy(BridgeState, [soldiers[0], soldiers[1], soldiers[2]], [token1.address, token2.address]);
  const bridgeStateInstance = await BridgeState.deployed();
  console.log("BridgeState Deployed");

  await deployer.deploy(Bridge, networkId, bridgeStateInstance.address);
  console.log("Bridge Start");
  const bridge = await Bridge.deployed();
  console.log("Bridge Deployed");

  const decimals = new BigNumber(10).pow(new BigNumber(18));
  const amount = new BigNumber(100).multipliedBy(decimals);

  await token1.mintNew();
  await token2.mintNew();

  await token1.transfer(bridge.address, amount);
  await token2.transfer(bridge.address, amount);
};
