import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export class CacheManager {
  constructor(cacheDir) {
    this.cacheDir = cacheDir;
  }

  get(key) {
    try {
      const cachePath = join(this.cacheDir, `${key}.json`);
      if (!existsSync(cachePath)) return null;
      
      const cached = JSON.parse(readFileSync(cachePath, 'utf8'));
      const age = Date.now() - new Date(cached.timestamp).getTime();
      
      const cacheValidityMs = this.getCacheDuration(key);
      
      if (age < cacheValidityMs) {
        return cached.data;
      }
      
      return null;
    } catch (error) {
      console.warn(`Cache read failed for ${key}:`, error.message);
      return null;
    }
  }

  set(key, data) {
    try {
      const cachePath = join(this.cacheDir, `${key}.json`);
      const cached = {
        timestamp: new Date().toISOString(),
        data
      };
      writeFileSync(cachePath, JSON.stringify(cached, null, 2));
    } catch (error) {
      console.warn(`Cache write failed for ${key}:`, error.message);
    }
  }

  getCacheDuration(key) {
    if (key.includes('fear-greed')) {
      return 1800000; // 30 minutes for sentiment data
    } else if (key.includes('options')) {
      return 900000; // 15 minutes for options (more volatile)
    } else if (key.includes('SPY') || key.includes('QQQ') || key.includes('IWM')) {
      return 300000; // 5 minutes for major indices during market hours
    }
    return 3600000; // Default 1 hour
  }
}