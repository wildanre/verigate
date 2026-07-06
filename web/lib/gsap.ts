'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

// Register once, client-only (per gsap-react skill: never run GSAP during SSR).
// DrawSVGPlugin + SplitText ship free in GSAP 3.13+ and power the section thread.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin, SplitText);
}

export { gsap, ScrollTrigger, DrawSVGPlugin, SplitText, useGSAP };

/** Media query used to gate motion (official gsap.matchMedia pattern). */
export const MOTION_OK = '(prefers-reduced-motion: no-preference)';
