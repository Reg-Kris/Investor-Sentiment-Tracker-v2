#!/usr/bin/env node

/**
 * Enterprise Audit Logging System
 * Provides comprehensive audit trails for financial data processing
 * Compliant with financial regulations and data governance requirements
 */

import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Audit log levels following financial industry standards
const AUDIT_LEVELS = {
  TRACE: 'TRACE',
  DEBUG: 'DEBUG', 
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
  COMPLIANCE: 'COMPLIANCE' // Special level for regulatory compliance events
};

// Audit event categories for financial data processing
const AUDIT_CATEGORIES = {
  DATA_INGESTION: 'DATA_INGESTION',
  DATA_TRANSFORMATION: 'DATA_TRANSFORMATION', 
  DATA_VALIDATION: 'DATA_VALIDATION',
  DATA_ACCESS: 'DATA_ACCESS',
  SYSTEM_EVENT: 'SYSTEM_EVENT',
  SECURITY_EVENT: 'SECURITY_EVENT',
  COMPLIANCE_EVENT: 'COMPLIANCE_EVENT',
  PERFORMANCE_EVENT: 'PERFORMANCE_EVENT',
  ERROR_EVENT: 'ERROR_EVENT'
};

// Data sensitivity classifications
const DATA_CLASSIFICATIONS = {
  PUBLIC: 'PUBLIC',
  INTERNAL: 'INTERNAL',
  CONFIDENTIAL: 'CONFIDENTIAL',
  RESTRICTED: 'RESTRICTED'
};

export class AuditLogger {
  constructor(config = {}) {
    this.config = {
      logDirectory: config.logDirectory || path.resolve(__dirname, '../logs/audit'),
      maxFileSize: config.maxFileSize || 100 * 1024 * 1024, // 100MB
      maxFiles: config.maxFiles || 30, // 30 days of logs
      enableEncryption: config.enableEncryption || false,
      encryptionKey: config.encryptionKey || null,
      enableIntegrityCheck: config.enableIntegrityCheck || true,
      bufferSize: config.bufferSize || 1000, // Buffer 1000 entries before flush
      flushInterval: config.flushInterval || 60000, // Flush every minute
      enableConsoleOutput: config.enableConsoleOutput || true,
      complianceMode: config.complianceMode || true,
      ...config
    };

    this.buffer = [];
    this.sessionId = this.generateSessionId();
    this.sequenceNumber = 0;
    this.currentLogFile = null;
    this.checksumHistory = new Map();
    
    // Initialize log directory
    this.initializeLogDirectory();
    
    // Set up periodic flush
    if (this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flushBuffer();
      }, this.config.flushInterval);
    }

    // Graceful shutdown handling
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
    process.on('exit', () => this.shutdown());
  }

  /**
   * Initialize audit log directory structure
   */
  async initializeLogDirectory() {
    try {
      await fs.ensureDir(this.config.logDirectory);
      await fs.ensureDir(path.join(this.config.logDirectory, 'archives'));
      await fs.ensureDir(path.join(this.config.logDirectory, 'checksums'));
      
      // Create audit log index file
      const indexFile = path.join(this.config.logDirectory, 'audit-index.jsonl');
      if (!await fs.pathExists(indexFile)) {
        await fs.writeFile(indexFile, '');
      }

      this.logSystemEvent('AUDIT_SYSTEM_INITIALIZED', {
        sessionId: this.sessionId,
        config: this.sanitizeConfig()
      });
    } catch (error) {
      console.error('Failed to initialize audit log directory:', error);
      throw error;
    }
  }

  /**
   * Generate unique session ID for this audit session
   */
  generateSessionId() {
    return `audit-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate unique audit ID for each entry
   */
  generateAuditId() {
    this.sequenceNumber++;
    return `${this.sessionId}-${String(this.sequenceNumber).padStart(8, '0')}`;
  }

  /**
   * Generate data hash for integrity checking
   */
  generateDataHash(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  /**
   * Core audit logging method
   */
  async audit(level, category, event, details = {}, metadata = {}) {
    const auditEntry = {
      auditId: this.generateAuditId(),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      level,
      category,
      event,
      details: this.sanitizeDetails(details),
      metadata: {
        processId: process.pid,
        hostname: require('os').hostname(),
        userId: process.env.USER || 'system',
        nodeVersion: process.version,
        platform: process.platform,
        ...metadata
      },
      dataClassification: this.classifyData(details),
      checksumData: null
    };

    // Add integrity check if enabled
    if (this.config.enableIntegrityCheck) {
      auditEntry.checksumData = this.generateDataHash(auditEntry);
    }

    // Add to buffer
    this.buffer.push(auditEntry);

    // Console output if enabled
    if (this.config.enableConsoleOutput) {
      this.outputToConsole(auditEntry);
    }

    // Auto-flush if buffer is full
    if (this.buffer.length >= this.config.bufferSize) {
      await this.flushBuffer();
    }

    return auditEntry.auditId;
  }

  /**
   * Log data ingestion events
   */
  async logDataIngestion(source, operation, data, result = null, error = null) {
    const details = {
      source,
      operation,
      dataSize: typeof data === 'object' ? JSON.stringify(data).length : String(data).length,
      recordCount: Array.isArray(data) ? data.length : 1,
      success: error === null,
      error: error ? {
        message: error.message,
        code: error.code,
        stack: error.stack
      } : null,
      result: result ? {
        recordsProcessed: result.recordsProcessed || 0,
        recordsRejected: result.recordsRejected || 0,
        processingTime: result.processingTime || 0
      } : null
    };

    const level = error ? AUDIT_LEVELS.ERROR : AUDIT_LEVELS.INFO;
    return this.audit(level, AUDIT_CATEGORIES.DATA_INGESTION, 'DATA_RECEIVED', details);
  }

  /**
   * Log data transformation events
   */
  async logDataTransformation(operation, inputData, outputData, transformation = {}) {
    const details = {
      operation,
      inputSize: JSON.stringify(inputData).length,
      outputSize: JSON.stringify(outputData).length,
      inputHash: this.generateDataHash(inputData),
      outputHash: this.generateDataHash(outputData),
      transformation: {
        rules: transformation.rules || [],
        fieldsModified: transformation.fieldsModified || [],
        validationResults: transformation.validationResults || {}
      },
      dataDiff: this.calculateDataDiff(inputData, outputData)
    };

    return this.audit(AUDIT_LEVELS.INFO, AUDIT_CATEGORIES.DATA_TRANSFORMATION, 'DATA_TRANSFORMED', details);
  }

  /**
   * Log data validation events
   */
  async logDataValidation(source, validationResults, data = null) {
    const details = {
      source,
      isValid: validationResults.isValid,
      validationTime: validationResults.validationTime || 0,
      errorCount: validationResults.errors ? validationResults.errors.length : 0,
      errors: validationResults.errors || [],
      businessRuleViolations: validationResults.businessRuleViolations || [],
      isCompliant: validationResults.isCompliant,
      schemaType: validationResults.schemaType,
      dataSize: data ? JSON.stringify(data).length : 0
    };

    const level = validationResults.isValid ? AUDIT_LEVELS.INFO : AUDIT_LEVELS.WARN;
    return this.audit(level, AUDIT_CATEGORIES.DATA_VALIDATION, 'DATA_VALIDATED', details);
  }

  /**
   * Log data access events
   */
  async logDataAccess(resource, operation, user = 'system', result = 'SUCCESS') {
    const details = {
      resource,
      operation,
      user,
      result,
      accessTime: new Date().toISOString(),
      sourceIP: process.env.CLIENT_IP || 'localhost',
      userAgent: process.env.USER_AGENT || 'node-script'
    };

    const level = result === 'SUCCESS' ? AUDIT_LEVELS.INFO : AUDIT_LEVELS.WARN;
    return this.audit(level, AUDIT_CATEGORIES.DATA_ACCESS, 'DATA_ACCESSED', details);
  }

  /**
   * Log system events
   */
  async logSystemEvent(event, details = {}) {
    return this.audit(AUDIT_LEVELS.INFO, AUDIT_CATEGORIES.SYSTEM_EVENT, event, details);
  }

  /**
   * Log compliance events
   */
  async logComplianceEvent(event, details = {}, severity = 'INFO') {
    const level = severity === 'CRITICAL' ? AUDIT_LEVELS.CRITICAL : 
                  severity === 'ERROR' ? AUDIT_LEVELS.ERROR :
                  severity === 'WARN' ? AUDIT_LEVELS.WARN : AUDIT_LEVELS.COMPLIANCE;
    
    return this.audit(level, AUDIT_CATEGORIES.COMPLIANCE_EVENT, event, {
      complianceFramework: 'FINANCIAL_DATA_GOVERNANCE',
      regulatoryRequirement: details.regulatoryRequirement || 'GENERAL',
      ...details
    });
  }

  /**
   * Log performance events
   */
  async logPerformanceEvent(operation, metrics) {
    const details = {
      operation,
      startTime: metrics.startTime,
      endTime: metrics.endTime,
      duration: metrics.duration,
      throughput: metrics.throughput || 0,
      errorRate: metrics.errorRate || 0,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };

    return this.audit(AUDIT_LEVELS.INFO, AUDIT_CATEGORIES.PERFORMANCE_EVENT, 'PERFORMANCE_MEASURED', details);
  }

  /**
   * Log error events
   */
  async logError(error, context = {}) {
    const details = {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      context,
      severity: this.classifyErrorSeverity(error),
      impact: this.assessErrorImpact(error, context)
    };

    return this.audit(AUDIT_LEVELS.ERROR, AUDIT_CATEGORIES.ERROR_EVENT, 'ERROR_OCCURRED', details);
  }

  /**
   * Flush buffer to persistent storage
   */
  async flushBuffer() {
    if (this.buffer.length === 0) return;

    try {
      const logFile = await this.getCurrentLogFile();
      const logEntries = this.buffer.splice(0); // Clear buffer and get entries
      
      // Encrypt entries if encryption is enabled
      const processedEntries = this.config.enableEncryption ? 
        logEntries.map(entry => this.encryptEntry(entry)) : logEntries;

      // Write to log file
      const logData = processedEntries.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      await fs.appendFile(logFile, logData);

      // Update checksums
      if (this.config.enableIntegrityCheck) {
        await this.updateChecksums(logEntries);
      }

      // Update audit index
      await this.updateAuditIndex(logEntries);

      // Check for log rotation
      await this.checkLogRotation();

    } catch (error) {
      console.error('Failed to flush audit buffer:', error);
      // Put entries back in buffer if flush failed
      this.buffer.unshift(...logEntries);
    }
  }

  /**
   * Get current log file path
   */
  async getCurrentLogFile() {
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.config.logDirectory, `audit-${today}.jsonl`);
    
    if (this.currentLogFile !== logFile) {
      this.currentLogFile = logFile;
      await fs.ensureFile(logFile);
    }
    
    return logFile;
  }

  /**
   * Update audit index for fast searching
   */
  async updateAuditIndex(entries) {
    const indexFile = path.join(this.config.logDirectory, 'audit-index.jsonl');
    
    const indexEntries = entries.map(entry => ({
      auditId: entry.auditId,
      timestamp: entry.timestamp,
      level: entry.level,
      category: entry.category,
      event: entry.event,
      sessionId: entry.sessionId,
      file: path.basename(this.currentLogFile),
      checksum: entry.checksumData
    }));

    const indexData = indexEntries.map(entry => JSON.stringify(entry)).join('\n') + '\n';
    await fs.appendFile(indexFile, indexData);
  }

  /**
   * Update integrity checksums
   */
  async updateChecksums(entries) {
    const checksumFile = path.join(this.config.logDirectory, 'checksums', 
      `checksums-${new Date().toISOString().split('T')[0]}.json`);
    
    const checksums = entries.map(entry => ({
      auditId: entry.auditId,
      checksum: entry.checksumData,
      timestamp: entry.timestamp
    }));

    let existingChecksums = [];
    if (await fs.pathExists(checksumFile)) {
      existingChecksums = await fs.readJSON(checksumFile);
    }

    const updatedChecksums = [...existingChecksums, ...checksums];
    await fs.writeJSON(checksumFile, updatedChecksums, { spaces: 2 });
  }

  /**
   * Check if log rotation is needed
   */
  async checkLogRotation() {
    if (!this.currentLogFile) return;

    const stats = await fs.stat(this.currentLogFile);
    if (stats.size > this.config.maxFileSize) {
      await this.rotateLog();
    }
  }

  /**
   * Rotate log files
   */
  async rotateLog() {
    if (!this.currentLogFile) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveDir = path.join(this.config.logDirectory, 'archives');
    const archiveFile = path.join(archiveDir, `${path.basename(this.currentLogFile, '.jsonl')}-${timestamp}.jsonl`);

    await fs.move(this.currentLogFile, archiveFile);
    
    // Compress archived file if possible
    if (this.config.enableCompression) {
      await this.compressFile(archiveFile);
    }

    // Clean up old archives
    await this.cleanupOldArchives();

    this.logSystemEvent('LOG_ROTATED', {
      oldFile: this.currentLogFile,
      archiveFile: archiveFile,
      fileSize: (await fs.stat(archiveFile)).size
    });
  }

  /**
   * Clean up old archive files
   */
  async cleanupOldArchives() {
    const archiveDir = path.join(this.config.logDirectory, 'archives');
    const files = await fs.readdir(archiveDir);
    
    const archiveFiles = files
      .filter(file => file.startsWith('audit-') && file.endsWith('.jsonl'))
      .map(file => ({
        name: file,
        path: path.join(archiveDir, file),
        stat: fs.statSync(path.join(archiveDir, file))
      }))
      .sort((a, b) => b.stat.mtime - a.stat.mtime);

    if (archiveFiles.length > this.config.maxFiles) {
      const filesToDelete = archiveFiles.slice(this.config.maxFiles);
      
      for (const file of filesToDelete) {
        await fs.remove(file.path);
        console.log(`Deleted old audit log: ${file.name}`);
      }
    }
  }

  /**
   * Sanitize configuration for logging (remove sensitive data)
   */
  sanitizeConfig() {
    const { encryptionKey, ...safeConfig } = this.config;
    return {
      ...safeConfig,
      encryptionKey: encryptionKey ? '[REDACTED]' : null
    };
  }

  /**
   * Sanitize details to remove sensitive information
   */
  sanitizeDetails(details) {
    const sensitive = ['password', 'token', 'key', 'secret', 'apikey', 'api_key'];
    const sanitized = { ...details };

    const sanitizeObject = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        if (sensitive.some(s => key.toLowerCase().includes(s))) {
          obj[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          sanitizeObject(value);
        }
      }
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * Classify data sensitivity
   */
  classifyData(data) {
    // Simple classification logic - can be enhanced based on business rules
    const dataStr = JSON.stringify(data).toLowerCase();
    
    if (dataStr.includes('ssn') || dataStr.includes('credit') || dataStr.includes('account')) {
      return DATA_CLASSIFICATIONS.RESTRICTED;
    } else if (dataStr.includes('price') || dataStr.includes('volume') || dataStr.includes('financial')) {
      return DATA_CLASSIFICATIONS.CONFIDENTIAL;
    } else if (dataStr.includes('internal') || dataStr.includes('private')) {
      return DATA_CLASSIFICATIONS.INTERNAL;
    } else {
      return DATA_CLASSIFICATIONS.PUBLIC;
    }
  }

  /**
   * Calculate data differences for transformation tracking
   */
  calculateDataDiff(before, after) {
    const diff = {
      fieldsAdded: [],
      fieldsRemoved: [],
      fieldsModified: []
    };

    try {
      const beforeKeys = Object.keys(before || {});
      const afterKeys = Object.keys(after || {});

      diff.fieldsAdded = afterKeys.filter(key => !beforeKeys.includes(key));
      diff.fieldsRemoved = beforeKeys.filter(key => !afterKeys.includes(key));
      
      const commonKeys = beforeKeys.filter(key => afterKeys.includes(key));
      diff.fieldsModified = commonKeys.filter(key => 
        JSON.stringify(before[key]) !== JSON.stringify(after[key])
      );
    } catch (error) {
      diff.error = error.message;
    }

    return diff;
  }

  /**
   * Classify error severity
   */
  classifyErrorSeverity(error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return 'HIGH';
    } else if (error.message.includes('validation') || error.message.includes('schema')) {
      return 'MEDIUM';
    } else if (error.message.includes('rate limit') || error.message.includes('timeout')) {
      return 'LOW';
    } else {
      return 'MEDIUM';
    }
  }

  /**
   * Assess error impact
   */
  assessErrorImpact(error, context) {
    return {
      dataIntegrity: context.affectsDataIntegrity || false,
      businessOperations: context.affectsBusinessOperations || false,
      compliance: context.affectsCompliance || false,
      userExperience: context.affectsUserExperience || false
    };
  }

  /**
   * Encrypt audit entry if encryption is enabled
   */
  encryptEntry(entry) {
    if (!this.config.enableEncryption || !this.config.encryptionKey) {
      return entry;
    }

    // Simple encryption implementation - use stronger encryption in production
    const cipher = crypto.createCipher('aes256', this.config.encryptionKey);
    const encrypted = cipher.update(JSON.stringify(entry), 'utf8', 'hex') + cipher.final('hex');
    
    return {
      auditId: entry.auditId,
      timestamp: entry.timestamp,
      encrypted: true,
      data: encrypted
    };
  }

  /**
   * Output to console
   */
  outputToConsole(entry) {
    const levelColors = {
      [AUDIT_LEVELS.TRACE]: '\x1b[90m', // gray
      [AUDIT_LEVELS.DEBUG]: '\x1b[36m', // cyan
      [AUDIT_LEVELS.INFO]: '\x1b[32m',  // green
      [AUDIT_LEVELS.WARN]: '\x1b[33m',  // yellow
      [AUDIT_LEVELS.ERROR]: '\x1b[31m', // red
      [AUDIT_LEVELS.CRITICAL]: '\x1b[41m', // red background
      [AUDIT_LEVELS.COMPLIANCE]: '\x1b[35m' // magenta
    };

    const color = levelColors[entry.level] || '\x1b[0m';
    const reset = '\x1b[0m';
    
    console.log(`${color}[AUDIT] [${entry.level}] [${entry.category}] ${entry.event}${reset}`, {
      auditId: entry.auditId,
      timestamp: entry.timestamp,
      details: entry.details
    });
  }

  /**
   * Search audit logs
   */
  async searchLogs(criteria = {}) {
    const indexFile = path.join(this.config.logDirectory, 'audit-index.jsonl');
    
    if (!await fs.pathExists(indexFile)) {
      return [];
    }

    const indexContent = await fs.readFile(indexFile, 'utf8');
    const indexEntries = indexContent.split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));

    let results = indexEntries;

    // Apply filters
    if (criteria.level) {
      results = results.filter(entry => entry.level === criteria.level);
    }
    if (criteria.category) {
      results = results.filter(entry => entry.category === criteria.category);
    }
    if (criteria.event) {
      results = results.filter(entry => entry.event === criteria.event);
    }
    if (criteria.startTime) {
      results = results.filter(entry => entry.timestamp >= criteria.startTime);
    }
    if (criteria.endTime) {
      results = results.filter(entry => entry.timestamp <= criteria.endTime);
    }

    return results.slice(0, criteria.limit || 100);
  }

  /**
   * Get audit statistics
   */
  getAuditStats() {
    return {
      sessionId: this.sessionId,
      sequenceNumber: this.sequenceNumber,
      bufferSize: this.buffer.length,
      checksumHistorySize: this.checksumHistory.size,
      uptime: Date.now() - parseInt(this.sessionId.split('-')[1]),
      config: this.sanitizeConfig()
    };
  }

  /**
   * Shutdown audit logger gracefully
   */
  async shutdown() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    await this.flushBuffer();
    
    this.logSystemEvent('AUDIT_SYSTEM_SHUTDOWN', {
      sessionId: this.sessionId,
      totalAuditEntries: this.sequenceNumber,
      shutdownTime: new Date().toISOString()
    });

    await this.flushBuffer(); // Final flush
  }
}

// Export singleton instance
let auditLogger = null;

export function getAuditLogger(config = {}) {
  if (!auditLogger) {
    auditLogger = new AuditLogger(config);
  }
  return auditLogger;
}

export { AUDIT_LEVELS, AUDIT_CATEGORIES, DATA_CLASSIFICATIONS };
export default AuditLogger;