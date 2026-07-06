'use client';

import { useRef } from 'react';
import { gsap, useGSAP, MOTION_OK } from '../../lib/gsap';

/**
 * A checkpoint on the vertical "verification thread" that runs between sections.
 * On scroll-in the thread draws itself: the line descends from the section
 * above, the hexagon node strokes on, a checkmark draws inside, hairlines
 * extend outward, and the line continues down to the next checkpoint.
 *
 * Each node stands for one verified, on-chain checkpoint — VeriGate's core idea,
 * drawn rather than decorated. Uses GSAP DrawSVGPlugin; reduced-motion shows the
 * finished thread with no animation.
 *
 * `variant="last"` omits the outgoing line (the thread terminates at the footer).
 */
export function ThreadNode({ variant = 'mid' }: { variant?: 'mid' | 'last' }) {
  const ref = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;

      const q = gsap.utils.selector(root);
      const draw = q('.tn-draw');
      const check = q('.tn-check');
      const node = q('.tn-node');
      const halo = q('.tn-halo');

      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          scrollTrigger: { trigger: root, start: 'top 82%', once: true },
        });

        tl.set(root, { autoAlpha: 1 })
          .from('.tn-line-top', { drawSVG: '0% 0%', duration: 0.45 })
          .from('.tn-node', { drawSVG: '0%', duration: 0.5 }, '-=0.1')
          .to('.tn-node', { fill: 'rgba(34,211,238,0.10)', duration: 0.3 }, '<')
          .from('.tn-check', { drawSVG: '0%', duration: 0.35, ease: 'power1.out' }, '-=0.05')
          .from('.tn-hair', { drawSVG: '50% 50%', duration: 0.5, stagger: 0.05 }, '-=0.25')
          .from(halo, { scale: 0, transformOrigin: 'center', duration: 0.5, ease: 'back.out(2)' }, '-=0.4');

        if (variant !== 'last') {
          tl.from('.tn-line-bot', { drawSVG: '0% 0%', duration: 0.5 }, '-=0.2');
        }

        // A single, quiet confirmation pulse once the checkpoint lands.
        tl.fromTo(
          halo,
          { opacity: 0.9 },
          { opacity: 0, scale: 2.1, transformOrigin: 'center', duration: 0.9, ease: 'power2.out' },
          '-=0.1',
        );

        void draw;
        void check;
        void node;
      });

      // Reduced motion: reveal the completed thread, no tweening.
      mm.add(`(prefers-reduced-motion: reduce)`, () => {
        gsap.set(root, { autoAlpha: 1 });
      });
    },
    { scope: ref },
  );

  return (
    <div className="thread" aria-hidden>
      <svg
        ref={ref}
        className="thread-svg"
        viewBox="0 0 200 132"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        style={{ visibility: 'hidden' }}
      >
        <defs>
          <linearGradient id="tn-hair-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#22d3ee" stopOpacity="0" />
            <stop offset="1" stopColor="#22d3ee" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="tn-hair-grad-l" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stopColor="#22d3ee" stopOpacity="0" />
            <stop offset="1" stopColor="#22d3ee" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* incoming / outgoing thread */}
        <line className="tn-draw tn-line-top" x1="100" y1="0" x2="100" y2="44" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
        {variant !== 'last' && (
          <line className="tn-draw tn-line-bot" x1="100" y1="88" x2="100" y2="132" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
        )}

        {/* hairlines extending to the section width */}
        <line className="tn-draw tn-hair" x1="100" y1="66" x2="6" y2="66" stroke="url(#tn-hair-grad-l)" strokeWidth="1" />
        <line className="tn-draw tn-hair" x1="100" y1="66" x2="194" y2="66" stroke="url(#tn-hair-grad)" strokeWidth="1" />

        {/* soft confirmation halo */}
        <circle className="tn-halo" cx="100" cy="66" r="20" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0" />

        {/* hexagon checkpoint node */}
        <path
          className="tn-draw tn-node"
          d="M100 45 L118 56 L118 76 L100 87 L82 76 L82 56 Z"
          stroke="#4ade80"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* checkmark inside */}
        <path className="tn-draw tn-check" d="M91 66 L98 73 L110 59" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
