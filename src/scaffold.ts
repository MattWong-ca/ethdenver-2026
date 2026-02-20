import fs from "fs-extra";
import path from "path";

export interface Features {
  projectName: string;
  contracts: boolean;
  storage: boolean;
  compute: boolean;
}

const TEMPLATES_DIR = path.join(__dirname, "..", "templates");

export function scaffold(features: Features, targetDir: string) {
  const { contracts, storage, compute } = features;

  // 0. Ensure all required directories exist
  fs.ensureDirSync(path.join(targetDir, "packages", "web", "app"));

  // 1. Always copy base
  fs.copySync(path.join(TEMPLATES_DIR, "base"), targetDir, { filter: noDeps });

  // 2. Conditionally copy feature files (lib + components only — no package.json overlap)
  if (contracts) {
    fs.copySync(path.join(TEMPLATES_DIR, "contracts"), targetDir, { filter: noDeps });
  }
  if (storage) {
    fs.copySync(path.join(TEMPLATES_DIR, "storage"), targetDir, { filter: noDeps });
  }
  if (compute) {
    fs.copySync(path.join(TEMPLATES_DIR, "compute"), targetDir, { filter: noDeps });
  }

  // 3. Generate dynamic files
  writeRootPackageJson(targetDir, features);
  writeWebPackageJson(targetDir, features);
  writeEnvExample(targetDir, features);
  writePageTsx(targetDir, features);
  writePageCss(targetDir);
  writeReadme(targetDir, features);

  // 4. Rename _gitignore → .gitignore
  const gi = path.join(targetDir, "_gitignore");
  if (fs.existsSync(gi)) fs.moveSync(gi, path.join(targetDir, ".gitignore"));

  // 5. Copy .env.example → .env.local
  const envEx = path.join(targetDir, "packages", "web", ".env.example");
  const envLocal = path.join(targetDir, "packages", "web", ".env.local");
  if (fs.existsSync(envEx) && !fs.existsSync(envLocal)) fs.copySync(envEx, envLocal);
}

function noDeps(src: string) {
  const rel = path.relative(TEMPLATES_DIR, src);
  return !rel.includes("node_modules") && !rel.includes(".next");
}

function writeRootPackageJson(targetDir: string, { projectName, contracts, storage }: Features) {
  const workspaces = ["packages/web"];
  if (contracts) workspaces.push("packages/contracts");

  const scripts: Record<string, string> = {
    dev: "npm run dev --workspace=packages/web",
    build: "npm run build --workspace=packages/web",
  };
  if (storage) {
    scripts.postinstall = "node scripts/patch-0g-sdk.js";
  }
  if (contracts) {
    scripts.deploy = "npm run compile --workspace=packages/contracts && npm run deploy --workspace=packages/contracts";
    scripts.verify = "npm run verify --workspace=packages/contracts";
  }

  fs.writeFileSync(
    path.join(targetDir, "package.json"),
    JSON.stringify({ name: projectName, version: "0.1.0", private: true, workspaces, scripts }, null, 2)
  );
}

function writeWebPackageJson(targetDir: string, { storage, compute }: Features) {
  const deps: Record<string, string> = {
    "@tanstack/react-query": "^5.62.0",
    next: "^15.0.0",
    react: "^19.0.0",
    "react-dom": "^19.0.0",
    viem: "^2.21.0",
    wagmi: "^2.13.0",
  };
  if (storage) {
    deps["@0glabs/0g-ts-sdk"] = "^0.3.3";
    deps["ethers"] = "^6.13.0";
  }
  if (compute) {
    deps["@0glabs/0g-serving-broker"] = "0.6.2";
    deps["openai"] = "^4.28.0";
    if (!deps["ethers"]) deps["ethers"] = "^6.13.0";
  }

  const pkg = {
    name: "web",
    version: "0.1.0",
    private: true,
    scripts: { dev: "next dev", build: "next build", start: "next start", lint: "next lint" },
    dependencies: deps,
    devDependencies: {
      "@types/node": "^22.0.0",
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
      typescript: "^5.7.0",
    },
  };

  fs.writeFileSync(
    path.join(targetDir, "packages", "web", "package.json"),
    JSON.stringify(pkg, null, 2)
  );
}

function writeEnvExample(targetDir: string, { contracts, storage, compute }: Features) {
  const lines = [
    "# 0G Galileo Testnet",
    "NEXT_PUBLIC_CHAIN_ID=16602",
    "NEXT_PUBLIC_RPC_URL=https://evmrpc-testnet.0g.ai",
  ];
  if (storage) {
    lines.push("STORAGE_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai");
  }
  if (compute || contracts) {
    lines.push("");
    lines.push("# Private key — used server-side for compute inference payments and/or Hardhat deploy");
    lines.push("# Never committed or exposed to the browser. Get testnet OG at https://faucet.0g.ai");
    lines.push("PRIVATE_KEY=");
  }
  if (storage && !contracts) {
    lines.push("");
    lines.push("# Private key for signing storage transactions — never commit this");
    lines.push("# Get testnet OG at https://faucet.0g.ai");
    lines.push("PRIVATE_KEY=");
  }
  if (contracts) {
    lines.push("");
    lines.push("# Populated automatically after `npm run deploy`");
    lines.push("NEXT_PUBLIC_CONTRACT_ADDRESS=");
  }

  fs.writeFileSync(path.join(targetDir, "packages", "web", ".env.example"), lines.join("\n") + "\n");
}

function writePageTsx(targetDir: string, { storage, compute }: Features) {
  const hasFeatures = storage || compute;

  const imports = [
    ...(storage ? [`import { StorageSection } from "@/components/StorageSection";`] : []),
    ...(compute ? [`import { ComputeSection } from "@/components/ComputeSection";`] : []),
  ];

  const body = hasFeatures
    ? `
  return (
    <main className={styles.main}>
      ${storage ? "<StorageSection />" : ""}
      ${compute ? "<ComputeSection />" : ""}
    </main>
  );`
    : `
  return (
    <main className={styles.landing}>
      <div className={styles.card}>
        <h1 className={styles.title}><span className={styles.accent}>create</span>-0g-app</h1>
        <p className={styles.subtitle}>Your 0G app is ready. Start editing:</p>
        <ul className={styles.steps}>
          <li>
            <span className={styles.label}>Frontend</span>
            <code className={styles.path}>packages/web/app/page.tsx</code>
          </li>
        </ul>
        <div className={styles.links}>
          <a href="https://docs.0g.ai" target="_blank" rel="noopener noreferrer">Docs ↗</a>
          <a href="https://faucet.0g.ai" target="_blank" rel="noopener noreferrer">Faucet ↗</a>
          <a href="https://chainscan-galileo.0g.ai" target="_blank" rel="noopener noreferrer">Explorer ↗</a>
        </div>
      </div>
    </main>
  );`;

  const content = `"use client";
import styles from "./page.module.css";
${imports.join("\n")}

export default function Home() {${body}
}
`;

  fs.writeFileSync(path.join(targetDir, "packages", "web", "app", "page.tsx"), content);
}

function writePageCss(targetDir: string) {
  const css = `
.main {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}

/* Landing (no features selected) */
.landing {
  min-height: calc(100vh - 56px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.card { display: flex; flex-direction: column; gap: 28px; max-width: 480px; width: 100%; }
.title { font-size: 2.2rem; font-weight: 700; letter-spacing: -0.04em; }
.accent { color: var(--accent); }
.subtitle { color: var(--muted); font-size: 0.95rem; margin-top: -16px; }
.steps { list-style: none; display: flex; flex-direction: column; gap: 12px; }
.steps li {
  display: flex; flex-direction: column; gap: 6px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 10px; padding: 14px 16px;
}
.label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); }
.path { font-family: monospace; font-size: 0.9rem; }
.links { display: flex; gap: 20px; }
.links a { font-size: 0.85rem; color: var(--muted); text-decoration: none; transition: color 0.15s; }
.links a:hover { color: var(--accent); }
`.trimStart();

  fs.writeFileSync(path.join(targetDir, "packages", "web", "app", "page.module.css"), css);
}

function writeReadme(targetDir: string, { projectName, contracts, storage, compute }: Features) {
  const lines = [
    `# ${projectName}`,
    "",
    "Built with [create-0g-app](https://www.npmjs.com/package/create-0g-app) on the [0G network](https://0g.ai).",
    "",
    "## Quick Start",
    "",
    "```bash",
    "npm install",
    "cp packages/web/.env.example packages/web/.env.local",
    "# Edit .env.local with your config",
    "npm run dev",
    "```",
  ];

  if (contracts) {
    lines.push("", "## Deploy Contract", "", "```bash", "npm run deploy", "npm run verify", "```");
  }
  if (storage) {
    lines.push("", "## Storage", "", "Files are uploaded to 0G decentralized storage via `@0glabs/0g-ts-sdk`.", "Edit `packages/web/components/StorageSection.tsx` to customize.");
  }
  if (compute) {
    lines.push("", "## Compute", "", "AI inference is routed through the 0G compute network via `@0glabs/0g-serving-broker`.", "Edit `packages/web/components/ComputeSection.tsx` to customize.");
  }

  lines.push("", "## Resources", "", "- [0G Docs](https://docs.0g.ai)", "- [Faucet](https://faucet.0g.ai)", "- [Explorer](https://chainscan-galileo.0g.ai)");

  fs.writeFileSync(path.join(targetDir, "README.md"), lines.join("\n") + "\n");
}
