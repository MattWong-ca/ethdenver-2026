#!/usr/bin/env node
import * as p from "@clack/prompts";
import pc from "picocolors";
import path from "path";
import fs from "fs-extra";
import { execSync } from "child_process";

const TEMPLATES = {
  storage: "File registry (storage SDK + on-chain provenance)",
  compute: "Decentralized chat (inference SDK + on-chain logging)",
  agent: "Autonomous agent (storage + compute + task contract)",
} as const;

type Template = keyof typeof TEMPLATES;

async function main() {
  console.log();
  console.log(
    pc.cyan(
      [
        "  ╔═══════════════════════════════════╗",
        "  ║     " + pc.bold("create-0g-app") + "  v1.0.0       ║",
        "  ╚═══════════════════════════════════╝",
      ].join("\n")
    )
  );
  console.log();

  p.intro(pc.bgCyan(pc.black(" 0G App Scaffolder ")));

  // Project name from CLI arg or prompt
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

  const template = await p.select({
    message: "Which template would you like to use?",
    options: Object.entries(TEMPLATES).map(([value, label]) => ({ value, label: `${value.padEnd(10)} — ${label}` })),
  });
  if (p.isCancel(template)) { p.cancel("Cancelled."); process.exit(0); }

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

  // Copy template
  s.start("Scaffolding project");
  const templateDir = path.join(__dirname, "..", "templates", template as Template);
  if (!fs.existsSync(templateDir)) {
    s.stop(pc.red(`Template "${template}" not found`));
    process.exit(1);
  }
  fs.copySync(templateDir, targetDir, {
    filter: (src) => !src.includes("node_modules") && !src.includes(".next"),
  });

  // Rename gitignore (npm strips .gitignore on publish)
  const gitignoreSrc = path.join(targetDir, "_gitignore");
  const gitignoreDest = path.join(targetDir, ".gitignore");
  if (fs.existsSync(gitignoreSrc)) fs.moveSync(gitignoreSrc, gitignoreDest);

  // Write .env from .env.example in web package
  const envExample = path.join(targetDir, "packages", "web", ".env.example");
  const envDest = path.join(targetDir, "packages", "web", ".env.local");
  if (fs.existsSync(envExample) && !fs.existsSync(envDest)) {
    fs.copySync(envExample, envDest);
  }

  s.stop(`Scaffolded project in ${pc.green(`./${projectName as string}`)}`);

  // Install dependencies — stream output directly so user can see progress
  console.log(pc.dim("\n  Installing dependencies... (this may take a minute, hang tight)\n"));
  try {
    execSync("npm install", { cwd: targetDir, stdio: "inherit" });
    console.log();
    p.log.success("Dependencies installed");
  } catch {
    p.log.warn("Dependency install failed — run `npm install` manually inside the project");
  }

  p.outro(
    [
      pc.green("Your 0G app is ready!"),
      "",
      "  " + pc.dim("Next steps:"),
      "",
      `    ${pc.cyan(`cd ${projectName as string}`)}`,
      `    ${pc.dim("# Add your private key to packages/web/.env.local")}`,
      `    ${pc.cyan("npm run dev")}     ${pc.dim("→ local dev server")}`,
      `    ${pc.cyan("npm run deploy")}  ${pc.dim("→ compile + deploy contract to Galileo testnet")}`,
      `    ${pc.cyan("npm run verify")}  ${pc.dim("→ verify contract on 0G explorer")}`,
      "",
      `  ${pc.dim("Docs: https://docs.0g.ai")}`,
    ].join("\n")
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
