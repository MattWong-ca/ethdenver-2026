import { NextRequest, NextResponse } from "next/server";
import { getBroker, setupProvider, PROVIDERS } from "../broker";

// POST /api/compute/setup — one-time provider setup per wallet
// Runs acknowledgeProviderSigner + transferFund (1 OG) for the given model's provider.
// This is on-chain state tied to your wallet address — only needs to run once ever,
// but must be re-run after a server restart since the in-memory cache is cleared.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const model = body.model ?? "qwen/qwen-2.5-7b-instruct";
    const providerAddress = PROVIDERS[model] ?? PROVIDERS["qwen/qwen-2.5-7b-instruct"];

    const broker = await getBroker();
    await setupProvider(broker, providerAddress);

    return NextResponse.json({ success: true, providerAddress });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
