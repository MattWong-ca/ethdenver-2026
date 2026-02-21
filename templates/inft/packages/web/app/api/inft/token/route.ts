export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://evmrpc-testnet.0g.ai";
const INFT_ADDRESS = process.env.NEXT_PUBLIC_INFT_ADDRESS ?? "";
const INDEXER_RPC = process.env.STORAGE_INDEXER_RPC ?? "https://indexer-storage-testnet-turbo.0g.ai";

const INFT_ABI = [
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function getMetadataHash(uint256 tokenId) external view returns (bytes32)",
  "function getEncryptedURI(uint256 tokenId) external view returns (string)",
];

export async function GET(req: NextRequest) {
  const tokenId = req.nextUrl.searchParams.get("id");
  if (!tokenId) return NextResponse.json({ error: "id is required" }, { status: 400 });
  if (!INFT_ADDRESS) return NextResponse.json({ error: "NEXT_PUBLIC_INFT_ADDRESS not configured" }, { status: 500 });

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(INFT_ADDRESS, INFT_ABI, provider);

  const [owner, metadataHash, storageRoot] = await Promise.all([
    contract.ownerOf(tokenId),
    contract.getMetadataHash(tokenId),
    contract.getEncryptedURI(tokenId),
  ]);

  // Attempt to retrieve + decode metadata from 0G Storage
  let metadata = null;
  try {
    const res = await fetch(
      `${INDEXER_RPC.replace(/\/$/, "")}/file?root=${storageRoot}`
    );
    if (res.ok) {
      const text = await res.text();
      metadata = JSON.parse(text);
    }
  } catch {}

  return NextResponse.json({ tokenId, owner, metadataHash, storageRoot, metadata });
}
