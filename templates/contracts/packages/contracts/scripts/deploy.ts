import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const MyContract = await ethers.getContractFactory("MyContract");
  const contract = await MyContract.deploy("Hello from 0G!");
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("MyContract deployed to:", address);

  fs.writeFileSync(path.join(__dirname, "../.deployed-address"), address);

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

  console.log(`\nView on explorer: https://chainscan-galileo.0g.ai/address/${address}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
