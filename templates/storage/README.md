# 0G Storage App

A decentralized file registry built on the [0G network](https://0g.ai).

- **Files** are stored on 0G's decentralized storage network via `@0glabs/0g-ts-sdk`
- **Provenance** (who uploaded what, and when) is recorded on-chain via `FileRegistry.sol`
- **Frontend** is a Next.js 15 app with wagmi wallet connect

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp packages/web/.env.example packages/web/.env.local
```

Edit `packages/web/.env.local` and add your private key:

```env
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

> Get testnet OG tokens from the [0G faucet](https://faucet.0g.ai) if your wallet is empty.

### 3. Start the dev server (no deploy needed)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You can browse the UI, but uploads need the contract deployed first.

### 4. Deploy the contract to Galileo testnet

```bash
npm run deploy
```

This will:
1. Compile `FileRegistry.sol`
2. Deploy it to the 0G Galileo testnet (chain ID 16601)
3. Automatically write the contract address to `packages/web/.env.local`

Restart the dev server after deploying to pick up the new address.

### 5. Verify the contract (optional)

```bash
npm run verify
```

View your contract on the [0G Galileo explorer](https://chainscan-galileo.0g.ai).

## Project Structure

```
├── packages/
│   ├── contracts/         Solidity + Hardhat
│   │   ├── contracts/
│   │   │   └── FileRegistry.sol
│   │   ├── scripts/
│   │   │   └── deploy.ts
│   │   └── hardhat.config.ts
│   └── web/               Next.js frontend
│       ├── app/
│       ├── lib/
│       │   ├── 0g-storage.ts   0G SDK wrapper
│       │   ├── abi.ts          FileRegistry ABI
│       │   └── wagmi.ts        Wallet config
│       └── .env.example
└── README.md
```

## How It Works

1. User connects their wallet (MetaMask or any injected wallet)
2. User drops a file onto the upload zone
3. The file is uploaded to 0G storage via the indexer — a content ID (merkle root) is returned
4. The content ID is written on-chain to `FileRegistry.sol` via `registerFile()`
5. The file gallery reads all content IDs from the contract for the connected wallet
6. Clicking "Download" fetches the file from 0G storage by content ID

## Troubleshooting

**"No contract deployed yet" warning**
Run `npm run deploy` and restart the dev server.

**Transaction fails / insufficient funds**
Get testnet OG tokens from [https://faucet.0g.ai](https://faucet.0g.ai).

**Upload hangs**
The 0G storage indexer may be temporarily unavailable. Check [https://docs.0g.ai](https://docs.0g.ai) for status.

**Wrong network in MetaMask**
Add the 0G Galileo testnet manually:
- Network name: 0G Galileo Testnet
- RPC URL: https://evmrpc-test.0g.ai
- Chain ID: 16601
- Currency: OG
- Explorer: https://chainscan-galileo.0g.ai
