'use client';

import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface SkeletonLoaderProps {
  variant?: 'card' | 'metric' | 'chart' | 'text' | 'circle';
  width?: string;
  height?: string;
  className?: string;
  count?: number;
}

export default function SkeletonLoader({
  variant = 'card',
  width,
  height,
  className,
  count = 1
}: SkeletonLoaderProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'metric':
        return 'h-24 w-full rounded-lg';
      case 'chart':
        return 'h-64 w-full rounded-lg';
      case 'text':
        return 'h-4 w-full rounded';
      case 'circle':
        return 'h-12 w-12 rounded-full';
      case 'card':
      default:
        return 'h-32 w-full rounded-lg';
    }
  };

  const shimmerVariants = {
    initial: { x: '-100%' },
    animate: { 
      x: '100%',
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: 'linear'
      }
    }
  };

  const pulseVariants = {
    initial: { opacity: 1 },
    animate: { 
      opacity: 0.6,
      transition: {
        repeat: Infinity,
        duration: 1.2,
        repeatType: 'reverse' as const,
        ease: 'easeInOut'
      }
    }
  };

  const SkeletonItem = () => (
    <div
      className={clsx(
        'relative overflow-hidden bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle',
        getVariantStyles(),
        className
      )}
      style={{ width, height }}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-gray-600/20"
        variants={shimmerVariants}
        initial="initial"
        animate="animate"
      />
      
      {/* Pulse base */}
      <motion.div
        className="absolute inset-0 bg-tremor-background-muted dark:bg-dark-tremor-background-muted"
        variants={pulseVariants}
        initial="initial"
        animate="animate"
      />
    </div>
  );

  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonItem key={index} />
      ))}
    </>
  );
}

// Specific skeleton components for common use cases
export function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('p-6 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <SkeletonLoader variant="text" width="60%" height="16px" />
        <SkeletonLoader variant="circle" width="24px" height="24px" />
      </div>
      <SkeletonLoader variant="text" width="40%" height="32px" />
      <div className="flex items-center space-x-2">
        <SkeletonLoader variant="text" width="20%" height="20px" />
        <SkeletonLoader variant="text" width="30%" height="16px" />
      </div>
      <SkeletonLoader variant="chart" height="80px" />
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('p-6 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonLoader variant="text" width="40%" height="20px" />
          <SkeletonLoader variant="text" width="25%" height="16px" />
        </div>
        <div className="flex space-x-2">
          <SkeletonLoader variant="text" width="80px" height="32px" />
          <SkeletonLoader variant="text" width="80px" height="32px" />
        </div>
      </div>
      <SkeletonLoader variant="chart" height="300px" />
      <div className="flex justify-between">
        {Array.from({ length: 5 }, (_, i) => (
          <SkeletonLoader key={i} variant="text" width="60px" height="12px" />
        ))}
      </div>
    </div>
  );
}

export function NewsFeedSkeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('p-6 space-y-4', className)}>
      <SkeletonLoader variant="text" width="30%" height="20px" />
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="space-y-2 pb-4 border-b border-tremor-border dark:border-dark-tremor-border last:border-b-0">
          <SkeletonLoader variant="text" width="90%" height="16px" />
          <SkeletonLoader variant="text" width="70%" height="14px" />
          <div className="flex items-center justify-between">
            <SkeletonLoader variant="text" width="25%" height="12px" />
            <SkeletonLoader variant="text" width="20%" height="12px" />
          </div>
        </div>
      ))}
    </div>
  );
}