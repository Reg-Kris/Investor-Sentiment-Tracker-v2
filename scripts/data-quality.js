#!/usr/bin/env node

/**
 * Enterprise Data Quality Management System
 * Implements comprehensive data quality gates, integrity checks, and outlier detection
 * for financial data processing with compliance monitoring
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAuditLogger, AUDIT_LEVELS, AUDIT_CATEGORIES } from './audit-logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data quality rule types
const QUALITY_RULE_TYPES = {
  COMPLETENESS: 'COMPLETENESS',
  ACCURACY: 'ACCURACY', 
  CONSISTENCY: 'CONSISTENCY',
  VALIDITY: 'VALIDITY',
  FRESHNESS: 'FRESHNESS',
  UNIQUENESS: 'UNIQUENESS',
  INTEGRITY: 'INTEGRITY',
  OUTLIER_DETECTION: 'OUTLIER_DETECTION'
};

// Quality check severity levels
const QUALITY_SEVERITY = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

// Financial data thresholds and boundaries
const FINANCIAL_BOUNDARIES = {
  STOCK_PRICE: {
    min: 0.01,
    max: 100000,
    dailyChangeLimit: 50 // 50% max daily change for most stocks
  },
  INDEX_PRICE: {
    min: 1,
    max: 50000,
    dailyChangeLimit: 20 // 20% max daily change for indices
  },
  VIX: {
    min: 5,
    max: 100,
    normalRange: [10, 40]
  },
  FEAR_GREED: {
    min: 0,
    max: 100,
    normalRange: [20, 80]
  },
  VOLUME: {
    min: 0,
    maxDailyMultiplier: 10 // Volume can't be 10x average without investigation
  },
  MARKET_CAP: {
    min: 1000000, // $1M minimum
    max: 10000000000000 // $10T maximum
  },
  PERCENTAGE: {
    min: -100,
    max: 1000 // Allow for high percentage gains in crypto
  },
  ECONOMIC_INDICATORS: {
    UNEMPLOYMENT: { min: 0, max: 50 },
    INFLATION: { min: -10, max: 50 },
    GDP_GROWTH: { min: -20, max: 20 },
    INTEREST_RATE: { min: -5, max: 25 }
  }
};

export class DataQualityManager {
  constructor(config = {}) {
    this.config = {
      enableOutlierDetection: true,
      outlierStandardDeviations: 3,
      enableCrossValidation: true,
      enableFreshnessChecks: true,
      maxDataAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      historicalDataWindow: 30, // 30 days for trend analysis
      enableComplianceReporting: true,
      qualityThresholds: {
        completeness: 95, // 95% data completeness required
        accuracy: 98,     // 98% accuracy required
        freshness: 90,    // 90% of data must be fresh
        consistency: 95   // 95% consistency across sources
      },
      ...config
    };

    this.auditLogger = getAuditLogger();
    this.qualityMetrics = new Map();
    this.historicalData = new Map();
    this.crossValidationRules = new Map();
    
    this.initializeQualityRules();
  }

  /**
   * Initialize default quality rules
   */
  initializeQualityRules() {
    // Stock price validation rules
    this.addQualityRule('stock_price_range', QUALITY_RULE_TYPES.VALIDITY, {
      field: 'price',
      validator: (value, context) => {
        const bounds = context.symbol?.startsWith('^') ? 
          FINANCIAL_BOUNDARIES.INDEX_PRICE : FINANCIAL_BOUNDARIES.STOCK_PRICE;
        return value >= bounds.min && value <= bounds.max;
      },
      severity: QUALITY_SEVERITY.ERROR,
      message: 'Stock price outside acceptable range'
    });

    // VIX validation
    this.addQualityRule('vix_range', QUALITY_RULE_TYPES.VALIDITY, {
      field: 'vix',
      validator: (value) => {
        return value >= FINANCIAL_BOUNDARIES.VIX.min && value <= FINANCIAL_BOUNDARIES.VIX.max;
      },
      severity: QUALITY_SEVERITY.ERROR,
      message: 'VIX value outside acceptable range'
    });

    // Fear & Greed Index validation
    this.addQualityRule('fear_greed_range', QUALITY_RULE_TYPES.VALIDITY, {
      field: 'fearGreedIndex',
      validator: (value) => {
        return value >= FINANCIAL_BOUNDARIES.FEAR_GREED.min && value <= FINANCIAL_BOUNDARIES.FEAR_GREED.max;
      },
      severity: QUALITY_SEVERITY.ERROR,
      message: 'Fear & Greed Index outside valid range'
    });

    // Percentage change validation
    this.addQualityRule('percentage_change', QUALITY_RULE_TYPES.VALIDITY, {
      field: 'change',
      validator: (value, context) => {
        const bounds = FINANCIAL_BOUNDARIES.PERCENTAGE;
        if (value < bounds.min || value > bounds.max) return false;
        
        // Additional check for extreme changes in major indices
        const majorIndices = ['SPY', 'QQQ', 'IWM', 'DIA'];
        if (context.symbol && majorIndices.includes(context.symbol)) {
          return Math.abs(value) <= FINANCIAL_BOUNDARIES.INDEX_PRICE.dailyChangeLimit;
        }
        
        return Math.abs(value) <= FINANCIAL_BOUNDARIES.STOCK_PRICE.dailyChangeLimit;
      },
      severity: QUALITY_SEVERITY.WARNING,
      message: 'Extreme percentage change detected'
    });

    // Data completeness check
    this.addQualityRule('data_completeness', QUALITY_RULE_TYPES.COMPLETENESS, {
      validator: (data) => {
        const requiredFields = this.getRequiredFields(data);
        const presentFields = requiredFields.filter(field => 
          this.hasValue(this.getNestedValue(data, field))
        );
        return (presentFields.length / requiredFields.length) * 100 >= this.config.qualityThresholds.completeness;
      },
      severity: QUALITY_SEVERITY.ERROR,
      message: 'Data completeness below threshold'
    });

    // Freshness check
    this.addQualityRule('data_freshness', QUALITY_RULE_TYPES.FRESHNESS, {
      validator: (data) => {
        const timestamp = data.timestamp || data.lastUpdated || data.date;
        if (!timestamp) return false;
        
        const dataAge = Date.now() - new Date(timestamp).getTime();
        return dataAge <= this.config.maxDataAge;
      },
      severity: QUALITY_SEVERITY.WARNING,
      message: 'Data is stale and may be outdated'
    });
  }

  /**
   * Add a quality rule
   */
  addQualityRule(id, type, rule) {
    if (!this.qualityRules) {
      this.qualityRules = new Map();
    }
    
    this.qualityRules.set(id, {
      id,
      type,
      ...rule,
      createdAt: new Date().toISOString()
    });
  }

  /**
   * Run comprehensive data quality checks
   */
  async runQualityChecks(data, source, context = {}) {
    const startTime = Date.now();
    
    const qualityReport = {
      source,
      timestamp: new Date().toISOString(),
      dataSize: JSON.stringify(data).length,
      context,
      checks: {
        completeness: null,
        accuracy: null,
        consistency: null,
        validity: null,
        freshness: null,
        uniqueness: null,
        outliers: null
      },
      violations: [],
      overallScore: 0,
      passed: false,
      processingTime: 0
    };

    try {
      // Run all quality checks
      qualityReport.checks.completeness = await this.checkCompleteness(data, source);
      qualityReport.checks.accuracy = await this.checkAccuracy(data, source, context);
      qualityReport.checks.validity = await this.checkValidity(data, source, context);
      qualityReport.checks.freshness = await this.checkFreshness(data, source);
      qualityReport.checks.outliers = await this.detectOutliers(data, source, context);
      
      if (this.config.enableConsistencyChecks) {
        qualityReport.checks.consistency = await this.checkConsistency(data, source, context);
      }

      // Collect all violations
      const allChecks = Object.values(qualityReport.checks).filter(check => check !== null);
      qualityReport.violations = allChecks.reduce((violations, check) => {
        return violations.concat(check.violations || []);
      }, []);

      // Calculate overall quality score
      qualityReport.overallScore = this.calculateQualityScore(qualityReport.checks);
      qualityReport.passed = qualityReport.overallScore >= 70 && // Minimum 70% quality score
        qualityReport.violations.filter(v => v.severity === QUALITY_SEVERITY.CRITICAL).length === 0;

      qualityReport.processingTime = Date.now() - startTime;

      // Log quality check results
      await this.auditLogger.logDataValidation(source, {
        isValid: qualityReport.passed,
        validationTime: qualityReport.processingTime,
        errors: qualityReport.violations,
        overallScore: qualityReport.overallScore
      }, data);

      // Store quality metrics for trending
      this.updateQualityMetrics(source, qualityReport);

      return qualityReport;

    } catch (error) {
      qualityReport.error = error.message;
      qualityReport.processingTime = Date.now() - startTime;
      
      await this.auditLogger.logError(error, {
        operation: 'data_quality_check',
        source,
        affectsDataIntegrity: true
      });

      return qualityReport;
    }
  }

  /**
   * Check data completeness
   */
  async checkCompleteness(data, source) {
    const requiredFields = this.getRequiredFields(data, source);
    const presentFields = [];
    const missingFields = [];

    requiredFields.forEach(field => {
      const value = this.getNestedValue(data, field);
      if (this.hasValue(value)) {
        presentFields.push(field);
      } else {
        missingFields.push(field);
      }
    });

    const completenessScore = (presentFields.length / requiredFields.length) * 100;
    const passed = completenessScore >= this.config.qualityThresholds.completeness;

    const violations = [];
    if (!passed) {
      violations.push({
        rule: 'data_completeness',
        type: QUALITY_RULE_TYPES.COMPLETENESS,
        severity: QUALITY_SEVERITY.ERROR,
        message: `Data completeness ${completenessScore.toFixed(1)}% below threshold ${this.config.qualityThresholds.completeness}%`,
        missingFields,
        impact: 'Data processing may be incomplete or inaccurate'
      });
    }

    return {
      type: QUALITY_RULE_TYPES.COMPLETENESS,
      score: completenessScore,
      passed,
      requiredFields: requiredFields.length,
      presentFields: presentFields.length,
      missingFields,
      violations
    };
  }

  /**
   * Check data accuracy through validation rules
   */
  async checkAccuracy(data, source, context) {
    const violations = [];
    let totalChecks = 0;
    let passedChecks = 0;

    // Run field-specific validation rules
    if (this.qualityRules) {
      for (const [ruleId, rule] of this.qualityRules.entries()) {
        if (rule.type === QUALITY_RULE_TYPES.VALIDITY) {
          totalChecks++;
          
          try {
            const value = rule.field ? this.getNestedValue(data, rule.field) : data;
            const isValid = rule.validator(value, { ...context, source });
            
            if (isValid) {
              passedChecks++;
            } else {
              violations.push({
                rule: ruleId,
                type: rule.type,
                severity: rule.severity,
                message: rule.message,
                field: rule.field,
                value: this.sanitizeValue(value),
                impact: 'Data accuracy compromised'
              });
            }
          } catch (error) {
            violations.push({
              rule: ruleId,
              type: rule.type,
              severity: QUALITY_SEVERITY.ERROR,
              message: `Validation rule failed: ${error.message}`,
              field: rule.field,
              impact: 'Unable to validate data accuracy'
            });
          }
        }
      }
    }

    const accuracyScore = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 100;
    const passed = accuracyScore >= this.config.qualityThresholds.accuracy;

    return {
      type: QUALITY_RULE_TYPES.ACCURACY,
      score: accuracyScore,
      passed,
      totalChecks,
      passedChecks,
      violations
    };
  }

  /**
   * Check data validity against business rules
   */
  async checkValidity(data, source, context) {
    const violations = [];
    
    // Custom validity checks based on data source
    switch (source) {
      case 'yahoo-finance':
        violations.push(...await this.validateYahooFinanceData(data, context));
        break;
      case 'fear-greed':
        violations.push(...await this.validateFearGreedData(data));
        break;
      case 'fred':
        violations.push(...await this.validateFREDData(data, context));
        break;
      case 'coingecko':
        violations.push(...await this.validateCoinGeckoData(data));
        break;
    }

    const passed = violations.filter(v => v.severity === QUALITY_SEVERITY.ERROR || v.severity === QUALITY_SEVERITY.CRITICAL).length === 0;

    return {
      type: QUALITY_RULE_TYPES.VALIDITY,
      passed,
      violations,
      validationRules: violations.length
    };
  }

  /**
   * Check data freshness
   */
  async checkFreshness(data, source) {
    const violations = [];
    const timestamps = this.extractTimestamps(data);
    
    let oldestData = null;
    let newestData = null;
    let staleCount = 0;

    timestamps.forEach(({ field, timestamp, age }) => {
      if (!oldestData || age > oldestData.age) {
        oldestData = { field, timestamp, age };
      }
      if (!newestData || age < newestData.age) {
        newestData = { field, timestamp, age };
      }

      if (age > this.config.maxDataAge) {
        staleCount++;
        violations.push({
          rule: 'data_freshness',
          type: QUALITY_RULE_TYPES.FRESHNESS,
          severity: age > this.config.maxDataAge * 2 ? QUALITY_SEVERITY.ERROR : QUALITY_SEVERITY.WARNING,
          message: `Data field '${field}' is ${Math.round(age / (1000 * 60 * 60))} hours old`,
          field,
          age: age,
          threshold: this.config.maxDataAge,
          impact: 'Stale data may lead to incorrect analysis'
        });
      }
    });

    const freshnessScore = timestamps.length > 0 ? 
      ((timestamps.length - staleCount) / timestamps.length) * 100 : 100;
    const passed = freshnessScore >= this.config.qualityThresholds.freshness;

    return {
      type: QUALITY_RULE_TYPES.FRESHNESS,
      score: freshnessScore,
      passed,
      totalTimestamps: timestamps.length,
      staleCount,
      oldestData,
      newestData,
      violations
    };
  }

  /**
   * Detect statistical outliers
   */
  async detectOutliers(data, source, context) {
    if (!this.config.enableOutlierDetection) {
      return { type: QUALITY_RULE_TYPES.OUTLIER_DETECTION, enabled: false };
    }

    const violations = [];
    const numericFields = this.extractNumericFields(data);
    
    for (const [field, value] of numericFields) {
      const historicalValues = this.getHistoricalValues(source, field);
      
      if (historicalValues.length < 10) continue; // Need at least 10 data points
      
      const outlierAnalysis = this.analyzeOutlier(value, historicalValues);
      
      if (outlierAnalysis.isOutlier) {
        violations.push({
          rule: 'outlier_detection',
          type: QUALITY_RULE_TYPES.OUTLIER_DETECTION,
          severity: outlierAnalysis.severity,
          message: `Outlier detected in field '${field}': value ${value} is ${outlierAnalysis.standardDeviations.toFixed(2)} standard deviations from mean`,
          field,
          value,
          mean: outlierAnalysis.mean,
          standardDeviation: outlierAnalysis.standardDeviation,
          standardDeviations: outlierAnalysis.standardDeviations,
          impact: 'Potential data quality issue or exceptional market condition'
        });
      }
    }

    const passed = violations.filter(v => v.severity === QUALITY_SEVERITY.ERROR || v.severity === QUALITY_SEVERITY.CRITICAL).length === 0;

    return {
      type: QUALITY_RULE_TYPES.OUTLIER_DETECTION,
      passed,
      fieldsAnalyzed: numericFields.length,
      outliersDetected: violations.length,
      violations
    };
  }

  /**
   * Check data consistency across sources
   */
  async checkConsistency(data, source, context) {
    const violations = [];
    
    // Cross-validation rules (e.g., market data consistency)
    if (source.includes('stock') && context.symbol) {
      const crossValidationViolations = await this.crossValidateStockData(data, context.symbol);
      violations.push(...crossValidationViolations);
    }

    const passed = violations.filter(v => v.severity === QUALITY_SEVERITY.ERROR || v.severity === QUALITY_SEVERITY.CRITICAL).length === 0;

    return {
      type: QUALITY_RULE_TYPES.CONSISTENCY,
      passed,
      crossValidationRules: violations.length,
      violations
    };
  }

  /**
   * Validate Yahoo Finance data
   */
  async validateYahooFinanceData(data, context) {
    const violations = [];
    
    try {
      const result = data.chart?.result?.[0];
      if (!result) return violations;

      const prices = result.indicators?.quote?.[0]?.close?.filter(p => p !== null) || [];
      const volumes = result.indicators?.quote?.[0]?.volume?.filter(v => v !== null) || [];

      // Check for reasonable price movements
      if (prices.length >= 2) {
        const current = prices[prices.length - 1];
        const previous = prices[prices.length - 2];
        const changePercent = Math.abs(((current - previous) / previous) * 100);

        if (context.symbol?.startsWith('^') && changePercent > 20) {
          violations.push({
            rule: 'extreme_index_movement',
            type: QUALITY_RULE_TYPES.VALIDITY,
            severity: QUALITY_SEVERITY.ERROR,
            message: `Extreme movement in index ${context.symbol}: ${changePercent.toFixed(2)}%`,
            value: changePercent,
            threshold: 20,
            impact: 'Potentially erroneous market data'
          });
        }
      }

      // Check for zero prices
      const zeroPrices = prices.filter(p => p <= 0).length;
      if (zeroPrices > 0) {
        violations.push({
          rule: 'zero_negative_prices',
          type: QUALITY_RULE_TYPES.VALIDITY,
          severity: QUALITY_SEVERITY.CRITICAL,
          message: `Found ${zeroPrices} zero or negative prices`,
          count: zeroPrices,
          impact: 'Invalid price data detected'
        });
      }

    } catch (error) {
      violations.push({
        rule: 'yahoo_data_structure',
        type: QUALITY_RULE_TYPES.VALIDITY,
        severity: QUALITY_SEVERITY.ERROR,
        message: `Failed to validate Yahoo Finance data structure: ${error.message}`,
        impact: 'Unable to validate data integrity'
      });
    }

    return violations;
  }

  /**
   * Validate Fear & Greed Index data
   */
  async validateFearGreedData(data) {
    const violations = [];
    
    try {
      const value = parseInt(data.data?.[0]?.value);
      const classification = data.data?.[0]?.value_classification;

      // Validate value-classification consistency
      const expectedClassification = this.getFearGreedClassification(value);
      if (classification !== expectedClassification) {
        violations.push({
          rule: 'fear_greed_classification_mismatch',
          type: QUALITY_RULE_TYPES.CONSISTENCY,
          severity: QUALITY_SEVERITY.WARNING,
          message: `Fear & Greed classification mismatch: ${value} should be '${expectedClassification}' but got '${classification}'`,
          value,
          expected: expectedClassification,
          actual: classification,
          impact: 'Inconsistent sentiment classification'
        });
      }

    } catch (error) {
      violations.push({
        rule: 'fear_greed_data_structure',
        type: QUALITY_RULE_TYPES.VALIDITY,
        severity: QUALITY_SEVERITY.ERROR,
        message: `Failed to validate Fear & Greed data: ${error.message}`,
        impact: 'Unable to validate sentiment data'
      });
    }

    return violations;
  }

  /**
   * Validate FRED economic data
   */
  async validateFREDData(data, context) {
    const violations = [];
    
    try {
      const observations = data.observations || [];
      const validObservations = observations.filter(obs => obs.value !== '.');
      
      if (validObservations.length === 0) {
        violations.push({
          rule: 'fred_no_valid_data',
          type: QUALITY_RULE_TYPES.COMPLETENESS,
          severity: QUALITY_SEVERITY.ERROR,
          message: 'No valid observations in FRED data',
          totalObservations: observations.length,
          impact: 'Economic indicator data unavailable'
        });
      }

      // Validate data ranges for specific economic indicators
      if (context.series && validObservations.length > 0) {
        const latestValue = parseFloat(validObservations[0].value);
        const bounds = FINANCIAL_BOUNDARIES.ECONOMIC_INDICATORS[context.series];
        
        if (bounds && (latestValue < bounds.min || latestValue > bounds.max)) {
          violations.push({
            rule: 'economic_indicator_range',
            type: QUALITY_RULE_TYPES.VALIDITY,
            severity: QUALITY_SEVERITY.WARNING,
            message: `Economic indicator ${context.series} value ${latestValue} outside expected range [${bounds.min}, ${bounds.max}]`,
            value: latestValue,
            bounds,
            impact: 'Unusual economic indicator value'
          });
        }
      }

    } catch (error) {
      violations.push({
        rule: 'fred_data_validation',
        type: QUALITY_RULE_TYPES.VALIDITY,
        severity: QUALITY_SEVERITY.ERROR,
        message: `Failed to validate FRED data: ${error.message}`,
        impact: 'Unable to validate economic data'
      });
    }

    return violations;
  }

  /**
   * Validate CoinGecko cryptocurrency data
   */
  async validateCoinGeckoData(data) {
    const violations = [];
    
    try {
      if (!Array.isArray(data)) {
        violations.push({
          rule: 'coingecko_data_format',
          type: QUALITY_RULE_TYPES.VALIDITY,
          severity: QUALITY_SEVERITY.ERROR,
          message: 'CoinGecko data should be an array',
          impact: 'Invalid cryptocurrency data format'
        });
        return violations;
      }

      data.forEach((coin, index) => {
        // Check for negative prices
        if (coin.current_price < 0) {
          violations.push({
            rule: 'negative_crypto_price',
            type: QUALITY_RULE_TYPES.VALIDITY,
            severity: QUALITY_SEVERITY.CRITICAL,
            message: `Negative price for ${coin.symbol}: ${coin.current_price}`,
            coinSymbol: coin.symbol,
            value: coin.current_price,
            impact: 'Invalid cryptocurrency price data'
          });
        }

        // Check for extreme price changes
        if (Math.abs(coin.price_change_percentage_24h) > 90) {
          violations.push({
            rule: 'extreme_crypto_change',
            type: QUALITY_RULE_TYPES.OUTLIER_DETECTION,
            severity: QUALITY_SEVERITY.WARNING,
            message: `Extreme 24h price change for ${coin.symbol}: ${coin.price_change_percentage_24h.toFixed(2)}%`,
            coinSymbol: coin.symbol,
            change: coin.price_change_percentage_24h,
            impact: 'Potential data anomaly or exceptional market event'
          });
        }
      });

    } catch (error) {
      violations.push({
        rule: 'coingecko_validation',
        type: QUALITY_RULE_TYPES.VALIDITY,
        severity: QUALITY_SEVERITY.ERROR,
        message: `Failed to validate CoinGecko data: ${error.message}`,
        impact: 'Unable to validate cryptocurrency data'
      });
    }

    return violations;
  }

  /**
   * Cross-validate stock data against multiple sources
   */
  async crossValidateStockData(data, symbol) {
    const violations = [];
    
    // This would compare data across different sources in a real implementation
    // For now, we'll implement basic consistency checks
    
    return violations;
  }

  /**
   * Calculate overall quality score
   */
  calculateQualityScore(checks) {
    const weights = {
      completeness: 0.25,
      accuracy: 0.30,
      validity: 0.25,
      freshness: 0.15,
      consistency: 0.05
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(checks).forEach(([checkType, result]) => {
      if (result && result.score !== undefined && weights[checkType]) {
        totalScore += result.score * weights[checkType];
        totalWeight += weights[checkType];
      }
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Update quality metrics for trending
   */
  updateQualityMetrics(source, qualityReport) {
    if (!this.qualityMetrics.has(source)) {
      this.qualityMetrics.set(source, []);
    }

    const metrics = this.qualityMetrics.get(source);
    metrics.push({
      timestamp: qualityReport.timestamp,
      score: qualityReport.overallScore,
      passed: qualityReport.passed,
      violationCount: qualityReport.violations.length,
      processingTime: qualityReport.processingTime
    });

    // Keep only last 100 entries
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }
  }

  /**
   * Get required fields for data source
   */
  getRequiredFields(data, source) {
    const commonFields = ['timestamp', 'date', 'lastUpdated'];
    
    switch (source) {
      case 'yahoo-finance':
        return ['chart.result.0.indicators.quote.0.close', ...commonFields];
      case 'fear-greed':
        return ['data.0.value', 'data.0.value_classification', ...commonFields];
      case 'fred':
        return ['observations', ...commonFields];
      case 'coingecko':
        return ['0.current_price', '0.symbol', '0.name', ...commonFields];
      default:
        return commonFields;
    }
  }

  /**
   * Get nested value from object
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        return current[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * Check if value is present and valid
   */
  hasValue(value) {
    return value !== undefined && value !== null && value !== '' && !Number.isNaN(value);
  }

  /**
   * Extract timestamps from data
   */
  extractTimestamps(data) {
    const timestamps = [];
    const now = Date.now();
    
    const checkTimestamp = (field, value) => {
      if (typeof value === 'string') {
        const timestamp = new Date(value);
        if (!isNaN(timestamp.getTime())) {
          timestamps.push({
            field,
            timestamp: timestamp.toISOString(),
            age: now - timestamp.getTime()
          });
        }
      }
    };

    const traverse = (obj, prefix = '') => {
      if (obj && typeof obj === 'object') {
        Object.entries(obj).forEach(([key, value]) => {
          const fieldName = prefix ? `${prefix}.${key}` : key;
          
          if (['timestamp', 'date', 'lastUpdated', 'time', 'updated_at'].includes(key.toLowerCase())) {
            checkTimestamp(fieldName, value);
          } else if (typeof value === 'object') {
            traverse(value, fieldName);
          }
        });
      }
    };

    traverse(data);
    return timestamps;
  }

  /**
   * Extract numeric fields for outlier detection
   */
  extractNumericFields(data) {
    const numericFields = [];
    
    const traverse = (obj, prefix = '') => {
      if (obj && typeof obj === 'object') {
        Object.entries(obj).forEach(([key, value]) => {
          const fieldName = prefix ? `${prefix}.${key}` : key;
          
          if (typeof value === 'number' && !isNaN(value)) {
            numericFields.push([fieldName, value]);
          } else if (typeof value === 'object' && value !== null) {
            traverse(value, fieldName);
          }
        });
      }
    };

    traverse(data);
    return numericFields;
  }

  /**
   * Get historical values for outlier detection
   */
  getHistoricalValues(source, field) {
    // In a real implementation, this would fetch from a database
    // For now, return mock historical data
    return Array.from({ length: 30 }, () => Math.random() * 100);
  }

  /**
   * Analyze if value is an outlier
   */
  analyzeOutlier(value, historicalValues) {
    const mean = historicalValues.reduce((sum, val) => sum + val, 0) / historicalValues.length;
    const variance = historicalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalValues.length;
    const standardDeviation = Math.sqrt(variance);
    const standardDeviations = Math.abs(value - mean) / standardDeviation;
    
    const isOutlier = standardDeviations > this.config.outlierStandardDeviations;
    const severity = standardDeviations > 5 ? QUALITY_SEVERITY.CRITICAL :
                    standardDeviations > 4 ? QUALITY_SEVERITY.ERROR :
                    QUALITY_SEVERITY.WARNING;

    return {
      isOutlier,
      severity,
      mean,
      standardDeviation,
      standardDeviations
    };
  }

  /**
   * Get expected Fear & Greed classification
   */
  getFearGreedClassification(value) {
    if (value <= 20) return 'Extreme Fear';
    if (value <= 40) return 'Fear';
    if (value <= 60) return 'Neutral';
    if (value <= 80) return 'Greed';
    return 'Extreme Greed';
  }

  /**
   * Sanitize value for logging
   */
  sanitizeValue(value) {
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    return value;
  }

  /**
   * Get quality metrics summary
   */
  getQualityMetrics(source = null) {
    if (source) {
      return this.qualityMetrics.get(source) || [];
    }
    
    const summary = {};
    for (const [src, metrics] of this.qualityMetrics.entries()) {
      const recent = metrics.slice(-10);
      summary[src] = {
        totalChecks: metrics.length,
        averageScore: recent.reduce((sum, m) => sum + m.score, 0) / recent.length,
        passRate: (recent.filter(m => m.passed).length / recent.length) * 100,
        averageProcessingTime: recent.reduce((sum, m) => sum + m.processingTime, 0) / recent.length
      };
    }
    
    return summary;
  }
}

export { QUALITY_RULE_TYPES, QUALITY_SEVERITY, FINANCIAL_BOUNDARIES };
export default DataQualityManager;