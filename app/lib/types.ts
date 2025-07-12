export interface SentimentData {
  fearGreedIndex: number;
  spyChange: number;
  qqqqChange: number;
  iwmChange: number;
  vixLevel: number;
  putCallRatio: number;
  overallSentiment: SentimentLevel;
  lastUpdated: string;
}

export type SentimentLevel = 'extreme-fear' | 'fear' | 'neutral' | 'greed' | 'extreme-greed';

export interface APIResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  chart?: {
    data: Array<{ name: string; value: number; }>;
    color: string;
  };
  sentiment?: SentimentLevel;
}