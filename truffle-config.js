/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * trufflesuite.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

const HDWalletProvider = require("@truffle/hdwallet-provider");

require("dotenv").config();
const fs = require("fs");
const mnemonic = fs.readFileSync(".secret").toString().trim();

const ROPSTEN_PROVIDER_HTTP_URL = process.env.ROPSTEN_PROVIDER_HTTP_URL?.trim() || "";

const infuraProjectId = process.env["INFURA_PROJECT_ID"]?.trim();

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    // Useful for testing. The `development` name is special - truffle uses it by default
    // if it's defined here and no other network is specified at the command line.
    // You should run a client (like ganache-cli, geth or parity) in a separate terminal
    // tab if you use this network and you must also set the `host`, `port` and `network_id`
    // options below to some value.
    //
    development: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 8545, // Standard Ethereum port (default: none)
      network_id: "*", // Any network (default: none)
      gas: 6721975
    },
    ropsten: {
      provider: () =>
        new HDWalletProvider(mnemonic, `${ROPSTEN_PROVIDER_HTTP_URL}`),
      network_id: 3, // Ropsten's id
      skipDryRun: true, // Skip dry run before migrations? (default: false for public nets )
    },
    // polygon_infura_testnet
    mumbai: {
      provider: () =>
        new HDWalletProvider({
          mnemonic: {
            phrase: mnemonic,
          },
          providerOrUrl:
            "https://polygon-mumbai.g.alchemy.com/v2/EboDOEY4Ocwdxw3ogIe5xU_w0k-jUkUC",
        }),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      chainId: 80001,
    },
    rsk: {
      provider: () =>
        new HDWalletProvider({
          mnemonic: {
            phrase: mnemonic,
          },
          providerOrUrl: "https://public-node.testnet.rsk.co",
        }),
      network_id: 31,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      chainId: 31,
    },
    kovan: {
      provider: () =>
        new HDWalletProvider({
          mnemonic: {
            phrase: mnemonic,
          },
          providerOrUrl:
            "https://eth-kovan.alchemyapi.io/v2/LUTJt980UAX-kSSmf56dhmrU1sSlF-7j",
        }),
      network_id: 42,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      chainId: 42,
    },
    rinkeby: {
      provider: () =>
        new HDWalletProvider({
          mnemonic: {
            phrase: mnemonic,
          },
          providerOrUrl:
            "https://eth-rinkeby.alchemyapi.io/v2/XWZ_VKdPfIqWxgg-MzekznDw3e3yeFsO",
        }),
      network_id: 4,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      chainId: 4,
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.10", // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 200,
        },
        evmVersion: "byzantium",
      },
    },
  },
};
