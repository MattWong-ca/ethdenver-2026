import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://evmrpc-testnet.0g.ai";

export const PROVIDERS: Record<string, string> = {
  "qwen/qwen-2.5-7b-instruct": "0xa48f01287233509FD694a22Bf840225062E67836",
};

// Use globalThis so state survives Next.js hot module reloads in dev mode
const g = globalThis as any;
if (!g._zgBroker) g._zgBroker = null;
if (!g._zgProviderReady) g._zgProviderReady = new Set<string>();

export function getProviderReady(): Set<string> {
  return g._zgProviderReady;
}

export function getSigner() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("PRIVATE_KEY is not set in .env.local");
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Wallet(privateKey, provider);
}

export async function getBroker() {
  if (g._zgBroker) return g._zgBroker;

  const signer = getSigner();
  const broker = await createZGComputeNetworkBroker(signer);

  const MIN_BALANCE = BigInt("3000000000000000000"); // 3 OG minimum
  try {
    const ledger = await broker.ledger.getLedger();
    if (ledger.availableBalance < MIN_BALANCE) {
      console.log("[compute] balance low, topping up...");
      await broker.ledger.depositFund(3);
    }
  } catch (e) {
    const msg = (e as Error).message ?? "";
    if (msg.includes("does not exist") || msg.includes("add-account")) {
      console.log("[compute] creating ledger with 3 OG deposit...");
      await broker.ledger.addLedger(3);
    } else {
      throw e;
    }
  }

  g._zgBroker = broker;
  return broker;
}

export async function setupProvider(
  broker: Awaited<ReturnType<typeof createZGComputeNetworkBroker>>,
  providerAddress: string
) {
  console.log("[compute] running one-time provider setup for", providerAddress);
  await broker.inference.acknowledgeProviderSigner(providerAddress);
  await broker.ledger.transferFund(providerAddress, "inference", BigInt("1000000000000000000")); // 1 OG
  g._zgProviderReady.add(providerAddress);
  console.log("[compute] provider setup done");
}
