'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.99
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 1.01
  }
};

const pageTransition = {
  type: 'tween' as const,
  ease: [0.4, 0, 0.2, 1] as const, // Custom cubic-bezier for smooth feel
  duration: 0.6
};

const staggerVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const staggerItemVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

export default function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      variants={staggerVariants}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      variants={staggerItemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Special transition for metric cards with hover effects
export function MetricCardTransition({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: 20, 
        scale: 0.95 
      }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1 
      }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{
        y: -4,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{
        scale: 0.98,
        transition: { duration: 0.1 }
      }}
    >
      {children}
    </motion.div>
  );
}

// Chart reveal animation
export function ChartReveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ 
        opacity: 0,
        scale: 0.95,
        filter: 'blur(10px)'
      }}
      animate={{ 
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)'
      }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      {children}
    </motion.div>
  );
}