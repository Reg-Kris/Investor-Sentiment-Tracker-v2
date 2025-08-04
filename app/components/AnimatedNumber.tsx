'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  format?: 'number' | 'currency' | 'percentage';
}

export default function AnimatedNumber({
  value,
  decimals = 2,
  duration = 0.8,
  className = '',
  prefix = '',
  suffix = '',
  format = 'number'
}: AnimatedNumberProps) {
  const spring = useSpring(0, { 
    stiffness: 100, 
    damping: 30,
    duration: duration * 1000
  });
  
  const display = useTransform(spring, (current) => {
    let formatted = current.toFixed(decimals);
    
    switch (format) {
      case 'currency':
        formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(current);
        break;
      case 'percentage':
        formatted = `${current.toFixed(decimals)}%`;
        break;
      case 'number':
      default:
        formatted = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(current);
        break;
    }
    
    return `${prefix}${formatted}${suffix}`;
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span
      className={`number-counter tabular-nums ${className}`}
      initial={{ scale: 1.05, opacity: 0.8 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <motion.span>{display}</motion.span>
    </motion.span>
  );
}