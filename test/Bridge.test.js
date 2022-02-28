const { assert } = require("chai");
const truffleAssert = require("truffle-assertions");

const TestERC20 = artifacts.require("TestERC20");
const BridgeState = artifacts.require("BridgeState");
const Bridge = artifacts.require("Bridge");

contract("Bridge", async (accounts) => {
  let token1, bridge, soldiers;

  before(async () => {
    token1 = await TestERC20.deployed();
    soldiers = await web3.eth.accounts.wallet.create(10);
    const soldiersAddresses = [];
    for (let i = 0; i < 10; i++) {
      soldiersAddresses.push(soldiers[i].address);
    }
    const bridgeState = await BridgeState.new(soldiersAddresses, [
      token1.address,
    ]);
    bridge = await Bridge.new(0, bridgeState.address);
    await token1.transfer(bridge.address, 1000);
  });

  describe("releaseTokens()", async () => {
    it("sends tokens to eth wallet and produces BridgeSuccess event", async () => {
      const toAddr = "0x9296bE4959E56b5DF2200DBfA30594504a7feD61";
      const rootChainId = 1;
      const destinationChainId = 0;
      const tokenAddr = token1.address;
      const rootTxnId = "rootTxnId_success";
      const amount = 1;

      const accountBalanceBefore = await token1.balanceOf(toAddr);
      const bridgeBalanceBefore = await token1.balanceOf(bridge.address);

      const msg = await messageHash(
        toAddr,
        rootChainId,
        destinationChainId,
        tokenAddr,
        rootTxnId,
        amount
      );
      const signatures = await signMessage(msg, [
        soldiers[0],
        soldiers[1],
        soldiers[2],
      ]);
      const result = await bridge.releaseTokens(
        tokenAddr,
        toAddr,
        rootChainId,
        destinationChainId,
        rootTxnId,
        amount,
        signatures
      );

      truffleAssert.eventEmitted(result, "BridgeSuccess", {
        toAddr: toAddr,
        rootChainId: web3.utils.toBN(rootChainId),
        destinationChainId: web3.utils.toBN(destinationChainId),
        tokenAddr: token1.address,
        rootTxnId: rootTxnId,
        amount: web3.utils.toBN(amount),
      });

      const accountBalanceAfter = await token1.balanceOf(toAddr);
      assert.isTrue(accountBalanceAfter.eq(accountBalanceBefore.addn(amount)));

      const bridgeBalanceAfter = await token1.balanceOf(bridge.address);
      assert.isTrue(bridgeBalanceAfter.eq(bridgeBalanceBefore.subn(amount)));
    });

    it("fails if signatures are duplicated", async () => {
      const toAddr = "0x9296bE4959E56b5DF2200DBfA30594504a7feD61";
      const rootChainId = 101001;
      const destinationChainId = 1;
      const tokenAddr = token1.address;
      const rootTxnId = "rootTxnId_duplicated_signature";
      const amount = 1;

      const msg = await messageHash(
        toAddr,
        rootChainId,
        destinationChainId,
        tokenAddr,
        rootTxnId,
        amount
      );
      const signatures = await signMessage(msg, [soldiers[0], soldiers[0]]);

      truffleAssert.fails(
        bridge.releaseTokens(
          tokenAddr,
          toAddr,
          rootChainId,
          destinationChainId,
          rootTxnId,
          amount,
          signatures
        ),
        truffleAssert.ErrorType.REVERT,
        "Duplicated signature"
      );
    });

    it("fails if transaction is already processed", async () => {
      const toAddr = "0x9296bE4959E56b5DF2200DBfA30594504a7feD61";
      const rootChainId = 1;
      const destinationChainId = 0;
      const tokenAddr = token1.address;
      const rootTxnId = "rootTxnId_already_processed";
      const amount = 1;

      const msg = await messageHash(
        toAddr,
        rootChainId,
        destinationChainId,
        tokenAddr,
        rootTxnId,
        amount
      );
      const signatures = await signMessage(msg, [
        soldiers[0],
        soldiers[1],
        soldiers[2],
      ]);

      const result = await bridge.releaseTokens(
        tokenAddr,
        toAddr,
        rootChainId,
        destinationChainId,
        rootTxnId,
        amount,
        signatures
      );
      truffleAssert.eventEmitted(result, "BridgeSuccess");

      truffleAssert.fails(
        bridge.releaseTokens(
          tokenAddr,
          toAddr,
          rootChainId,
          destinationChainId,
          rootTxnId,
          amount,
          signatures
        ),
        truffleAssert.ErrorType.REVERT,
        "Transaction ID already processed"
      );
    });

    it("fails if transaction is already processed, but signed by different soldiers", async () => {
      const toAddr = "0x9296bE4959E56b5DF2200DBfA30594504a7feD61";
      const rootChainId = 1;
      const destinationChainId = 0;
      const tokenAddr = token1.address;
      const rootTxnId = "rootTxnId_already_processed_2";
      const amount = 1;

      const msg = await messageHash(
        toAddr,
        rootChainId,
        destinationChainId,
        tokenAddr,
        rootTxnId,
        amount
      );
      const signatures = await signMessage(msg, [
        soldiers[0],
        soldiers[1],
        soldiers[2],
      ]);

      const result = await bridge.releaseTokens(
        tokenAddr,
        toAddr,
        rootChainId,
        destinationChainId,
        rootTxnId,
        amount,
        signatures
      );
      truffleAssert.eventEmitted(result, "BridgeSuccess");

      const differentSignatures = await signMessage(msg, [
        soldiers[3],
        soldiers[4],
        soldiers[5],
      ]);

      truffleAssert.fails(
        bridge.releaseTokens(
          tokenAddr,
          toAddr,
          rootChainId,
          destinationChainId,
          rootTxnId,
          amount,
          differentSignatures
        ),
        truffleAssert.ErrorType.REVERT,
        "Transaction ID already processed"
      );
    });
  });

  describe("lockTokens()", async () => {
    it("locks user tokens and produces Lock event", async () => {
      const toAddr = "EHS4JX2MPRQPUAIEGQW6ZBA4FMQPUC2H6L4XMUIMOYNUAB7QFSVD3MGTVU";
      const destinationChainId = 1;
      const amount = 1;
      const fromAddr = accounts[0];

      const accountBalanceBefore = await token1.balanceOf(fromAddr);
      const bridgeBalanceBefore = await token1.balanceOf(bridge.address);

      await token1.approve(bridge.address, amount);
      const result = await bridge.lockTokens(
        toAddr,
        destinationChainId,
        token1.address,
        amount
      );

      truffleAssert.eventEmitted(result, "Lock", {
        fromAddr: fromAddr,
        toAddr: toAddr,
        rootChainId: web3.utils.toBN(0),
        destinationChainId: web3.utils.toBN(destinationChainId),
        tokenAddr: token1.address,
        amount: web3.utils.toBN(amount),
      });

      const accountBalanceAfter = await token1.balanceOf(fromAddr);
      assert.isTrue(accountBalanceAfter.eq(accountBalanceBefore.subn(amount)));

      const bridgeBalanceAfter = await token1.balanceOf(bridge.address);
      assert.isTrue(bridgeBalanceAfter.eq(bridgeBalanceBefore.addn(amount)));
    });
  });
});

const messageHash = async function (
  toAddress,
  rootChainId,
  destinationChainId,
  tokenAddress,
  rootTxnId,
  amount
) {
  return web3.utils
    .soliditySha3(
      { t: "address", v: toAddress },
      { t: "uint32", v: rootChainId },
      { t: "uint32", v: destinationChainId },
      { t: "address", v: tokenAddress },
      { t: "string", v: rootTxnId },
      { t: "uint256", v: amount }
    )
    .toString("hex");
};

const signMessage = async function (message, signers) {
  const signatures = [];
  for (const s of signers) {
    signatures.push(s.sign(message).signature);
  }
  return signatures;
};
