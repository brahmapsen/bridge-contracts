const { assert } = require("chai");
const truffleAssert = require("truffle-assertions");

const BridgeState = artifacts.require("BridgeState");
const TestERC20 = artifacts.require("TestERC20");

contract("BridgeState", async (accounts) => {
  const tokenToRemove = "0xA7EFAe728D2936e78BDA97dc267687568dD593f3";
  let token1, bridgeState, soldiers;

  before(async () => {
    token1 = await TestERC20.deployed();
    soldiers = await web3.eth.accounts.wallet.create(10);
    const soldiersAddresses = [accounts[0]];
    for (let i = 0; i < 10; i++) {
      soldiersAddresses.push(soldiers[i].address);
    }
    bridgeState = await BridgeState.new(soldiersAddresses, [
      token1.address,
      tokenToRemove,
    ]);
  });

  describe("isTokenValid()", async () => {
    it("should return expected result for deployed BridgeState", async () => {
      assert.isTrue(await bridgeState.isTokenValid(token1.address));
      assert.isFalse(await bridgeState.isTokenValid(accounts[0]));
    });
  });

  describe("isSoldier()", async () => {
    it("should return expected result for deployed BridgeState", async () => {
      assert.isTrue(await bridgeState.isSoldier(soldiers[0].address));
      assert.isFalse(await bridgeState.isSoldier(accounts[2]));
    });
  });

  describe("addToken()", async () => {
    it("should add a token", async () => {
      const tokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
      assert.isFalse(await bridgeState.isTokenValid(tokenAddress));

      const nonce = await bridgeState.getNonce();
      const message = await messageHash(tokenAddress, nonce);
      const signatures = await signMessage(message, [
        soldiers[0],
        soldiers[1],
        soldiers[2],
      ]);

      const result = await bridgeState.addToken(
        tokenAddress,
        nonce,
        signatures
      );

      truffleAssert.eventEmitted(result, "LogTokenAdded", {
        tokenAddress: tokenAddress,
      });

      assert.isTrue(await bridgeState.isTokenValid(tokenAddress));

      const newNonce = await bridgeState.getNonce();
      assert.isTrue(newNonce.eq(nonce.addn(1)));
    });

    it("should fail if called not by soldier", async () => {
      const tokenAddress = "0x4bc006ea645bd96d6397e582cbb412f825b5805b";
      const nonce = await bridgeState.getNonce();
      const message = await messageHash(tokenAddress, nonce);
      const signatures = await signMessage(message, [
        soldiers[0],
        soldiers[1],
        soldiers[2],
      ]);

      truffleAssert.fails(
        bridgeState.addToken(tokenAddress, nonce, signatures, {
          from: accounts[1],
        }),
        truffleAssert.ErrorType.REVERT,
        "caller is not one of the soldiers"
      );

      assert.isFalse(await bridgeState.isTokenValid(tokenAddress));
    });

    it("should fail if signature is not valid", async () => {
      const tokenAddress = "0x4bc006ea645bd96d6397e582cbb412f825b5805b";
      const nonce = await bridgeState.getNonce();
      const message = await messageHash(tokenAddress, nonce);
      const notSoldier = await web3.eth.accounts.create();
      const signatures = await signMessage(message, [
        notSoldier,
        soldiers[0],
        soldiers[1],
      ]);

      truffleAssert.fails(
        bridgeState.addToken(tokenAddress, nonce, signatures),
        truffleAssert.ErrorType.REVERT,
        "Invalid signature"
      );

      assert.isFalse(await bridgeState.isTokenValid(tokenAddress));
    });

    it("should fail if duplicated signature", async () => {
      const tokenAddress = "0x4bc006ea645bd96d6397e582cbb412f825b5805b";
      const nonce = await bridgeState.getNonce();
      const message = await messageHash(tokenAddress, nonce);
      const signatures = await signMessage(message, [
        soldiers[0],
        soldiers[0],
        soldiers[0],
      ]);

      truffleAssert.fails(
        bridgeState.addToken(tokenAddress, nonce, signatures),
        truffleAssert.ErrorType.REVERT,
        "Duplicated signature"
      );

      assert.isFalse(await bridgeState.isTokenValid(tokenAddress));
    });

    it("should fail if invalid nonce", async () => {
      const tokenAddress = "0x4bc006ea645bd96d6397e582cbb412f825b5805b";
      const nonce = 0;
      const message = await messageHash(tokenAddress, nonce);
      const signatures = await signMessage(message, [
        soldiers[0],
        soldiers[1],
        soldiers[2],
      ]);

      truffleAssert.fails(
        bridgeState.addToken(tokenAddress, nonce, signatures),
        truffleAssert.ErrorType.REVERT,
        "Invalid nonce"
      );

      assert.isFalse(await bridgeState.isTokenValid(tokenAddress));
    });

    it("should fail if token already active", async () => {
      const tokenAddress = token1.address;
      const nonce = await bridgeState.getNonce();
      const message = await messageHash(tokenAddress, nonce);
      const signatures = await signMessage(message, [
        soldiers[0],
        soldiers[1],
        soldiers[2],
      ]);

      truffleAssert.fails(
        bridgeState.addToken(tokenAddress, nonce, signatures),
        truffleAssert.ErrorType.REVERT,
        "Token already active"
      );
    });
  });

  describe("removeToken()", async () => {
    it("should remove token", async () => {
      const tokenAddress = tokenToRemove;
      assert.isTrue(await bridgeState.isTokenValid(tokenAddress));

      const nonce = await bridgeState.getNonce();
      const message = await messageHash(tokenAddress, nonce);
      const signatures = await signMessage(message, [
        soldiers[0],
        soldiers[1],
        soldiers[2],
      ]);

      const result = await bridgeState.removeToken(
        tokenAddress,
        nonce,
        signatures
      );

      truffleAssert.eventEmitted(result, "LogTokenRemoved", {
        tokenAddress: tokenAddress,
      });

      assert.isFalse(await bridgeState.isTokenValid(tokenAddress));

      const newNonce = await bridgeState.getNonce();
      assert.isTrue(newNonce.eq(nonce.addn(1)));
    });

    it("should fail if called not by soldier", async () => {
      const tokenAddress = token1.address;
      const nonce = await bridgeState.getNonce();
      const message = await messageHash(tokenAddress, nonce);
      const signatures = await signMessage(message, [
        soldiers[0],
        soldiers[1],
        soldiers[2],
      ]);

      truffleAssert.fails(
        bridgeState.removeToken(tokenAddress, nonce, signatures, {
          from: accounts[1],
        }),
        truffleAssert.ErrorType.REVERT,
        "caller is not one of the soldiers"
      );

      assert.isTrue(await bridgeState.isTokenValid(tokenAddress));
    });

    it("should fail if signature is not valid", async () => {
      const tokenAddress = token1.address;
      const nonce = await bridgeState.getNonce();
      const message = await messageHash(tokenAddress, nonce);
      const notSoldier = await web3.eth.accounts.create();
      const signatures = await signMessage(message, [
        notSoldier,
        soldiers[0],
        soldiers[1],
      ]);

      truffleAssert.fails(
        bridgeState.removeToken(tokenAddress, nonce, signatures),
        truffleAssert.ErrorType.REVERT,
        "Invalid signature"
      );

      assert.isTrue(await bridgeState.isTokenValid(tokenAddress));
    });

    it("should fail if duplicated signature", async () => {
      const tokenAddress = token1.address;
      const nonce = await bridgeState.getNonce();
      const message = await messageHash(tokenAddress, nonce);
      const signatures = await signMessage(message, [
        soldiers[0],
        soldiers[0],
        soldiers[0],
      ]);

      truffleAssert.fails(
        bridgeState.removeToken(tokenAddress, nonce, signatures),
        truffleAssert.ErrorType.REVERT,
        "Duplicated signature"
      );

      assert.isTrue(await bridgeState.isTokenValid(tokenAddress));
    });

    it("should fail if invalid nonce", async () => {
      const tokenAddress = token1.address;
      const nonce = 0;
      const message = await messageHash(tokenAddress, nonce);
      const signatures = await signMessage(message, [
        soldiers[0],
        soldiers[1],
        soldiers[2],
      ]);

      truffleAssert.fails(
        bridgeState.removeToken(tokenAddress, nonce, signatures),
        truffleAssert.ErrorType.REVERT,
        "Invalid nonce"
      );

      assert.isTrue(await bridgeState.isTokenValid(tokenAddress));
    });

    it("should fail if token already inactive", async () => {
      const tokenAddress = "0x4bc006ea645bd96d6397e582cbb412f825b5805b";
      const nonce = await bridgeState.getNonce();
      const message = await messageHash(tokenAddress, nonce);
      const signatures = await signMessage(message, [
        soldiers[0],
        soldiers[1],
        soldiers[2],
      ]);

      truffleAssert.fails(
        bridgeState.removeToken(tokenAddress, nonce, signatures),
        truffleAssert.ErrorType.REVERT,
        "Token already not active"
      );
    });
  });

  describe("addSoldier()", async () => {
    it("should add soldier", async () => {
      const soldierAddress = "0xB9d915f857e7c12B2057336aC064a9ae9C9d1b6F";
      assert.isFalse(await bridgeState.isSoldier(soldierAddress));

      const nonce = await bridgeState.getNonce();
      const message = await messageHash(soldierAddress, nonce);
      const signatures = await signMessage(message, [
        soldiers[0],
        soldiers[1],
        soldiers[2],
      ]);

      const result = await bridgeState.addSoldier(
        soldierAddress,
        nonce,
        signatures
      );

      truffleAssert.eventEmitted(result, "LogSoldierAdded", {
        soldierAddress: soldierAddress,
      });

      assert.isTrue(await bridgeState.isSoldier(soldierAddress));

      const newNonce = await bridgeState.getNonce();
      assert.isTrue(newNonce.eq(nonce.addn(1)));
    });

    it("should fail if called not by soldier", async () => {
      const soldierAddress = "0x03f7724180aa6b939894b5ca4314783b0b36b329";
      assert.isFalse(await bridgeState.isSoldier(soldierAddress));

      const nonce = await bridgeState.getNonce();
      const message = await messageHash(soldierAddress, nonce);
      const signatures = await signMessage(message, [
        soldiers[0],
        soldiers[1],
        soldiers[2],
      ]);

      truffleAssert.fails(
        bridgeState.addSoldier(soldierAddress, nonce, signatures, {
          from: accounts[1],
        }),
        truffleAssert.ErrorType.REVERT,
        "caller is not one of the soldiers"
      );

      assert.isFalse(await bridgeState.isSoldier(soldierAddress));
    });

    it("should fail if signature is not valid", async () => {
      const soldierAddress = "0x03f7724180aa6b939894b5ca4314783b0b36b329";
      assert.isFalse(await bridgeState.isSoldier(soldierAddress));

      const nonce = await bridgeState.getNonce();
      const message = await messageHash(soldierAddress, nonce);
      const notSoldier = await web3.eth.accounts.create();
      const signatures = await signMessage(message, [
        notSoldier,
        soldiers[0],
        soldiers[1],
      ]);

      truffleAssert.fails(
        bridgeState.addSoldier(soldierAddress, nonce, signatures),
        truffleAssert.ErrorType.REVERT,
        "Invalid signature"
      );

      assert.isFalse(await bridgeState.isSoldier(soldierAddress));
    });

    it("should fail if invalid nonce", async () => {
      const soldierAddress = "0x03f7724180aa6b939894b5ca4314783b0b36b329";
      assert.isFalse(await bridgeState.isSoldier(soldierAddress));

      const nonce = 0;
      const message = await messageHash(soldierAddress, nonce);
      const signatures = await signMessage(message, [
        soldiers[0],
        soldiers[1],
        soldiers[2],
      ]);

      truffleAssert.fails(
        bridgeState.addSoldier(soldierAddress, nonce, signatures),
        truffleAssert.ErrorType.REVERT,
        "Invalid nonce"
      );

      assert.isFalse(await bridgeState.isSoldier(soldierAddress));
    });

    it("should fail if soldier already active", async () => {
      const soldierAddress = soldiers[0].address;
      assert.isTrue(await bridgeState.isSoldier(soldierAddress));

      const nonce = await bridgeState.getNonce();
      const message = await messageHash(soldierAddress, nonce);
      const signatures = await signMessage(message, [
        soldiers[0],
        soldiers[1],
        soldiers[2],
      ]);

      truffleAssert.fails(
        bridgeState.addSoldier(soldierAddress, nonce, signatures),
        truffleAssert.ErrorType.REVERT,
        "Soldier already active"
      );
    });

    it("should fail if duplicated signature", async () => {
      const soldierAddress = "0x03f7724180aa6b939894b5ca4314783b0b36b329";
      assert.isFalse(await bridgeState.isSoldier(soldierAddress));

      const nonce = await bridgeState.getNonce();
      const message = await messageHash(soldierAddress, nonce);
      const signatures = await signMessage(message, [
        soldiers[0],
        soldiers[0],
        soldiers[0],
      ]);

      truffleAssert.fails(
        bridgeState.addSoldier(soldierAddress, nonce, signatures),
        truffleAssert.ErrorType.REVERT,
        "Duplicated signature"
      );
    });
  });

  describe("removeSoldier()", async () => {
    it("should remove soldier", async () => {
      const soldierAddress = soldiers[9].address;
      assert.isTrue(await bridgeState.isSoldier(soldierAddress));

      const nonce = await bridgeState.getNonce();
      const message = await messageHash(soldierAddress, nonce);
      const signatures = await signMessage(message, [
        soldiers[0],
        soldiers[1],
        soldiers[2],
      ]);

      const result = await bridgeState.removeSoldier(
        soldierAddress,
        nonce,
        signatures
      );

      truffleAssert.eventEmitted(result, "LogSoldierRemoved", {
        soldierAddress: soldierAddress,
      });

      assert.isFalse(await bridgeState.isSoldier(soldierAddress));

      const newNonce = await bridgeState.getNonce();
      assert.isTrue(newNonce.eq(nonce.addn(1)));
    });

    it("should fail if called not by soldier", async () => {
      const soldierAddress = soldiers[0].address;
      assert.isTrue(await bridgeState.isSoldier(soldierAddress));

      const nonce = await bridgeState.getNonce();
      const message = await messageHash(soldierAddress, nonce);
      const signatures = await signMessage(message, [
        soldiers[0],
        soldiers[1],
        soldiers[2],
      ]);

      truffleAssert.fails(
        bridgeState.removeSoldier(soldierAddress, nonce, signatures, {
          from: accounts[1],
        }),
        truffleAssert.ErrorType.REVERT,
        "caller is not one of the soldiers"
      );

      assert.isTrue(await bridgeState.isSoldier(soldierAddress));
    });

    it("should fail if signature is not valid", async () => {
      const soldierAddress = soldiers[0].address;
      assert.isTrue(await bridgeState.isSoldier(soldierAddress));

      const nonce = await bridgeState.getNonce();
      const message = await messageHash(soldierAddress, nonce);
      const notSoldier = await web3.eth.accounts.create();
      const signatures = await signMessage(message, [
        notSoldier,
        soldiers[1],
        soldiers[2],
      ]);

      truffleAssert.fails(
        bridgeState.removeSoldier(soldierAddress, nonce, signatures),
        truffleAssert.ErrorType.REVERT,
        "Invalid signature"
      );

      assert.isTrue(await bridgeState.isSoldier(soldierAddress));
    });

    it("should fail if duplicated signature", async () => {
      const soldierAddress = soldiers[0].address;
      assert.isTrue(await bridgeState.isSoldier(soldierAddress));

      const nonce = await bridgeState.getNonce();
      const message = await messageHash(soldierAddress, nonce);
      const signatures = await signMessage(message, [
        soldiers[0],
        soldiers[0],
        soldiers[0],
      ]);

      truffleAssert.fails(
        bridgeState.removeSoldier(soldierAddress, nonce, signatures),
        truffleAssert.ErrorType.REVERT,
        "Duplicated signature"
      );

      assert.isTrue(await bridgeState.isSoldier(soldierAddress));
    });

    it("should fail if invalid nonce", async () => {
      const soldierAddress = soldiers[0].address;
      assert.isTrue(await bridgeState.isSoldier(soldierAddress));

      const nonce = 0;
      const message = await messageHash(soldierAddress, nonce);
      const signatures = await signMessage(message, [
        soldiers[0],
        soldiers[1],
        soldiers[2],
      ]);

      truffleAssert.fails(
        bridgeState.removeSoldier(soldierAddress, nonce, signatures),
        truffleAssert.ErrorType.REVERT,
        "Invalid nonce"
      );

      assert.isTrue(await bridgeState.isSoldier(soldierAddress));
    });

    it("should fail if not a soldier", async () => {
      const soldierAddress = accounts[2];
      assert.isFalse(await bridgeState.isSoldier(soldierAddress));

      const nonce = await bridgeState.getNonce();
      const message = await messageHash(soldierAddress, nonce);
      const signatures = await signMessage(message, [
        soldiers[0],
        soldiers[1],
        soldiers[2],
      ]);

      truffleAssert.fails(
        bridgeState.removeSoldier(soldierAddress, nonce, signatures),
        truffleAssert.ErrorType.REVERT,
        "Not a solider"
      );
    });

    it("should fail if soldier count will be below signature threshold", async () => {
      const soldierAddress = soldiers[0].address;
      const newBridgeState = await BridgeState.new([accounts[0], soldierAddress], []);

      const nonce = await bridgeState.getNonce();
      const message = await messageHash(soldierAddress, nonce);
      const signatures = await signMessage(message, [
        soldiers[0],
        soldiers[1]
      ]);

      truffleAssert.fails(
        bridgeState.removeSoldier(soldierAddress, nonce, signatures),
        truffleAssert.ErrorType.REVERT,
        "Not enough soldiers"
      );
    });
  });
});

const messageHash = async function (address, nonce) {
  return web3.utils
    .soliditySha3({ t: "address", v: address }, { t: "uint256", v: nonce })
    .toString("hex");
};

const signMessage = async function (message, signers) {
  const signatures = [];
  for (const s of signers) {
    signatures.push(s.sign(message).signature);
  }
  return signatures;
};
