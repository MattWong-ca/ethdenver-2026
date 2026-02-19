"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import styles from "./Navbar.module.css";

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <nav className={styles.nav}>
      <div className={styles.left}>
        <Link href="/" className={styles.logo}>
          <span className={styles.accent}>create</span>-0g-app
        </Link>
        <div className={styles.tabs}>
          <Link
            href="/storage"
            className={`${styles.tab} ${pathname === "/storage" ? styles.active : ""}`}
          >
            Storage
          </Link>
        </div>
      </div>
      <div className={styles.right}>
        {isConnected ? (
          <>
            <span className={styles.address}>{address?.slice(0, 6)}…{address?.slice(-4)}</span>
            <button className={styles.btnSecondary} onClick={() => disconnect()}>Disconnect</button>
          </>
        ) : (
          <button className={styles.btnPrimary} onClick={() => connect({ connector: connectors[0] })}>
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}
