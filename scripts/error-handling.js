#!/usr/bin/env node

/**
 * Enterprise Error Handling System
 * Provides structured error reporting, categorization, and recovery strategies
 * for financial data pipeline operations with compliance reporting
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAuditLogger, AUDIT_LEVELS, AUDIT_CATEGORIES } from './audit-logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Error classification system
const ERROR_CATEGORIES = {
  DATA_SOURCE: 'DATA_SOURCE',
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  TRANSFORMATION: 'TRANSFORMATION',
  BUSINESS_LOGIC: 'BUSINESS_LOGIC',
  SYSTEM: 'SYSTEM',
  SECURITY: 'SECURITY',
  COMPLIANCE: 'COMPLIANCE',
  CONFIGURATION: 'CONFIGURATION',
  RESOURCE: 'RESOURCE'
};

// Error severity levels aligned with financial industry standards
const ERROR_SEVERITY = {
  LOW: 'LOW',           // Minor issues, informational
  MEDIUM: 'MEDIUM',     // Warning-level issues, degraded service
  HIGH: 'HIGH',         // Error-level issues, service impact
  CRITICAL: 'CRITICAL', // Critical issues, major service impact
  FATAL: 'FATAL'        // System failure, complete service outage
};

// Recovery strategies for different error types
const RECOVERY_STRATEGIES = {
  RETRY: 'RETRY',
  FALLBACK_DATA: 'FALLBACK_DATA',
  CIRCUIT_BREAKER: 'CIRCUIT_BREAKER',
  GRACEFUL_DEGRADATION: 'GRACEFUL_DEGRADATION',
  MANUAL_INTERVENTION: 'MANUAL_INTERVENTION',
  FAILOVER: 'FAILOVER',
  CACHE_STALE_DATA: 'CACHE_STALE_DATA',
  SKIP_PROCESSING: 'SKIP_PROCESSING'
};

// Standardized error codes for financial data operations
const ERROR_CODES = {
  // Data Source Errors (1000-1999)
  DATA_SOURCE_UNAVAILABLE: 'E1001',
  DATA_SOURCE_TIMEOUT: 'E1002',
  DATA_SOURCE_RATE_LIMITED: 'E1003',
  DATA_SOURCE_AUTHENTICATION: 'E1004',
  DATA_SOURCE_INVALID_RESPONSE: 'E1005',
  DATA_SOURCE_MALFORMED_DATA: 'E1006',
  
  // Network Errors (2000-2999)
  NETWORK_CONNECTION_FAILED: 'E2001',
  NETWORK_TIMEOUT: 'E2002',
  NETWORK_DNS_RESOLUTION: 'E2003',
  NETWORK_SSL_ERROR: 'E2004',
  NETWORK_PROXY_ERROR: 'E2005',
  
  // Validation Errors (3000-3999)
  SCHEMA_VALIDATION_FAILED: 'E3001',
  DATA_QUALITY_VIOLATION: 'E3002',
  BUSINESS_RULE_VIOLATION: 'E3003',
  DATA_INTEGRITY_VIOLATION: 'E3004',
  DATA_FRESHNESS_VIOLATION: 'E3005',
  
  // Transformation Errors (4000-4999)
  DATA_TRANSFORMATION_FAILED: 'E4001',
  DATA_AGGREGATION_FAILED: 'E4002',
  DATA_ENRICHMENT_FAILED: 'E4003',
  DATA_NORMALIZATION_FAILED: 'E4004',
  
  // Business Logic Errors (5000-5999)
  CALCULATION_ERROR: 'E5001',
  SENTIMENT_ANALYSIS_FAILED: 'E5002',
  INDICATOR_CALCULATION_FAILED: 'E5003',
  THRESHOLD_VIOLATION: 'E5004',
  
  // System Errors (6000-6999)
  FILE_SYSTEM_ERROR: 'E6001',
  MEMORY_ALLOCATION_ERROR: 'E6002',
  PROCESS_FAILURE: 'E6003',
  CONFIGURATION_ERROR: 'E6004',
  DEPENDENCY_ERROR: 'E6005',
  
  // Security Errors (7000-7999)
  AUTHENTICATION_FAILED: 'E7001',
  AUTHORIZATION_FAILED: 'E7002',
  DATA_ENCRYPTION_FAILED: 'E7003',
  AUDIT_LOG_FAILURE: 'E7004',
  
  // Compliance Errors (8000-8999)
  REGULATORY_VIOLATION: 'E8001',
  DATA_RETENTION_VIOLATION: 'E8002',
  PRIVACY_VIOLATION: 'E8003',
  AUDIT_TRAIL_VIOLATION: 'E8004',
  
  // Resource Errors (9000-9999)
  INSUFFICIENT_MEMORY: 'E9001',
  DISK_SPACE_FULL: 'E9002',
  CPU_LIMIT_EXCEEDED: 'E9003',
  QUOTA_EXCEEDED: 'E9004'
};

// Error recovery configurations
const RECOVERY_CONFIGS = {
  [ERROR_CODES.DATA_SOURCE_TIMEOUT]: {
    strategy: RECOVERY_STRATEGIES.RETRY,
    maxRetries: 3,
    backoffMultiplier: 2,
    initialDelay: 1000,
    fallbackStrategy: RECOVERY_STRATEGIES.CACHE_STALE_DATA
  },
  [ERROR_CODES.DATA_SOURCE_RATE_LIMITED]: {
    strategy: RECOVERY_STRATEGIES.CIRCUIT_BREAKER,
    circuitBreakerTimeout: 300000, // 5 minutes
    fallbackStrategy: RECOVERY_STRATEGIES.CACHE_STALE_DATA
  },
  [ERROR_CODES.DATA_SOURCE_UNAVAILABLE]: {
    strategy: RECOVERY_STRATEGIES.FALLBACK_DATA,
    fallbackSources: ['cache', 'historical_average'],
    alertEscalation: true
  },
  [ERROR_CODES.SCHEMA_VALIDATION_FAILED]: {
    strategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION,
    skipInvalidFields: true,
    logViolations: true
  },
  [ERROR_CODES.NETWORK_CONNECTION_FAILED]: {
    strategy: RECOVERY_STRATEGIES.RETRY,
    maxRetries: 5,
    backoffMultiplier: 1.5,
    initialDelay: 2000
  }
};

export class EnterpriseErrorHandler {
  constructor(config = {}) {
    this.config = {
      enableRecovery: true,
      enableCircuitBreaker: true,
      enableAlerting: true,
      maxRetries: 3,
      baseRetryDelay: 1000,
      circuitBreakerTimeout: 300000, // 5 minutes
      errorReportingEndpoint: null,
      slackWebhook: null,
      emailAlerts: false,
      enableMetrics: true,
      enableErrorAggregation: true,
      ...config
    };

    this.auditLogger = getAuditLogger();
    this.errorMetrics = new Map();
    this.circuitBreakers = new Map();
    this.errorHistory = [];
    this.recoveryAttempts = new Map();
    
    this.initializeErrorHandling();
  }

  /**
   * Initialize error handling system
   */
  initializeErrorHandling() {
    // Set up global error handlers
    process.on('uncaughtException', (error) => {
      this.handleCriticalError(error, 'UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.handleCriticalError(reason, 'UNHANDLED_REJECTION', { promise });
    });

    // Initialize circuit breakers for critical services
    this.initializeCircuitBreakers();
  }

  /**
   * Initialize circuit breakers for external services
   */
  initializeCircuitBreakers() {
    const services = [
      'yahoo-finance',
      'alpha-vantage', 
      'fred',
      'coingecko',
      'fear-greed'
    ];

    services.forEach(service => {
      this.circuitBreakers.set(service, {
        state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
        failureCount: 0,
        failureThreshold: 5,
        timeout: this.config.circuitBreakerTimeout,
        lastFailureTime: null,
        successCount: 0,
        halfOpenMaxCalls: 3
      });
    });
  }

  /**
   * Handle and classify errors with recovery strategies
   */
  async handleError(error, context = {}) {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();
    
    // Classify the error
    const classification = this.classifyError(error, context);
    
    // Create structured error object
    const structuredError = {
      errorId,
      timestamp,
      ...classification,
      context: this.sanitizeContext(context),
      stackTrace: error.stack,
      environment: this.getEnvironmentInfo(),
      recovery: null
    };

    try {
      // Log the error
      await this.logError(structuredError);
      
      // Update metrics
      this.updateErrorMetrics(structuredError);
      
      // Attempt recovery if enabled
      if (this.config.enableRecovery) {
        structuredError.recovery = await this.attemptRecovery(structuredError, context);
      }
      
      // Check for alert conditions
      if (this.shouldAlert(structuredError)) {
        await this.sendAlert(structuredError);
      }
      
      // Update circuit breaker state
      this.updateCircuitBreaker(structuredError, context);
      
      return structuredError;
      
    } catch (handlingError) {
      // Error handling failed - this is critical
      console.error('Error handling system failed:', handlingError);
      await this.handleCriticalError(handlingError, 'ERROR_HANDLER_FAILURE', { originalError: error });
      return structuredError;
    }
  }

  /**
   * Classify error into category, severity, and error code
   */
  classifyError(error, context) {
    let category = ERROR_CATEGORIES.SYSTEM;
    let severity = ERROR_SEVERITY.MEDIUM;
    let errorCode = 'E0000'; // Generic error code
    let recoverable = true;

    // Network-related errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      category = ERROR_CATEGORIES.NETWORK;
      errorCode = error.code === 'ENOTFOUND' ? ERROR_CODES.NETWORK_DNS_RESOLUTION : ERROR_CODES.NETWORK_CONNECTION_FAILED;
      severity = ERROR_SEVERITY.HIGH;
    }
    
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      category = ERROR_CATEGORIES.NETWORK;
      errorCode = ERROR_CODES.NETWORK_TIMEOUT;
      severity = ERROR_SEVERITY.MEDIUM;
    }

    // Data source errors
    if (context.source || error.message?.includes('API')) {
      category = ERROR_CATEGORIES.DATA_SOURCE;
      
      if (error.message?.includes('rate limit') || error.status === 429) {
        errorCode = ERROR_CODES.DATA_SOURCE_RATE_LIMITED;
        severity = ERROR_SEVERITY.MEDIUM;
      } else if (error.status >= 500) {
        errorCode = ERROR_CODES.DATA_SOURCE_UNAVAILABLE;
        severity = ERROR_SEVERITY.HIGH;
      } else if (error.status === 401 || error.status === 403) {
        errorCode = ERROR_CODES.DATA_SOURCE_AUTHENTICATION;
        severity = ERROR_SEVERITY.HIGH;
        recoverable = false;
      } else if (error.message?.includes('invalid') || error.message?.includes('malformed')) {
        errorCode = ERROR_CODES.DATA_SOURCE_MALFORMED_DATA;
        severity = ERROR_SEVERITY.MEDIUM;
      }
    }

    // Validation errors
    if (error.message?.includes('validation') || error.message?.includes('schema')) {
      category = ERROR_CATEGORIES.VALIDATION;
      errorCode = ERROR_CODES.SCHEMA_VALIDATION_FAILED;
      severity = ERROR_SEVERITY.MEDIUM;
    }

    // Business logic errors
    if (context.operation === 'calculation' || error.message?.includes('calculation')) {
      category = ERROR_CATEGORIES.BUSINESS_LOGIC;
      errorCode = ERROR_CODES.CALCULATION_ERROR;
      severity = ERROR_SEVERITY.HIGH;
    }

    // File system errors
    if (error.code?.startsWith('E') && ['ENOENT', 'EACCES', 'EMFILE', 'ENOSPC'].includes(error.code)) {
      category = ERROR_CATEGORIES.SYSTEM;
      errorCode = error.code === 'ENOSPC' ? ERROR_CODES.DISK_SPACE_FULL : ERROR_CODES.FILE_SYSTEM_ERROR;
      severity = error.code === 'ENOSPC' ? ERROR_SEVERITY.CRITICAL : ERROR_SEVERITY.HIGH;
    }

    // Memory errors
    if (error.message?.includes('memory') || error.code === 'ERR_MEMORY_ALLOCATION_FAILED') {
      category = ERROR_CATEGORIES.RESOURCE;
      errorCode = ERROR_CODES.INSUFFICIENT_MEMORY;
      severity = ERROR_SEVERITY.CRITICAL;
      recoverable = false;
    }

    return {
      name: error.name || 'Error',
      message: error.message || 'Unknown error',
      code: error.code,
      status: error.status,
      category,
      severity,
      errorCode,
      recoverable,
      retryable: this.isRetryable(errorCode),
      businessImpact: this.assessBusinessImpact(category, severity, context)
    };
  }

  /**
   * Attempt error recovery based on classification
   */
  async attemptRecovery(structuredError, context) {
    const recoveryConfig = RECOVERY_CONFIGS[structuredError.errorCode] || {
      strategy: RECOVERY_STRATEGIES.RETRY,
      maxRetries: this.config.maxRetries
    };

    const recoveryAttempt = {
      strategy: recoveryConfig.strategy,
      startTime: Date.now(),
      attempts: [],
      success: false,
      finalAction: null
    };

    try {
      switch (recoveryConfig.strategy) {
        case RECOVERY_STRATEGIES.RETRY:
          recoveryAttempt.success = await this.executeRetryStrategy(structuredError, context, recoveryConfig);
          break;
          
        case RECOVERY_STRATEGIES.FALLBACK_DATA:
          recoveryAttempt.success = await this.executeFallbackStrategy(structuredError, context, recoveryConfig);
          break;
          
        case RECOVERY_STRATEGIES.CIRCUIT_BREAKER:
          recoveryAttempt.success = await this.executeCircuitBreakerStrategy(structuredError, context, recoveryConfig);
          break;
          
        case RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION:
          recoveryAttempt.success = await this.executeGracefulDegradation(structuredError, context, recoveryConfig);
          break;
          
        case RECOVERY_STRATEGIES.CACHE_STALE_DATA:
          recoveryAttempt.success = await this.executeCacheStrategy(structuredError, context, recoveryConfig);
          break;
          
        default:
          recoveryAttempt.finalAction = 'No recovery strategy available';
      }

      // If primary strategy failed, try fallback
      if (!recoveryAttempt.success && recoveryConfig.fallbackStrategy) {
        const fallbackConfig = { strategy: recoveryConfig.fallbackStrategy };
        const fallbackResult = await this.attemptRecovery(structuredError, context);
        recoveryAttempt.fallbackUsed = true;
        recoveryAttempt.fallbackResult = fallbackResult;
        recoveryAttempt.success = fallbackResult.success;
      }

    } catch (recoveryError) {
      recoveryAttempt.error = {
        message: recoveryError.message,
        stack: recoveryError.stack
      };
    }

    recoveryAttempt.duration = Date.now() - recoveryAttempt.startTime;
    return recoveryAttempt;
  }

  /**
   * Execute retry strategy with exponential backoff
   */
  async executeRetryStrategy(structuredError, context, config) {
    const maxRetries = config.maxRetries || this.config.maxRetries;
    const baseDelay = config.initialDelay || this.config.baseRetryDelay;
    const backoffMultiplier = config.backoffMultiplier || 2;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
      
      // Wait before retry (except first attempt)
      if (attempt > 1) {
        await this.sleep(delay);
      }

      try {
        // Attempt to re-execute the failed operation
        if (context.retryFunction && typeof context.retryFunction === 'function') {
          const result = await context.retryFunction();
          
          await this.auditLogger.logSystemEvent('ERROR_RECOVERY_SUCCESS', {
            errorId: structuredError.errorId,
            strategy: 'RETRY',
            attempt,
            totalAttempts: maxRetries
          });
          
          return true;
        }
      } catch (retryError) {
        await this.auditLogger.logError(retryError, {
          operation: 'error_recovery_retry',
          errorId: structuredError.errorId,
          attempt,
          maxRetries
        });
        
        if (attempt === maxRetries) {
          return false;
        }
      }
    }

    return false;
  }

  /**
   * Execute fallback data strategy
   */
  async executeFallbackStrategy(structuredError, context, config) {
    const fallbackSources = config.fallbackSources || ['cache', 'default'];

    for (const source of fallbackSources) {
      try {
        let fallbackData = null;

        switch (source) {
          case 'cache':
            fallbackData = await this.getFallbackFromCache(context);
            break;
          case 'historical_average':
            fallbackData = await this.getHistoricalAverage(context);
            break;
          case 'default':
            fallbackData = await this.getDefaultValues(context);
            break;
        }

        if (fallbackData) {
          await this.auditLogger.logSystemEvent('ERROR_RECOVERY_FALLBACK', {
            errorId: structuredError.errorId,
            fallbackSource: source,
            dataAvailable: true
          });
          
          // Store fallback data in context for consumption
          context.fallbackData = fallbackData;
          return true;
        }
      } catch (fallbackError) {
        await this.auditLogger.logError(fallbackError, {
          operation: 'fallback_data_retrieval',
          source,
          errorId: structuredError.errorId
        });
      }
    }

    return false;
  }

  /**
   * Execute circuit breaker strategy
   */
  async executeCircuitBreakerStrategy(structuredError, context, config) {
    const serviceName = context.source || 'unknown';
    const circuitBreaker = this.circuitBreakers.get(serviceName);

    if (!circuitBreaker) return false;

    // Open the circuit breaker
    circuitBreaker.state = 'OPEN';
    circuitBreaker.lastFailureTime = Date.now();
    circuitBreaker.failureCount++;

    await this.auditLogger.logSystemEvent('CIRCUIT_BREAKER_OPENED', {
      service: serviceName,
      failureCount: circuitBreaker.failureCount,
      errorId: structuredError.errorId
    });

    // Use cache or default data while circuit is open
    return await this.executeCacheStrategy(structuredError, context, config);
  }

  /**
   * Execute graceful degradation strategy
   */
  async executeGracefulDegradation(structuredError, context, config) {
    // Implement service degradation logic
    const degradationActions = {
      skipNonEssentialData: true,
      useSimplifiedCalculations: true,
      reduceDataPrecision: config.reduceDataPrecision || false,
      skipValidationRules: config.skipInvalidFields || false
    };

    await this.auditLogger.logSystemEvent('GRACEFUL_DEGRADATION_ACTIVATED', {
      errorId: structuredError.errorId,
      degradationActions,
      service: context.source
    });

    context.degradationMode = degradationActions;
    return true;
  }

  /**
   * Execute cache strategy
   */
  async executeCacheStrategy(structuredError, context, config) {
    try {
      const cachedData = await this.getStaleDataFromCache(context);
      
      if (cachedData) {
        const cacheAge = Date.now() - new Date(cachedData.timestamp).getTime();
        
        await this.auditLogger.logSystemEvent('STALE_CACHE_DATA_USED', {
          errorId: structuredError.errorId,
          cacheAge: Math.round(cacheAge / 1000), // seconds
          source: context.source
        });
        
        context.fallbackData = cachedData;
        context.dataFreshness = 'STALE';
        return true;
      }
    } catch (cacheError) {
      await this.auditLogger.logError(cacheError, {
        operation: 'cache_fallback',
        errorId: structuredError.errorId
      });
    }

    return false;
  }

  /**
   * Check if error should trigger an alert
   */
  shouldAlert(structuredError) {
    if (!this.config.enableAlerting) return false;

    // Always alert on critical and fatal errors
    if ([ERROR_SEVERITY.CRITICAL, ERROR_SEVERITY.FATAL].includes(structuredError.severity)) {
      return true;
    }

    // Alert on compliance violations
    if (structuredError.category === ERROR_CATEGORIES.COMPLIANCE) {
      return true;
    }

    // Alert on repeated errors
    const recentErrors = this.getRecentErrors(structuredError.errorCode, 300000); // 5 minutes
    if (recentErrors.length >= 5) {
      return true;
    }

    // Alert on business-critical errors
    if (structuredError.businessImpact.high) {
      return true;
    }

    return false;
  }

  /**
   * Send error alert
   */
  async sendAlert(structuredError) {
    const alert = {
      timestamp: new Date().toISOString(),
      errorId: structuredError.errorId,
      title: `${structuredError.severity} Error: ${structuredError.errorCode}`,
      message: structuredError.message,
      category: structuredError.category,
      severity: structuredError.severity,
      businessImpact: structuredError.businessImpact,
      recovery: structuredError.recovery,
      environment: structuredError.environment.environment || 'unknown'
    };

    try {
      // Log alert
      await this.auditLogger.logSystemEvent('ERROR_ALERT_SENT', alert);

      // Send to external alerting systems
      if (this.config.slackWebhook) {
        await this.sendSlackAlert(alert);
      }

      if (this.config.emailAlerts) {
        await this.sendEmailAlert(alert);
      }

      if (this.config.errorReportingEndpoint) {
        await this.sendToErrorReporting(alert);
      }

    } catch (alertError) {
      console.error('Failed to send error alert:', alertError);
    }
  }

  /**
   * Handle critical errors that could crash the system
   */
  async handleCriticalError(error, type, context = {}) {
    const structuredError = {
      errorId: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      type,
      name: error.name || 'CriticalError',
      message: error.message || 'Critical system error',
      stack: error.stack,
      category: ERROR_CATEGORIES.SYSTEM,
      severity: ERROR_SEVERITY.FATAL,
      errorCode: 'E0001',
      context,
      recoverable: false
    };

    try {
      await this.auditLogger.logError(error, {
        operation: 'critical_error_handling',
        type,
        affectsBusinessOperations: true,
        affectsCompliance: true
      });

      // Force alert for critical errors
      await this.sendAlert(structuredError);

    } catch (loggingError) {
      // If logging fails, at least output to console
      console.error('CRITICAL ERROR - Logging failed:', loggingError);
      console.error('Original critical error:', error);
    }

    // For fatal errors, consider graceful shutdown
    if (type === 'UNCAUGHT_EXCEPTION') {
      console.error('Uncaught exception occurred. System may be unstable.');
      // In production, you might want to gracefully shut down
      // process.exit(1);
    }
  }

  /**
   * Update circuit breaker state
   */
  updateCircuitBreaker(structuredError, context) {
    const serviceName = context.source;
    if (!serviceName) return;

    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (!circuitBreaker) return;

    const now = Date.now();

    switch (circuitBreaker.state) {
      case 'CLOSED':
        if (structuredError.severity === ERROR_SEVERITY.HIGH || structuredError.severity === ERROR_SEVERITY.CRITICAL) {
          circuitBreaker.failureCount++;
          if (circuitBreaker.failureCount >= circuitBreaker.failureThreshold) {
            circuitBreaker.state = 'OPEN';
            circuitBreaker.lastFailureTime = now;
          }
        } else {
          // Reset failure count on success
          circuitBreaker.failureCount = 0;
        }
        break;

      case 'OPEN':
        if (now - circuitBreaker.lastFailureTime >= circuitBreaker.timeout) {
          circuitBreaker.state = 'HALF_OPEN';
          circuitBreaker.successCount = 0;
        }
        break;

      case 'HALF_OPEN':
        if (structuredError.severity === ERROR_SEVERITY.HIGH || structuredError.severity === ERROR_SEVERITY.CRITICAL) {
          circuitBreaker.state = 'OPEN';
          circuitBreaker.lastFailureTime = now;
          circuitBreaker.failureCount++;
        } else {
          circuitBreaker.successCount++;
          if (circuitBreaker.successCount >= circuitBreaker.halfOpenMaxCalls) {
            circuitBreaker.state = 'CLOSED';
            circuitBreaker.failureCount = 0;
          }
        }
        break;
    }
  }

  /**
   * Update error metrics
   */
  updateErrorMetrics(structuredError) {
    if (!this.config.enableMetrics) return;

    const key = `${structuredError.category}-${structuredError.errorCode}`;
    
    if (!this.errorMetrics.has(key)) {
      this.errorMetrics.set(key, {
        count: 0,
        firstOccurrence: structuredError.timestamp,
        lastOccurrence: structuredError.timestamp,
        severityDistribution: {},
        recoverySuccessRate: 0,
        averageRecoveryTime: 0
      });
    }

    const metrics = this.errorMetrics.get(key);
    metrics.count++;
    metrics.lastOccurrence = structuredError.timestamp;
    
    if (!metrics.severityDistribution[structuredError.severity]) {
      metrics.severityDistribution[structuredError.severity] = 0;
    }
    metrics.severityDistribution[structuredError.severity]++;

    // Update recovery metrics
    if (structuredError.recovery) {
      if (structuredError.recovery.success) {
        metrics.recoverySuccessRate = (metrics.recoverySuccessRate + 1) / 2; // Simple average
        metrics.averageRecoveryTime = (metrics.averageRecoveryTime + structuredError.recovery.duration) / 2;
      }
    }

    // Add to error history
    this.errorHistory.push({
      timestamp: structuredError.timestamp,
      errorCode: structuredError.errorCode,
      category: structuredError.category,
      severity: structuredError.severity,
      recovered: structuredError.recovery?.success || false
    });

    // Keep only last 1000 errors in memory
    if (this.errorHistory.length > 1000) {
      this.errorHistory = this.errorHistory.slice(-1000);
    }
  }

  /**
   * Log structured error
   */
  async logError(structuredError) {
    await this.auditLogger.audit(
      AUDIT_LEVELS.ERROR,
      AUDIT_CATEGORIES.ERROR_EVENT,
      'STRUCTURED_ERROR_OCCURRED',
      {
        errorId: structuredError.errorId,
        errorCode: structuredError.errorCode,
        category: structuredError.category,
        severity: structuredError.severity,
        message: structuredError.message,
        recoverable: structuredError.recoverable,
        businessImpact: structuredError.businessImpact,
        recovery: structuredError.recovery
      },
      {
        source: structuredError.context.source,
        operation: structuredError.context.operation,
        dataClassification: 'INTERNAL'
      }
    );
  }

  // Utility methods
  generateErrorId() {
    return `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  sanitizeContext(context) {
    const { retryFunction, ...sanitized } = context;
    return sanitized;
  }

  getEnvironmentInfo() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      environment: process.env.NODE_ENV || 'development',
      processId: process.pid,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  isRetryable(errorCode) {
    const retryableErrors = [
      ERROR_CODES.DATA_SOURCE_TIMEOUT,
      ERROR_CODES.NETWORK_TIMEOUT,
      ERROR_CODES.NETWORK_CONNECTION_FAILED,
      ERROR_CODES.DATA_SOURCE_UNAVAILABLE
    ];
    return retryableErrors.includes(errorCode);
  }

  assessBusinessImpact(category, severity, context) {
    return {
      high: severity === ERROR_SEVERITY.CRITICAL || severity === ERROR_SEVERITY.FATAL,
      dataIntegrity: category === ERROR_CATEGORIES.VALIDATION || category === ERROR_CATEGORIES.DATA_SOURCE,
      userExperience: severity !== ERROR_SEVERITY.LOW,
      compliance: category === ERROR_CATEGORIES.COMPLIANCE || category === ERROR_CATEGORIES.SECURITY,
      financial: context.source && ['yahoo-finance', 'alpha-vantage', 'fred'].includes(context.source)
    };
  }

  getRecentErrors(errorCode, timeWindow) {
    const cutoff = Date.now() - timeWindow;
    return this.errorHistory.filter(error => 
      error.errorCode === errorCode && 
      new Date(error.timestamp).getTime() > cutoff
    );
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Fallback data methods (simplified implementations)
  async getFallbackFromCache(context) {
    // Implementation would fetch from cache
    return null;
  }

  async getHistoricalAverage(context) {
    // Implementation would calculate historical average
    return null;
  }

  async getDefaultValues(context) {
    // Implementation would return safe default values
    return {
      timestamp: new Date().toISOString(),
      source: 'default',
      data: {}
    };
  }

  async getStaleDataFromCache(context) {
    // Implementation would fetch stale cache data
    return null;
  }

  // Alert methods (simplified implementations)
  async sendSlackAlert(alert) {
    // Implementation would send to Slack
    console.log('Slack alert would be sent:', alert.title);
  }

  async sendEmailAlert(alert) {
    // Implementation would send email
    console.log('Email alert would be sent:', alert.title);
  }

  async sendToErrorReporting(alert) {
    // Implementation would send to error reporting service
    console.log('Error reporting alert would be sent:', alert.title);
  }

  /**
   * Get error statistics and metrics
   */
  getErrorStats() {
    const stats = {
      totalErrors: this.errorHistory.length,
      errorsByCategory: {},
      errorsBySeverity: {},
      errorsByCode: {},
      circuitBreakerStates: {},
      recentErrorRate: 0
    };

    // Aggregate error history
    this.errorHistory.forEach(error => {
      stats.errorsByCategory[error.category] = (stats.errorsByCategory[error.category] || 0) + 1;
      stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
      stats.errorsByCode[error.errorCode] = (stats.errorsByCode[error.errorCode] || 0) + 1;
    });

    // Circuit breaker states
    for (const [service, breaker] of this.circuitBreakers.entries()) {
      stats.circuitBreakerStates[service] = breaker.state;
    }

    // Recent error rate (last hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentErrors = this.errorHistory.filter(error => 
      new Date(error.timestamp).getTime() > oneHourAgo
    );
    stats.recentErrorRate = recentErrors.length;

    return stats;
  }
}

// Export singleton instance
let errorHandler = null;

export function getErrorHandler(config = {}) {
  if (!errorHandler) {
    errorHandler = new EnterpriseErrorHandler(config);
  }
  return errorHandler;
}

export { 
  ERROR_CATEGORIES, 
  ERROR_SEVERITY, 
  ERROR_CODES, 
  RECOVERY_STRATEGIES,
  RECOVERY_CONFIGS 
};

export default EnterpriseErrorHandler;