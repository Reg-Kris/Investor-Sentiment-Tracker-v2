'use client';

import { Card, Metric, Text, Flex, BadgeDelta, AreaChart } from '@tremor/react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus, Info, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'percentage' | 'absolute' | 'basis-points';
  trend?: 'up' | 'down' | 'neutral';
  chart?: {
    data: Array<{ name: string; value: number; }>;
    color: string;
    showChart?: boolean;
  };
  subtitle?: string;
  icon?: React.ReactNode;
  target?: number;
  status?: 'excellent' | 'good' | 'fair' | 'poor';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function MetricCard({
  title,
  value,
  change,
  changeType = 'percentage',
  trend,
  chart,
  subtitle,
  icon,
  target,
  status,
  className,
  size = 'md'
}: MetricCardProps) {
  const formatChange = (change: number, type: 'percentage' | 'absolute' | 'basis-points') => {
    const absChange = Math.abs(change);
    switch (type) {
      case 'percentage':
        return `${absChange.toFixed(2)}%`;
      case 'basis-points':
        return `${absChange.toFixed(0)} bps`;
      case 'absolute':
      default:
        return absChange.toFixed(2);
    }
  };

  const getDeltaType = (change?: number, trend?: 'up' | 'down' | 'neutral') => {
    if (trend === 'neutral' || change === 0) return 'unchanged';
    if (trend === 'up' || (change && change > 0)) return 'increase';
    if (trend === 'down' || (change && change < 0)) return 'decrease';
    return 'unchanged';
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'excellent': return 'emerald';
      case 'good': return 'green';
      case 'fair': return 'yellow';
      case 'poor': return 'red';
      default: return 'blue';
    }
  };

  const getTrendIcon = () => {
    if (trend === 'up' || (change && change > 0)) {
      return <TrendingUp className="h-4 w-4" />;
    }
    if (trend === 'down' || (change && change < 0)) {
      return <TrendingDown className="h-4 w-4" />;
    }
    return <Minus className="h-4 w-4" />;
  };

  const sizeClasses = {
    sm: {
      metric: 'text-lg',
      chart: 'h-16',
      padding: 'p-4'
    },
    md: {
      metric: 'text-2xl',
      chart: 'h-20',
      padding: 'p-6'
    },
    lg: {
      metric: 'text-3xl',
      chart: 'h-24',
      padding: 'p-8'
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ 
        y: -4, 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={clsx(
          sizeClasses[size].padding,
          'fintech-card-hover glass-subtle group relative overflow-hidden',
          'border border-tremor-border/50 dark:border-dark-tremor-border/50',
          'backdrop-blur-sm bg-gradient-to-br from-white/80 to-white/40',
          'dark:from-slate-800/80 dark:to-slate-900/40',
          className
        )}
        decoration="left"
        decorationColor={status ? getStatusColor(status) : 'blue'}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-fintech-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Live data indicator */}
        {status === 'excellent' && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-fintech-success-500 rounded-full animate-pulse" />
              <Activity className="w-3 h-3 text-fintech-success-500" />
            </div>
          </div>
        )}
      {/* Header */}
      <Flex justifyContent="start" alignItems="center" className="space-x-2 mb-3">
        {icon && <div className="text-tremor-content dark:text-dark-tremor-content">{icon}</div>}
        <Text className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
          {title}
        </Text>
        {target && (
          <div 
            className="group relative"
            role="tooltip"
            aria-label={`Target: ${target}`}
          >
            <Info className="h-3 w-3 text-tremor-content-subtle dark:text-dark-tremor-content-subtle cursor-help" />
            <div className="invisible group-hover:visible absolute z-10 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg -top-8 left-0 whitespace-nowrap">
              Target: {target}
            </div>
          </div>
        )}
      </Flex>

      {/* Main Metric */}
      <div className="mb-4 relative">
        <div className={clsx(
          sizeClasses[size].metric,
          'font-bold text-tremor-content-strong dark:text-dark-tremor-content-strong'
        )}>
          {typeof value === 'number' ? (
            <AnimatedNumber 
              value={value} 
              decimals={2}
              className="text-inherit"
            />
          ) : (
            <motion.span
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {value}
            </motion.span>
          )}
        </div>
        {subtitle && (
          <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle mt-1">
            {subtitle}
          </Text>
        )}
      </div>

      {/* Change Indicator */}
      {(change !== undefined || trend) && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Flex justifyContent="start" alignItems="center" className="space-x-2 mb-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BadgeDelta 
                deltaType={getDeltaType(change, trend)}
                size="xs"
                className="backdrop-blur-sm"
              >
                <Flex alignItems="center" className="space-x-1">
                  <motion.div
                    animate={{ 
                      rotate: change && change > 0 ? 0 : change && change < 0 ? 180 : 0 
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {getTrendIcon()}
                  </motion.div>
                  {change !== undefined ? (
                    <AnimatedNumber 
                      value={Math.abs(change)} 
                      decimals={2}
                      suffix={changeType === 'percentage' ? '%' : changeType === 'basis-points' ? ' bps' : ''}
                      className="text-inherit"
                    />
                  ) : (
                    <span>{trend}</span>
                  )}
                </Flex>
              </BadgeDelta>
            </motion.div>
            <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle text-xs">
              vs previous period
            </Text>
          </Flex>
        </motion.div>
      )}

      {/* Progress to Target */}
      {target && typeof value === 'number' && (
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Flex justifyContent="between" className="mb-1">
            <Text className="text-xs text-tremor-content dark:text-dark-tremor-content">
              Progress to Target
            </Text>
            <Text className="text-xs text-tremor-content dark:text-dark-tremor-content">
              <AnimatedNumber value={(value / target) * 100} decimals={0} suffix="%" />
            </Text>
          </Flex>
          <div className="w-full bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle rounded-full h-2 overflow-hidden">
            <motion.div 
              className={clsx(
                'h-2 rounded-full',
                `bg-${getStatusColor(status)}-500`
              )}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((value / target) * 100, 100)}%` }}
              transition={{ duration: 1, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </motion.div>
      )}

      {/* Mini Chart */}
      {chart && chart.showChart !== false && chart.data.length > 0 && (
        <motion.div 
          className={clsx('mt-4 relative', sizeClasses[size].chart)}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="chart-container h-full p-2">
            <AreaChart
              data={chart.data}
              index="name"
              categories={["value"]}
              colors={[chart.color]}
              showXAxis={false}
              showYAxis={false}
              showGridLines={false}
              showLegend={false}
              showTooltip={true}
              className="h-full"
              autoMinValue={true}
              curveType="natural"
              animationDuration={1000}
            />
          </div>
        </motion.div>
      )}

      {/* Status Badge */}
      {status && (
        <motion.div 
          className="flex justify-end mt-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <motion.div 
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm',
              'border border-white/20 dark:border-gray-700/20',
              `bg-${getStatusColor(status)}-100/80 text-${getStatusColor(status)}-700`,
              `dark:bg-${getStatusColor(status)}-900/80 dark:text-${getStatusColor(status)}-300`
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </motion.div>
        </motion.div>
      )}
      </Card>
    </motion.div>
  );
}