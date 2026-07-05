'use client';

import { useRef } from 'react';
import { gsap, useGSAP, MOTION_OK } from '../../lib/gsap';

/**
 * Animate a number from 0 to `value` when scrolled into view (GSAP textContent
 * snap pattern). SSR renders the final value so the metric is real without JS.
 */
export function CountUp({ value, duration = 1.4 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(ref.current, {
          textContent: 0,
          snap: { textContent: 1 },
          duration,
          ease: 'power2.out',
          scrollTrigger: { trigger: ref.current, start: 'top 92%', once: true },
        });
      });
    },
    { scope: ref },
  );

  return <span ref={ref}>{value}</span>;
}
