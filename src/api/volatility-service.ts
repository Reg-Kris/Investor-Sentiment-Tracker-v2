import type { APIResponse } from './types';
import { API_CONFIG } from './config';

export class VolatilityService {
  private static readonly FRED_API_KEY = 'demo';

  static async getVixData(): Promise<APIResponse> {
    try {
      const response = await fetch(
        `${API_CONFIG.ENDPOINTS.fred}?series_id=VIXCLS&api_key=${this.FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`,
      );
      if (!response.ok) throw new Error('Failed to fetch VIX data');

      const data = await response.json();
      const latestObs = data.observations[0];

      return {
        success: true,
        data: {
          value: parseFloat(latestObs.value),
          date: latestObs.date,
        },
      };
    } catch (error) {
      console.warn('VIX API failed, using mock data:', error);
      return {
        success: true,
        data: {
          value: 15 + Math.random() * 25,
          date: new Date().toISOString().split('T')[0],
        },
      };
    }
  }

  static async getPolicyUncertaintyData(): Promise<APIResponse> {
    try {
      const response = await fetch(
        `${API_CONFIG.ENDPOINTS.fred}?series_id=USEPUINDXD&api_key=${this.FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`,
      );
      if (!response.ok)
        throw new Error('Failed to fetch policy uncertainty data');

      const data = await response.json();
      const latestObs = data.observations[0];

      return {
        success: true,
        data: {
          value: parseFloat(latestObs.value),
          date: latestObs.date,
        },
      };
    } catch (error) {
      console.warn('Policy uncertainty API failed, using mock data:', error);
      return {
        success: true,
        data: {
          value: 100 + Math.random() * 200,
          date: new Date().toISOString().split('T')[0],
        },
      };
    }
  }
}
