import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'VeriGate Dashboard',
  description: 'Verification-as-a-Service on CROO CAP',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="hdr">
          <h1>🛡️ VeriGate</h1>
          <nav>
            <a href="/">Orders</a>
            <a href="/playground">Playground</a>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
