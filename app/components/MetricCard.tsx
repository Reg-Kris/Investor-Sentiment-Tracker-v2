'use client';

import { Card, Metric, Text, Flex, BadgeDelta, AreaChart } from '@tremor/react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

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
    <Card 
      className={clsx(
        sizeClasses[size].padding,
        'animate-fade-in hover:shadow-tremor-card dark:hover:shadow-dark-tremor-card transition-all duration-200',
        className
      )}
      decoration="left"
      decorationColor={status ? getStatusColor(status) : 'blue'}
    >
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
      <div className="mb-4">
        <Metric 
          className={clsx(
            sizeClasses[size].metric,
            'font-bold text-tremor-content-strong dark:text-dark-tremor-content-strong'
          )}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Metric>
        {subtitle && (
          <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle mt-1">
            {subtitle}
          </Text>
        )}
      </div>

      {/* Change Indicator */}
      {(change !== undefined || trend) && (
        <Flex justifyContent="start" alignItems="center" className="space-x-2 mb-4">
          <BadgeDelta 
            deltaType={getDeltaType(change, trend)}
            size="xs"
          >
            <Flex alignItems="center" className="space-x-1">
              {getTrendIcon()}
              <span>
                {change !== undefined ? formatChange(change, changeType) : trend}
              </span>
            </Flex>
          </BadgeDelta>
          <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle text-xs">
            vs previous period
          </Text>
        </Flex>
      )}

      {/* Progress to Target */}
      {target && typeof value === 'number' && (
        <div className="mb-4">
          <Flex justifyContent="between" className="mb-1">
            <Text className="text-xs text-tremor-content dark:text-dark-tremor-content">
              Progress to Target
            </Text>
            <Text className="text-xs text-tremor-content dark:text-dark-tremor-content">
              {Math.round((value / target) * 100)}%
            </Text>
          </Flex>
          <div className="w-full bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle rounded-full h-2">
            <div 
              className={clsx(
                'h-2 rounded-full transition-all duration-300',
                `bg-${getStatusColor(status)}-500`
              )}
              style={{ width: `${Math.min((value / target) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Mini Chart */}
      {chart && chart.showChart !== false && chart.data.length > 0 && (
        <div className={clsx('mt-4', sizeClasses[size].chart)}>
          <AreaChart
            data={chart.data}
            index="name"
            categories={["value"]}
            colors={[chart.color]}
            showXAxis={false}
            showYAxis={false}
            showGridLines={false}
            showLegend={false}
            showTooltip={false}
            className="h-full"
            autoMinValue={true}
            curveType="natural"
          />
        </div>
      )}

      {/* Status Badge */}
      {status && (
        <div className="flex justify-end mt-4">
          <div className={clsx(
            'px-2 py-1 rounded-full text-xs font-medium',
            `bg-${getStatusColor(status)}-100 text-${getStatusColor(status)}-700`,
            `dark:bg-${getStatusColor(status)}-900 dark:text-${getStatusColor(status)}-300`
          )}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        </div>
      )}
    </Card>
  );
}