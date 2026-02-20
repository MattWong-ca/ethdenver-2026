"use client";
import { useState, useRef } from "react";
import { useAccount } from "wagmi";
import styles from "./StorageSection.module.css";

export function StorageSection() {
  const { isConnected } = useAccount();
  const [dragOver, setDragOver] = useState(false);
  const [uploaded, setUploaded] = useState<{ name: string; contentId: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TODO: replace with real 0G storage upload via @0glabs/0g-ts-sdk
  const handleFile = (file: File) => {
    const fakeContentId = "0x" + Math.random().toString(16).slice(2).padEnd(64, "0");
    setUploaded((prev) => [...prev, { name: file.name, contentId: fakeContentId }]);
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Storage</h2>
      <p className={styles.description}>Upload files to 0G decentralized storage.</p>

      {!isConnected ? (
        <p className={styles.hint}>Connect your wallet to upload files.</p>
      ) : (
        <>
          <div
            className={`${styles.dropzone} ${dragOver ? styles.over : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <span className={styles.icon}>↑</span>
            <p>Drop a file or <span className={styles.link}>click to browse</span></p>
            <p className={styles.subtext}>Stored on 0G · Provenance on-chain</p>
          </div>

          {uploaded.length > 0 && (
            <ul className={styles.fileList}>
              {uploaded.map((f, i) => (
                <li key={i} className={styles.fileItem}>
                  <div>
                    <p className={styles.fileName}>{f.name}</p>
                    <p className={styles.contentId}>{f.contentId.slice(0, 24)}…</p>
                  </div>
                  <span className={styles.badge}>Uploaded</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
