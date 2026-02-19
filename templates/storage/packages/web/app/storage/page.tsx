"use client";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { useState, useCallback, useRef } from "react";
import { BrowserProvider } from "ethers";
import { uploadFile, downloadFile } from "@/lib/0g-storage";
import { FILE_REGISTRY_ABI } from "@/lib/abi";
import styles from "./page.module.css";

const CONTRACT = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "") as `0x${string}`;

type FileRecord = { contentId: string; filename: string; timestamp: bigint };
type UploadStatus = "idle" | "uploading-storage" | "registering" | "done" | "error";

export default function StoragePage() {
  const { address, isConnected } = useAccount();

  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [lastContentId, setLastContentId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: files, refetch } = useReadContract({
    address: CONTRACT,
    abi: FILE_REGISTRY_ABI,
    functionName: "getFiles",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!CONTRACT },
  });

  const { writeContractAsync } = useWriteContract();

  const handleFile = useCallback(
    async (file: File) => {
      if (!isConnected || !address) return;
      try {
        setStatus("uploading-storage");
        setStatusMsg(`Uploading "${file.name}" to 0G storage…`);

        const provider = new BrowserProvider(window.ethereum as Parameters<typeof BrowserProvider>[0]);
        const signer = await provider.getSigner();

        const { contentId } = await uploadFile(file, signer);
        setLastContentId(contentId);

        setStatus("registering");
        setStatusMsg("Registering on-chain…");

        await writeContractAsync({
          address: CONTRACT,
          abi: FILE_REGISTRY_ABI,
          functionName: "registerFile",
          args: [contentId, file.name],
        });

        setStatus("done");
        setStatusMsg(`Done! Content ID: ${contentId.slice(0, 18)}…`);
        refetch();
      } catch (e) {
        setStatus("error");
        setStatusMsg(e instanceof Error ? e.message : "Unknown error");
      }
    },
    [isConnected, address, writeContractAsync, refetch]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDownload = async (record: FileRecord) => {
    const blob = await downloadFile(record.contentId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = record.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isConnected) {
    return (
      <div className={styles.connectPrompt}>
        Connect your wallet to upload and view files.
      </div>
    );
  }

  return (
    <main className={styles.main}>
      {!CONTRACT && (
        <div className={styles.warning}>
          ⚠ No contract deployed yet. Run <code>npm run deploy</code> from the repo root, then restart the dev server.
        </div>
      )}

      <div
        className={`${styles.dropzone} ${dragOver ? styles.dropzoneOver : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <div className={styles.dropzoneIcon}>↑</div>
        <p>Drop a file here or <span className={styles.link}>click to browse</span></p>
        <p className={styles.dropzoneHint}>Any file type · Stored on 0G · Provenance on-chain</p>
      </div>

      {status !== "idle" && (
        <div className={`${styles.statusBar} ${styles[status]}`}>
          {(status === "uploading-storage" || status === "registering") && (
            <span className={styles.spinner} />
          )}
          {statusMsg}
          {status === "done" && lastContentId && (
            <a
              className={styles.explorerLink}
              href="https://chainscan-galileo.0g.ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on explorer ↗
            </a>
          )}
        </div>
      )}

      <section className={styles.gallery}>
        <h2>Your Files</h2>
        {!files || files.length === 0 ? (
          <p className={styles.empty}>No files uploaded yet. Drop one above to get started.</p>
        ) : (
          <ul className={styles.fileList}>
            {[...(files as FileRecord[])].reverse().map((f, i) => (
              <li key={i} className={styles.fileItem}>
                <div className={styles.fileInfo}>
                  <span className={styles.fileName}>{f.filename}</span>
                  <span className={styles.fileContentId} title={f.contentId}>
                    {f.contentId.slice(0, 20)}…
                  </span>
                  <span className={styles.fileDate}>
                    {new Date(Number(f.timestamp) * 1000).toLocaleString()}
                  </span>
                </div>
                <button className={styles.btnSecondary} onClick={() => handleDownload(f)}>
                  Download
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
