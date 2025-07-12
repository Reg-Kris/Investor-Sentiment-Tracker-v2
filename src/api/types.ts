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