import { Variants } from 'framer-motion';

// Respect reduced motion by using gentle, performant transitions
export const transitionNormal = { duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] as const };
export const transitionSmooth = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const };
export const transitionSpring = { type: 'spring' as const, stiffness: 380, damping: 28 };

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitionNormal,
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitionSmooth,
  },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitionSmooth,
  },
};

export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitionSmooth,
  },
};

export const staggerContainer = (staggerDelay = 0.08, delayChildren = 0.05): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
});

export const slideOverRight: Variants = {
  hidden: { x: '100%', opacity: 0.8 },
  visible: {
    x: 0,
    opacity: 1,
    transition: transitionSmooth,
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

export const modalScale: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitionSmooth,
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: 12,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};
