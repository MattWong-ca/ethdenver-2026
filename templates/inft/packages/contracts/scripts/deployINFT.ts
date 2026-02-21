import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying INFT with account:", deployer.address);

  const INFT = await ethers.getContractFactory("INFT");
  const inft = await INFT.deploy("Intelligent NFT", "INFT");
  await inft.waitForDeployment();

  const address = await inft.getAddress();
  console.log("INFT deployed to:", address);

  fs.writeFileSync(path.join(__dirname, "../.deployed-inft-address"), address);

  const envPath = path.join(__dirname, "../../web/.env.local");
  if (fs.existsSync(envPath)) {
    let env = fs.readFileSync(envPath, "utf8");
    if (env.includes("NEXT_PUBLIC_INFT_ADDRESS=")) {
      env = env.replace(/NEXT_PUBLIC_INFT_ADDRESS=.*/, `NEXT_PUBLIC_INFT_ADDRESS=${address}`);
    } else {
      env += `\nNEXT_PUBLIC_INFT_ADDRESS=${address}`;
    }
    fs.writeFileSync(envPath, env);
    console.log("Updated web/.env.local with INFT address");
  }

  console.log(`\nView on explorer: https://chainscan-galileo.0g.ai/address/${address}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
