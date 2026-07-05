'use client';

import { motion, useReducedMotion } from 'framer-motion';

/** Subtle, monochrome, slowly-drifting dot-grid backdrop (no gradient fill). */
export function DotGrid() {
  const reduced = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className="dotgrid"
      animate={reduced ? undefined : { backgroundPositionY: ['0px', '24px'] }}
      transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
    />
  );
}
