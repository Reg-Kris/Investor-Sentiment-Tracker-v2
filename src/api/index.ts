// Main API module - consolidated exports
export { OptionsService } from './options-service';
export { MarketService } from './market-service';
export { SentimentService } from './sentiment-service';
export { VolatilityService } from './volatility-service';
export type { APIResponse, PutCallData } from './types';
export { API_CONFIG } from './config';

// Legacy API service for backward compatibility
import type { APIResponse } from './types';
import { OptionsService } from './options-service';
import { MarketService } from './market-service';
import { SentimentService } from './sentiment-service';
import { VolatilityService } from './volatility-service';

export class APIService {
  // Sentiment indicators
  static async getFearGreedIndex(): Promise<APIResponse> {
    return SentimentService.getFearGreedIndex();
  }

  // Market data
  static async getSpyData(): Promise<APIResponse> {
    return MarketService.getSpyData();
  }

  static async getQqqData(): Promise<APIResponse> {
    return MarketService.getQqqData();
  }

  static async getIwmData(): Promise<APIResponse> {
    return MarketService.getIwmData();
  }

  static async getMarketVolumeData(): Promise<APIResponse> {
    return MarketService.getMarketVolumeData();
  }

  // Volatility indicators
  static async getVixData(): Promise<APIResponse> {
    return VolatilityService.getVixData();
  }

  static async getPolicyUncertaintyData(): Promise<APIResponse> {
    return VolatilityService.getPolicyUncertaintyData();
  }

  // Options data
  static async calculateMarketPutCallRatio(): Promise<APIResponse> {
    return OptionsService.calculateMarketPutCallRatio();
  }
}
