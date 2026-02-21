import styles from "./ContractsSection.module.css";

export function ContractsSection() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Contracts</h2>
      <p className={styles.line}>
        Your contract lives at <code className={styles.code}>packages/contracts/contracts/MyContract.sol</code>
      </p>
      <p className={styles.line}>
        To deploy to 0G Galileo testnet, run <code className={styles.code}>npm run deploy</code>
      </p>
    </section>
  );
}
