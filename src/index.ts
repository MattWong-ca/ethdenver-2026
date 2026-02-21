#!/usr/bin/env node
import * as p from "@clack/prompts";
import pc from "picocolors";
import path from "path";
import fs from "fs-extra";
import { execSync } from "child_process";
import { scaffold } from "./scaffold";

async function main() {
  console.log();
  console.log(
    pc.cyan(
      [
        "  ╔═══════════════════════════════════╗",
        "  ║     " + pc.bold("create-0g-app") + "  v1.1.0         ║",
        "  ╚═══════════════════════════════════╝",
      ].join("\n")
    )
  );
  console.log();

  p.intro(pc.bgCyan(pc.black(" 0G App Scaffolder ")));

  // Project name
  let projectName = process.argv[2];
  if (!projectName) {
    const name = await p.text({
      message: "Project name:",
      placeholder: "my-0g-app",
      validate: (v) => {
        if (!v) return "Project name is required";
        if (!/^[a-z0-9-_]+$/i.test(v)) return "Only letters, numbers, hyphens and underscores";
      },
    });
    if (p.isCancel(name)) { p.cancel("Cancelled."); process.exit(0); }
    projectName = name as string;
  }

  // Feature selection
  const contracts = await p.confirm({ message: "Include on-chain contracts? (Hardhat + 0G Galileo)", initialValue: false });
  if (p.isCancel(contracts)) { p.cancel("Cancelled."); process.exit(0); }

  const storage = await p.confirm({ message: "Use 0G Storage?", initialValue: false });
  if (p.isCancel(storage)) { p.cancel("Cancelled."); process.exit(0); }

  const compute = await p.confirm({ message: "Use 0G Compute? (AI inference)", initialValue: false });
  if (p.isCancel(compute)) { p.cancel("Cancelled."); process.exit(0); }

  const inft = await p.confirm({ message: "Use 0G INFT? (Intelligent NFTs — metadata on 0G Storage)", initialValue: false });
  if (p.isCancel(inft)) { p.cancel("Cancelled."); process.exit(0); }

  const targetDir = path.resolve(process.cwd(), projectName as string);

  if (fs.existsSync(targetDir)) {
    const overwrite = await p.confirm({
      message: `Directory ${pc.yellow(projectName as string)} already exists. Overwrite?`,
      initialValue: false,
    });
    if (p.isCancel(overwrite) || !overwrite) { p.cancel("Cancelled."); process.exit(0); }
    fs.removeSync(targetDir);
  }

  const s = p.spinner();

  fs.ensureDirSync(targetDir);

  s.start("Scaffolding project");
  scaffold({ projectName: projectName as string, contracts: !!contracts, storage: !!storage, compute: !!compute, inft: !!inft }, targetDir);
  s.stop(`Scaffolded project in ${pc.green(`./${projectName as string}`)}`);

  // Install
  console.log(pc.dim("\n  Installing dependencies... (this may take a minute, hang tight)\n"));
  try {
    execSync("npm install", { cwd: targetDir, stdio: "inherit" });
    console.log();
    p.log.success("Dependencies installed");
  } catch {
    p.log.warn("Dependency install failed — run `npm install` manually");
  }

  const selectedFeatures = [
    contracts && "contracts",
    storage && "storage",
    compute && "compute",
    inft && "inft",
  ].filter(Boolean);

  const needsPrivateKey = !!(contracts || storage || compute || inft);

  p.outro(
    [
      pc.green("Your 0G app is ready!"),
      selectedFeatures.length > 0
        ? `  ${pc.dim("Features:")} ${selectedFeatures.map((f) => pc.cyan(f as string)).join(", ")}`
        : "",
      "",
      "  " + pc.dim("Next steps:"),
      "",
      `    ${pc.cyan(`cd ${projectName as string}`)}`,
      needsPrivateKey ? `    ${pc.yellow("⚠")}  Add your ${pc.bold("PRIVATE_KEY")} to ${pc.cyan(`${projectName as string}/packages/web/.env.local`)}` : "",
      needsPrivateKey ? `       ${pc.dim("Get testnet OG at https://faucet.0g.ai")}` : "",
      "",
      contracts ? `    ${pc.cyan("npm run deploy")}       ${pc.dim("→ deploy contract to Galileo testnet")}` : "",
      inft ? `    ${pc.cyan("npm run deploy:inft")}  ${pc.dim("→ deploy INFT contract to Galileo testnet")}` : "",
      `    ${pc.cyan("npm run dev")}          ${pc.dim("→ start local dev server")}`,
      "",
      `  ${pc.dim("Docs: https://docs.0g.ai")}`,
    ]
      .filter((l) => l !== "")
      .join("\n")
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
