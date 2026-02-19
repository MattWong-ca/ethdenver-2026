import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <span className={styles.accent}>create</span>-0g-app
        </h1>
        <p className={styles.subtitle}>Your 0G app is ready. Start editing:</p>
        <ul className={styles.steps}>
          <li>
            <span className={styles.label}>Frontend</span>
            <code className={styles.path}>packages/web/app/page.tsx</code>
          </li>
          <li>
            <span className={styles.label}>Contract</span>
            <code className={styles.path}>packages/contracts/contracts/FileRegistry.sol</code>
          </li>
        </ul>
        <div className={styles.links}>
          <a href="https://docs.0g.ai" target="_blank" rel="noopener noreferrer">Docs ↗</a>
          <a href="https://faucet.0g.ai" target="_blank" rel="noopener noreferrer">Faucet ↗</a>
          <a href="https://chainscan-galileo.0g.ai" target="_blank" rel="noopener noreferrer">Explorer ↗</a>
        </div>
      </div>
    </main>
  );
}
