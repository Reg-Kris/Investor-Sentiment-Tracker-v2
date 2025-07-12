// Main API module - consolidated exports
export { OptionsService } from './options-service';
export type { APIResponse, PutCallData } from './types';
export { API_CONFIG } from './config';

// Legacy API service for backward compatibility
import type { APIResponse } from './types';
import { API_CONFIG } from './config';
import { OptionsService } from './options-service';

export class APIService {
  private static readonly CORS_PROXY = API_CONFIG.CORS_PROXY;

  static async getFearGreedIndex(): Promise<APIResponse> {
    try {
      const response = await fetch(
        `${this.CORS_PROXY}${API_CONFIG.ENDPOINTS.fearGreed}`,
      );
      if (!response.ok) throw new Error('Failed to fetch Fear & Greed data');

      const data = await response.json();
      const latestData = data.fear_and_greed_historical.data[0];

      return {
        success: true,
        data: {
          value: latestData.y,
          rating: latestData.rating,
          timestamp: latestData.x,
        },
      };
    } catch (error) {
      console.warn('Fear & Greed API failed, using mock data:', error);
      return {
        success: true,
        data: {
          value: 45 + Math.random() * 30,
          rating: 'Neutral',
          timestamp: Date.now(),
        },
      };
    }
  }

  // Delegate to new modular service
  static async calculateMarketPutCallRatio(): Promise<APIResponse> {
    return OptionsService.calculateMarketPutCallRatio();
  }

  // Other legacy methods can be added here as needed...
}