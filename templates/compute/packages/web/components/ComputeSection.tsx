"use client";
import { useState, useEffect } from "react";
import styles from "./ComputeSection.module.css";

const MODELS = [
  "qwen/qwen-2.5-7b-instruct",
];

type Message = { role: "user" | "assistant"; content: string };

export function ComputeSection() {
  const [model, setModel] = useState(MODELS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [setupRanThisSession, setSetupRanThisSession] = useState<boolean | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [setupMsg, setSetupMsg] = useState("");

  useEffect(() => {
    fetch("/api/compute")
      .then((r) => r.json())
      .then((d) => setSetupRanThisSession(d.providerReady?.[model] ?? false))
      .catch(() => setSetupRanThisSession(false));
  }, [model]);

  const runSetup = async () => {
    setSetupLoading(true);
    setSetupError("");
    setSetupMsg("");
    try {
      const res = await fetch("/api/compute/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Setup failed");
      setSetupRanThisSession(true);
      setSetupMsg("Setup complete.");
    } catch (e) {
      setSetupError(e instanceof Error ? e.message : "Setup failed");
    } finally {
      setSetupLoading(false);
    }
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setMessages([...history, { role: "assistant", content: data.content }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Compute</h2>
      <p className={styles.description}>
        Just like making an OpenAI API call, except every query is cryptographically
        verified and paid for onchain using 0G tokens.
      </p>

      {/* Main Flow */}
      <details className={styles.flow}>
        <summary className={styles.flowHeading}>Main Flow</summary>
        <ol className={styles.flowList}>
          <li>
            <strong>Your Wallet (via private key)</strong> deposits 0G into the{" "}
            <strong>Ledger</strong> — an onchain escrow contract.
            Minimum 3 0G. Tied to your wallet address, accessible from any machine
            with the same private key.
          </li>
          <li>
            <strong>Ledger</strong> allocates funds to a{" "}
            <strong>Provider Sub-account</strong> via <code>transferFund</code>.
            1 0G moves from your <em>available</em> balance into a <em>locked</em>{" "}
            pool for that specific provider.
          </li>
          <li>
            <strong>Provider Sub-account</strong> is drawn down in{" "}
            <strong>micropayments per query</strong> — not 1 0G per message.
            Think of it as a prepaid pool the provider pulls fractions from each request.
          </li>
        </ol>
      </details>

      {/* Per-Request Flow */}
      <details className={styles.flow}>
        <summary className={styles.flowHeading}>Actual AI API calls (fast)</summary>
        <ol className={styles.flowList}>
          <li>
            <code>getRequestHeaders</code> — signs your query with a single-use auth
            token off-chain. Instant.
          </li>
          <li>
            <strong>HTTP inference call</strong> to the provider&apos;s
            OpenAI-compatible endpoint. ~5 seconds.
          </li>
          <li>
            <code>processResponse</code> — verifies the provider&apos;s cryptographic
            signature on the response and settles the micropayment from the sub-account.
          </li>
        </ol>
      </details>

      {/* One-time setup panel */}
      <div className={styles.setupBox}>
        <div className={styles.setupHeader}>
          <span className={styles.setupTitle}>Provider Setup</span>
          <span className={`${styles.statusPill} ${setupRanThisSession ? styles.pillReady : styles.pillPending}`}>
            {setupRanThisSession === null ? "Checking…" : setupRanThisSession ? "Run this session" : "Not run this session"}
          </span>
        </div>
        <p className={styles.hint}>
          <strong>First time using this wallet?</strong> Run setup once — this is
          permanent on-chain. If you&apos;ve already done it with this wallet before,
          skip this and chat directly.
        </p>
        <details className={styles.setupDetails}>
          <summary className={styles.setupSubtitle}>Under the hood</summary>
          <ol className={styles.setupSteps}>
            <li>
              <code>addLedger(3)</code> — create your escrow account with a 3 0G deposit
            </li>
            <li>
              <code>acknowledgeProviderSigner</code> — whitelist the provider&apos;s signing key
            </li>
            <li>
              <code>transferFund(provider, 1 0G)</code> — fund the provider sub-account
            </li>
          </ol>
        </details>
        <div className={styles.setupWarning}>
          <strong>⚠ Only run this once per wallet address.</strong> Each click transfers
          an additional 1 OG to the provider unnecessarily.
        </div>
        <div className={styles.setupRow}>
          <button className={styles.btnSetup} onClick={runSetup} disabled={setupLoading}>
            {setupLoading ? "Setting up…" : "Run Setup"}
          </button>
          {setupMsg && <span className={styles.setupSuccess}>{setupMsg}</span>}
          {setupError && <span className={styles.setupError}>{setupError}</span>}
        </div>
      </div>

      {/* Model picker */}
      <div className={styles.modelRow}>
        <label className={styles.modelLabel}>Model</label>
        <select
          className={styles.modelSelect}
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={loading}
        >
          {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Chat */}
      <div className={styles.chatBox}>
        {messages.length === 0 && (
          <p className={styles.empty}>Send a message to query the 0G compute network.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`${styles.message} ${styles[m.role]}`}>
            <span className={styles.role}>{m.role === "user" ? "You" : "AI"}</span>
            <p>{m.content}</p>
          </div>
        ))}
        {loading && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <span className={styles.role}>AI</span>
            <span className={styles.spinner} />
          </div>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.inputRow}>
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Type a message…"
          disabled={loading}
        />
        <button
          className={styles.btn}
          onClick={send}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </section>
  );
}
