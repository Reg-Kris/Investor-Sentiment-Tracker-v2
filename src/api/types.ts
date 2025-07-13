export interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface PutCallData {
  ratio: number;
  putVolume: number;
  callVolume: number;
  sentiment: string;
  color: string;
  message: string;
  successfulFetches: number;
  totalSymbols: number;
}

export interface MarketData {
  price: number;
  change: number;
  changePercent: number;
}

export interface FearGreedData {
  value: number;
  rating: string;
  timestamp: number;
}

export interface VixData {
  value: number;
  date: string;
}

export interface VolumeData {
  volume: number;
  date: string;
}

export interface PolicyUncertaintyData {
  value: number;
  date: string;
}
