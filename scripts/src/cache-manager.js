import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { CACHE_DURATIONS } from './config.js';

export class CacheManager {
  constructor(cacheDir) {
    this.cacheDir = cacheDir;
  }

  getFromCache(key) {
    try {
      const cachePath = join(this.cacheDir, `${key}.json`);
      if (!existsSync(cachePath)) return null;

      const cached = JSON.parse(readFileSync(cachePath, 'utf8'));
      const age = Date.now() - new Date(cached.timestamp).getTime();

      // Dynamic cache duration based on data type
      let cacheValidityMs = CACHE_DURATIONS.default;

      if (key.includes('fear-greed')) {
        cacheValidityMs = CACHE_DURATIONS.fearGreed;
      } else if (key.includes('options')) {
        cacheValidityMs = CACHE_DURATIONS.options;
      } else if (
        key.includes('SPY') ||
        key.includes('QQQ') ||
        key.includes('IWM')
      ) {
        cacheValidityMs = CACHE_DURATIONS.stocks;
      }

      if (age < cacheValidityMs) {
        return cached.data;
      }

      return null;
    } catch (error) {
      console.warn(`Cache read failed for ${key}:`, error.message);
      return null;
    }
  }

  saveToCache(key, data) {
    try {
      const cachePath = join(this.cacheDir, `${key}.json`);
      const cached = {
        timestamp: new Date().toISOString(),
        data,
      };
      writeFileSync(cachePath, JSON.stringify(cached, null, 2));
    } catch (error) {
      console.warn(`Cache write failed for ${key}:`, error.message);
    }
  }
}
