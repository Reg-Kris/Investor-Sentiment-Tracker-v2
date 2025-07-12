import fetch from 'node-fetch';
import { CONFIG } from './config.js';

export class HttpClient {
  constructor(cacheManager, circuitBreaker) {
    this.cache = cacheManager;
    this.circuitBreaker = circuitBreaker;
  }

  async fetchWithRetry(url, retries = 3, cacheKey = null) {
    // Check circuit breaker
    if (this.circuitBreaker.isOpen(url)) {
      console.warn(`⚡ Circuit breaker open for ${url}`);
      throw new Error('Circuit breaker open');
    }

    // Try cache first if available
    if (cacheKey) {
      const cached = this.cache.getFromCache(cacheKey);
      if (cached) {
        console.log(`📦 Using cached data for ${cacheKey}`);
        return cached;
      }
    }

    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), CONFIG.requestTimeout);
        
        const headers = {
          'User-Agent': 'Mozilla/5.0 (compatible; SentimentBot/1.0)',
          'Accept': 'application/json'
        };
        
        // Add RapidAPI headers for Fear & Greed Index
        if (url.includes('rapidapi.com')) {
          const urlObj = new URL(url);
          headers['X-RapidAPI-Host'] = urlObj.hostname;
          headers['X-RapidAPI-Key'] = CONFIG.rapidApiKey;
        }
        
        const response = await fetch(url, {
          signal: controller.signal,
          headers
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Reset circuit breaker on success
        this.circuitBreaker.reset(url);
        
        // Cache successful response
        if (cacheKey) {
          this.cache.saveToCache(cacheKey, data);
        }
        
        return data;
      } catch (error) {
        console.warn(`⚠️  Attempt ${i + 1}/${retries} failed for ${url}:`, error.message);
        
        // Record failure
        this.circuitBreaker.recordFailure(url);
        
        if (i === retries - 1) {
          console.error(`❌ All attempts failed for ${url}`);
          throw error;
        }
        
        // Exponential backoff with jitter
        const delay = (2000 * Math.pow(2, i)) + (Math.random() * 1000);
        await this.sleep(delay);
      }
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}