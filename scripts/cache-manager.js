#!/usr/bin/env node

/**
 * Advanced Cache Manager for API responses and data
 * Implements multi-layer caching with TTL, compression, and persistence
 */

import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '.cache');

// Cache configurations by data type
const CACHE_CONFIGS = {
  'market-data': { ttl: 300000, compress: true }, // 5 minutes
  'sentiment-data': { ttl: 600000, compress: true }, // 10 minutes
  'news-data': { ttl: 1800000, compress: false }, // 30 minutes
  'economic-data': { ttl: 3600000, compress: true }, // 1 hour
  'static-data': { ttl: 86400000, compress: true }, // 24 hours
  'analysis-results': { ttl: 900000, compress: true } // 15 minutes
};

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0
    };
    
    // Ensure cache directory exists
    fs.ensureDirSync(CACHE_DIR);
    
    // Clean up expired entries on startup
    this.cleanupExpiredEntries();
    
    // Set up periodic cleanup
    setInterval(() => this.cleanupExpiredEntries(), 300000); // 5 minutes
  }

  /**
   * Generate cache key from data
   */
  generateKey(data) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  /**
   * Get cache file path
   */
  getCacheFilePath(key, type) {
    const typeDir = path.join(CACHE_DIR, type);
    fs.ensureDirSync(typeDir);
    return path.join(typeDir, `${key}.json`);
  }

  /**
   * Check if cache entry is valid
   */
  isValid(entry, config) {
    if (!entry || !entry.timestamp || !entry.ttl) return false;
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Get data from cache
   */
  async get(key, type = 'default') {
    const config = CACHE_CONFIGS[type] || CACHE_CONFIGS['market-data'];
    
    // Check memory cache first
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key);
      if (this.isValid(entry, config)) {
        this.cacheStats.hits++;
        return entry.data;
      } else {
        this.memoryCache.delete(key);
      }
    }

    // Check disk cache
    try {
      const filePath = this.getCacheFilePath(key, type);
      if (await fs.pathExists(filePath)) {
        const entry = await fs.readJson(filePath);
        if (this.isValid(entry, config)) {
          // Restore to memory cache
          this.memoryCache.set(key, entry);
          this.cacheStats.hits++;
          return entry.data;
        } else {
          // Remove expired file
          await fs.remove(filePath);
        }
      }
    } catch (error) {
      console.warn(`Cache read error for key ${key}:`, error.message);
    }

    this.cacheStats.misses++;
    return null;
  }

  /**
   * Set data in cache
   */
  async set(key, data, type = 'default', customTTL = null) {
    const config = CACHE_CONFIGS[type] || CACHE_CONFIGS['market-data'];
    const ttl = customTTL || config.ttl;
    
    const entry = {
      data,
      timestamp: Date.now(),
      ttl,
      type,
      size: JSON.stringify(data).length
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);

    // Store in disk cache
    try {
      const filePath = this.getCacheFilePath(key, type);
      await fs.writeJson(filePath, entry, { spaces: config.compress ? 0 : 2 });
      this.cacheStats.sets++;
      this.cacheStats.size += entry.size;
    } catch (error) {
      console.warn(`Cache write error for key ${key}:`, error.message);
    }
  }

  /**
   * Delete cache entry
   */
  async delete(key, type = 'default') {
    // Remove from memory
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key);
      this.cacheStats.size -= entry.size || 0;
      this.memoryCache.delete(key);
    }

    // Remove from disk
    try {
      const filePath = this.getCacheFilePath(key, type);
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
        this.cacheStats.deletes++;
      }
    } catch (error) {
      console.warn(`Cache delete error for key ${key}:`, error.message);
    }
  }

  /**
   * Clear all cache for a specific type
   */
  async clearType(type) {
    const typeDir = path.join(CACHE_DIR, type);
    
    // Clear memory cache entries of this type
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.type === type) {
        this.memoryCache.delete(key);
      }
    }

    try {
      if (await fs.pathExists(typeDir)) {
        await fs.remove(typeDir);
      }
    } catch (error) {
      console.warn(`Cache clear error for type ${type}:`, error.message);
    }
  }

  /**
   * Clean up expired entries
   */
  async cleanupExpiredEntries() {
    const cleanupStart = Date.now();
    let cleaned = 0;

    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      const config = CACHE_CONFIGS[entry.type] || CACHE_CONFIGS['market-data'];
      if (!this.isValid(entry, config)) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    // Clean disk cache
    try {
      const types = await fs.readdir(CACHE_DIR);
      for (const type of types) {
        const typeDir = path.join(CACHE_DIR, type);
        if ((await fs.stat(typeDir)).isDirectory()) {
          const files = await fs.readdir(typeDir);
          for (const file of files) {
            try {
              const filePath = path.join(typeDir, file);
              const entry = await fs.readJson(filePath);
              const config = CACHE_CONFIGS[entry.type] || CACHE_CONFIGS['market-data'];
              
              if (!this.isValid(entry, config)) {
                await fs.remove(filePath);
                cleaned++;
              }
            } catch (error) {
              // Remove corrupted files
              await fs.remove(path.join(typeDir, file));
              cleaned++;
            }
          }
        }
      }
    } catch (error) {
      console.warn('Cache cleanup error:', error.message);
    }

    const cleanupTime = Date.now() - cleanupStart;
    if (cleaned > 0) {
      console.log(`Cache cleanup: removed ${cleaned} expired entries in ${cleanupTime}ms`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      ...this.cacheStats,
      memoryEntries: this.memoryCache.size,
      hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0
    };
  }

  /**
   * Get cache health report
   */
  async getHealthReport() {
    const stats = this.getStats();
    const diskSize = await this.getDiskCacheSize();
    
    return {
      health: 'healthy',
      stats,
      diskSize,
      types: Object.keys(CACHE_CONFIGS),
      recommendations: this.generateRecommendations(stats)
    };
  }

  /**
   * Get total disk cache size
   */
  async getDiskCacheSize() {
    try {
      const { stdout } = await import('child_process').then(cp => 
        new Promise((resolve, reject) => {
          cp.exec(`du -sb ${CACHE_DIR}`, (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve({ stdout, stderr });
          });
        })
      );
      return parseInt(stdout.split('\t')[0]);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Generate cache optimization recommendations
   */
  generateRecommendations(stats) {
    const recommendations = [];
    
    if (stats.hitRate < 0.5) {
      recommendations.push('Low cache hit rate - consider increasing TTL values');
    }
    
    if (stats.size > 50 * 1024 * 1024) { // 50MB
      recommendations.push('Cache size is large - consider more aggressive cleanup');
    }
    
    if (stats.memoryEntries > 1000) {
      recommendations.push('Many memory entries - consider reducing memory cache size');
    }

    return recommendations;
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  switch (command) {
    case 'stats':
      console.log('Cache Statistics:', JSON.stringify(cacheManager.getStats(), null, 2));
      break;
      
    case 'health':
      cacheManager.getHealthReport().then(report => {
        console.log('Cache Health Report:', JSON.stringify(report, null, 2));
      });
      break;
      
    case 'cleanup':
      cacheManager.cleanupExpiredEntries().then(() => {
        console.log('Cache cleanup completed');
      });
      break;
      
    case 'clear':
      const type = process.argv[3];
      if (type) {
        cacheManager.clearType(type).then(() => {
          console.log(`Cleared cache for type: ${type}`);
        });
      } else {
        console.log('Usage: node cache-manager.js clear <type>');
      }
      break;
      
    default:
      console.log('Usage: node cache-manager.js <command>');
      console.log('Commands: stats, health, cleanup, clear <type>');
  }
}