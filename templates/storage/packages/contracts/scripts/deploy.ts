import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying FileRegistry with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "OG");

  const FileRegistry = await ethers.getContractFactory("FileRegistry");
  const registry = await FileRegistry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("FileRegistry deployed to:", address);

  // Write the address to a file so `npm run verify` can pick it up
  fs.writeFileSync(path.join(__dirname, "../.deployed-address"), address);

  // Also update the web package's .env.local so the frontend picks it up immediately
  const envPath = path.join(__dirname, "../../web/.env.local");
  if (fs.existsSync(envPath)) {
    let env = fs.readFileSync(envPath, "utf8");
    if (env.includes("NEXT_PUBLIC_CONTRACT_ADDRESS=")) {
      env = env.replace(/NEXT_PUBLIC_CONTRACT_ADDRESS=.*/, `NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
    } else {
      env += `\nNEXT_PUBLIC_CONTRACT_ADDRESS=${address}`;
    }
    fs.writeFileSync(envPath, env);
    console.log("Updated web/.env.local with contract address");
  }

  console.log("\nNext steps:");
  console.log(`  npm run verify   — verify on 0G explorer`);
  console.log(`  View on explorer: https://chainscan-galileo.0g.ai/address/${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
