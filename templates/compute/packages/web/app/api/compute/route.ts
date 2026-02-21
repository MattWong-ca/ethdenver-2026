import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getBroker, PROVIDERS, getProviderReady } from "./broker";

// GET /api/compute — provider setup status
export async function GET() {
  const ready = getProviderReady();
  const providerReady: Record<string, boolean> = {};
  for (const [model, addr] of Object.entries(PROVIDERS)) {
    providerReady[model] = ready.has(addr);
  }
  return NextResponse.json({ models: Object.keys(PROVIDERS), providerReady });
}

// POST /api/compute — inference only (run /api/compute/setup first)
export async function POST(req: NextRequest) {
  try {
    const { model, messages } = await req.json();

    if (!model || !messages) {
      return NextResponse.json({ error: "model and messages are required" }, { status: 400 });
    }

    const providerAddress = PROVIDERS[model] ?? PROVIDERS["qwen/qwen-2.5-7b-instruct"];

    const broker = await getBroker();

    const { endpoint, model: modelName } = await broker.inference.getServiceMetadata(providerAddress);
    const query = JSON.stringify(messages);
    const headers = await broker.inference.getRequestHeaders(providerAddress, query);

    const openai = new OpenAI({ baseURL: endpoint, apiKey: "" });
    const completion = await openai.chat.completions.create(
      { model: modelName, messages, max_tokens: 1024 },
      { headers: headers as Record<string, string> }
    );

    const content = completion.choices[0].message.content ?? "";
    const chatId = completion.id;

    // processResponse settles payment — non-fatal if it fails (inference already completed)
    let isValid = false;
    try {
      isValid = await broker.inference.processResponse(providerAddress, chatId, content);
    } catch (e) {
      console.warn("[compute] processResponse failed (settlement skipped):", (e as Error).message);
    }

    return NextResponse.json({ content, model, isValid });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
