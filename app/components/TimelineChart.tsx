'use client';

import { Card, Text, Flex, AreaChart, LineChart, Select, SelectItem } from '@tremor/react';
import { useState } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface TimelineDataPoint {
  date: string;
  sentiment: number;
  fearGreed?: number;
  vix?: number;
  spyPrice?: number;
  volume?: number;
}

interface TimelineChartProps {
  title?: string;
  data: TimelineDataPoint[];
  height?: string | number;
  className?: string;
  showControls?: boolean;
  defaultPeriod?: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';
  chartType?: 'area' | 'line';
}

export default function TimelineChart({
  title = "Sentiment Timeline",
  data,
  height = 300,
  className,
  showControls = true,
  defaultPeriod = '1M',
  chartType = 'area'
}: TimelineChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
  const [selectedMetric, setSelectedMetric] = useState<'sentiment' | 'fearGreed' | 'vix' | 'spyPrice'>('sentiment');

  const periods = [
    { value: '1D', label: '1 Day' },
    { value: '1W', label: '1 Week' },
    { value: '1M', label: '1 Month' },
    { value: '3M', label: '3 Months' },
    { value: '6M', label: '6 Months' },
    { value: '1Y', label: '1 Year' }
  ];

  const metrics = [
    { 
      value: 'sentiment', 
      label: 'Sentiment Index',
      color: 'blue',
      format: (value: number) => `${value.toFixed(1)}`
    },
    { 
      value: 'fearGreed', 
      label: 'Fear & Greed',
      color: 'purple',
      format: (value: number) => `${value.toFixed(0)}`
    },
    { 
      value: 'vix', 
      label: 'VIX Level',
      color: 'red',
      format: (value: number) => `${value.toFixed(2)}`
    },
    { 
      value: 'spyPrice', 
      label: 'SPY Price',
      color: 'green',
      format: (value: number) => `$${value.toFixed(2)}`
    }
  ];

  const filterDataByPeriod = (data: TimelineDataPoint[], period: string) => {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case '1D':
        startDate.setDate(now.getDate() - 1);
        break;
      case '1W':
        startDate.setDate(now.getDate() - 7);
        break;
      case '1M':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return data;
    }

    return data.filter(point => new Date(point.date) >= startDate);
  };

  const currentMetric = metrics.find(m => m.value === selectedMetric);
  const filteredData = filterDataByPeriod(data, selectedPeriod);
  
  // Prepare chart data with proper formatting
  const chartData = filteredData.map(point => ({
    date: new Date(point.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      ...(selectedPeriod === '1Y' ? { year: 'numeric' } : {})
    }),
    [selectedMetric]: point[selectedMetric] || 0
  }));

  const getSentimentZones = () => {
    if (selectedMetric !== 'sentiment' && selectedMetric !== 'fearGreed') return [];
    
    return [
      { min: 0, max: 20, label: 'Extreme Fear', color: 'red-100' },
      { min: 20, max: 40, label: 'Fear', color: 'orange-100' },
      { min: 40, max: 60, label: 'Neutral', color: 'yellow-100' },
      { min: 60, max: 80, label: 'Greed', color: 'green-100' },
      { min: 80, max: 100, label: 'Extreme Greed', color: 'emerald-100' }
    ];
  };

  const getLatestValue = () => {
    if (filteredData.length === 0) return null;
    const latest = filteredData[filteredData.length - 1];
    return latest[selectedMetric];
  };

  const getChange = () => {
    if (filteredData.length < 2) return null;
    const latest = filteredData[filteredData.length - 1][selectedMetric];
    const previous = filteredData[filteredData.length - 2][selectedMetric];
    if (!latest || !previous) return null;
    return ((latest - previous) / previous) * 100;
  };

  const latestValue = getLatestValue();
  const change = getChange();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className={clsx('p-6 glass-subtle fintech-glow', className)}>
        {/* Header */}
        <Flex justifyContent="between" alignItems="start" className="mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Text className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong fintech-text-gradient">
              {title}
            </Text>
            <Flex alignItems="center" className="space-x-4 mt-2">
              <AnimatePresence mode="wait">
                {latestValue && currentMetric && (
                  <motion.div
                    key={`${selectedMetric}-${latestValue}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Text className="text-2xl font-bold text-tremor-content-strong dark:text-dark-tremor-content-strong number-counter">
                      {currentMetric.format(latestValue)}
                    </Text>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {change !== null && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <Text className={clsx(
                      'text-sm font-medium px-2 py-1 rounded-full backdrop-blur-sm',
                      change >= 0 
                        ? 'text-green-600 dark:text-green-400 bg-green-100/50 dark:bg-green-900/50' 
                        : 'text-red-600 dark:text-red-400 bg-red-100/50 dark:bg-red-900/50'
                    )}>
                      {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                    </Text>
                  </motion.div>
                )}
              </AnimatePresence>
            </Flex>
          </motion.div>

          {showControls && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Flex className="space-x-2">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Select 
                    value={selectedMetric} 
                    onValueChange={(value) => setSelectedMetric(value as any)}
                    placeholder="Select metric"
                  >
                    {metrics.map((metric) => (
                      <SelectItem key={metric.value} value={metric.value}>
                        {metric.label}
                      </SelectItem>
                    ))}
                  </Select>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Select 
                    value={selectedPeriod} 
                    onValueChange={(value) => setSelectedPeriod(value as any)}
                    placeholder="Select period"
                  >
                    {periods.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </Select>
                </motion.div>
              </Flex>
            </motion.div>
          )}
      </Flex>

        {/* Chart */}
        <motion.div 
          className="relative chart-container"
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <AnimatePresence mode="wait">
            {chartData.length > 0 ? (
              <motion.div
                key={`${selectedMetric}-${selectedPeriod}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="h-full"
              >
                {chartType === 'area' ? (
                  <AreaChart
                    data={chartData}
                    index="date"
                    categories={[selectedMetric]}
                    colors={[currentMetric?.color || 'blue']}
                    showLegend={false}
                    showYAxis={true}
                    showXAxis={true}
                    showGridLines={true}
                    className="h-full"
                    yAxisWidth={60}
                    curveType="natural"
                    showAnimation={true}
                    animationDuration={1200}
                    valueFormatter={(value) => currentMetric?.format(value) || value.toString()}
                  />
                ) : (
                  <LineChart
                    data={chartData}
                    index="date"
                    categories={[selectedMetric]}
                    colors={[currentMetric?.color || 'blue']}
                    showLegend={false}
                    showYAxis={true}
                    showXAxis={true}
                    showGridLines={true}
                    className="h-full"
                    yAxisWidth={60}
                    curveType="natural"
                    showAnimation={true}
                    animationDuration={1200}
                    valueFormatter={(value) => currentMetric?.format(value) || value.toString()}
                  />
                )}
              </motion.div>
            ) : (
              <motion.div 
                className="h-full flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle">
                  No data available for selected period
                </Text>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      {/* Sentiment Zones Legend (only for sentiment metrics) */}
      {(selectedMetric === 'sentiment' || selectedMetric === 'fearGreed') && (
        <div className="mt-4 pt-4 border-t border-tremor-border dark:border-dark-tremor-border">
          <Text className="text-xs text-tremor-content dark:text-dark-tremor-content mb-2">
            Sentiment Zones
          </Text>
          <Flex justifyContent="between" className="flex-wrap gap-2">
            {getSentimentZones().map((zone) => (
              <Flex key={zone.label} alignItems="center" className="space-x-1">
                <div className={`w-3 h-3 rounded bg-${zone.color}`} />
                <Text className="text-xs text-tremor-content dark:text-dark-tremor-content">
                  {zone.label}
                </Text>
              </Flex>
            ))}
          </Flex>
        </div>
      )}

      {/* Data Quality Indicator */}
      <div className="mt-2">
        <Text className="text-xs text-tremor-content-subtle dark:text-dark-tremor-content-subtle">
          Showing {chartData.length} data points • Last updated: {
            filteredData.length > 0 
              ? new Date(filteredData[filteredData.length - 1].date).toLocaleString()
              : 'N/A'
          }
        </Text>
      </div>
      </Card>
    </motion.div>
  );
}