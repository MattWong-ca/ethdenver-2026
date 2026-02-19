import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "create-0g-app",
  description: "Decentralized app powered by 0G",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
