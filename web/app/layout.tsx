import './globals.css';
import type { ReactNode } from 'react';
import { Geist, Geist_Mono, Space_Grotesk } from 'next/font/google';
import { cn } from '@/lib/utils';

// Body: Geist (clean, characterful). Display: Space Grotesk (technical grotesk
// with strong numerals — fits a verification/on-chain product). Mono: Geist Mono
// for hashes, prices, code and structural labels.
const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });

export const metadata = {
  title: 'VeriGate — Verification-as-a-Service on CROO CAP',
  description:
    'Hire an agent to check your agent. Fact-checking, schema validation, and hallucination detection for AI outputs — paid per verification in USDC, hashed on-chain.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={cn('dark font-sans', geist.variable, geistMono.variable, spaceGrotesk.variable)}
    >
      <body>
        <header className="nav">
          <div className="nav-inner">
            <a className="brand" href="/">
              <span className="brand-mark" aria-hidden>◇</span> VeriGate
            </a>
            <nav className="nav-links">
              <a href="/dashboard">Dashboard</a>
              <a href="/playground">Playground</a>
              <a href="https://github.com/wildanre/verigate" target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a className="nav-cta" href="/playground">Try it free</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
