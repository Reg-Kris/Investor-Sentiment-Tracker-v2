import fetch from 'node-fetch';

export class HttpClient {
  constructor(timeout = 15000) {
    this.timeout = timeout;
  }

  async fetchWithRetry(url, retries = 3, headers = {}) {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeout);
        
        const defaultHeaders = {
          'User-Agent': 'Mozilla/5.0 (compatible; SentimentBot/1.0)',
          'Accept': 'application/json',
          ...headers
        };
        
        const response = await fetch(url, {
          signal: controller.signal,
          headers: defaultHeaders
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.warn(`⚠️  Attempt ${i + 1}/${retries} failed for ${url}:`, error.message);
        
        if (i === retries - 1) {
          console.error(`❌ All attempts failed for ${url}`);
          throw error;
        }
        
        const delay = (2000 * Math.pow(2, i)) + (Math.random() * 1000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  buildRapidApiHeaders(rapidApiKey, host) {
    return {
      'X-RapidAPI-Host': host,
      'X-RapidAPI-Key': rapidApiKey
    };
  }
}