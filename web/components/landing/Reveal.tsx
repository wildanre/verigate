'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP, MOTION_OK } from '../../lib/gsap';

/** Fade + rise a block into view once (GSAP ScrollTrigger), reduced-motion aware. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(ref.current, {
          opacity: 0,
          y: 24,
          duration: 0.7,
          delay,
          ease: 'power3.out',
          scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true },
        });
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
