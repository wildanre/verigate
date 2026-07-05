import './globals.css';
import type { ReactNode } from 'react';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata = {
  title: 'VeriGate — Verification-as-a-Service on CROO CAP',
  description:
    'Hire an agent to check your agent. Fact-checking, schema validation, and hallucination detection for AI outputs — paid per verification in USDC, hashed on-chain.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn('dark font-sans', geist.variable)}>
      <body>
        <header className="nav">
          <div className="nav-inner">
            <a className="brand" href="/">🛡️ VeriGate</a>
            <nav className="nav-links">
              <a href="/dashboard">Dashboard</a>
              <a href="/playground">Playground</a>
              <a href="https://github.com/wildanre/verigate" target="_blank" rel="noreferrer">GitHub</a>
              <a className="nav-cta" href="/playground">Try it free</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
