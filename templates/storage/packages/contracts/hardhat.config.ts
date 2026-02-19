import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
import path from "path";

// Load .env from the web package (single source of truth)
dotenv.config({ path: path.resolve(__dirname, "../web/.env.local") });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    "0g-galileo": {
      url: process.env.NEXT_PUBLIC_RPC_URL ?? "https://evmrpc-test.0g.ai",
      chainId: 16601,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      "0g-galileo": "no-api-key-needed",
    },
    customChains: [
      {
        network: "0g-galileo",
        chainId: 16601,
        urls: {
          apiURL: "https://chainscan-galileo.0g.ai/api",
          browserURL: "https://chainscan-galileo.0g.ai",
        },
      },
    ],
  },
};

export default config;
