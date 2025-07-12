import type { TimeFrame } from '../../../types/sentiment';

export interface IndicatorCardProps {
  title: string;
  value: string;
  change?: string;
  message: string;
  color: string;
  timeframe: TimeFrame;
  trend?: 'up' | 'down' | 'neutral';
  score?: number; // Score for gauge visualization (0-100)
  onTimeframeChange?: (timeframe: TimeFrame) => void;
}

export interface GaugeSegment {
  start: number;
  end: number;
  color: string;
}

export interface GaugeConfig {
  centerX: number;
  centerY: number;
  radius: number;
  segments: GaugeSegment[];
}