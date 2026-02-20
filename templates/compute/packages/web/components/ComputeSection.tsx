"use client";
import { useState } from "react";
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
        AI inference via 0G decentralized compute. Payments settled on-chain per query.
      </p>

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
        <button className={styles.btn} onClick={send} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </section>
  );
}
