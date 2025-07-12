export interface SentimentData {
  overall: {
    score: number;
    sentiment: string;
    message: string;
    confidence: number;
    components: {
      [key: string]: {
        score: number;
        weight: number;
      };
    };
  };
  timeframes: {
    [key: string]: {
      score: number;
      sentiment: string;
      message: string;
      trend: string;
    };
  };
  indicators: {
    fearGreed: {
      value: number;
      label: string;
      message: string;
      color: string;
    };
    spy: MarketIndicator;
    qqq: MarketIndicator;
    iwm: MarketIndicator;
    vix: {
      value: number;
      message: string;
      color: string;
    };
    options: {
      spy?: string;
      qqq?: string;
      iwm?: string;
      market?: string;
    };
  };
  lastAnalyzed: string;
}

export interface MarketIndicator {
  price: number;
  change: number;
  message: string;
  color: string;
}

export type TimeFrame = '1d' | '5d' | '1m';

export interface SentimentClusterProps {
  score: number;
  sentiment: string;
  message: string;
  timeframe: TimeFrame;
  onTimeframeChange?: (timeframe: TimeFrame) => void;
}