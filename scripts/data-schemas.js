#!/usr/bin/env node

/**
 * Data Schema Validation Module
 * Provides JSON schema validation for all external API responses
 * Ensures data integrity and compliance with financial data standards
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ 
  allErrors: true, 
  verbose: true,
  strict: false,
  removeAdditional: true // Remove additional properties not defined in schema
});
addFormats(ajv);

// Financial data validation patterns
const FINANCIAL_PATTERNS = {
  percentage: "^-?[0-9]+(\\.[0-9]+)?$",
  price: "^[0-9]+(\\.[0-9]+)?$",
  volume: "^[0-9]+$",
  symbol: "^[A-Z^]{1,6}$",
  timestamp: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z$"
};

// Yahoo Finance API Schema
const YAHOO_FINANCE_SCHEMA = {
  type: "object",
  required: ["chart"],
  properties: {
    chart: {
      type: "object",
      required: ["result"],
      properties: {
        result: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["indicators"],
            properties: {
              meta: {
                type: "object",
                properties: {
                  currency: { type: "string" },
                  symbol: { type: "string", pattern: FINANCIAL_PATTERNS.symbol },
                  exchangeName: { type: "string" },
                  instrumentType: { type: "string" },
                  firstTradeDate: { type: "number" },
                  regularMarketTime: { type: "number" },
                  gmtoffset: { type: "number" },
                  timezone: { type: "string" },
                  exchangeTimezoneName: { type: "string" },
                  regularMarketPrice: { type: "number", minimum: 0 },
                  chartPreviousClose: { type: "number", minimum: 0 },
                  priceHint: { type: "number" },
                  currentTradingPeriod: { type: "object" },
                  dataGranularity: { type: "string" },
                  range: { type: "string" },
                  validRanges: { type: "array" }
                }
              },
              timestamp: {
                type: "array",
                items: { type: "number", minimum: 0 }
              },
              indicators: {
                type: "object",
                required: ["quote"],
                properties: {
                  quote: {
                    type: "array",
                    minItems: 1,
                    items: {
                      type: "object",
                      required: ["close"],
                      properties: {
                        open: {
                          type: "array",
                          items: { type: ["number", "null"], minimum: 0 }
                        },
                        high: {
                          type: "array",
                          items: { type: ["number", "null"], minimum: 0 }
                        },
                        low: {
                          type: "array",
                          items: { type: ["number", "null"], minimum: 0 }
                        },
                        close: {
                          type: "array",
                          items: { type: ["number", "null"], minimum: 0 }
                        },
                        volume: {
                          type: "array",
                          items: { type: ["number", "null"], minimum: 0 }
                        }
                      }
                    }
                  },
                  adjclose: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        adjclose: {
                          type: "array",
                          items: { type: ["number", "null"], minimum: 0 }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        error: { type: ["object", "null"] }
      }
    }
  }
};

// Fear & Greed Index API Schema
const FEAR_GREED_SCHEMA = {
  type: "object",
  required: ["name", "data"],
  properties: {
    name: { type: "string", enum: ["Fear and Greed Index"] },
    data: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["value", "value_classification", "timestamp", "time_until_update"],
        properties: {
          value: { 
            type: "string", 
            pattern: "^[0-9]{1,3}$",
            // Validate that value is between 0-100 when converted to number
            transform: ["trim"],
            minimum: 0,
            maximum: 100
          },
          value_classification: { 
            type: "string", 
            enum: ["Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"] 
          },
          timestamp: { 
            type: "string", 
            pattern: "^[0-9]{10}$" // Unix timestamp
          },
          time_until_update: { 
            type: ["string", "null"]
          }
        }
      }
    },
    metadata: { type: "object" }
  }
};

// Alpha Vantage News Sentiment Schema
const ALPHA_VANTAGE_NEWS_SCHEMA = {
  type: "object",
  required: ["items", "sentiment_score_definition", "relevance_score_definition"],
  properties: {
    items: { type: "string" },
    sentiment_score_definition: { type: "string" },
    relevance_score_definition: { type: "string" },
    feed: {
      type: "array",
      items: {
        type: "object",
        required: ["title", "url", "time_published", "authors", "summary"],
        properties: {
          title: { type: "string", minLength: 1 },
          url: { type: "string", format: "uri" },
          time_published: { 
            type: "string", 
            pattern: "^\\d{8}T\\d{6}$" // YYYYMMDDTHHMMSS format
          },
          authors: {
            type: "array",
            items: { type: "string" }
          },
          summary: { type: "string", minLength: 1 },
          banner_image: { type: ["string", "null"], format: "uri" },
          source: { type: "string" },
          category_within_source: { type: "string" },
          source_domain: { type: "string" },
          topics: {
            type: "array",
            items: {
              type: "object",
              properties: {
                topic: { type: "string" },
                relevance_score: { type: "string", pattern: "^[0-1](\\.[0-9]+)?$" }
              }
            }
          },
          overall_sentiment_score: { 
            type: "number", 
            minimum: -1, 
            maximum: 1 
          },
          overall_sentiment_label: { 
            type: "string", 
            enum: ["Bearish", "Somewhat-Bearish", "Neutral", "Somewhat-Bullish", "Bullish"] 
          },
          ticker_sentiment: {
            type: "array",
            items: {
              type: "object",
              required: ["ticker", "relevance_score", "ticker_sentiment_score", "ticker_sentiment_label"],
              properties: {
                ticker: { type: "string", pattern: FINANCIAL_PATTERNS.symbol },
                relevance_score: { 
                  type: "string", 
                  pattern: "^[0-1](\\.[0-9]+)?$" 
                },
                ticker_sentiment_score: { 
                  type: "string", 
                  pattern: "^-?[0-1](\\.[0-9]+)?$" 
                },
                ticker_sentiment_label: { 
                  type: "string", 
                  enum: ["Bearish", "Somewhat-Bearish", "Neutral", "Somewhat-Bullish", "Bullish"] 
                }
              }
            }
          }
        }
      }
    }
  }
};

// FRED Economic Data Schema
const FRED_SCHEMA = {
  type: "object",
  required: ["realtime_start", "realtime_end", "observation_start", "observation_end", "units", "output_type", "file_type", "order_by", "sort_order", "count", "offset", "limit", "observations"],
  properties: {
    realtime_start: { type: "string", format: "date" },
    realtime_end: { type: "string", format: "date" },
    observation_start: { type: "string", format: "date" },
    observation_end: { type: "string", format: "date" },
    units: { type: "string" },
    output_type: { type: "number" },
    file_type: { type: "string" },
    order_by: { type: "string" },
    sort_order: { type: "string" },
    count: { type: "number", minimum: 0 },
    offset: { type: "number", minimum: 0 },
    limit: { type: "number", minimum: 1 },
    observations: {
      type: "array",
      items: {
        type: "object",
        required: ["realtime_start", "realtime_end", "date", "value"],
        properties: {
          realtime_start: { type: "string", format: "date" },
          realtime_end: { type: "string", format: "date" },
          date: { type: "string", format: "date" },
          value: { 
            type: "string",
            // Can be numeric value or "." for missing data
            pattern: "^([0-9]+(\\.[0-9]+)?|\\.)$"
          }
        }
      }
    }
  }
};

// CoinGecko API Schema
const COINGECKO_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    required: ["id", "symbol", "name", "current_price", "market_cap", "total_volume", "price_change_percentage_24h"],
    properties: {
      id: { type: "string", minLength: 1 },
      symbol: { type: "string", minLength: 1 },
      name: { type: "string", minLength: 1 },
      image: { type: "string", format: "uri" },
      current_price: { type: ["number", "null"], minimum: 0 },
      market_cap: { type: ["number", "null"], minimum: 0 },
      market_cap_rank: { type: ["number", "null"], minimum: 1 },
      fully_diluted_valuation: { type: ["number", "null"] },
      total_volume: { type: ["number", "null"], minimum: 0 },
      high_24h: { type: ["number", "null"], minimum: 0 },
      low_24h: { type: ["number", "null"], minimum: 0 },
      price_change_24h: { type: ["number", "null"] },
      price_change_percentage_24h: { type: ["number", "null"] },
      market_cap_change_24h: { type: ["number", "null"] },
      market_cap_change_percentage_24h: { type: ["number", "null"] },
      circulating_supply: { type: ["number", "null"], minimum: 0 },
      total_supply: { type: ["number", "null"], minimum: 0 },
      max_supply: { type: ["number", "null"], minimum: 0 },
      ath: { type: ["number", "null"], minimum: 0 },
      ath_change_percentage: { type: ["number", "null"] },
      ath_date: { type: ["string", "null"], format: "date-time" },
      atl: { type: ["number", "null"], minimum: 0 },
      atl_change_percentage: { type: ["number", "null"] },
      atl_date: { type: ["string", "null"], format: "date-time" },
      roi: { 
        type: ["object", "null"],
        properties: {
          times: { type: "number" },
          currency: { type: "string" },
          percentage: { type: "number" }
        }
      },
      last_updated: { type: "string", format: "date-time" },
      sparkline_in_7d: {
        type: ["object", "null"],
        properties: {
          price: {
            type: "array",
            items: { type: ["number", "null"] }
          }
        }
      },
      price_change_percentage_1h_in_currency: { type: ["number", "null"] },
      price_change_percentage_24h_in_currency: { type: ["number", "null"] },
      price_change_percentage_7d_in_currency: { type: ["number", "null"] }
    }
  }
};

// Compile schemas
const validators = {
  yahooFinance: ajv.compile(YAHOO_FINANCE_SCHEMA),
  fearGreed: ajv.compile(FEAR_GREED_SCHEMA),
  alphaVantageNews: ajv.compile(ALPHA_VANTAGE_NEWS_SCHEMA),
  fred: ajv.compile(FRED_SCHEMA),
  coinGecko: ajv.compile(COINGECKO_SCHEMA)
};

/**
 * Data validation class with enterprise-grade validation patterns
 */
export class DataValidator {
  constructor() {
    this.validationHistory = new Map();
    this.errorPatterns = new Map();
  }

  /**
   * Validate data against a specific schema
   * @param {string} schemaType - Type of schema to validate against
   * @param {any} data - Data to validate
   * @param {string} source - Data source identifier
   * @returns {Object} Validation result
   */
  validate(schemaType, data, source = 'unknown') {
    const validator = validators[schemaType];
    if (!validator) {
      throw new Error(`Unknown schema type: ${schemaType}`);
    }

    const startTime = Date.now();
    const isValid = validator(data);
    const validationTime = Date.now() - startTime;

    const result = {
      isValid,
      errors: validator.errors || [],
      source,
      schemaType,
      timestamp: new Date().toISOString(),
      validationTime,
      dataSize: JSON.stringify(data).length
    };

    // Track validation history
    this.trackValidation(result);

    // Log validation results
    this.logValidationResult(result);

    return result;
  }

  /**
   * Validate Yahoo Finance API response
   */
  validateYahooFinance(data, symbol) {
    const result = this.validate('yahooFinance', data, `yahoo-${symbol}`);
    
    // Additional business logic validation
    if (result.isValid) {
      const additionalChecks = this.validateFinancialBusinessRules(data, symbol);
      result.businessRuleViolations = additionalChecks.violations;
      result.isCompliant = additionalChecks.isCompliant;
    }

    return result;
  }

  /**
   * Validate Fear & Greed Index response
   */
  validateFearGreed(data) {
    const result = this.validate('fearGreed', data, 'fear-greed');
    
    if (result.isValid) {
      // Additional validation for Fear & Greed specific rules
      const value = parseInt(data.data[0].value);
      if (value < 0 || value > 100) {
        result.businessRuleViolations = [{
          rule: 'fear_greed_range',
          message: `Fear & Greed value ${value} is outside valid range 0-100`,
          severity: 'error'
        }];
        result.isCompliant = false;
      } else {
        result.isCompliant = true;
      }
    }

    return result;
  }

  /**
   * Validate Alpha Vantage News Sentiment response
   */
  validateAlphaVantageNews(data, symbol) {
    const result = this.validate('alphaVantageNews', data, `alpha-vantage-news-${symbol}`);
    
    if (result.isValid && data.feed) {
      // Validate sentiment scores are within expected ranges
      const violations = [];
      data.feed.forEach((article, index) => {
        if (article.overall_sentiment_score < -1 || article.overall_sentiment_score > 1) {
          violations.push({
            rule: 'sentiment_score_range',
            message: `Article ${index} sentiment score ${article.overall_sentiment_score} outside range [-1, 1]`,
            severity: 'error'
          });
        }
      });
      
      result.businessRuleViolations = violations;
      result.isCompliant = violations.length === 0;
    }

    return result;
  }

  /**
   * Validate FRED economic data response
   */
  validateFRED(data, series) {
    const result = this.validate('fred', data, `fred-${series}`);
    
    if (result.isValid) {
      // Check for data freshness
      const violations = [];
      const latestObservation = data.observations[0];
      const observationDate = new Date(latestObservation.date);
      const daysSinceUpdate = (Date.now() - observationDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate > 90) { // Economic data shouldn't be older than 90 days
        violations.push({
          rule: 'data_freshness',
          message: `FRED data for ${series} is ${Math.round(daysSinceUpdate)} days old`,
          severity: 'warning'
        });
      }

      result.businessRuleViolations = violations;
      result.isCompliant = violations.filter(v => v.severity === 'error').length === 0;
    }

    return result;
  }

  /**
   * Validate CoinGecko cryptocurrency data
   */
  validateCoinGecko(data) {
    const result = this.validate('coinGecko', data, 'coingecko');
    
    if (result.isValid) {
      const violations = [];
      
      data.forEach((coin, index) => {
        // Validate price change percentages are reasonable (not more than 100% change in 24h)
        if (Math.abs(coin.price_change_percentage_24h) > 100) {
          violations.push({
            rule: 'reasonable_price_change',
            message: `${coin.symbol} has extreme 24h price change: ${coin.price_change_percentage_24h}%`,
            severity: 'warning'
          });
        }
        
        // Validate market cap is reasonable compared to current price and supply
        if (coin.current_price && coin.circulating_supply && coin.market_cap) {
          const calculatedMarketCap = coin.current_price * coin.circulating_supply;
          const deviation = Math.abs(calculatedMarketCap - coin.market_cap) / coin.market_cap;
          
          if (deviation > 0.1) { // 10% deviation threshold
            violations.push({
              rule: 'market_cap_consistency',
              message: `${coin.symbol} market cap calculation deviation: ${Math.round(deviation * 100)}%`,
              severity: 'warning'
            });
          }
        }
      });

      result.businessRuleViolations = violations;
      result.isCompliant = violations.filter(v => v.severity === 'error').length === 0;
    }

    return result;
  }

  /**
   * Validate financial business rules for stock data
   */
  validateFinancialBusinessRules(data, symbol) {
    const violations = [];
    
    try {
      const result = data.chart.result[0];
      const prices = result.indicators.quote[0].close.filter(p => p !== null);
      
      if (prices.length < 2) {
        violations.push({
          rule: 'minimum_data_points',
          message: `Insufficient price data for ${symbol}: only ${prices.length} data points`,
          severity: 'error'
        });
      } else {
        const current = prices[prices.length - 1];
        const previous = prices[prices.length - 2];
        const changePercent = Math.abs(((current - previous) / previous) * 100);
        
        // Check for unrealistic price movements (more than 50% in one day for major indices)
        const majorIndices = ['SPY', 'QQQ', 'IWM', 'DIA', '^VIX'];
        if (majorIndices.includes(symbol) && changePercent > 50) {
          violations.push({
            rule: 'realistic_price_movement',
            message: `Extreme price movement for ${symbol}: ${changePercent.toFixed(2)}%`,
            severity: 'error'
          });
        }
        
        // Check for zero or negative prices
        if (current <= 0) {
          violations.push({
            rule: 'positive_price',
            message: `Invalid price for ${symbol}: ${current}`,
            severity: 'error'
          });
        }
        
        // Check for missing volume data on trading days
        const volumes = result.indicators.quote[0].volume;
        if (volumes && volumes[volumes.length - 1] === 0 && !symbol.startsWith('^')) {
          violations.push({
            rule: 'volume_validation',
            message: `Zero volume detected for ${symbol} on trading day`,
            severity: 'warning'
          });
        }
      }
    } catch (error) {
      violations.push({
        rule: 'data_structure',
        message: `Failed to parse price data for ${symbol}: ${error.message}`,
        severity: 'error'
      });
    }

    return {
      violations,
      isCompliant: violations.filter(v => v.severity === 'error').length === 0
    };
  }

  /**
   * Track validation results for pattern analysis
   */
  trackValidation(result) {
    const key = `${result.source}-${result.schemaType}`;
    
    if (!this.validationHistory.has(key)) {
      this.validationHistory.set(key, {
        totalValidations: 0,
        successCount: 0,
        errorCount: 0,
        avgValidationTime: 0,
        recentErrors: []
      });
    }

    const history = this.validationHistory.get(key);
    history.totalValidations++;
    
    if (result.isValid) {
      history.successCount++;
    } else {
      history.errorCount++;
      history.recentErrors.push({
        timestamp: result.timestamp,
        errors: result.errors,
        errorCount: result.errors.length
      });
      
      // Keep only last 10 errors
      if (history.recentErrors.length > 10) {
        history.recentErrors = history.recentErrors.slice(-10);
      }
    }

    // Update average validation time
    history.avgValidationTime = ((history.avgValidationTime * (history.totalValidations - 1)) + result.validationTime) / history.totalValidations;
  }

  /**
   * Log validation results
   */
  logValidationResult(result) {
    const logLevel = result.isValid ? 'info' : 'error';
    const logData = {
      timestamp: result.timestamp,
      source: result.source,
      schemaType: result.schemaType,
      isValid: result.isValid,
      validationTime: result.validationTime,
      dataSize: result.dataSize,
      errorCount: result.errors.length
    };

    if (!result.isValid) {
      logData.errors = result.errors.map(err => ({
        instancePath: err.instancePath,
        schemaPath: err.schemaPath,
        keyword: err.keyword,
        message: err.message,
        data: err.data
      }));
    }

    console.log(`[DATA_VALIDATION] [${logLevel.toUpperCase()}]`, JSON.stringify(logData, null, 2));
  }

  /**
   * Get validation statistics
   */
  getValidationStats() {
    const stats = {};
    
    for (const [key, history] of this.validationHistory.entries()) {
      stats[key] = {
        ...history,
        successRate: (history.successCount / history.totalValidations) * 100,
        errorRate: (history.errorCount / history.totalValidations) * 100
      };
    }

    return {
      timestamp: new Date().toISOString(),
      totalSources: this.validationHistory.size,
      stats
    };
  }

  /**
   * Clear validation history (for maintenance)
   */
  clearHistory() {
    this.validationHistory.clear();
    this.errorPatterns.clear();
    console.log('[DATA_VALIDATION] Validation history cleared');
  }
}

export default DataValidator;