'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface FearGreedGaugeProps {
  value: number;
  size?: number;
}

export default function FearGreedGauge({ value, size = 200 }: FearGreedGaugeProps) {
  const data = [
    { name: 'Value', value: value },
    { name: 'Remaining', value: 100 - value }
  ];

  const getColor = (value: number) => {
    if (value < 20) return '#DC2626'; // red-600
    if (value < 40) return '#EA580C'; // orange-600
    if (value < 60) return '#D97706'; // amber-600
    if (value < 80) return '#65A30D'; // lime-600
    return '#16A34A'; // green-600
  };

  const getLabel = (value: number) => {
    if (value < 20) return 'Extreme Fear';
    if (value < 40) return 'Fear';
    if (value < 60) return 'Neutral';
    if (value < 80) return 'Greed';
    return 'Extreme Greed';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={size * 0.3}
              outerRadius={size * 0.45}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={getColor(value)} />
              <Cell fill="#E5E7EB" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-sm text-white opacity-80">{getLabel(value)}</div>
        </div>
      </div>
    </div>
  );
}