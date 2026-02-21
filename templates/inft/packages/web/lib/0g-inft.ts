export type MintResult = {
  tokenId: string;
  metadataHash: string;
  storageRoot: string;
  txHash: string;
};

export type TokenInfo = {
  tokenId: string;
  owner: string;
  metadataHash: string;
  storageRoot: string;
  metadata: {
    name: string;
    description: string;
    createdAt: number;
  } | null;
};

/** Mint a new INFT. Metadata is stored on 0G Storage; hash + storage root go on-chain. */
export async function mintINFT(
  recipient: string,
  name: string,
  description: string
): Promise<MintResult> {
  const res = await fetch("/api/inft/mint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient, name, description }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Fetch token info by ID (owner, metadata hash, storage root, decoded metadata). */
export async function getToken(tokenId: string): Promise<TokenInfo> {
  const res = await fetch(`/api/inft/token?id=${encodeURIComponent(tokenId)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
