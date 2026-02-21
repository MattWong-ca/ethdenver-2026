"use client";
import { useState, useRef } from "react";
import { uploadFile, downloadFile } from "@/lib/0g-storage";
import styles from "./StorageSection.module.css";

type UploadedFile = {
  name: string;
  rootHash: string;
  txHash: string;
};

type UploadState = { status: "idle" } | { status: "uploading"; name: string } | { status: "error"; message: string };

export function StorageSection() {
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploadState({ status: "uploading", name: file.name });
    try {
      const { rootHash, txHash } = await uploadFile(file);
      setUploaded((prev) => [...prev, { name: file.name, rootHash, txHash }]);
      setUploadState({ status: "idle" });
    } catch (err) {
      setUploadState({ status: "error", message: err instanceof Error ? err.message : "Upload failed" });
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Storage</h2>
      <p className={styles.description}>Upload files to 0G decentralized storage.</p>

      {/* Upload flow */}
      <details className={styles.flow}>
        <summary className={styles.flowHeading}>Upload flow</summary>
        <ol className={styles.flowList}>
          <li>
            <code>ZgFile.fromFilePath</code> — wraps the file into a 0G file object
          </li>
          <li>
            <code>zgFile.merkleTree()</code> — builds a Merkle tree of the file&apos;s
            chunks so the network can verify data integrity during retrieval
          </li>
          <li>
            <code>indexer.upload(zgFile, RPC_URL, signer)</code> — disperses file chunks
            across 0G storage nodes and records the Merkle root on-chain, paying gas
          </li>
          <li>
            Returns <code>rootHash</code> (Merkle root = permanent content address)
            and <code>txHash</code> (on-chain record)
          </li>
        </ol>
      </details>

      {/* Download flow */}
      <details className={styles.flow}>
        <summary className={styles.flowHeading}>Download flow</summary>
        <ol className={styles.flowList}>
          <li>
            <code>indexer.download(rootHash, tmpPath)</code> — fetches file chunks
            from storage nodes by Merkle root, verifying each chunk against the tree
          </li>
          <li>
            File is streamed back to the browser as a binary download
          </li>
        </ol>
      </details>

      <div
        className={`${styles.dropzone} ${uploadState.status === "uploading" ? styles.over : ""}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => uploadState.status !== "uploading" && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <span className={styles.icon}>↑</span>
        <p>Drop a file or <span className={styles.link}>click to browse</span></p>
        <p className={styles.subtext}>Stored on 0G · Provenance on-chain</p>
      </div>

      {uploadState.status === "uploading" && (
        <div className={`${styles.status} ${styles.uploading}`}>
          <span className={styles.spinner} />
          Uploading {uploadState.name}…
        </div>
      )}
      {uploadState.status === "error" && (
        <div className={`${styles.status} ${styles.error}`}>
          {uploadState.message}
        </div>
      )}

      {uploaded.length > 0 && (
        <ul className={styles.fileList}>
          {uploaded.map((f, i) => (
            <li key={i} className={styles.fileItem}>
              <div>
                <p className={styles.fileName}>{f.name}</p>
                <p className={styles.contentId}>{f.rootHash.slice(0, 24)}…</p>
                <a
                  className={styles.txLink}
                  href={`https://chainscan-galileo.0g.ai/tx/${f.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on explorer ↗
                </a>
              </div>
              <button
                className={styles.btn}
                onClick={() => downloadFile(f.rootHash, f.name)}
              >
                Download
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
