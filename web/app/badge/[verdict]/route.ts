const COLORS: Record<string, string> = {
  pass: '#4ade80',
  fail: '#f87171',
  partial: '#fbbf24',
  verified: '#4ade80',
};

/** shields-style "Verified by VeriGate" SVG badge, colored by verdict. */
export async function GET(_req: Request, { params }: { params: Promise<{ verdict: string }> }) {
  const { verdict: raw } = await params;
  const verdict = (raw || 'verified').replace(/\.svg$/, '').toLowerCase();
  const color = COLORS[verdict] ?? '#8b93a7';
  const label = 'verified by VeriGate';
  const value = verdict;
  const lw = 128;
  const vw = 8 + value.length * 7;
  const w = lw + vw;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${label}: ${value}">
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <rect rx="3" width="${w}" height="20" fill="#555"/>
  <rect rx="3" x="${lw}" width="${vw}" height="20" fill="${color}"/>
  <rect rx="3" width="${w}" height="20" fill="url(#s)"/>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,DejaVu Sans,sans-serif" font-size="11">
    <text x="${lw / 2}" y="14">${label}</text>
    <text x="${lw + vw / 2}" y="14" fill="#08130c" font-weight="bold">${value}</text>
  </g>
</svg>`;

  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml',
      'cache-control': 'public, max-age=300',
    },
  });
}
