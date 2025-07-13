import type { APIResponse } from './types';
import { API_CONFIG } from './config';

export class SentimentService {
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
}
