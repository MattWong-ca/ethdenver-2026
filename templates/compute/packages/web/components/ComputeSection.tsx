"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import styles from "./ComputeSection.module.css";

type Message = { role: "user" | "assistant"; content: string };

const DUMMY_REPLIES = [
  "This response is a placeholder. Wire up @0glabs/0g-serving-user-broker to use real 0G inference.",
  "Connect the compute SDK to route this through decentralized AI inference on 0G.",
  "Replace this dummy response with a real call to the 0G compute network.",
];

export function ComputeSection() {
  const { isConnected } = useAccount();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // TODO: replace with real 0G inference via @0glabs/0g-serving-user-broker
  const send = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const reply = DUMMY_REPLIES[Math.floor(Math.random() * DUMMY_REPLIES.length)];
    setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    setLoading(false);
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Compute</h2>
      <p className={styles.description}>AI inference via 0G decentralized compute network.</p>

      {!isConnected ? (
        <p className={styles.hint}>Connect your wallet to use compute.</p>
      ) : (
        <>
          <div className={styles.chatBox}>
            {messages.length === 0 && <p className={styles.empty}>Send a message to get started.</p>}
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
        </>
      )}
    </section>
  );
}
