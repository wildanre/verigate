'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Register once, client-only (per gsap-react skill: never run GSAP during SSR).
if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

export { gsap, ScrollTrigger, useGSAP };

/** Media query used to gate motion (official gsap.matchMedia pattern). */
export const MOTION_OK = '(prefers-reduced-motion: no-preference)';
