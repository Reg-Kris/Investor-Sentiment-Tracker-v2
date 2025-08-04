'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { useInView } from 'react-intersection-observer';

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
      ease: [0.4, 0, 0.2, 1] as const,
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
      ease: [0.4, 0, 0.2, 1] as const
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

// Enhanced viewport-triggered animation component
export function ViewportAnimation({ 
  children, 
  className = '', 
  animation = 'fadeUp',
  delay = 0,
  threshold = 0.1,
  triggerOnce = true
}: {
  children: ReactNode;
  className?: string;
  animation?: 'fadeUp' | 'fadeLeft' | 'fadeRight' | 'scale' | 'slideUp' | 'bounce';
  delay?: number;
  threshold?: number;
  triggerOnce?: boolean;
}) {
  const { ref, inView } = useInView({
    threshold,
    triggerOnce,
    rootMargin: '-50px 0px'
  });

  const animationVariants = {
    fadeUp: {
      hidden: { opacity: 0, y: 40 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] as const }
      }
    },
    fadeLeft: {
      hidden: { opacity: 0, x: -40 },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: { duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] as const }
      }
    },
    fadeRight: {
      hidden: { opacity: 0, x: 40 },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: { duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] as const }
      }
    },
    scale: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { 
        opacity: 1, 
        scale: 1,
        transition: { duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] as const }
      }
    },
    slideUp: {
      hidden: { opacity: 0, y: 60, scale: 0.95 },
      visible: { 
        opacity: 1, 
        y: 0,
        scale: 1,
        transition: { duration: 0.7, delay, ease: [0.4, 0, 0.2, 1] as const }
      }
    },
    bounce: {
      hidden: { opacity: 0, y: 40, scale: 0.9 },
      visible: { 
        opacity: 1, 
        y: 0,
        scale: 1,
        transition: { 
          duration: 0.7, 
          delay, 
          ease: [0.68, -0.55, 0.265, 1.55] as const // Bouncy easing
        }
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={animationVariants[animation]}
    >
      {children}
    </motion.div>
  );
}

// Enhanced hover interaction component
export function HoverScale({ 
  children, 
  className = '',
  scale = 1.03,
  duration = 0.2 
}: {
  children: ReactNode;
  className?: string;
  scale?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ 
        scale, 
        transition: { duration, ease: "easeOut" }
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

// Floating animation component for subtle motion
export function FloatingAnimation({ 
  children, 
  className = '',
  intensity = 8,
  duration = 4
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [-intensity/2, intensity/2, -intensity/2],
        rotate: [0, 1, 0, -1, 0]
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
}