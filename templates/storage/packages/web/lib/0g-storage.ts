import { Indexer, ZgFile } from "@0glabs/0g-ts-sdk";
import { ethers } from "ethers";

const INDEXER_URL =
  process.env.NEXT_PUBLIC_STORAGE_INDEXER ?? "https://indexer-storage-testnet-standard.0g.ai";

export async function uploadFile(file: File, signer: ethers.Signer): Promise<{ contentId: string }> {
  const zgFile = await ZgFile.fromNodeFileBuffer(
    Buffer.from(await file.arrayBuffer()),
    file.name
  );
  const [tree, treeErr] = await zgFile.merkleTree();
  if (treeErr || !tree) throw new Error(`Failed to build merkle tree: ${treeErr}`);
  const contentId = tree.rootHash();
  const indexer = new Indexer(INDEXER_URL);
  const [, uploadErr] = await indexer.upload(zgFile, 0, signer);
  if (uploadErr) throw new Error(`Upload failed: ${uploadErr}`);
  return { contentId };
}

export async function downloadFile(contentId: string): Promise<Blob> {
  const indexer = new Indexer(INDEXER_URL);
  const buffer = await indexer.download(contentId);
  return new Blob([buffer]);
}
