# create-0g-app

The fastest way to build on [0G](https://0g.ai). One command scaffolds a full-stack app pre-wired with working code for 0G Storage, Compute (AI inference), smart contracts, and INFTs.

```bash
npx create-0g-app@latest
```

---

## What gets generated

A monorepo with two workspaces:

```
my-app/
├── packages/
│   ├── web/                  # Next.js 15 frontend
│   │   ├── app/
│   │   │   ├── page.tsx      # Main page (edit this)
│   │   │   ├── layout.tsx
│   │   │   └── api/          # Server-side API routes (storage, compute, INFT)
│   │   ├── components/       # Feature UI components
│   │   ├── lib/              # Client-side SDK helpers
│   │   └── .env.local        # Your private keys + config (never committed)
│   └── contracts/            # Hardhat project (if contracts or INFT selected)
│       ├── contracts/        # Solidity source files
│       └── scripts/          # Deploy scripts
├── scripts/
│   └── patch-0g-sdk.js       # Patches @0glabs/0g-ts-sdk ABI for current testnet
└── package.json              # Root workspace scripts
```

---

## Quick Start

```bash
npx create-0g-app@latest my-app
cd my-app

# Add your private key to packages/web/.env.local
# Get testnet OG tokens at https://faucet.0g.ai

npm run dev        # Start dev server at localhost:3000
npm run deploy     # Deploy contracts to 0G Galileo testnet
```

---

## Features

### Contracts (Hardhat + 0G Galileo)

Scaffolds a Hardhat project targeting the 0G Galileo testnet (chain ID `16602`).

**Key files:**
- `packages/contracts/contracts/MyContract.sol` — your Solidity contract
- `packages/contracts/scripts/deploy.ts` — deploys and writes address to `.env.local`
- `packages/contracts/hardhat.config.ts` — pre-configured for 0G Galileo

**Commands:**
```bash
npm run deploy    # compile + deploy to Galileo testnet
```

**RPC:** `https://evmrpc-testnet.0g.ai`

**Explorer:** `https://chainscan-galileo.0g.ai`

**Docs:** https://docs.0g.ai/developer-hub/building-on-0g/contracts

---

### Storage (`@0glabs/0g-ts-sdk`)

Uploads and retrieves files from 0G decentralized storage. Files are split into chunks, Merkle-tree verified, and dispersed across storage nodes. The Merkle root (`rootHash`) is recorded on-chain as a permanent content address.

**Key files:**
- `packages/web/app/api/upload/route.ts` — server-side upload handler
- `packages/web/app/api/download/[rootHash]/route.ts` — server-side download handler
- `packages/web/lib/0g-storage.ts` — client helpers (`uploadFile`, `downloadFile`)
- `packages/web/components/StorageSection.tsx` — upload/download UI

**Key SDK calls:**
```ts
import { ZgFile, Indexer } from "@0glabs/0g-ts-sdk";

const zgFile = await ZgFile.fromFilePath(tmpPath);
const [tree, err] = await zgFile.merkleTree();          // build Merkle tree
const [tx, uploadErr] = await indexer.upload(zgFile, RPC_URL, signer as any);
// tx.rootHash = permanent content address
// tx.txHash   = on-chain submission transaction

const dlErr = await indexer.download(rootHash, outPath, false); // retrieve by root hash
```

> **Note:** `scripts/patch-0g-sdk.js` patches the SDK's ABI to match the current testnet `FixedPriceFlow` contract. It runs automatically on `npm install` via `postinstall`.

**Docs:** https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk

---

### Compute (`@0glabs/0g-serving-broker`)

Routes AI inference through the 0G compute network. Every query is cryptographically verified and paid for on-chain using OG tokens via a ledger/escrow system. The API is OpenAI-compatible.

**Key files:**
- `packages/web/app/api/compute/broker.ts` — broker singleton, ledger management
- `packages/web/app/api/compute/route.ts` — inference endpoint
- `packages/web/app/api/compute/setup/route.ts` — one-time provider setup
- `packages/web/components/ComputeSection.tsx` — chat UI

**Payment flow:**
1. `broker.ledger.addLedger(3)` — deposit 3 OG into on-chain escrow (one-time per wallet)
2. `broker.inference.acknowledgeProviderSigner(providerAddress)` — whitelist the provider
3. `broker.ledger.transferFund(providerAddress, "inference", 1_OG)` — fund provider sub-account
4. `broker.inference.getRequestHeaders(providerAddress, query)` — sign each request off-chain
5. HTTP call to provider's OpenAI-compatible endpoint
6. `broker.inference.processResponse(providerAddress, chatId, content)` — settle micropayment

**Key SDK calls:**
```ts
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";

const broker = await createZGComputeNetworkBroker(signer);
const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
const headers = await broker.inference.getRequestHeaders(providerAddress, query);
// use with openai client: new OpenAI({ baseURL: endpoint }).chat.completions.create(...)
await broker.inference.processResponse(providerAddress, chatId, content);
```

**Env vars required:**
```
PRIVATE_KEY=       # pays for inference (server-side only)
```

> **Important:** Run provider setup once per wallet. Each setup call transfers 1 OG to the provider sub-account.

**Docs:** https://docs.0g.ai/developer-hub/building-on-0g/compute-network/inference

---

### INFT — Intelligent NFTs (`@0glabs/0g-ts-sdk` + ERC-721)

Mints ERC-721 tokens whose metadata lives on 0G decentralized storage. The `storageRoot` (Merkle root of the metadata file) and `metadataHash` (keccak256 of the JSON) are recorded on-chain, making metadata verifiable and tamper-proof.

**Key files:**
- `packages/contracts/contracts/INFT.sol` — ERC-721 contract with `mint(to, storageRoot, metadataHash)`
- `packages/contracts/scripts/deployINFT.ts` — deploys and writes address to `.env.local`
- `packages/web/app/api/inft/mint/route.ts` — uploads metadata to 0G Storage then mints on-chain
- `packages/web/app/api/inft/token/route.ts` — fetches token owner + metadata from chain + storage
- `packages/web/lib/0g-inft.ts` — client helpers (`mintINFT`, `getToken`)
- `packages/web/components/INFTSection.tsx` — mint + lookup UI

**Mint flow:**
```ts
// 1. Build metadata JSON
const metadata = { name, description, createdAt: Date.now() };

// 2. Upload to 0G Storage → get storageRoot
const [tx] = await indexer.upload(zgFile, RPC_URL, signer as any);
const storageRoot = tx.rootHash;

// 3. Compute metadata hash for tamper detection
const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(metadata)));

// 4. Mint on-chain — records ownership + both hashes permanently
await contract.mint(recipient, storageRoot, metadataHash);

// 5. Parse INFTMinted event for tokenId
```

**Env vars required:**
```
PRIVATE_KEY=                    # deploy + sign storage + pay gas
NEXT_PUBLIC_INFT_ADDRESS=       # auto-populated after `npm run deploy`
STORAGE_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
```

**Docs:** https://docs.0g.ai/developer-hub/building-on-0g/inft/integration

---

## Environment Variables

All env vars live in `packages/web/.env.local` (copied from `.env.example` on scaffold).

| Variable | Required for | Description |
|---|---|---|
| `NEXT_PUBLIC_RPC_URL` | All | 0G Galileo EVM RPC |
| `NEXT_PUBLIC_CHAIN_ID` | All | `16602` (Galileo testnet) |
| `PRIVATE_KEY` | Contracts, Storage, Compute, INFT | Server-side signing key. Never exposed to browser. |
| `STORAGE_INDEXER_RPC` | Storage, INFT | 0G Storage indexer endpoint |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Contracts | Auto-written by deploy script |
| `NEXT_PUBLIC_INFT_ADDRESS` | INFT | Auto-written by deploy script |

---

## Testnet Resources

| Resource | URL |
|---|---|
| Faucet (get OG tokens) | https://faucet.0g.ai |
| Explorer | https://chainscan-galileo.0g.ai |
| RPC | https://evmrpc-testnet.0g.ai |
| Storage Indexer | https://indexer-storage-testnet-turbo.0g.ai |
| 0G Docs | https://docs.0g.ai |

---

## Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Wallet:** wagmi 2 + viem (0G Galileo chain pre-configured)
- **Contracts:** Hardhat, Solidity, ethers v6
- **Storage:** `@0glabs/0g-ts-sdk`
- **Compute:** `@0glabs/0g-serving-broker`
- **INFT:** `@0glabs/0g-ts-sdk` + OpenZeppelin ERC-721
