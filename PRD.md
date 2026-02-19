# PRD: `create-0g-app` — Zero-Config Scaffold CLI for 0G

## Overview

`create-0g-app` is a CLI scaffolding tool (invoked via `npx create-0g-app`) that generates a fully wired, runnable dApp for the 0G decentralized AI network. Developers pick a template, answer a few prompts, and immediately have a working project with a smart contract, frontend, and 0G storage/compute integration — no manual SDK wiring required.

---

## Pros & Cons

### Pros
- **Directly called out by the bounty** — the judges wrote this exact project name as a positive example. Lowest ambiguity of any idea.
- **High usefulness score (30%)** — removes the biggest onboarding friction: getting a first working project running.
- **Highly reusable (15%)** — every future 0G builder can use it. DevRel can promote it long-term.
- **Demo-friendly** — judges can watch `npx create-0g-app demo` run live. Very concrete.
- **Scoped to a hackathon timeline** — a CLI + 2-3 templates is achievable in 2 days.
- **Existing starter kits to build from** — 0G already has storage/compute starter repos we can template-ize.

### Cons
- **Predictable** — other teams may attempt the same thing. Must be noticeably more polished.
- **Breadth vs. depth tradeoff** — 3 shallow templates is worse than 1 excellent one. Scope must be controlled.
- **Node/npm ecosystem complexity** — cross-platform CLI behavior (Windows paths, npx caching) can be fiddly.
- **Testnet dependency** — deploy steps require faucet funds and testnet availability, which can fail during a live demo.

---

## Goals

1. A developer can run one command and have a working, locally runnable 0G dApp in under 2 minutes.
2. The generated project compiles, deploys a contract, and verifies it on the 0G Galileo testnet with a single follow-up command.
3. Three templates cover the three core 0G use cases: Storage, Compute (inference), and AI Agent.
4. The tool and all generated projects are fully open source with clear setup steps.

## Non-Goals

- Mainnet deployment support (testnet only for hackathon scope)
- GUI / browser-based scaffold wizard
- Plugin system or extensibility framework
- Custom Hardhat/Foundry plugin packages (contracts live inside each template, not as standalone plugins)

---

## User Stories

**As a developer new to 0G**, I want to run `npx create-0g-app my-project` and choose a template, so I can have a working example to learn from without reading the entire docs.

**As a hackathon builder**, I want to run one deploy command that handles contract deployment AND storage/compute setup, so I can focus on my idea instead of config.

**As a DevRel engineer at 0G**, I want a canonical scaffold tool I can link to in docs and workshops, so onboarding new developers is a one-liner.

---

## Project Structure (All Templates)

Every generated project is a monorepo with two packages:

```
my-dapp/
├── packages/
│   ├── contracts/               (Hardhat — Solidity, compile, deploy, verify)
│   │   ├── contracts/
│   │   │   └── *.sol
│   │   ├── scripts/
│   │   │   └── deploy.ts
│   │   ├── hardhat.config.ts    (pre-configured for 0G Galileo)
│   │   └── package.json
│   └── web/                     (Next.js + wagmi + 0G SDKs)
│       ├── app/
│       ├── lib/
│       │   ├── 0g-storage.ts    (SDK wrapper, storage templates only)
│       │   └── 0g-compute.ts    (SDK wrapper, compute templates only)
│       ├── .env.example
│       └── package.json
├── package.json                 (workspace root with shared scripts)
└── README.md
```

**Root scripts:**
```
npm run dev        → starts Next.js dev server
npm run deploy     → compiles + deploys contract to Galileo, then starts frontend
npm run verify     → verifies contract on 0G explorer
```

---

## Templates

### Template 1: `storage` (Core — ship this first)

**Concept:** A file registry dApp. Files are stored on 0G's decentralized storage network; the on-chain contract records provenance (who uploaded what, and when).

**Contract — `FileRegistry.sol`:**
- `uploadFile(string calldata contentId, string calldata filename)` — stores content ID on-chain
- `getFiles(address owner)` — returns all content IDs for a wallet
- Emits `FileUploaded(address indexed owner, string contentId, uint256 timestamp)`

**Frontend:**
- Drag-and-drop file upload UI
- Upload flow: file → 0G storage SDK (`indexer.upload()`) → get content ID → write to contract
- Gallery view: reads content IDs from contract, downloads files from 0G storage on demand
- Wallet connect via wagmi

**Why this pattern matters:** On-chain provenance + off-chain data is the core 0G value prop. This demonstrates it concretely.

---

### Template 2: `compute` (AI Inference)

**Concept:** A decentralized chat interface where inference is paid for and settled on-chain via 0G's compute network.

**Contract — `InferenceLogger.sol`:**
- `logQuery(string calldata modelId, string calldata queryHash)` — lightweight on-chain record of queries
- `getQueryCount(address user)` — returns number of queries made
- Gives the template an on-chain footprint and demonstrates contract + SDK co-existence

**Frontend:**
- Simple chat UI with model selector (populated via `listService()`)
- Inference flow: `getRequestHeaders()` → fetch to 0G inference endpoint → `processResponse()`
- Wallet connect for on-chain fee settlement via `@0glabs/0g-serving-user-broker`
- Query history pulled from on-chain log

---

### Template 3: `agent` (AI Agent + Storage)

**Concept:** An autonomous agent that accepts tasks on-chain, runs inference via 0G compute, stores results to 0G storage, and posts the result content ID back on-chain.

**Contract — `AgentTaskRegistry.sol`:**
- `submitTask(string calldata prompt)` — creates a task on-chain, emits event
- `completeTask(uint256 taskId, string calldata resultCid)` — agent writes result CID on-chain
- `getTask(uint256 taskId)` — returns task status + result CID

**Backend (Next.js API route `/api/agent`):**
- Listens for `TaskSubmitted` events
- Calls 0G inference with the prompt
- Stores result to 0G storage, gets content ID
- Calls `completeTask()` on the contract with the CID

**Frontend:**
- Submit a task (e.g., "summarize this text")
- Poll task status from contract
- Download and display result from 0G storage by content ID

---

## CLI UX Flow

```
$ npx create-0g-app my-dapp

  ╔═══════════════════════════════════╗
  ║       create-0g-app  v1.0.0       ║
  ╚═══════════════════════════════════╝

  ? Which template would you like to use?
  ❯  storage   — File registry (storage SDK + on-chain provenance)
     compute   — Decentralized chat (inference SDK + on-chain logging)
     agent     — Autonomous agent (storage + compute + task contract)

  ? Package manager:
  ❯  npm
     pnpm
     yarn

  ✔ Scaffolding project in ./my-dapp
  ✔ Installing dependencies
  ✔ Writing .env from .env.example

  ─────────────────────────────────────
  Your 0G app is ready! Next steps:

    cd my-dapp
    # Add your private key to .env
    npm run dev       → local dev server (no deploy needed)
    npm run deploy    → compile + deploy contract to Galileo testnet
    npm run verify    → verify contract on 0G explorer
  ─────────────────────────────────────
```

---

## Technical Architecture

### CLI package

```
create-0g-app/
├── bin/
│   └── index.ts                 (CLI entrypoint)
├── templates/
│   ├── storage/
│   ├── compute/
│   └── agent/
└── package.json
```

### Key dependencies (CLI package)
| Package | Purpose |
|---|---|
| `@clack/prompts` | Interactive CLI prompts |
| `picocolors` | Colored terminal output |
| `fs-extra` | Template file copying |
| `node` >= 18 | Native fetch, ESM support |

### Key dependencies (generated `contracts/` package)
| Package | Purpose |
|---|---|
| `hardhat` | Compile, deploy, verify Solidity |
| `@nomicfoundation/hardhat-toolbox` | ethers, chai, typechain bundled |
| `viem` | Lightweight EVM interaction in deploy scripts |

### Key dependencies (generated `web/` package)
| Package | Purpose |
|---|---|
| `@0glabs/0g-ts-sdk` | Storage upload/download |
| `@0glabs/0g-serving-user-broker` | Compute inference + payments |
| `wagmi` + `viem` | Wallet connection + contract reads/writes |
| `next` 15 | Frontend framework |

---

## Network Configuration (pre-filled in `.env.example`)

```env
# 0G Galileo Testnet
NEXT_PUBLIC_CHAIN_ID=16601
NEXT_PUBLIC_RPC_URL=https://evmrpc-test.0g.ai
NEXT_PUBLIC_STORAGE_INDEXER=https://indexer-storage-testnet-standard.0g.ai
NEXT_PUBLIC_STORAGE_RPC=https://rpc-storage-testnet.0g.ai

# Hardhat deploy (server-side only — never commit)
PRIVATE_KEY=

# Populated automatically after `npm run deploy`
NEXT_PUBLIC_CONTRACT_ADDRESS=
```

### Hardhat config (pre-configured for 0G)
```ts
// hardhat.config.ts
networks: {
  "0g-galileo": {
    url: process.env.RPC_URL ?? "https://evmrpc-test.0g.ai",
    chainId: 16601,
    accounts: [process.env.PRIVATE_KEY!],
  }
},
etherscan: {
  apiKey: { "0g-galileo": "no-api-key-needed" },
  customChains: [{
    network: "0g-galileo",
    chainId: 16601,
    urls: { apiURL: "https://chainscan-galileo.0g.ai/api", browserURL: "https://chainscan-galileo.0g.ai" }
  }]
}
```

---

## Milestones (Hackathon Timeline)

| # | Milestone | Owner | Done when |
|---|---|---|---|
| 1 | CLI scaffolding shell | Dev 1 | `npx create-0g-app` prompts and copies files into correct monorepo structure |
| 2 | `storage` template — contracts | Dev 1 | `FileRegistry.sol` compiles and deploys to Galileo |
| 3 | `storage` template — frontend | Dev 1 | Upload + download + on-chain log works end-to-end |
| 4 | `compute` template | Dev 2 | Chat UI completes inference round-trip + `InferenceLogger` logs on-chain |
| 5 | `agent` template | Dev 2 | Agent task runs end-to-end: submit → infer → store → CID on-chain |
| 6 | Polish + README | Both | `npm run dev` works fresh from scaffold, README has copy-paste steps + troubleshooting |
| 7 | Publish to npm | Dev 1 | `npx create-0g-app` works globally without local install |

---

## Success Criteria (Judging Alignment)

| Criterion | Weight | How we hit it |
|---|---|---|
| Usefulness | 30% | Cuts time-to-first-working-app from hours to 2 minutes; covers contract + storage + compute |
| Quality & maintainability | 25% | Monorepo structure, typed SDK wrappers, Hardhat typechain, ESLint in generated projects |
| Clarity & documentation | 20% | README with copy-paste steps, inline comments in generated code, troubleshooting section |
| Reusability | 15% | Published to npm, 3 templates cover all major 0G use cases |
| Polish | 10% | Clack prompt UI, colored output, `npm run deploy` writes contract address to `.env` automatically |

---

## Open Questions

1. **Package manager**: Support `pnpm` workspaces in generated projects, or npm only to keep scope tight?
2. **Wallet connect**: Wagmi v2 (RainbowKit) or keep it minimal with a plain `window.ethereum` connector?
3. **Demo wallet**: Include a funded testnet demo wallet in the repo for live judging, or require judges to use the faucet?
4. **npm publish**: Publish under a personal npm account or create an `@0g-community` org?
5. **Contract verification**: Is the 0G Galileo explorer API compatible with Hardhat's `hardhat-verify` plugin out of the box, or will we need a custom verification script?
