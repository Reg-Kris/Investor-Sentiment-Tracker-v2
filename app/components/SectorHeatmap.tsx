'use client';

import { Card, Text, Metric, Flex } from '@tremor/react';
import { clsx } from 'clsx';

interface SectorData {
  name: string;
  change: number;
  volume?: number;
  marketCap?: number;
  symbol?: string;
}

interface SectorHeatmapProps {
  title?: string;
  data: SectorData[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'grid' | 'compact';
}

export default function SectorHeatmap({
  title = "Sector Performance",
  data,
  className,
  size = 'md',
  layout = 'grid'
}: SectorHeatmapProps) {
  const getPerformanceColor = (change: number) => {
    const intensity = Math.min(Math.abs(change) / 5, 1); // Max intensity at ±5%
    
    if (change > 0) {
      // Green for positive changes
      const opacity = Math.max(0.1, intensity);
      return {
        backgroundColor: `rgba(34, 197, 94, ${opacity})`,
        textColor: change > 2 ? 'text-white' : 'text-green-800 dark:text-green-200',
        borderColor: 'border-green-300 dark:border-green-700'
      };
    } else if (change < 0) {
      // Red for negative changes
      const opacity = Math.max(0.1, intensity);
      return {
        backgroundColor: `rgba(239, 68, 68, ${opacity})`,
        textColor: Math.abs(change) > 2 ? 'text-white' : 'text-red-800 dark:text-red-200',
        borderColor: 'border-red-300 dark:border-red-700'
      };
    } else {
      // Gray for no change
      return {
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        textColor: 'text-gray-700 dark:text-gray-300',
        borderColor: 'border-gray-300 dark:border-gray-700'
      };
    }
  };

  const sizeClasses = {
    sm: {
      container: 'gap-2',
      tile: 'p-3 min-h-[80px]',
      metric: 'text-sm',
      change: 'text-xs'
    },
    md: {
      container: 'gap-3',
      tile: 'p-4 min-h-[100px]',
      metric: 'text-base',
      change: 'text-sm'
    },
    lg: {
      container: 'gap-4',
      tile: 'p-6 min-h-[120px]',
      metric: 'text-lg',
      change: 'text-base'
    }
  };

  const layoutClasses = {
    grid: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    compact: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  };

  // Sort data by performance for better visual hierarchy
  const sortedData = [...data].sort((a, b) => b.change - a.change);

  return (
    <Card className={clsx('p-6', className)}>
      <div className="mb-6">
        <Text className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
          {title}
        </Text>
        <Text className="text-tremor-content-subtle dark:text-dark-tremor-content-subtle mt-1">
          Market sector performance heatmap
        </Text>
      </div>

      <div className={clsx(
        layoutClasses[layout],
        sizeClasses[size].container
      )}>
        {sortedData.map((sector) => {
          const colors = getPerformanceColor(sector.change);
          
          return (
            <div
              key={sector.name}
              className={clsx(
                'rounded-lg border transition-all duration-200 hover:scale-105 cursor-pointer',
                'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
                sizeClasses[size].tile,
                colors.borderColor,
                colors.textColor
              )}
              style={{ backgroundColor: colors.backgroundColor }}
              role="button"
              tabIndex={0}
              aria-label={`${sector.name} sector: ${sector.change > 0 ? '+' : ''}${sector.change.toFixed(2)}% change`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  // Handle sector click/selection
                  console.log('Sector selected:', sector.name);
                }
              }}
            >
              <div className="flex flex-col justify-between h-full">
                <div>
                  <Text className={clsx(
                    'font-medium truncate mb-1',
                    sizeClasses[size].metric
                  )}>
                    {sector.name}
                  </Text>
                  {sector.symbol && (
                    <Text className="text-xs opacity-75 font-mono">
                      {sector.symbol}
                    </Text>
                  )}
                </div>
                
                <div className="mt-auto">
                  <Flex justifyContent="between" alignItems="end">
                    <div>
                      <Metric className={clsx(
                        'font-bold',
                        sizeClasses[size].change
                      )}>
                        {sector.change > 0 ? '+' : ''}{sector.change.toFixed(2)}%
                      </Metric>
                    </div>
                    {sector.volume && (
                      <div className="text-right">
                        <Text className="text-xs opacity-75">
                          Vol: {(sector.volume / 1000000).toFixed(1)}M
                        </Text>
                      </div>
                    )}
                  </Flex>
                  
                  {sector.marketCap && (
                    <Text className="text-xs opacity-75 mt-1">
                      Cap: ${(sector.marketCap / 1000000000).toFixed(1)}B
                    </Text>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-tremor-border dark:border-dark-tremor-border">
        <Flex justifyContent="center" alignItems="center" className="space-x-6">
          <Flex alignItems="center" className="space-x-2">
            <div className="w-4 h-4 rounded bg-red-500 opacity-60" />
            <Text className="text-xs text-tremor-content dark:text-dark-tremor-content">
              Decline
            </Text>
          </Flex>
          <Flex alignItems="center" className="space-x-2">
            <div className="w-4 h-4 rounded bg-gray-400 opacity-60" />
            <Text className="text-xs text-tremor-content dark:text-dark-tremor-content">
              Flat
            </Text>
          </Flex>
          <Flex alignItems="center" className="space-x-2">
            <div className="w-4 h-4 rounded bg-green-500 opacity-60" />
            <Text className="text-xs text-tremor-content dark:text-dark-tremor-content">
              Growth
            </Text>
          </Flex>
        </Flex>
        <Text className="text-center text-xs text-tremor-content-subtle dark:text-dark-tremor-content-subtle mt-2">
          Color intensity indicates magnitude of change
        </Text>
      </div>
    </Card>
  );
}