import { SentimentData, SentimentLevel, APIResponse } from './types';
import {
  InputValidator,
  RateLimiter,
  SecurityAuditor,
  SecureAPIClient,
  DataEncryption,
  SecurityError,
  APIError,
} from './security';
// Security-enhanced API service for financial data

class APIService {
  private static instance: APIService;
  private cache: Map<string, { data: any; timestamp: number; integrity: string }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private errorCounts: Map<string, number> = new Map();
  private secureClient: SecureAPIClient;
  private anomalyDetector: AnomalyDetector;

  constructor() {
    this.secureClient = SecureAPIClient.getInstance();
    this.anomalyDetector = new AnomalyDetector();
  }

  static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  private checkRateLimit(endpoint: string): boolean {
    const clientId = 'sentiment-tracker'; // In production, use actual client identification
    
    if (!RateLimiter.checkRateLimit(clientId, endpoint)) {
      SecurityAuditor.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        endpoint,
        clientId,
        timestamp: new Date().toISOString(),
      });
      return false;
    }
    
    return true;
  }

  private trackError(endpoint: string, error: Error): void {
    const errorCount = (this.errorCounts.get(endpoint) || 0) + 1;
    this.errorCounts.set(endpoint, errorCount);
    
    // Log security event for audit trail
    SecurityAuditor.logSecurityEvent('API_REQUEST_FAILED', {
      endpoint,
      error: error.message,
      errorCount,
      consecutiveErrors: errorCount,
      timestamp: new Date().toISOString(),
    });
    
    // Check for anomalous error patterns
    this.anomalyDetector.recordError(endpoint, error);
    
    // Alert if error count exceeds threshold
    if (errorCount >= 5) {
      SecurityAuditor.logSecurityEvent('ANOMALY_DETECTED', {
        type: 'MULTIPLE_API_FAILURES',
        endpoint,
        totalErrors: errorCount,
        recommendation: 'Check API service status and consider fallback data',
      });
    }
  }

  private resetErrorCount(endpoint: string): void {
    if (this.errorCounts.has(endpoint)) {
      this.errorCounts.set(endpoint, 0);
      console.info(`API service recovered for ${endpoint}`);
    }
  }

  private async fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    
    // Validate cached data integrity
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      const dataString = JSON.stringify(cached.data);
      if (DataEncryption.verifyHash(dataString, cached.integrity)) {
        SecurityAuditor.logSecurityEvent('DATA_ACCESS', {
          source: 'cache',
          key,
          cacheAge: Date.now() - cached.timestamp,
        });
        return cached.data as T;
      } else {
        // Cache integrity violation - remove corrupted data
        SecurityAuditor.logSecurityEvent('SECURITY_VIOLATION', {
          type: 'CACHE_INTEGRITY_FAILURE',
          key,
          action: 'CACHE_CLEARED',
        });
        this.cache.delete(key);
      }
    }

    const startTime = Date.now();
    
    try {
      const data = await fetcher();
      
      // Create integrity hash for cached data
      const dataString = JSON.stringify(data);
      const integrity = DataEncryption.createHash(dataString);
      
      this.cache.set(key, { 
        data, 
        timestamp: Date.now(),
        integrity 
      });
      
      this.resetErrorCount(key);
      
      const responseTime = Date.now() - startTime;
      SecurityAuditor.logSecurityEvent('API_REQUEST_COMPLETED', {
        key,
        responseTime,
        dataReceived: typeof data !== 'undefined',
        cacheUpdated: true,
      });
      
      return data;
    } catch (error) {
      this.trackError(key, error as Error);
      
      // Use stale cache if available and integrity is valid
      if (cached) {
        const dataString = JSON.stringify(cached.data);
        if (DataEncryption.verifyHash(dataString, cached.integrity)) {
          SecurityAuditor.logSecurityEvent('DATA_ACCESS', {
            source: 'stale_cache',
            key,
            cacheAge: Date.now() - cached.timestamp,
            reason: 'API_ERROR_FALLBACK',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          return cached.data as T;
        }
      }
      
      throw error;
    }
  }

  async getFearGreedIndex(): Promise<number> {
    if (!this.checkRateLimit('fear-greed')) {
      throw new SecurityError('Rate limit exceeded for Fear & Greed Index API');
    }

    return this.fetchWithCache('fear-greed', async () => {
      try {
        const data = await this.secureClient.secureRequest<any>('https://api.alternative.me/fng/');
        
        // Validate response structure
        if (!data.data || !Array.isArray(data.data) || !data.data[0] || !data.data[0].value) {
          throw new APIError('Invalid response format from Fear & Greed API', 422, 'https://api.alternative.me/fng/');
        }
        
        // Validate and sanitize the fear & greed value
        const rawValue = data.data[0].value;
        const value = InputValidator.validateNumber(rawValue, 'fearGreedIndex');
        
        // Fear & Greed Index should be between 0-100
        if (value < 0 || value > 100) {
          throw new SecurityError('Fear & Greed Index value out of valid range (0-100)');
        }
        
        // Check for anomalous values
        this.anomalyDetector.checkFearGreedAnomaly(value);
        
        SecurityAuditor.logSecurityEvent('DATA_ACCESS', {
          source: 'fear_greed_api',
          value,
          dataIntegrity: 'validated',
        });
        
        return Math.round(value); // Ensure integer
      } catch (error) {
        if (error instanceof SecurityError || error instanceof APIError) {
          throw error;
        }
        throw new APIError(
          `Fear & Greed API request failed: ${error}`,
          500,
          'https://api.alternative.me/fng/'
        );
      }
    });
  }

  async getStockData(symbol: string): Promise<{ change: number; price: number }> {
    // Validate and sanitize stock symbol
    const validatedSymbol = InputValidator.validateStockSymbol(symbol);
    
    if (!this.checkRateLimit(`yahoo-${validatedSymbol}`)) {
      throw new SecurityError(`Rate limit exceeded for Yahoo Finance API (${validatedSymbol})`);
    }

    return this.fetchWithCache(`stock-${validatedSymbol}`, async () => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${validatedSymbol}?interval=1d&range=5d`;
        const data = await this.secureClient.secureRequest<any>(url);
        
        // Validate response structure with comprehensive checks
        if (!data.chart || !data.chart.result || !Array.isArray(data.chart.result) || !data.chart.result[0]) {
          throw new APIError(`Invalid response format from Yahoo Finance API for ${validatedSymbol}`, 422, url);
        }
        
        const result = data.chart.result[0];
        if (!result.indicators || !result.indicators.quote || !Array.isArray(result.indicators.quote) || 
            !result.indicators.quote[0] || !Array.isArray(result.indicators.quote[0].close)) {
          throw new APIError(`No price data available for ${validatedSymbol}`, 422, url);
        }
        
        // Filter and validate price data
        const prices = result.indicators.quote[0].close
          .filter((price: any) => price !== null && typeof price === 'number' && Number.isFinite(price))
          .map((price: number) => InputValidator.validateNumber(price, `${validatedSymbol} price`));
        
        if (prices.length < 2) {
          throw new APIError(`Insufficient price data for ${validatedSymbol}`, 422, url);
        }
        
        const current = prices[prices.length - 1];
        const previous = prices[prices.length - 2];
        
        // Validate price reasonableness (stock prices should be positive)
        if (current <= 0 || previous <= 0) {
          throw new SecurityError(`Invalid stock price data for ${validatedSymbol}: prices must be positive`);
        }
        
        // Calculate percentage change with validation
        const change = ((current - previous) / previous) * 100;
        const validatedChange = InputValidator.validatePercentage(change, `${validatedSymbol} change`);
        
        // Check for anomalous price movements
        this.anomalyDetector.checkStockAnomaly(validatedSymbol, current, validatedChange);
        
        SecurityAuditor.logSecurityEvent('DATA_ACCESS', {
          source: 'yahoo_finance_api',
          symbol: validatedSymbol,
          price: current,
          change: validatedChange,
          dataIntegrity: 'validated',
        });
        
        return { 
          change: Math.round(validatedChange * 100) / 100, // Round to 2 decimal places
          price: Math.round(current * 100) / 100 // Round to 2 decimal places
        };
      } catch (error) {
        if (error instanceof SecurityError || error instanceof APIError) {
          throw error;
        }
        throw new APIError(
          `Yahoo Finance API request failed for ${validatedSymbol}: ${error}`,
          500,
          `https://query1.finance.yahoo.com/v8/finance/chart/${validatedSymbol}`
        );
      }
    });
  }

  async getVIXData(): Promise<number> {
    if (!this.checkRateLimit('yahoo-vix')) {
      throw new SecurityError('Rate limit exceeded for Yahoo Finance VIX API');
    }

    return this.fetchWithCache('vix', async () => {
      try {
        const url = 'https://query1.finance.yahoo.com/v8/finance/chart/^VIX?interval=1d&range=1d';
        const data = await this.secureClient.secureRequest<any>(url);
        
        // Validate response structure
        if (!data.chart || !data.chart.result || !Array.isArray(data.chart.result) || !data.chart.result[0] || 
            !data.chart.result[0].indicators || !data.chart.result[0].indicators.quote ||
            !Array.isArray(data.chart.result[0].indicators.quote) || !data.chart.result[0].indicators.quote[0] || 
            !Array.isArray(data.chart.result[0].indicators.quote[0].close)) {
          throw new APIError('Invalid response format from Yahoo Finance VIX API', 422, url);
        }
        
        const closeValues = data.chart.result[0].indicators.quote[0].close;
        const vixValue = closeValues[closeValues.length - 1]; // Get most recent value
        
        // Validate VIX value
        const validatedVix = InputValidator.validateNumber(vixValue, 'VIX');
        
        // VIX should be positive and typically ranges from 9-80 (extreme values)
        if (validatedVix < 0 || validatedVix > 200) {
          throw new SecurityError('VIX value out of reasonable range (0-200)');
        }
        
        // Check for anomalous VIX values
        this.anomalyDetector.checkVIXAnomaly(validatedVix);
        
        SecurityAuditor.logSecurityEvent('DATA_ACCESS', {
          source: 'yahoo_vix_api',
          value: validatedVix,
          dataIntegrity: 'validated',
        });
        
        return Math.round(validatedVix * 100) / 100; // Round to 2 decimal places
      } catch (error) {
        if (error instanceof SecurityError || error instanceof APIError) {
          throw error;
        }
        throw new APIError(
          `Yahoo Finance VIX API request failed: ${error}`,
          500,
          'https://query1.finance.yahoo.com/v8/finance/chart/^VIX'
        );
      }
    });
  }

  async getPutCallRatio(): Promise<number> {
    return this.fetchWithCache('put-call', async () => {
      try {
        // Since Yahoo Finance free API doesn't provide options volume data,
        // we'll calculate a proxy put/call ratio using market volatility indicators
        const [vixData, spyData] = await Promise.all([
          this.getVIXData(),
          this.getStockData('SPY')
        ]);

        // Calculate put/call proxy using VIX level and market movement
        let putCallProxy = this.calculatePutCallProxy(vixData, spyData.change);
        
        SecurityAuditor.logSecurityEvent('DATA_ACCESS', {
          source: 'put_call_proxy_calculation',
          vix: vixData,
          spyChange: spyData.change,
          calculatedRatio: putCallProxy,
          method: 'volatility_based_proxy',
        });
        
        return Math.round(putCallProxy * 100) / 100; // Round to 2 decimal places
        
      } catch (error) {
        // Enhanced fallback calculation based on current market conditions
        SecurityAuditor.logSecurityEvent('API_REQUEST_FAILED', {
          endpoint: 'put-call-proxy',
          error: error instanceof Error ? error.message : 'Unknown error',
          fallbackUsed: true,
        });
        
        // Return a more realistic market-neutral ratio instead of 1.00
        return 0.92; // Typical market average (slightly bullish bias)
      }
    });
  }

  /**
   * Calculate Put/Call ratio proxy using VIX and market movement
   * This provides a more realistic estimate than random generation
   */
  private calculatePutCallProxy(vixLevel: number, spyChange: number): number {
    // Base ratio starts at market neutral (0.9 = slightly more calls than puts, typical bull market)
    let ratio = 0.9;
    
    // VIX adjustment (higher VIX = more fear = more puts)
    // VIX 20-30: normal market conditions
    // VIX >30: increased fear, more puts
    // VIX <15: complacency, fewer puts
    if (vixLevel > 35) {
      ratio += 0.4; // High fear = much more put activity
    } else if (vixLevel > 25) {
      ratio += 0.2; // Moderate fear = more puts
    } else if (vixLevel < 15) {
      ratio -= 0.1; // Low fear = fewer puts (more calls)
    }
    
    // Market movement adjustment (down days = more defensive puts)
    if (spyChange < -2) {
      ratio += 0.3; // Large down move = defensive put buying
    } else if (spyChange < -0.5) {
      ratio += 0.15; // Moderate down move = some put buying
    } else if (spyChange > 1.5) {
      ratio -= 0.1; // Strong up move = less put demand
    }
    
    // Ensure ratio stays within realistic bounds (0.4 to 2.0)
    // Historical data shows ratios rarely go below 0.4 or above 2.0
    ratio = Math.max(0.4, Math.min(2.0, ratio));
    
    return ratio;
  }

  private calculateSentiment(fearGreed: number, stockChanges: number[], vix: number): SentimentLevel {
    const avgStockChange = stockChanges.reduce((a, b) => a + b, 0) / stockChanges.length;
    
    let score = 0;
    score += fearGreed;
    score += Math.max(-20, Math.min(20, avgStockChange * 10)) + 20;
    score += Math.max(0, Math.min(40, (40 - vix) * 2));
    
    const normalizedScore = score / 140 * 100;
    
    if (normalizedScore < 20) return 'extreme-fear';
    if (normalizedScore < 40) return 'fear';
    if (normalizedScore < 60) return 'neutral';
    if (normalizedScore < 80) return 'greed';
    return 'extreme-greed';
  }

  async getSentimentData(): Promise<APIResponse<SentimentData>> {
    try {
      // First try to load data from the pre-fetched JSON file (for static deployment)
      const jsonData = await this.loadPreFetchedData();
      if (jsonData) {
        console.log('Using pre-fetched data from JSON file');
        return {
          success: true,
          data: jsonData
        };
      }

      // Fall back to direct API calls if JSON data unavailable
      console.log('JSON data unavailable, falling back to direct API calls');
      const [fearGreed, spy, qqq, iwm, vix, putCall] = await Promise.allSettled([
        this.getFearGreedIndex(),
        this.getStockData('SPY'),
        this.getStockData('QQQ'),
        this.getStockData('IWM'),
        this.getVIXData(),
        this.getPutCallRatio()
      ]);

      const fearGreedValue = fearGreed.status === 'fulfilled' ? fearGreed.value : 50;
      const spyData = spy.status === 'fulfilled' ? spy.value : { change: 0, price: 620 };
      const qqqData = qqq.status === 'fulfilled' ? qqq.value : { change: 0, price: 540 };
      const iwmData = iwm.status === 'fulfilled' ? iwm.value : { change: 0, price: 200 };
      const vixValue = vix.status === 'fulfilled' ? vix.value : 20;
      const putCallValue = putCall.status === 'fulfilled' ? putCall.value : 0.92;

      const stockChanges = [spyData.change, qqqData.change, iwmData.change];
      const overallSentiment = this.calculateSentiment(fearGreedValue, stockChanges, vixValue);

      return {
        success: true,
        data: {
          fearGreedIndex: fearGreedValue,
          spyChange: spyData.change,
          spyPrice: spyData.price || 500,
          qqqqChange: qqqData.change,
          qqqPrice: qqqData.price || 400,
          iwmChange: iwmData.change,
          iwmPrice: iwmData.price || 200,
          vixLevel: vixValue,
          putCallRatio: putCallValue,
          overallSentiment,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        data: this.getMockData(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async loadPreFetchedData(): Promise<SentimentData | null> {
    try {
      const response = await fetch('/data/market-data.json');
      if (!response.ok) {
        console.log('Pre-fetched data file not found or inaccessible');
        return null;
      }

      const marketData = await response.json();
      
      // Extract relevant data from the JSON structure
      const stocks = marketData.stocks || {};
      const vixData = stocks['^VIX'] || {}; // VIX is stored in stocks with ^VIX symbol
      const fearGreedData = marketData.fearGreed || {}; // fearGreed not fear_greed

      // Convert to expected SentimentData format
      const spyChange = stocks.SPY?.change || 0;
      const spyPrice = stocks.SPY?.price || 500;
      const qqqChange = stocks.QQQ?.change || 0;
      const qqqPrice = stocks.QQQ?.price || 400;
      const iwmChange = stocks.IWM?.change || 0;
      const iwmPrice = stocks.IWM?.price || 200;
      const vixLevel = vixData.price || 20; // VIX price not value
      const fearGreedIndex = fearGreedData.value || 50;
      // Use pre-calculated put/call ratio from data, fallback to calculation if not available
      const putCallRatio = marketData.putCallRatio || this.calculatePutCallProxy(vixLevel, spyChange);


      const stockChanges = [spyChange, qqqChange, iwmChange];
      const overallSentiment = this.calculateSentiment(fearGreedIndex, stockChanges, vixLevel);

      return {
        fearGreedIndex,
        spyChange,
        spyPrice,
        qqqqChange: qqqChange,
        qqqPrice,
        iwmChange,
        iwmPrice,
        vixLevel,
        putCallRatio,
        overallSentiment,
        lastUpdated: marketData.timestamp || new Date().toISOString()
      };
    } catch (error) {
      console.log('Error loading pre-fetched data:', error);
      return null;
    }
  }

  private getMockData(): SentimentData {
    const mockChanges = [0.5, -0.3, 0.8];
    return {
      fearGreedIndex: 45,
      spyChange: mockChanges[0],
      spyPrice: 620,
      qqqqChange: mockChanges[1],
      qqqPrice: 540,
      iwmChange: mockChanges[2],
      iwmPrice: 200,
      vixLevel: 22,
      putCallRatio: 0.92,
      overallSentiment: this.calculateSentiment(45, mockChanges, 22),
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Anomaly detection for financial data security monitoring
 */
class AnomalyDetector {
  private errorHistory: Map<string, Array<{ timestamp: number; error: Error }>> = new Map();
  private dataHistory: Map<string, Array<{ timestamp: number; value: number }>> = new Map();
  private readonly HISTORY_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
  private readonly ANOMALY_THRESHOLD = 3; // Standard deviations

  /**
   * Record API error for pattern analysis
   */
  recordError(endpoint: string, error: Error): void {
    const now = Date.now();
    const history = this.errorHistory.get(endpoint) || [];
    
    // Add new error
    history.push({ timestamp: now, error });
    
    // Remove old entries
    const filtered = history.filter(entry => now - entry.timestamp < this.HISTORY_WINDOW);
    this.errorHistory.set(endpoint, filtered);
    
    // Check for error patterns
    this.detectErrorAnomalies(endpoint, filtered);
  }

  /**
   * Check for anomalous Fear & Greed Index values
   */
  checkFearGreedAnomaly(value: number): void {
    this.recordDataPoint('fear-greed', value);
    
    // Fear & Greed Index should typically be between 10-90
    if (value < 5 || value > 95) {
      SecurityAuditor.logSecurityEvent('ANOMALY_DETECTED', {
        type: 'EXTREME_FEAR_GREED_VALUE',
        value,
        threshold: 'Outside normal range (5-95)',
      });
    }
  }

  /**
   * Check for anomalous stock price movements
   */
  checkStockAnomaly(symbol: string, price: number, change: number): void {
    this.recordDataPoint(`stock-${symbol}`, price);
    
    // Check for extreme price changes
    if (Math.abs(change) > 20) {
      SecurityAuditor.logSecurityEvent('ANOMALY_DETECTED', {
        type: 'EXTREME_STOCK_MOVEMENT',
        symbol,
        price,
        change,
        threshold: '>20% change',
      });
    }
    
    // Check for suspicious price patterns
    const history = this.dataHistory.get(`stock-${symbol}`) || [];
    if (history.length > 5) {
      const recentPrices = history.slice(-5).map(h => h.value);
      const variance = this.calculateVariance(recentPrices);
      
      if (variance < 0.01) { // Very low variance might indicate manipulation
        SecurityAuditor.logSecurityEvent('ANOMALY_DETECTED', {
          type: 'SUSPICIOUS_PRICE_PATTERN',
          symbol,
          pattern: 'LOW_VARIANCE',
          variance,
        });
      }
    }
  }

  /**
   * Check for anomalous VIX values
   */
  checkVIXAnomaly(value: number): void {
    this.recordDataPoint('vix', value);
    
    // VIX rarely goes below 9 or above 80
    if (value < 8 || value > 100) {
      SecurityAuditor.logSecurityEvent('ANOMALY_DETECTED', {
        type: 'EXTREME_VIX_VALUE',
        value,
        threshold: 'Outside typical range (8-100)',
      });
    }
  }

  /**
   * Record data point for anomaly detection
   */
  private recordDataPoint(key: string, value: number): void {
    const now = Date.now();
    const history = this.dataHistory.get(key) || [];
    
    history.push({ timestamp: now, value });
    
    // Remove old entries
    const filtered = history.filter(entry => now - entry.timestamp < this.HISTORY_WINDOW);
    this.dataHistory.set(key, filtered);
  }

  /**
   * Detect error patterns that might indicate attacks or system issues
   */
  private detectErrorAnomalies(endpoint: string, errorHistory: Array<{ timestamp: number; error: Error }>): void {
    const now = Date.now();
    const recentErrors = errorHistory.filter(entry => now - entry.timestamp < 5 * 60 * 1000); // Last 5 minutes
    
    // Check for rapid error bursts
    if (recentErrors.length >= 10) {
      SecurityAuditor.logSecurityEvent('ANOMALY_DETECTED', {
        type: 'ERROR_BURST',
        endpoint,
        errorCount: recentErrors.length,
        timeWindow: '5 minutes',
      });
    }
    
    // Check for repeated error types
    const errorTypes = recentErrors.map(e => e.error.name);
    const uniqueTypes = new Set(errorTypes);
    
    if (recentErrors.length >= 5 && uniqueTypes.size === 1) {
      SecurityAuditor.logSecurityEvent('ANOMALY_DETECTED', {
        type: 'REPEATED_ERROR_TYPE',
        endpoint,
        errorType: Array.from(uniqueTypes)[0],
        count: recentErrors.length,
      });
    }
  }

  /**
   * Calculate variance for anomaly detection
   */
  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
}

export default APIService;