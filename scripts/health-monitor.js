#!/usr/bin/env node

/**
 * Data Source Health Monitoring System
 * Implements comprehensive health checks, circuit breakers, and availability monitoring
 * for all external data sources with SLA tracking and automated recovery
 */

import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAuditLogger, AUDIT_LEVELS, AUDIT_CATEGORIES } from './audit-logger.js';
import { getErrorHandler, ERROR_CODES } from './error-handling.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Health check types
const HEALTH_CHECK_TYPES = {
  CONNECTIVITY: 'CONNECTIVITY',
  RESPONSE_TIME: 'RESPONSE_TIME',
  DATA_QUALITY: 'DATA_QUALITY',
  AUTHENTICATION: 'AUTHENTICATION',
  RATE_LIMITING: 'RATE_LIMITING',
  ENDPOINT_AVAILABILITY: 'ENDPOINT_AVAILABILITY'
};

// Health status levels
const HEALTH_STATUS = {
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  UNHEALTHY: 'UNHEALTHY',
  CRITICAL: 'CRITICAL',
  UNKNOWN: 'UNKNOWN'
};

// Circuit breaker states
const CIRCUIT_STATES = {
  CLOSED: 'CLOSED',     // Normal operation
  OPEN: 'OPEN',         // Failing, reject requests
  HALF_OPEN: 'HALF_OPEN' // Testing if service recovered
};

// SLA thresholds for financial data sources
const SLA_THRESHOLDS = {
  yahoo_finance: {
    availability: 99.5,     // 99.5% uptime
    responseTime: 2000,     // 2 seconds max
    errorRate: 1.0,         // 1% max error rate
    dataFreshness: 300000   // 5 minutes max staleness
  },
  alpha_vantage: {
    availability: 99.0,
    responseTime: 5000,     // 5 seconds (news API is slower)
    errorRate: 2.0,
    dataFreshness: 3600000  // 1 hour max staleness
  },
  fred: {
    availability: 98.0,     // Government APIs can be less reliable
    responseTime: 3000,
    errorRate: 2.0,
    dataFreshness: 86400000 // 1 day (economic data updates slowly)
  },
  coingecko: {
    availability: 99.0,
    responseTime: 3000,
    errorRate: 1.5,
    dataFreshness: 300000   // 5 minutes
  },
  fear_greed: {
    availability: 98.5,
    responseTime: 2000,
    errorRate: 1.0,
    dataFreshness: 3600000  // 1 hour
  }
};

export class DataSourceHealthMonitor {
  constructor(config = {}) {
    this.config = {
      healthCheckInterval: 60000,      // 1 minute
      detailedCheckInterval: 300000,   // 5 minutes
      circuitBreakerTimeout: 300000,   // 5 minutes
      maxConsecutiveFailures: 5,
      responseTimeoutMs: 10000,
      enableCircuitBreaker: true,
      enableSLAMonitoring: true,
      enableAutoRecovery: true,
      healthReportPath: path.resolve(__dirname, '../logs/health-reports'),
      ...config
    };

    this.auditLogger = getAuditLogger();
    this.errorHandler = getErrorHandler();
    
    // Data source configurations
    this.dataSources = new Map();
    this.circuitBreakers = new Map();
    this.healthMetrics = new Map();
    this.slaMetrics = new Map();
    
    // Initialize monitoring
    this.initializeDataSources();
    this.initializeCircuitBreakers();
    this.startHealthMonitoring();
  }

  /**
   * Initialize data source configurations
   */
  initializeDataSources() {
    const sources = [
      {
        id: 'yahoo_finance',
        name: 'Yahoo Finance API',
        endpoints: [
          {
            url: 'https://query1.finance.yahoo.com/v8/finance/chart/SPY',
            type: 'stock_data',
            params: { interval: '1d', range: '1d' },
            expectedFields: ['chart.result.0.indicators.quote.0.close']
          }
        ],
        healthChecks: [
          HEALTH_CHECK_TYPES.CONNECTIVITY,
          HEALTH_CHECK_TYPES.RESPONSE_TIME,
          HEALTH_CHECK_TYPES.DATA_QUALITY
        ]
      },
      {
        id: 'alpha_vantage',
        name: 'Alpha Vantage API',
        endpoints: [
          {
            url: 'https://www.alphavantage.co/query',
            type: 'news_sentiment',
            params: {
              function: 'NEWS_SENTIMENT',
              tickers: 'SPY',
              apikey: process.env.ALPHA_VANTAGE_API_KEY || 'demo',
              limit: 1
            },
            expectedFields: ['feed']
          }
        ],
        healthChecks: [
          HEALTH_CHECK_TYPES.CONNECTIVITY,
          HEALTH_CHECK_TYPES.RESPONSE_TIME,
          HEALTH_CHECK_TYPES.AUTHENTICATION,
          HEALTH_CHECK_TYPES.RATE_LIMITING
        ]
      },
      {
        id: 'fred',
        name: 'Federal Reserve Economic Data',
        endpoints: [
          {
            url: 'https://api.stlouisfed.org/fred/series/observations',
            type: 'economic_data',
            params: {
              series_id: 'UNRATE',
              api_key: process.env.FRED_API_KEY || 'demo',
              file_type: 'json',
              limit: 1
            },
            expectedFields: ['observations']
          }
        ],
        healthChecks: [
          HEALTH_CHECK_TYPES.CONNECTIVITY,
          HEALTH_CHECK_TYPES.RESPONSE_TIME,
          HEALTH_CHECK_TYPES.AUTHENTICATION
        ]
      },
      {
        id: 'coingecko',
        name: 'CoinGecko API',
        endpoints: [
          {
            url: 'https://api.coingecko.com/api/v3/coins/markets',
            type: 'crypto_data',
            params: {
              vs_currency: 'usd',
              ids: 'bitcoin',
              order: 'market_cap_desc',
              per_page: 1,
              page: 1
            },
            expectedFields: ['0.current_price']
          }
        ],
        healthChecks: [
          HEALTH_CHECK_TYPES.CONNECTIVITY,
          HEALTH_CHECK_TYPES.RESPONSE_TIME,
          HEALTH_CHECK_TYPES.RATE_LIMITING
        ]
      },
      {
        id: 'fear_greed',
        name: 'Fear & Greed Index API',
        endpoints: [
          {
            url: 'https://api.alternative.me/fng',
            type: 'sentiment_index',
            params: { limit: 1 },
            expectedFields: ['data.0.value']
          }
        ],
        healthChecks: [
          HEALTH_CHECK_TYPES.CONNECTIVITY,
          HEALTH_CHECK_TYPES.RESPONSE_TIME,
          HEALTH_CHECK_TYPES.DATA_QUALITY
        ]
      }
    ];

    sources.forEach(source => {
      this.dataSources.set(source.id, {
        ...source,
        lastHealthCheck: null,
        currentStatus: HEALTH_STATUS.UNKNOWN,
        consecutiveFailures: 0,
        uptime: 0,
        totalRequests: 0,
        successfulRequests: 0,
        averageResponseTime: 0,
        lastError: null
      });

      // Initialize health metrics
      this.healthMetrics.set(source.id, {
        checks: [],
        availability: 100,
        averageResponseTime: 0,
        errorRate: 0,
        lastSuccessfulCheck: null,
        lastFailedCheck: null
      });

      // Initialize SLA metrics
      this.slaMetrics.set(source.id, {
        availability: {
          target: SLA_THRESHOLDS[source.id]?.availability || 99.0,
          current: 100,
          breaches: 0
        },
        responseTime: {
          target: SLA_THRESHOLDS[source.id]?.responseTime || 5000,
          current: 0,
          breaches: 0
        },
        errorRate: {
          target: SLA_THRESHOLDS[source.id]?.errorRate || 2.0,
          current: 0,
          breaches: 0
        }
      });
    });
  }

  /**
   * Initialize circuit breakers for each data source
   */
  initializeCircuitBreakers() {
    this.dataSources.forEach((source, sourceId) => {
      this.circuitBreakers.set(sourceId, {
        state: CIRCUIT_STATES.CLOSED,
        failureCount: 0,
        failureThreshold: this.config.maxConsecutiveFailures,
        timeout: this.config.circuitBreakerTimeout,
        lastFailureTime: null,
        halfOpenSuccesses: 0,
        halfOpenMaxAttempts: 3
      });
    });
  }

  /**
   * Start continuous health monitoring
   */
  startHealthMonitoring() {
    // Basic health checks every minute
    setInterval(() => {
      this.runBasicHealthChecks();
    }, this.config.healthCheckInterval);

    // Detailed health checks every 5 minutes
    setInterval(() => {
      this.runDetailedHealthChecks();
    }, this.config.detailedCheckInterval);

    // Generate health reports every 15 minutes
    setInterval(() => {
      this.generateHealthReport();
    }, 900000); // 15 minutes

    // Initial health check
    setTimeout(() => {
      this.runBasicHealthChecks();
    }, 5000); // 5 second delay to allow system startup
  }

  /**
   * Run basic connectivity and response time checks
   */
  async runBasicHealthChecks() {
    const checkResults = new Map();

    for (const [sourceId, source] of this.dataSources.entries()) {
      const circuitBreaker = this.circuitBreakers.get(sourceId);
      
      // Skip if circuit breaker is open
      if (circuitBreaker.state === CIRCUIT_STATES.OPEN) {
        if (Date.now() - circuitBreaker.lastFailureTime >= circuitBreaker.timeout) {
          circuitBreaker.state = CIRCUIT_STATES.HALF_OPEN;
          circuitBreaker.halfOpenSuccesses = 0;
        } else {
          continue; // Skip health check while circuit is open
        }
      }

      try {
        const checkResult = await this.performHealthCheck(sourceId, source);
        checkResults.set(sourceId, checkResult);
        
        // Update circuit breaker state
        this.updateCircuitBreaker(sourceId, checkResult);
        
        // Update health metrics
        this.updateHealthMetrics(sourceId, checkResult);
        
        // Update SLA metrics
        this.updateSLAMetrics(sourceId, checkResult);

      } catch (error) {
        const failedResult = {
          sourceId,
          timestamp: new Date().toISOString(),
          status: HEALTH_STATUS.CRITICAL,
          error: error.message,
          checks: {}
        };
        
        checkResults.set(sourceId, failedResult);
        this.updateCircuitBreaker(sourceId, failedResult);
        this.updateHealthMetrics(sourceId, failedResult);

        await this.errorHandler.handleError(error, {
          source: sourceId,
          operation: 'health_check',
          healthCheck: true
        });
      }
    }

    // Log health check summary
    await this.auditLogger.logSystemEvent('HEALTH_CHECK_COMPLETED', {
      checkType: 'basic',
      sourcesChecked: checkResults.size,
      healthySources: Array.from(checkResults.values()).filter(r => r.status === HEALTH_STATUS.HEALTHY).length,
      unhealthySources: Array.from(checkResults.values()).filter(r => r.status !== HEALTH_STATUS.HEALTHY).length
    });
  }

  /**
   * Run detailed health checks including data quality validation
   */
  async runDetailedHealthChecks() {
    for (const [sourceId, source] of this.dataSources.entries()) {
      try {
        // Perform comprehensive health check
        const detailedResult = await this.performDetailedHealthCheck(sourceId, source);
        
        // Check SLA compliance
        const slaCompliance = this.checkSLACompliance(sourceId);
        
        await this.auditLogger.logSystemEvent('DETAILED_HEALTH_CHECK', {
          sourceId,
          status: detailedResult.status,
          slaCompliance,
          responseTime: detailedResult.responseTime,
          dataQuality: detailedResult.dataQuality
        });

      } catch (error) {
        await this.errorHandler.handleError(error, {
          source: sourceId,
          operation: 'detailed_health_check'
        });
      }
    }
  }

  /**
   * Perform health check for a specific data source
   */
  async performHealthCheck(sourceId, source) {
    const startTime = Date.now();
    const result = {
      sourceId,
      timestamp: new Date().toISOString(),
      status: HEALTH_STATUS.HEALTHY,
      responseTime: 0,
      checks: {},
      error: null
    };

    try {
      // Test each endpoint
      for (const endpoint of source.endpoints) {
        const endpointResult = await this.checkEndpoint(endpoint);
        result.checks[endpoint.type] = endpointResult;
        
        if (!endpointResult.success) {
          result.status = HEALTH_STATUS.UNHEALTHY;
          result.error = endpointResult.error;
        }
      }

      result.responseTime = Date.now() - startTime;
      
      // Classify overall status based on response time and errors
      if (result.status === HEALTH_STATUS.HEALTHY) {
        const threshold = SLA_THRESHOLDS[sourceId]?.responseTime || 5000;
        if (result.responseTime > threshold * 1.5) {
          result.status = HEALTH_STATUS.DEGRADED;
        }
      }

    } catch (error) {
      result.status = HEALTH_STATUS.CRITICAL;
      result.error = error.message;
      result.responseTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Perform detailed health check with data quality validation
   */
  async performDetailedHealthCheck(sourceId, source) {
    const result = await this.performHealthCheck(sourceId, source);
    
    // Add data quality checks
    for (const endpoint of source.endpoints) {
      try {
        const dataQualityResult = await this.validateDataQuality(sourceId, endpoint);
        result.checks[`${endpoint.type}_quality`] = dataQualityResult;
        
        if (!dataQualityResult.passed) {
          result.status = result.status === HEALTH_STATUS.HEALTHY ? 
            HEALTH_STATUS.DEGRADED : result.status;
        }
      } catch (error) {
        result.checks[`${endpoint.type}_quality`] = {
          passed: false,
          error: error.message
        };
      }
    }

    return result;
  }

  /**
   * Check individual endpoint health
   */
  async checkEndpoint(endpoint) {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(endpoint.url, {
        params: endpoint.params,
        timeout: this.config.responseTimeoutMs,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DataPipeline/1.0)'
        }
      });

      const responseTime = Date.now() - startTime;
      
      // Check response status
      if (response.status !== 200) {
        return {
          success: false,
          responseTime,
          statusCode: response.status,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      // Validate expected fields are present
      const validationResult = this.validateResponseStructure(response.data, endpoint.expectedFields);
      
      return {
        success: validationResult.valid,
        responseTime,
        statusCode: response.status,
        dataSize: JSON.stringify(response.data).length,
        fieldsPresent: validationResult.fieldsPresent,
        fieldsMissing: validationResult.fieldsMissing,
        error: validationResult.valid ? null : 'Required fields missing'
      };

    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error.message,
        errorCode: error.code,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Validate response data structure
   */
  validateResponseStructure(data, expectedFields) {
    const fieldsPresent = [];
    const fieldsMissing = [];

    expectedFields.forEach(fieldPath => {
      const value = this.getNestedValue(data, fieldPath);
      if (value !== undefined && value !== null) {
        fieldsPresent.push(fieldPath);
      } else {
        fieldsMissing.push(fieldPath);
      }
    });

    return {
      valid: fieldsMissing.length === 0,
      fieldsPresent,
      fieldsMissing
    };
  }

  /**
   * Validate data quality for specific endpoint
   */
  async validateDataQuality(sourceId, endpoint) {
    try {
      const response = await axios.get(endpoint.url, {
        params: endpoint.params,
        timeout: this.config.responseTimeoutMs
      });

      const qualityChecks = {
        dataSize: JSON.stringify(response.data).length,
        hasValidTimestamp: false,
        hasValidData: false,
        outliers: [],
        errors: []
      };

      // Source-specific quality checks
      switch (sourceId) {
        case 'yahoo_finance':
          qualityChecks.hasValidData = this.validateYahooFinanceData(response.data);
          break;
        case 'fear_greed':
          qualityChecks.hasValidData = this.validateFearGreedData(response.data);
          qualityChecks.hasValidTimestamp = this.hasValidTimestamp(response.data.data?.[0]?.timestamp);
          break;
        case 'alpha_vantage':
          qualityChecks.hasValidData = this.validateAlphaVantageData(response.data);
          break;
        case 'fred':
          qualityChecks.hasValidData = this.validateFredData(response.data);
          break;
        case 'coingecko':
          qualityChecks.hasValidData = this.validateCoinGeckoData(response.data);
          break;
      }

      const passed = qualityChecks.hasValidData && qualityChecks.errors.length === 0;

      return {
        passed,
        qualityScore: this.calculateQualityScore(qualityChecks),
        checks: qualityChecks
      };

    } catch (error) {
      return {
        passed: false,
        error: error.message,
        qualityScore: 0
      };
    }
  }

  /**
   * Update circuit breaker state based on health check result
   */
  updateCircuitBreaker(sourceId, checkResult) {
    if (!this.config.enableCircuitBreaker) return;

    const circuitBreaker = this.circuitBreakers.get(sourceId);
    if (!circuitBreaker) return;

    const isSuccess = checkResult.status === HEALTH_STATUS.HEALTHY || 
                     checkResult.status === HEALTH_STATUS.DEGRADED;

    switch (circuitBreaker.state) {
      case CIRCUIT_STATES.CLOSED:
        if (isSuccess) {
          circuitBreaker.failureCount = 0;
        } else {
          circuitBreaker.failureCount++;
          if (circuitBreaker.failureCount >= circuitBreaker.failureThreshold) {
            circuitBreaker.state = CIRCUIT_STATES.OPEN;
            circuitBreaker.lastFailureTime = Date.now();
            
            this.auditLogger.logSystemEvent('CIRCUIT_BREAKER_OPENED', {
              sourceId,
              failureCount: circuitBreaker.failureCount,
              lastError: checkResult.error
            });
          }
        }
        break;

      case CIRCUIT_STATES.HALF_OPEN:
        if (isSuccess) {
          circuitBreaker.halfOpenSuccesses++;
          if (circuitBreaker.halfOpenSuccesses >= circuitBreaker.halfOpenMaxAttempts) {
            circuitBreaker.state = CIRCUIT_STATES.CLOSED;
            circuitBreaker.failureCount = 0;
            
            this.auditLogger.logSystemEvent('CIRCUIT_BREAKER_CLOSED', {
              sourceId,
              recoveryAttempts: circuitBreaker.halfOpenSuccesses
            });
          }
        } else {
          circuitBreaker.state = CIRCUIT_STATES.OPEN;
          circuitBreaker.lastFailureTime = Date.now();
          circuitBreaker.failureCount++;
        }
        break;
    }
  }

  /**
   * Update health metrics
   */
  updateHealthMetrics(sourceId, checkResult) {
    const metrics = this.healthMetrics.get(sourceId);
    if (!metrics) return;

    const source = this.dataSources.get(sourceId);
    
    // Update source statistics
    source.totalRequests++;
    source.lastHealthCheck = checkResult.timestamp;
    source.currentStatus = checkResult.status;
    
    if (checkResult.status === HEALTH_STATUS.HEALTHY || checkResult.status === HEALTH_STATUS.DEGRADED) {
      source.successfulRequests++;
      source.consecutiveFailures = 0;
      metrics.lastSuccessfulCheck = checkResult.timestamp;
    } else {
      source.consecutiveFailures++;
      source.lastError = checkResult.error;
      metrics.lastFailedCheck = checkResult.timestamp;
    }

    // Update rolling averages
    if (checkResult.responseTime) {
      source.averageResponseTime = source.averageResponseTime === 0 ? 
        checkResult.responseTime : 
        (source.averageResponseTime + checkResult.responseTime) / 2;
    }

    // Calculate availability percentage
    metrics.availability = (source.successfulRequests / source.totalRequests) * 100;
    metrics.errorRate = ((source.totalRequests - source.successfulRequests) / source.totalRequests) * 100;
    metrics.averageResponseTime = source.averageResponseTime;

    // Store recent check results (keep last 100)
    if (!metrics.checks) metrics.checks = [];
    metrics.checks.push(checkResult);
    if (metrics.checks.length > 100) {
      metrics.checks = metrics.checks.slice(-100);
    }
  }

  /**
   * Update SLA metrics
   */
  updateSLAMetrics(sourceId, checkResult) {
    if (!this.config.enableSLAMonitoring) return;

    const slaMetrics = this.slaMetrics.get(sourceId);
    const healthMetrics = this.healthMetrics.get(sourceId);
    
    if (!slaMetrics || !healthMetrics) return;

    // Update availability SLA
    slaMetrics.availability.current = healthMetrics.availability;
    if (healthMetrics.availability < slaMetrics.availability.target) {
      slaMetrics.availability.breaches++;
    }

    // Update response time SLA
    if (checkResult.responseTime) {
      slaMetrics.responseTime.current = checkResult.responseTime;
      if (checkResult.responseTime > slaMetrics.responseTime.target) {
        slaMetrics.responseTime.breaches++;
      }
    }

    // Update error rate SLA
    slaMetrics.errorRate.current = healthMetrics.errorRate;
    if (healthMetrics.errorRate > slaMetrics.errorRate.target) {
      slaMetrics.errorRate.breaches++;
    }
  }

  /**
   * Check SLA compliance for a data source
   */
  checkSLACompliance(sourceId) {
    const slaMetrics = this.slaMetrics.get(sourceId);
    if (!slaMetrics) return { compliant: false, reason: 'No SLA metrics available' };

    const violations = [];

    if (slaMetrics.availability.current < slaMetrics.availability.target) {
      violations.push(`Availability ${slaMetrics.availability.current.toFixed(2)}% below target ${slaMetrics.availability.target}%`);
    }

    if (slaMetrics.responseTime.current > slaMetrics.responseTime.target) {
      violations.push(`Response time ${slaMetrics.responseTime.current}ms above target ${slaMetrics.responseTime.target}ms`);
    }

    if (slaMetrics.errorRate.current > slaMetrics.errorRate.target) {
      violations.push(`Error rate ${slaMetrics.errorRate.current.toFixed(2)}% above target ${slaMetrics.errorRate.target}%`);
    }

    return {
      compliant: violations.length === 0,
      violations,
      metrics: slaMetrics
    };
  }

  /**
   * Generate comprehensive health report
   */
  async generateHealthReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSources: this.dataSources.size,
        healthySources: 0,
        degradedSources: 0,
        unhealthySources: 0,
        criticalSources: 0
      },
      sources: {},
      slaCompliance: {},
      circuitBreakerStatus: {},
      recommendations: []
    };

    // Collect data for each source
    for (const [sourceId, source] of this.dataSources.entries()) {
      const healthMetrics = this.healthMetrics.get(sourceId);
      const slaCompliance = this.checkSLACompliance(sourceId);
      const circuitBreaker = this.circuitBreakers.get(sourceId);

      // Update summary counts
      switch (source.currentStatus) {
        case HEALTH_STATUS.HEALTHY:
          report.summary.healthySources++;
          break;
        case HEALTH_STATUS.DEGRADED:
          report.summary.degradedSources++;
          break;
        case HEALTH_STATUS.UNHEALTHY:
          report.summary.unhealthySources++;
          break;
        case HEALTH_STATUS.CRITICAL:
          report.summary.criticalSources++;
          break;
      }

      // Source details
      report.sources[sourceId] = {
        name: source.name,
        status: source.currentStatus,
        availability: healthMetrics.availability,
        averageResponseTime: healthMetrics.averageResponseTime,
        errorRate: healthMetrics.errorRate,
        consecutiveFailures: source.consecutiveFailures,
        lastHealthCheck: source.lastHealthCheck,
        lastError: source.lastError
      };

      // SLA compliance
      report.slaCompliance[sourceId] = slaCompliance;

      // Circuit breaker status
      report.circuitBreakerStatus[sourceId] = {
        state: circuitBreaker.state,
        failureCount: circuitBreaker.failureCount,
        lastFailureTime: circuitBreaker.lastFailureTime
      };

      // Generate recommendations
      if (!slaCompliance.compliant) {
        report.recommendations.push({
          sourceId,
          priority: 'HIGH',
          type: 'SLA_VIOLATION',
          message: `${source.name} is not meeting SLA requirements`,
          violations: slaCompliance.violations
        });
      }

      if (circuitBreaker.state === CIRCUIT_STATES.OPEN) {
        report.recommendations.push({
          sourceId,
          priority: 'CRITICAL',
          type: 'CIRCUIT_BREAKER_OPEN',
          message: `${source.name} circuit breaker is open - service unavailable`,
          action: 'Investigate service health and consider manual intervention'
        });
      }

      if (source.consecutiveFailures >= 3) {
        report.recommendations.push({
          sourceId,
          priority: 'MEDIUM',
          type: 'CONSECUTIVE_FAILURES',
          message: `${source.name} has ${source.consecutiveFailures} consecutive failures`,
          action: 'Monitor closely and consider backup data sources'
        });
      }
    }

    // Save report to file
    await this.saveHealthReport(report);

    // Log report summary
    await this.auditLogger.logSystemEvent('HEALTH_REPORT_GENERATED', {
      totalSources: report.summary.totalSources,
      healthySources: report.summary.healthySources,
      issuesFound: report.recommendations.length,
      slaViolations: Object.values(report.slaCompliance).filter(s => !s.compliant).length
    });

    return report;
  }

  /**
   * Save health report to file
   */
  async saveHealthReport(report) {
    try {
      await fs.ensureDir(this.config.healthReportPath);
      
      const fileName = `health-report-${new Date().toISOString().split('T')[0]}.json`;
      const filePath = path.join(this.config.healthReportPath, fileName);
      
      await fs.writeJSON(filePath, report, { spaces: 2 });
      
      // Also save latest report
      const latestPath = path.join(this.config.healthReportPath, 'latest-health-report.json');
      await fs.writeJSON(latestPath, report, { spaces: 2 });
      
    } catch (error) {
      await this.errorHandler.handleError(error, {
        operation: 'save_health_report',
        affectsMonitoring: true
      });
    }
  }

  // Data validation methods for different sources
  validateYahooFinanceData(data) {
    try {
      return !!(data.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.length > 0);
    } catch {
      return false;
    }
  }

  validateFearGreedData(data) {
    try {
      const value = parseInt(data.data?.[0]?.value);
      return !isNaN(value) && value >= 0 && value <= 100;
    } catch {
      return false;
    }
  }

  validateAlphaVantageData(data) {
    try {
      return Array.isArray(data.feed) && data.feed.length > 0;
    } catch {
      return false;
    }
  }

  validateFredData(data) {
    try {
      return Array.isArray(data.observations) && data.observations.length > 0;
    } catch {
      return false;
    }
  }

  validateCoinGeckoData(data) {
    try {
      return Array.isArray(data) && data.length > 0 && typeof data[0].current_price === 'number';
    } catch {
      return false;
    }
  }

  hasValidTimestamp(timestamp) {
    if (!timestamp) return false;
    const date = new Date(parseInt(timestamp) * 1000);
    return !isNaN(date.getTime()) && date.getTime() > 946684800000; // After year 2000
  }

  calculateQualityScore(qualityChecks) {
    let score = 0;
    let maxScore = 0;

    if (qualityChecks.hasValidData) score += 40;
    maxScore += 40;

    if (qualityChecks.hasValidTimestamp) score += 20;
    maxScore += 20;

    if (qualityChecks.dataSize > 0) score += 20;
    maxScore += 20;

    if (qualityChecks.errors.length === 0) score += 20;
    maxScore += 20;

    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        return current[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * Get health status for specific source
   */
  getSourceHealth(sourceId) {
    const source = this.dataSources.get(sourceId);
    const metrics = this.healthMetrics.get(sourceId);
    const sla = this.slaMetrics.get(sourceId);
    const circuitBreaker = this.circuitBreakers.get(sourceId);

    if (!source) return null;

    return {
      source: {
        id: sourceId,
        name: source.name,
        status: source.currentStatus,
        lastHealthCheck: source.lastHealthCheck,
        consecutiveFailures: source.consecutiveFailures,
        lastError: source.lastError
      },
      metrics: metrics || {},
      sla: sla || {},
      circuitBreaker: circuitBreaker || {}
    };
  }

  /**
   * Get overall system health
   */
  getSystemHealth() {
    const sources = Array.from(this.dataSources.keys()).map(id => this.getSourceHealth(id));
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalSources: sources.length,
      healthySources: sources.filter(s => s.source.status === HEALTH_STATUS.HEALTHY).length,
      degradedSources: sources.filter(s => s.source.status === HEALTH_STATUS.DEGRADED).length,
      unhealthySources: sources.filter(s => s.source.status === HEALTH_STATUS.UNHEALTHY).length,
      criticalSources: sources.filter(s => s.source.status === HEALTH_STATUS.CRITICAL).length,
      openCircuitBreakers: sources.filter(s => s.circuitBreaker.state === CIRCUIT_STATES.OPEN).length
    };

    // Overall system status
    let overallStatus = HEALTH_STATUS.HEALTHY;
    if (summary.criticalSources > 0) {
      overallStatus = HEALTH_STATUS.CRITICAL;
    } else if (summary.unhealthySources > 0) {
      overallStatus = HEALTH_STATUS.UNHEALTHY;
    } else if (summary.degradedSources > 0) {
      overallStatus = HEALTH_STATUS.DEGRADED;
    }

    return {
      overallStatus,
      summary,
      sources
    };
  }

  /**
   * Manual health check trigger
   */
  async triggerHealthCheck(sourceId = null) {
    if (sourceId) {
      const source = this.dataSources.get(sourceId);
      if (source) {
        return await this.performDetailedHealthCheck(sourceId, source);
      }
      throw new Error(`Unknown source: ${sourceId}`);
    } else {
      await this.runBasicHealthChecks();
      return this.getSystemHealth();
    }
  }

  /**
   * Reset circuit breaker manually
   */
  resetCircuitBreaker(sourceId) {
    const circuitBreaker = this.circuitBreakers.get(sourceId);
    if (circuitBreaker) {
      circuitBreaker.state = CIRCUIT_STATES.CLOSED;
      circuitBreaker.failureCount = 0;
      circuitBreaker.lastFailureTime = null;
      
      this.auditLogger.logSystemEvent('CIRCUIT_BREAKER_MANUAL_RESET', {
        sourceId,
        resetBy: 'manual_intervention'
      });
      
      return true;
    }
    return false;
  }
}

// Export singleton instance
let healthMonitor = null;

export function getHealthMonitor(config = {}) {
  if (!healthMonitor) {
    healthMonitor = new DataSourceHealthMonitor(config);
  }
  return healthMonitor;
}

export { 
  HEALTH_CHECK_TYPES, 
  HEALTH_STATUS, 
  CIRCUIT_STATES, 
  SLA_THRESHOLDS 
};

export default DataSourceHealthMonitor;