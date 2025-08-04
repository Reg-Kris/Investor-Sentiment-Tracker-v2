#!/usr/bin/env node

/**
 * Enterprise Data Pipeline Monitoring System
 * Provides comprehensive monitoring, performance metrics, and alerting
 * for financial data pipeline operations with SLA tracking and compliance reporting
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { getAuditLogger, AUDIT_LEVELS, AUDIT_CATEGORIES } from './audit-logger.js';
import { getErrorHandler } from './error-handling.js';
import { getHealthMonitor } from './health-monitor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Metric types for comprehensive monitoring
const METRIC_TYPES = {
  COUNTER: 'COUNTER',           // Monotonic increasing (requests, errors)
  GAUGE: 'GAUGE',              // Point-in-time values (memory, CPU)
  HISTOGRAM: 'HISTOGRAM',       // Distribution of values (response times)
  SUMMARY: 'SUMMARY',          // Statistical summaries (percentiles)
  TIMER: 'TIMER'               // Duration measurements
};

// Performance metric categories
const METRIC_CATEGORIES = {
  THROUGHPUT: 'THROUGHPUT',
  LATENCY: 'LATENCY',
  ERROR_RATE: 'ERROR_RATE',
  RESOURCE_USAGE: 'RESOURCE_USAGE',
  DATA_QUALITY: 'DATA_QUALITY',
  BUSINESS_METRICS: 'BUSINESS_METRICS',
  SLA_COMPLIANCE: 'SLA_COMPLIANCE'
};

// Alert severity levels aligned with financial operations
const ALERT_SEVERITY = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  EMERGENCY: 'EMERGENCY'
};

// SLA performance thresholds
const SLA_PERFORMANCE_THRESHOLDS = {
  pipeline_execution_time: {
    target: 300000, // 5 minutes max
    warning: 240000, // 4 minutes warning
    critical: 360000 // 6 minutes critical
  },
  data_processing_throughput: {
    target: 1000, // records per minute
    warning: 800,
    critical: 500
  },
  error_rate: {
    target: 1.0, // 1% max error rate
    warning: 0.8,
    critical: 2.0
  },
  data_freshness: {
    target: 300000, // 5 minutes max age
    warning: 240000,
    critical: 600000
  },
  system_availability: {
    target: 99.5, // 99.5% uptime
    warning: 99.0,
    critical: 98.0
  }
};

export class PipelineMonitor {
  constructor(config = {}) {
    this.config = {
      metricsCollectionInterval: 30000,    // 30 seconds
      metricsRetentionPeriod: 86400000,    // 24 hours
      performanceReportInterval: 300000,   // 5 minutes
      alertCheckInterval: 60000,           // 1 minute
      enableRealTimeMonitoring: true,
      enablePerformanceReports: true,
      enableSLAMonitoring: true,
      enableResourceMonitoring: true,
      metricsStoragePath: path.resolve(__dirname, '../logs/metrics'),
      dashboardUpdateInterval: 15000,      // 15 seconds
      ...config
    };

    this.auditLogger = getAuditLogger();
    this.errorHandler = getErrorHandler();
    this.healthMonitor = getHealthMonitor();

    // Monitoring state
    this.metrics = new Map();
    this.activeTimers = new Map();
    this.performanceBaselines = new Map();
    this.alertRules = new Map();
    this.alertHistory = [];
    this.pipelineExecutions = [];
    
    // System monitoring
    this.systemMetrics = {
      startTime: Date.now(),
      processId: process.pid,
      nodeVersion: process.version,
      platform: process.platform
    };

    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring system
   */
  initializeMonitoring() {
    this.initializeMetrics();
    this.initializeAlertRules();
    this.startMetricsCollection();
    this.startPerformanceReporting();
    this.startAlertMonitoring();

    // Log monitoring system startup
    this.auditLogger.logSystemEvent('PIPELINE_MONITORING_STARTED', {
      config: this.sanitizeConfig(),
      systemInfo: this.getSystemInfo()
    });
  }

  /**
   * Initialize core metrics
   */
  initializeMetrics() {
    const coreMetrics = [
      // Throughput metrics
      { name: 'pipeline_executions_total', type: METRIC_TYPES.COUNTER, category: METRIC_CATEGORIES.THROUGHPUT },
      { name: 'data_records_processed_total', type: METRIC_TYPES.COUNTER, category: METRIC_CATEGORIES.THROUGHPUT },
      { name: 'api_requests_total', type: METRIC_TYPES.COUNTER, category: METRIC_CATEGORIES.THROUGHPUT },
      
      // Latency metrics
      { name: 'pipeline_execution_duration', type: METRIC_TYPES.HISTOGRAM, category: METRIC_CATEGORIES.LATENCY },
      { name: 'api_request_duration', type: METRIC_TYPES.HISTOGRAM, category: METRIC_CATEGORIES.LATENCY },
      { name: 'data_processing_duration', type: METRIC_TYPES.HISTOGRAM, category: METRIC_CATEGORIES.LATENCY },
      
      // Error metrics
      { name: 'pipeline_errors_total', type: METRIC_TYPES.COUNTER, category: METRIC_CATEGORIES.ERROR_RATE },
      { name: 'api_errors_total', type: METRIC_TYPES.COUNTER, category: METRIC_CATEGORIES.ERROR_RATE },
      { name: 'validation_errors_total', type: METRIC_TYPES.COUNTER, category: METRIC_CATEGORIES.ERROR_RATE },
      
      // Resource metrics
      { name: 'memory_usage_bytes', type: METRIC_TYPES.GAUGE, category: METRIC_CATEGORIES.RESOURCE_USAGE },
      { name: 'cpu_usage_percent', type: METRIC_TYPES.GAUGE, category: METRIC_CATEGORIES.RESOURCE_USAGE },
      { name: 'active_connections', type: METRIC_TYPES.GAUGE, category: METRIC_CATEGORIES.RESOURCE_USAGE },
      
      // Data quality metrics
      { name: 'data_quality_score', type: METRIC_TYPES.GAUGE, category: METRIC_CATEGORIES.DATA_QUALITY },
      { name: 'schema_violations_total', type: METRIC_TYPES.COUNTER, category: METRIC_CATEGORIES.DATA_QUALITY },
      { name: 'data_freshness_seconds', type: METRIC_TYPES.GAUGE, category: METRIC_CATEGORIES.DATA_QUALITY },
      
      // Business metrics
      { name: 'market_data_updates_total', type: METRIC_TYPES.COUNTER, category: METRIC_CATEGORIES.BUSINESS_METRICS },
      { name: 'sentiment_calculations_total', type: METRIC_TYPES.COUNTER, category: METRIC_CATEGORIES.BUSINESS_METRICS },
      { name: 'alert_notifications_total', type: METRIC_TYPES.COUNTER, category: METRIC_CATEGORIES.BUSINESS_METRICS }
    ];

    coreMetrics.forEach(metric => this.registerMetric(metric));
  }

  /**
   * Initialize alert rules
   */
  initializeAlertRules() {
    const alertRules = [
      {
        name: 'high_error_rate',
        metric: 'pipeline_errors_total',
        condition: 'rate_per_minute > 5',
        severity: ALERT_SEVERITY.CRITICAL,
        message: 'High error rate detected in data pipeline'
      },
      {
        name: 'slow_pipeline_execution',
        metric: 'pipeline_execution_duration',
        condition: 'p95 > 300000', // 5 minutes
        severity: ALERT_SEVERITY.WARNING,
        message: 'Pipeline execution time exceeding SLA'
      },
      {
        name: 'high_memory_usage',
        metric: 'memory_usage_bytes',
        condition: 'current > 1073741824', // 1GB
        severity: ALERT_SEVERITY.WARNING,
        message: 'High memory usage detected'
      },
      {
        name: 'data_freshness_violation',
        metric: 'data_freshness_seconds',
        condition: 'current > 600', // 10 minutes
        severity: ALERT_SEVERITY.CRITICAL,
        message: 'Data freshness SLA violation'
      },
      {
        name: 'api_timeout_spike',
        metric: 'api_request_duration',
        condition: 'p95 > 10000', // 10 seconds
        severity: ALERT_SEVERITY.WARNING,
        message: 'API response times degrading'
      }
    ];

    alertRules.forEach(rule => this.alertRules.set(rule.name, rule));
  }

  /**
   * Register a new metric
   */
  registerMetric(metricConfig) {
    const metric = {
      ...metricConfig,
      values: [],
      currentValue: 0,
      lastUpdated: null,
      statistics: {
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity,
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0
      }
    };

    this.metrics.set(metricConfig.name, metric);
  }

  /**
   * Record metric value
   */
  recordMetric(metricName, value, labels = {}) {
    const metric = this.metrics.get(metricName);
    if (!metric) {
      console.warn(`Unknown metric: ${metricName}`);
      return;
    }

    const timestamp = Date.now();
    const metricValue = {
      value,
      timestamp,
      labels
    };

    // Update metric
    metric.values.push(metricValue);
    metric.currentValue = value;
    metric.lastUpdated = timestamp;

    // Update statistics
    this.updateMetricStatistics(metric);

    // Clean old values (keep only last 24 hours)
    const cutoff = timestamp - this.config.metricsRetentionPeriod;
    metric.values = metric.values.filter(v => v.timestamp > cutoff);

    // Log high-level metric updates
    if (metric.category === METRIC_CATEGORIES.ERROR_RATE && value > 0) {
      this.auditLogger.logSystemEvent('METRIC_RECORDED', {
        metric: metricName,
        value,
        category: metric.category,
        labels
      });
    }
  }

  /**
   * Update metric statistics
   */
  updateMetricStatistics(metric) {
    const values = metric.values.map(v => v.value).sort((a, b) => a - b);
    const count = values.length;

    if (count === 0) return;

    metric.statistics.count = count;
    metric.statistics.sum = values.reduce((sum, val) => sum + val, 0);
    metric.statistics.min = values[0];
    metric.statistics.max = values[count - 1];
    metric.statistics.avg = metric.statistics.sum / count;

    // Calculate percentiles
    metric.statistics.p50 = this.calculatePercentile(values, 50);
    metric.statistics.p95 = this.calculatePercentile(values, 95);
    metric.statistics.p99 = this.calculatePercentile(values, 99);
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(sortedValues, percentile) {
    if (sortedValues.length === 0) return 0;
    
    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedValues[lower];
    }
    
    const weight = index - lower;
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  /**
   * Start a timer for duration measurement
   */
  startTimer(timerName, labels = {}) {
    const timerId = `${timerName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.activeTimers.set(timerId, {
      name: timerName,
      startTime: Date.now(),
      labels
    });

    return timerId;
  }

  /**
   * End a timer and record the duration
   */
  endTimer(timerId) {
    const timer = this.activeTimers.get(timerId);
    if (!timer) {
      console.warn(`Unknown timer: ${timerId}`);
      return;
    }

    const duration = Date.now() - timer.startTime;
    this.recordMetric(timer.name, duration, timer.labels);
    this.activeTimers.delete(timerId);

    return duration;
  }

  /**
   * Monitor pipeline execution
   */
  async monitorPipelineExecution(operationName, operation, context = {}) {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    const execution = {
      id: executionId,
      operation: operationName,
      startTime: new Date(startTime).toISOString(),
      context,
      status: 'RUNNING',
      duration: null,
      error: null,
      metrics: {
        memoryStart: process.memoryUsage(),
        cpuStart: process.cpuUsage()
      }
    };

    this.pipelineExecutions.push(execution);

    // Start timer
    const timerId = this.startTimer('pipeline_execution_duration', { operation: operationName });

    try {
      // Record execution start
      this.recordMetric('pipeline_executions_total', 1, { operation: operationName, status: 'started' });

      // Execute operation
      const result = await operation();

      // Record success
      execution.status = 'SUCCESS';
      execution.duration = Date.now() - startTime;
      execution.metrics.memoryEnd = process.memoryUsage();
      execution.metrics.cpuEnd = process.cpuUsage(execution.metrics.cpuStart);

      this.endTimer(timerId);
      this.recordMetric('pipeline_executions_total', 1, { operation: operationName, status: 'success' });

      // Log execution metrics
      await this.auditLogger.logPerformanceEvent(operationName, {
        startTime,
        endTime: Date.now(),
        duration: execution.duration,
        memoryUsed: execution.metrics.memoryEnd.heapUsed - execution.metrics.memoryStart.heapUsed,
        cpuTime: execution.metrics.cpuEnd.user + execution.metrics.cpuEnd.system
      });

      return result;

    } catch (error) {
      // Record failure
      execution.status = 'FAILED';
      execution.duration = Date.now() - startTime;
      execution.error = {
        message: error.message,
        code: error.code,
        stack: error.stack
      };

      this.endTimer(timerId);
      this.recordMetric('pipeline_errors_total', 1, { operation: operationName, error: error.name });

      // Handle error through error handler
      await this.errorHandler.handleError(error, {
        operation: operationName,
        executionId,
        context,
        affectsBusinessOperations: true
      });

      throw error;
    } finally {
      // Clean up old executions (keep last 100)
      if (this.pipelineExecutions.length > 100) {
        this.pipelineExecutions = this.pipelineExecutions.slice(-100);
      }
    }
  }

  /**
   * Start continuous metrics collection
   */
  startMetricsCollection() {
    const collectMetrics = () => {
      try {
        // System resource metrics
        const memUsage = process.memoryUsage();
        this.recordMetric('memory_usage_bytes', memUsage.heapUsed);

        const cpuUsage = process.cpuUsage();
        this.recordMetric('cpu_usage_percent', (cpuUsage.user + cpuUsage.system) / 1000000); // Convert to seconds

        // System load metrics
        const loadAvg = os.loadavg();
        this.recordMetric('system_load_1m', loadAvg[0]);

        // Health monitor integration
        const systemHealth = this.healthMonitor.getSystemHealth();
        this.recordMetric('healthy_data_sources', systemHealth.summary.healthySources);
        this.recordMetric('unhealthy_data_sources', systemHealth.summary.unhealthySources + systemHealth.summary.criticalSources);

        // Calculate derived metrics
        this.calculateDerivedMetrics();

      } catch (error) {
        console.error('Error collecting metrics:', error);
      }
    };

    // Collect metrics immediately and then at intervals
    collectMetrics();
    setInterval(collectMetrics, this.config.metricsCollectionInterval);
  }

  /**
   * Calculate derived metrics from base metrics
   */
  calculateDerivedMetrics() {
    // Calculate error rates
    const totalRequests = this.getMetricValue('api_requests_total');
    const totalErrors = this.getMetricValue('api_errors_total');
    
    if (totalRequests > 0) {
      const errorRate = (totalErrors / totalRequests) * 100;
      this.recordMetric('error_rate_percent', errorRate);
    }

    // Calculate throughput (requests per minute)
    const requestsMetric = this.metrics.get('api_requests_total');
    if (requestsMetric && requestsMetric.values.length > 1) {
      const recentValues = requestsMetric.values.slice(-10); // Last 10 data points
      const timeSpan = recentValues[recentValues.length - 1].timestamp - recentValues[0].timestamp;
      const requestCount = recentValues[recentValues.length - 1].value - recentValues[0].value;
      
      if (timeSpan > 0) {
        const throughput = (requestCount / timeSpan) * 60000; // requests per minute
        this.recordMetric('throughput_rpm', throughput);
      }
    }

    // Calculate data freshness
    const lastDataUpdate = this.getLastDataUpdateTime();
    if (lastDataUpdate) {
      const freshnessSeconds = (Date.now() - lastDataUpdate) / 1000;
      this.recordMetric('data_freshness_seconds', freshnessSeconds);
    }
  }

  /**
   * Start performance reporting
   */
  startPerformanceReporting() {
    if (!this.config.enablePerformanceReports) return;

    const generateReport = async () => {
      try {
        const report = await this.generatePerformanceReport();
        await this.savePerformanceReport(report);
        
        // Check SLA compliance
        if (this.config.enableSLAMonitoring) {
          await this.checkSLACompliance(report);
        }

      } catch (error) {
        await this.errorHandler.handleError(error, {
          operation: 'performance_reporting',
          affectsMonitoring: true
        });
      }
    };

    setInterval(generateReport, this.config.performanceReportInterval);
  }

  /**
   * Start alert monitoring
   */
  startAlertMonitoring() {
    const checkAlerts = async () => {
      try {
        for (const [ruleName, rule] of this.alertRules.entries()) {
          const alertTriggered = await this.evaluateAlertRule(rule);
          if (alertTriggered) {
            await this.triggerAlert(rule, alertTriggered);
          }
        }
      } catch (error) {
        console.error('Error checking alerts:', error);
      }
    };

    setInterval(checkAlerts, this.config.alertCheckInterval);
  }

  /**
   * Evaluate alert rule
   */
  async evaluateAlertRule(rule) {
    const metric = this.metrics.get(rule.metric);
    if (!metric) return false;

    try {
      // Parse condition (simplified parser for demo)
      const condition = rule.condition;
      const currentValue = metric.currentValue;
      const statistics = metric.statistics;

      // Evaluate different condition types
      if (condition.includes('rate_per_minute >')) {
        const threshold = parseFloat(condition.split('>')[1].trim());
        const recentValues = metric.values.filter(v => v.timestamp > Date.now() - 60000);
        const rate = recentValues.length;
        return rate > threshold ? { type: 'rate', value: rate, threshold } : false;
      }

      if (condition.includes('p95 >')) {
        const threshold = parseFloat(condition.split('>')[1].trim());
        return statistics.p95 > threshold ? { type: 'percentile', value: statistics.p95, threshold } : false;
      }

      if (condition.includes('current >')) {
        const threshold = parseFloat(condition.split('>')[1].trim());
        return currentValue > threshold ? { type: 'threshold', value: currentValue, threshold } : false;
      }

      return false;

    } catch (error) {
      console.error(`Error evaluating alert rule ${rule.name}:`, error);
      return false;
    }
  }

  /**
   * Trigger alert
   */
  async triggerAlert(rule, alertData) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      rule: rule.name,
      severity: rule.severity,
      message: rule.message,
      metric: rule.metric,
      condition: rule.condition,
      triggerValue: alertData.value,
      threshold: alertData.threshold,
      context: {
        systemHealth: this.healthMonitor.getSystemHealth().overallStatus,
        activeExecutions: this.pipelineExecutions.filter(e => e.status === 'RUNNING').length
      }
    };

    // Add to alert history
    this.alertHistory.push(alert);
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }

    // Log alert
    await this.auditLogger.audit(
      AUDIT_LEVELS.WARN,
      AUDIT_CATEGORIES.SYSTEM_EVENT,
      'PERFORMANCE_ALERT_TRIGGERED',
      alert
    );

    // Record alert metric
    this.recordMetric('alert_notifications_total', 1, { 
      severity: rule.severity, 
      rule: rule.name 
    });

    // Send notifications based on severity
    if (rule.severity === ALERT_SEVERITY.CRITICAL || rule.severity === ALERT_SEVERITY.EMERGENCY) {
      await this.sendCriticalAlert(alert);
    }

    return alert;
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport() {
    const timestamp = new Date().toISOString();
    const reportPeriod = this.config.performanceReportInterval;

    const report = {
      timestamp,
      period: {
        duration: reportPeriod,
        start: new Date(Date.now() - reportPeriod).toISOString(),
        end: timestamp
      },
      summary: {
        totalPipelineExecutions: this.pipelineExecutions.length,
        successfulExecutions: this.pipelineExecutions.filter(e => e.status === 'SUCCESS').length,
        failedExecutions: this.pipelineExecutions.filter(e => e.status === 'FAILED').length,
        averageExecutionTime: 0,
        systemUptime: Date.now() - this.systemMetrics.startTime
      },
      metrics: {},
      systemHealth: this.healthMonitor.getSystemHealth(),
      slaCompliance: {},
      recommendations: []
    };

    // Calculate success rate
    if (report.summary.totalPipelineExecutions > 0) {
      report.summary.successRate = (report.summary.successfulExecutions / report.summary.totalPipelineExecutions) * 100;
    }

    // Calculate average execution time
    const completedExecutions = this.pipelineExecutions.filter(e => e.duration !== null);
    if (completedExecutions.length > 0) {
      report.summary.averageExecutionTime = completedExecutions.reduce((sum, e) => sum + e.duration, 0) / completedExecutions.length;
    }

    // Collect metric summaries
    for (const [metricName, metric] of this.metrics.entries()) {
      report.metrics[metricName] = {
        current: metric.currentValue,
        statistics: { ...metric.statistics },
        category: metric.category,
        lastUpdated: metric.lastUpdated
      };
    }

    // Generate recommendations
    report.recommendations = this.generatePerformanceRecommendations(report);

    return report;
  }

  /**
   * Generate performance recommendations
   */
  generatePerformanceRecommendations(report) {
    const recommendations = [];

    // Check execution time
    if (report.summary.averageExecutionTime > SLA_PERFORMANCE_THRESHOLDS.pipeline_execution_time.warning) {
      recommendations.push({
        type: 'PERFORMANCE',
        priority: 'HIGH',
        message: 'Pipeline execution time exceeding target',
        suggestion: 'Consider optimizing data processing algorithms or increasing system resources',
        metric: 'pipeline_execution_duration',
        currentValue: report.summary.averageExecutionTime,
        targetValue: SLA_PERFORMANCE_THRESHOLDS.pipeline_execution_time.target
      });
    }

    // Check error rate
    const errorRate = report.metrics.error_rate_percent?.current || 0;
    if (errorRate > SLA_PERFORMANCE_THRESHOLDS.error_rate.warning) {
      recommendations.push({
        type: 'RELIABILITY',
        priority: 'CRITICAL',
        message: 'Error rate exceeding acceptable threshold',
        suggestion: 'Investigate error patterns and improve error handling',
        metric: 'error_rate_percent',
        currentValue: errorRate,
        targetValue: SLA_PERFORMANCE_THRESHOLDS.error_rate.target
      });
    }

    // Check memory usage
    const memoryUsage = report.metrics.memory_usage_bytes?.current || 0;
    if (memoryUsage > 800 * 1024 * 1024) { // 800MB
      recommendations.push({
        type: 'RESOURCE',
        priority: 'MEDIUM',
        message: 'High memory usage detected',
        suggestion: 'Monitor for memory leaks and consider garbage collection tuning',
        metric: 'memory_usage_bytes',
        currentValue: memoryUsage,
        targetValue: 500 * 1024 * 1024 // 500MB target
      });
    }

    // Check data freshness
    const dataFreshness = report.metrics.data_freshness_seconds?.current || 0;
    if (dataFreshness > SLA_PERFORMANCE_THRESHOLDS.data_freshness.warning / 1000) {
      recommendations.push({
        type: 'DATA_QUALITY',
        priority: 'HIGH',
        message: 'Data freshness SLA violation',
        suggestion: 'Check data source availability and processing pipeline efficiency',
        metric: 'data_freshness_seconds',
        currentValue: dataFreshness,
        targetValue: SLA_PERFORMANCE_THRESHOLDS.data_freshness.target / 1000
      });
    }

    return recommendations;
  }

  /**
   * Check SLA compliance
   */
  async checkSLACompliance(report) {
    const slaResults = {};

    for (const [slaName, thresholds] of Object.entries(SLA_PERFORMANCE_THRESHOLDS)) {
      const metricValue = this.getSLAMetricValue(slaName, report);
      
      slaResults[slaName] = {
        target: thresholds.target,
        current: metricValue,
        compliant: metricValue <= thresholds.target,
        warningThreshold: thresholds.warning,
        criticalThreshold: thresholds.critical,
        status: this.getSLAStatus(metricValue, thresholds)
      };

      // Log SLA violations
      if (!slaResults[slaName].compliant) {
        await this.auditLogger.logComplianceEvent('SLA_VIOLATION', {
          sla: slaName,
          target: thresholds.target,
          actual: metricValue,
          severity: slaResults[slaName].status
        }, slaResults[slaName].status);
      }
    }

    return slaResults;
  }

  /**
   * Get SLA metric value from report
   */
  getSLAMetricValue(slaName, report) {
    switch (slaName) {
      case 'pipeline_execution_time':
        return report.summary.averageExecutionTime || 0;
      case 'error_rate':
        return report.metrics.error_rate_percent?.current || 0;
      case 'data_freshness':
        return (report.metrics.data_freshness_seconds?.current || 0) * 1000; // Convert to ms
      case 'system_availability':
        return report.systemHealth.summary.healthySources / report.systemHealth.summary.totalSources * 100;
      default:
        return 0;
    }
  }

  /**
   * Get SLA status based on thresholds
   */
  getSLAStatus(value, thresholds) {
    if (value <= thresholds.target) return 'COMPLIANT';
    if (value <= thresholds.warning) return 'WARNING';
    if (value <= thresholds.critical) return 'CRITICAL';
    return 'EMERGENCY';
  }

  /**
   * Save performance report
   */
  async savePerformanceReport(report) {
    try {
      await fs.ensureDir(this.config.metricsStoragePath);
      
      const fileName = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
      const filePath = path.join(this.config.metricsStoragePath, fileName);
      
      await fs.writeJSON(filePath, report, { spaces: 2 });
      
      // Also save latest report
      const latestPath = path.join(this.config.metricsStoragePath, 'latest-performance-report.json');
      await fs.writeJSON(latestPath, report, { spaces: 2 });
      
    } catch (error) {
      await this.errorHandler.handleError(error, {
        operation: 'save_performance_report',
        affectsMonitoring: true
      });
    }
  }

  /**
   * Send critical alert
   */
  async sendCriticalAlert(alert) {
    // Implementation would integrate with alerting systems
    console.log(`🚨 CRITICAL ALERT: ${alert.message}`);
    console.log(`Metric: ${alert.metric}, Value: ${alert.triggerValue}, Threshold: ${alert.threshold}`);
  }

  // Utility methods
  getMetricValue(metricName) {
    const metric = this.metrics.get(metricName);
    return metric ? metric.currentValue : 0;
  }

  getLastDataUpdateTime() {
    // Implementation would track last successful data update
    return Date.now() - 60000; // Mock: 1 minute ago
  }

  sanitizeConfig() {
    return {
      metricsCollectionInterval: this.config.metricsCollectionInterval,
      performanceReportInterval: this.config.performanceReportInterval,
      enableSLAMonitoring: this.config.enableSLAMonitoring,
      enableRealTimeMonitoring: this.config.enableRealTimeMonitoring
    };
  }

  getSystemInfo() {
    return {
      ...this.systemMetrics,
      hostname: os.hostname(),
      architecture: os.arch(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpuCount: os.cpus().length,
      uptime: os.uptime()
    };
  }

  /**
   * Get current metrics dashboard data
   */
  getDashboardData() {
    const systemHealth = this.healthMonitor.getSystemHealth();
    
    return {
      timestamp: new Date().toISOString(),
      systemStatus: systemHealth.overallStatus,
      metrics: {
        pipelineExecutions: this.getMetricValue('pipeline_executions_total'),
        errorRate: this.getMetricValue('error_rate_percent'),
        averageResponseTime: this.metrics.get('api_request_duration')?.statistics.avg || 0,
        memoryUsage: this.getMetricValue('memory_usage_bytes'),
        dataFreshness: this.getMetricValue('data_freshness_seconds'),
        throughput: this.getMetricValue('throughput_rpm')
      },
      healthSummary: systemHealth.summary,
      activeAlerts: this.alertHistory.filter(a => 
        Date.now() - new Date(a.timestamp).getTime() < 300000 // Last 5 minutes
      ).length,
      recentExecutions: this.pipelineExecutions.slice(-10)
    };
  }

  /**
   * Get detailed metric history
   */
  getMetricHistory(metricName, timeRange = 3600000) { // Default 1 hour
    const metric = this.metrics.get(metricName);
    if (!metric) return [];

    const cutoff = Date.now() - timeRange;
    return metric.values.filter(v => v.timestamp > cutoff);
  }

  /**
   * Get alert history
   */
  getAlertHistory(timeRange = 86400000) { // Default 24 hours
    const cutoff = Date.now() - timeRange;
    return this.alertHistory.filter(a => 
      new Date(a.timestamp).getTime() > cutoff
    );
  }
}

// Export singleton instance
let pipelineMonitor = null;

export function getPipelineMonitor(config = {}) {
  if (!pipelineMonitor) {
    pipelineMonitor = new PipelineMonitor(config);
  }
  return pipelineMonitor;
}

export { 
  METRIC_TYPES, 
  METRIC_CATEGORIES, 
  ALERT_SEVERITY, 
  SLA_PERFORMANCE_THRESHOLDS 
};

export default PipelineMonitor;