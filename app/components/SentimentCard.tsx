'use client';

import { MetricCardProps } from '@/app/lib/types';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

export default function SentimentCard({ title, value, change, chart, sentiment }: MetricCardProps) {
  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'extreme-fear': return 'from-red-500 to-red-700';
      case 'fear': return 'from-orange-400 to-red-500';
      case 'neutral': return 'from-yellow-400 to-orange-400';
      case 'greed': return 'from-green-400 to-yellow-400';
      case 'extreme-greed': return 'from-green-500 to-green-700';
      default: return 'from-slate-600 to-slate-800';
    }
  };

  const getChangeColor = (change?: number) => {
    if (!change) return 'text-gray-400';
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const formatChange = (change?: number) => {
    if (!change) return '';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getSentimentColor(sentiment)} p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105`}
         style={{ height: '320px' }}>
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg truncate">{title}</h3>
          {change !== undefined && (
            <div className={`flex items-center gap-1 ${getChangeColor(change)}`}>
              {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="text-sm font-medium">{formatChange(change)}</span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="mb-4">
            <div className="text-3xl font-bold text-white mb-1">
              {typeof value === 'number' ? value.toFixed(2) : value}
            </div>
          </div>

          {chart && (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart.data}>
                  <defs>
                    <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chart.color} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={chart.color} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={chart.color}
                    strokeWidth={2}
                    fill={`url(#gradient-${title})`}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="absolute top-4 right-4 opacity-20">
          <Activity size={24} className="text-white" />
        </div>
      </div>

      <div className="absolute inset-0 bg-black bg-opacity-10"></div>
    </div>
  );
}