"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { mintINFT, getToken } from "@/lib/0g-inft";
import type { MintResult, TokenInfo } from "@/lib/0g-inft";
import styles from "./INFTSection.module.css";

export function INFTSection() {
  const { address } = useAccount();

  // Mint form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [minting, setMinting] = useState(false);
  const [mintError, setMintError] = useState("");
  const [minted, setMinted] = useState<MintResult[]>([]);

  // Lookup form
  const [lookupId, setLookupId] = useState("");
  const [looking, setLooking] = useState(false);
  const [lookupResult, setLookupResult] = useState<TokenInfo | null>(null);
  const [lookupError, setLookupError] = useState("");

  const handleMint = async () => {
    if (!address) return setMintError("Connect your wallet first");
    if (!name.trim()) return setMintError("Name is required");
    setMinting(true);
    setMintError("");
    try {
      const result = await mintINFT(address, name, description);
      setMinted((prev) => [result, ...prev]);
      setName("");
      setDescription("");
    } catch (e) {
      setMintError(e instanceof Error ? e.message : "Mint failed");
    } finally {
      setMinting(false);
    }
  };

  const handleLookup = async () => {
    if (!lookupId.trim()) return;
    setLooking(true);
    setLookupError("");
    setLookupResult(null);
    try {
      const result = await getToken(lookupId);
      setLookupResult(result);
    } catch (e) {
      setLookupError(e instanceof Error ? e.message : "Token not found");
    } finally {
      setLooking(false);
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>INFT</h2>
      <p className={styles.description}>
        Mint Intelligent NFTs — metadata stored on 0G Storage, ownership on 0G Chain. <a className={styles.docsLink} href="https://docs.0g.ai/developer-hub/building-on-0g/inft/integration" target="_blank" rel="noopener noreferrer">Docs ↗</a>
      </p>

      {/* Mint flow */}
      <details className={styles.flow}>
        <summary className={styles.flowHeading}>Mint flow</summary>
        <ol className={styles.flowList}>
          <li>
            Build metadata JSON <code>{"{ name, description, createdAt }"}</code> on the server
          </li>
          <li>
            <code>indexer.upload(zgFile, RPC_URL, signer)</code> — upload metadata to
            0G Storage, returns <code>storageRoot</code> (Merkle root = content address)
          </li>
          <li>
            <code>ethers.keccak256(metadataJSON)</code> — compute <code>metadataHash</code>{" "}
            so anyone can verify the metadata hasn&apos;t been tampered with
          </li>
          <li>
            <code>contract.mint(recipient, storageRoot, metadataHash)</code> — call{" "}
            <code>INFT.sol</code> on-chain, recording ownership and both hashes permanently
          </li>
          <li>
            Parse <code>INFTMinted</code> event log to extract the new <code>tokenId</code>
          </li>
        </ol>
      </details>

      {/* Lookup flow */}
      <details className={styles.flow}>
        <summary className={styles.flowHeading}>Lookup flow</summary>
        <ol className={styles.flowList}>
          <li>
            Read <code>owner</code>, <code>storageRoot</code>, and <code>metadataHash</code>{" "}
            from the contract on-chain by token ID
          </li>
          <li>
            <code>indexer.download(storageRoot)</code> — fetch the metadata JSON from
            0G Storage nodes using the Merkle root
          </li>
          <li>
            Recompute <code>keccak256</code> of fetched JSON and compare to on-chain{" "}
            <code>metadataHash</code> to verify integrity
          </li>
        </ol>
      </details>

      {/* ── Mint ── */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Mint an INFT</h3>
        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My AI Agent"
            disabled={minting}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your AI agent's capabilities…"
            rows={3}
            disabled={minting}
          />
        </div>
        {mintError && <p className={styles.error}>{mintError}</p>}
        <button
          className={styles.btn}
          onClick={handleMint}
          disabled={minting || !name.trim()}
        >
          {minting ? <><span className={styles.spinner} /> Minting…</> : "Mint INFT"}
        </button>
      </div>

      {/* ── Minted tokens ── */}
      {minted.length > 0 && (
        <ul className={styles.tokenList}>
          {minted.map((t) => (
            <li key={t.tokenId} className={styles.tokenItem}>
              <div className={styles.tokenMeta}>
                <span className={styles.tokenId}>Token #{t.tokenId}</span>
                <p className={styles.mono}>{t.storageRoot.slice(0, 28)}…</p>
                <a
                  className={styles.link}
                  href={`https://chainscan-galileo.0g.ai/tx/${t.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on explorer ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ── Lookup ── */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Look up a Token</h3>
        <div className={styles.row}>
          <input
            className={styles.input}
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            placeholder="Token ID"
            disabled={looking}
          />
          <button
            className={styles.btnOutline}
            onClick={handleLookup}
            disabled={looking || !lookupId.trim()}
          >
            {looking ? <span className={styles.spinner} /> : "Look up"}
          </button>
        </div>
        {lookupError && <p className={styles.error}>{lookupError}</p>}
        {lookupResult && (
          <div className={styles.result}>
            <Row label="Token ID" value={`#${lookupResult.tokenId}`} />
            <Row label="Owner" value={lookupResult.owner} mono />
            <Row label="Storage Root" value={lookupResult.storageRoot} mono truncate />
            {lookupResult.metadata && (
              <>
                <Row label="Name" value={lookupResult.metadata.name} />
                {lookupResult.metadata.description && (
                  <Row label="Description" value={lookupResult.metadata.description} />
                )}
                <Row
                  label="Created"
                  value={new Date(lookupResult.metadata.createdAt).toLocaleString()}
                />
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Row({ label, value, mono, truncate }: { label: string; value: string; mono?: boolean; truncate?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--accent)" }}>{label}</span>
      <span style={{ fontSize: "0.88rem", fontFamily: mono ? "monospace" : "inherit", overflow: truncate ? "hidden" : undefined, textOverflow: truncate ? "ellipsis" : undefined, whiteSpace: truncate ? "nowrap" : undefined }}>{value}</span>
    </div>
  );
}
