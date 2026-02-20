import { createZGServingNetworkBroker } from "@0glabs/0g-serving-user-broker";
import { ethers } from "ethers";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://evmrpc-test.0g.ai";

export async function getbroker(signer: ethers.Signer) {
  return createZGServingNetworkBroker(signer, { chainId: 16601, rpcUrl: RPC_URL });
}

export async function listModels(signer: ethers.Signer) {
  const broker = await getbroker(signer);
  const services = await broker.listService();
  return services;
}

export async function chat(
  signer: ethers.Signer,
  providerAddress: string,
  modelName: string,
  messages: { role: string; content: string }[]
) {
  const broker = await getbroker(signer);
  await broker.acknowledgeProviderSigner(providerAddress);
  const { endpoint, model } = await broker.getServiceMetadata(providerAddress, modelName);
  const headers = await broker.getRequestHeaders(providerAddress, modelName, JSON.stringify(messages));

  const response = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ model, messages, max_tokens: 1024 }),
  });

  if (!response.ok) throw new Error(`Inference request failed: ${response.statusText}`);
  await broker.processResponse(providerAddress, response.clone(), modelName);

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}
