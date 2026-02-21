export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { Indexer, MemData } from "@0glabs/0g-ts-sdk";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://evmrpc-testnet.0g.ai";
const INDEXER_RPC = process.env.STORAGE_INDEXER_RPC ?? "https://indexer-storage-testnet-turbo.0g.ai";
const INFT_ADDRESS = process.env.NEXT_PUBLIC_INFT_ADDRESS ?? "";

const INFT_ABI = [
  "function mint(address to, string calldata encryptedURI, bytes32 metadataHash) external returns (uint256)",
  "event INFTMinted(uint256 indexed tokenId, address indexed owner, bytes32 metadataHash, string encryptedURI)",
];

export async function POST(req: NextRequest) {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) return NextResponse.json({ error: "PRIVATE_KEY not configured" }, { status: 500 });
  if (!INFT_ADDRESS) return NextResponse.json({ error: "NEXT_PUBLIC_INFT_ADDRESS not configured" }, { status: 500 });

  const { recipient, name, description } = await req.json() as {
    recipient: string;
    name: string;
    description: string;
  };

  if (!recipient || !name) {
    return NextResponse.json({ error: "recipient and name are required" }, { status: 400 });
  }

  // 1. Build metadata JSON
  const metadata = { name, description: description ?? "", createdAt: Date.now() };
  const metadataJSON = JSON.stringify(metadata);
  const metadataBytes = Buffer.from(metadataJSON, "utf-8");

  // 2. Upload metadata to 0G Storage via temp file
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(privateKey, provider);
  const indexer = new Indexer(INDEXER_RPC);

  const tmpPath = join(tmpdir(), `inft-meta-${randomBytes(8).toString("hex")}.json`);
  let storageRoot = "";

  try {
    await writeFile(tmpPath, metadataBytes);

    const { ZgFile } = await import("@0glabs/0g-ts-sdk");
    const zgFile = await ZgFile.fromFilePath(tmpPath);
    const [tree, treeErr] = await zgFile.merkleTree();
    if (treeErr || !tree) throw new Error(`Merkle tree error: ${treeErr}`);

    const [tx, uploadErr] = await indexer.upload(zgFile, RPC_URL, signer);
    if (uploadErr) throw new Error(`Storage upload error: ${uploadErr}`);
    await zgFile.close();

    storageRoot = tx.rootHash;
  } finally {
    await unlink(tmpPath).catch(() => {});
  }

  // 3. Compute metadata hash
  const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(metadataJSON));

  // 4. Mint INFT on-chain
  const contract = new ethers.Contract(INFT_ADDRESS, INFT_ABI, signer);
  const tx = await contract.mint(recipient, storageRoot, metadataHash);
  const receipt = await tx.wait();

  // 5. Parse tokenId from event
  const iface = new ethers.Interface(INFT_ABI);
  let tokenId = "0";
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === "INFTMinted") {
        tokenId = parsed.args.tokenId.toString();
        break;
      }
    } catch {}
  }

  return NextResponse.json({
    tokenId,
    metadataHash,
    storageRoot,
    txHash: receipt.hash,
  });
}
