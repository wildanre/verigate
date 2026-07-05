'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP, MOTION_OK } from '../lib/gsap';

/**
 * Page-transition wrapper. In the App Router a template remounts on every
 * navigation, so this GSAP intro (fade + rise) plays on each page change.
 * Reduced-motion users get an instant render.
 */
export default function Template({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          ref.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'all' },
        );
      });
    },
    { scope: ref },
  );

  return <div ref={ref}>{children}</div>;
}
