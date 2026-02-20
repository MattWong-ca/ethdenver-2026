import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import OpenAI from "openai";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://evmrpc-testnet.0g.ai";

// Active testnet providers (verified on 0G Galileo testnet)
const PROVIDERS: Record<string, string> = {
  "qwen/qwen-2.5-7b-instruct": "0xa48f01287233509FD694a22Bf840225062E67836",
};

function getSigner() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("PRIVATE_KEY is not set in .env.local");
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Wallet(privateKey, provider);
}

async function getBroker() {
  const signer = getSigner();
  const broker = await createZGComputeNetworkBroker(signer);

  try {
    await broker.ledger.getLedger();
  } catch (e) {
    const msg = (e as Error).message ?? "";
    if (msg.includes("does not exist") || msg.includes("add-account")) {
      console.log("Creating ledger account with 0.1 OG deposit...");
      await broker.ledger.addLedger(0.1);
    } else {
      throw e;
    }
  }

  return broker;
}

// GET /api/compute — list available models
export async function GET() {
  try {
    const broker = await getBroker();
    const services = await broker.inference.listService();
    const safe = JSON.parse(JSON.stringify(services, (_, v) => (typeof v === "bigint" ? v.toString() : v)));
    return NextResponse.json({ models: Object.keys(PROVIDERS), services: safe });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/compute — send a query
export async function POST(req: NextRequest) {
  try {
    const { model, messages } = await req.json();

    if (!model || !messages) {
      return NextResponse.json({ error: "model and messages are required" }, { status: 400 });
    }

    const providerAddress = PROVIDERS[model] ?? PROVIDERS["qwen/qwen-2.5-7b-instruct"];

    const broker = await getBroker();

    // Acknowledge provider (safe to call multiple times)
    await broker.inference.acknowledgeProviderSigner(providerAddress);

    // Get endpoint + model name from provider metadata
    const { endpoint, model: modelName } = await broker.inference.getServiceMetadata(providerAddress);

    // Get single-use auth headers
    const query = JSON.stringify(messages);
    const headers = await broker.inference.getRequestHeaders(providerAddress, query);

    // Call the provider via OpenAI-compatible API
    const openai = new OpenAI({ baseURL: endpoint, apiKey: "" });
    const completion = await openai.chat.completions.create(
      { model: modelName, messages, max_tokens: 1024 },
      { headers: headers as Record<string, string> }
    );

    const content = completion.choices[0].message.content ?? "";
    const chatId = completion.id;

    // Settle payment
    const isValid = await broker.inference.processResponse(providerAddress, chatId, content);

    return NextResponse.json({ content, model, isValid });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
