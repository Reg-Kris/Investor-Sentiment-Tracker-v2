/**
 * Security utilities for financial data handling and compliance
 * Implements OWASP security guidelines and SOX compliance requirements
 */

import crypto from 'crypto';

// Security configuration constants
export const SECURITY_CONFIG = {
  API_RATE_LIMIT: {
    WINDOW_MS: 60000, // 1 minute
    MAX_REQUESTS: 60, // 60 requests per minute
    BURST_LIMIT: 10, // Allow short bursts
  },
  ENCRYPTION: {
    ALGORITHM: 'aes-256-gcm',
    KEY_LENGTH: 32,
    IV_LENGTH: 16,
    TAG_LENGTH: 16,
  },
  AUDIT: {
    LOG_RETENTION_DAYS: 2555, // 7 years for SOX compliance
    SENSITIVE_FIELDS: ['api_key', 'token', 'password', 'secret'],
  },
  INPUT_VALIDATION: {
    MAX_STRING_LENGTH: 1000,
    MAX_NUMBER_VALUE: Number.MAX_SAFE_INTEGER,
    MIN_NUMBER_VALUE: Number.MIN_SAFE_INTEGER,
  },
} as const;

/**
 * Input validation and sanitization for financial data
 */
export class InputValidator {
  /**
   * Validates and sanitizes string input
   */
  static sanitizeString(input: unknown): string {
    if (typeof input !== 'string') {
      throw new SecurityError('Invalid input type: expected string');
    }

    // Remove potentially dangerous characters
    const sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/[<>'"&]/g, (match) => {
        // HTML encode dangerous characters
        const entityMap: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;',
        };
        return entityMap[match] || match;
      })
      .trim();

    if (sanitized.length > SECURITY_CONFIG.INPUT_VALIDATION.MAX_STRING_LENGTH) {
      throw new SecurityError(`Input exceeds maximum length of ${SECURITY_CONFIG.INPUT_VALIDATION.MAX_STRING_LENGTH}`);
    }

    return sanitized;
  }

  /**
   * Validates numerical input for financial data
   */
  static validateNumber(input: unknown, fieldName = 'number'): number {
    let num: number;

    if (typeof input === 'string') {
      num = parseFloat(input);
    } else if (typeof input === 'number') {
      num = input;
    } else {
      throw new SecurityError(`Invalid ${fieldName}: must be a number`);
    }

    if (!Number.isFinite(num)) {
      throw new SecurityError(`Invalid ${fieldName}: must be a finite number`);
    }

    if (num > SECURITY_CONFIG.INPUT_VALIDATION.MAX_NUMBER_VALUE || 
        num < SECURITY_CONFIG.INPUT_VALIDATION.MIN_NUMBER_VALUE) {
      throw new SecurityError(`${fieldName} value out of safe range`);
    }

    return num;
  }

  /**
   * Validates financial percentage values
   */
  static validatePercentage(input: unknown, fieldName = 'percentage'): number {
    const num = this.validateNumber(input, fieldName);
    
    // Allow reasonable percentage ranges for financial data
    if (num < -100 || num > 1000) {
      throw new SecurityError(`${fieldName} percentage out of reasonable range (-100% to 1000%)`);
    }

    return num;
  }

  /**
   * Validates stock symbol format
   */
  static validateStockSymbol(input: unknown): string {
    const symbol = this.sanitizeString(input);
    
    // Stock symbols should be alphanumeric, 1-5 characters, possibly with dots/hyphens
    if (!/^[A-Z0-9.-]{1,5}$/i.test(symbol)) {
      throw new SecurityError('Invalid stock symbol format');
    }

    return symbol.toUpperCase();
  }

  /**
   * Validates timestamp/date input
   */
  static validateTimestamp(input: unknown): Date {
    let date: Date;

    if (input instanceof Date) {
      date = input;
    } else if (typeof input === 'string' || typeof input === 'number') {
      date = new Date(input);
    } else {
      throw new SecurityError('Invalid timestamp format');
    }

    if (isNaN(date.getTime())) {
      throw new SecurityError('Invalid date/timestamp');
    }

    // Ensure timestamp is within reasonable range (not in far future/past)
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    if (date < oneYearAgo || date > oneYearFromNow) {
      throw new SecurityError('Timestamp out of reasonable range');
    }

    return date;
  }
}

/**
 * Rate limiting implementation for API security
 */
export class RateLimiter {
  private static requests: Map<string, { count: number; resetTime: number; lastRequest: number }> = new Map();

  /**
   * Check if request is within rate limits
   */
  static checkRateLimit(identifier: string, endpoint = 'default'): boolean {
    const key = `${identifier}:${endpoint}`;
    const now = Date.now();
    const windowMs = SECURITY_CONFIG.API_RATE_LIMIT.WINDOW_MS;
    const maxRequests = SECURITY_CONFIG.API_RATE_LIMIT.MAX_REQUESTS;

    let requestData = this.requests.get(key);

    if (!requestData || now > requestData.resetTime) {
      // Reset window
      requestData = {
        count: 1,
        resetTime: now + windowMs,
        lastRequest: now,
      };
      this.requests.set(key, requestData);
      return true;
    }

    // Check for burst protection
    const timeSinceLastRequest = now - requestData.lastRequest;
    if (timeSinceLastRequest < 100 && requestData.count >= SECURITY_CONFIG.API_RATE_LIMIT.BURST_LIMIT) {
      SecurityAuditor.logSecurityEvent('RATE_LIMIT_BURST_DETECTED', {
        identifier,
        endpoint,
        requestCount: requestData.count,
        timeSinceLastRequest,
      });
      return false; // Burst detected
    }

    if (requestData.count >= maxRequests) {
      SecurityAuditor.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        identifier,
        endpoint,
        requestCount: requestData.count,
        resetTime: new Date(requestData.resetTime).toISOString(),
      });
      return false; // Rate limit exceeded
    }

    requestData.count++;
    requestData.lastRequest = now;
    return true;
  }

  /**
   * Get rate limit status for monitoring
   */
  static getRateLimitStatus(identifier: string, endpoint = 'default'): {
    remaining: number;
    resetTime: number;
    isLimited: boolean;
  } {
    const key = `${identifier}:${endpoint}`;
    const requestData = this.requests.get(key);
    const maxRequests = SECURITY_CONFIG.API_RATE_LIMIT.MAX_REQUESTS;

    if (!requestData) {
      return {
        remaining: maxRequests,
        resetTime: Date.now() + SECURITY_CONFIG.API_RATE_LIMIT.WINDOW_MS,
        isLimited: false,
      };
    }

    return {
      remaining: Math.max(0, maxRequests - requestData.count),
      resetTime: requestData.resetTime,
      isLimited: requestData.count >= maxRequests,
    };
  }
}

/**
 * Data encryption for sensitive financial information
 */
export class DataEncryption {
  private static getEncryptionKey(): Buffer {
    // In production, this should come from a secure key management system
    const keyString = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32';
    return crypto.scryptSync(keyString, 'salt', SECURITY_CONFIG.ENCRYPTION.KEY_LENGTH);
  }

  /**
   * Encrypt sensitive data
   */
  static encrypt(data: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(SECURITY_CONFIG.ENCRYPTION.IV_LENGTH);
      const cipher = crypto.createCipher(SECURITY_CONFIG.ENCRYPTION.ALGORITHM, key);
      
      cipher.setAAD(Buffer.from('financial-data', 'utf8'));
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Combine IV, tag, and encrypted data
      return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    } catch (error) {
      SecurityAuditor.logSecurityEvent('ENCRYPTION_FAILED', { error: String(error) });
      throw new SecurityError('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: string): string {
    try {
      const [ivHex, tagHex, encrypted] = encryptedData.split(':');
      
      if (!ivHex || !tagHex || !encrypted) {
        throw new SecurityError('Invalid encrypted data format');
      }

      const key = this.getEncryptionKey();
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      
      const decipher = crypto.createDecipher(SECURITY_CONFIG.ENCRYPTION.ALGORITHM, key);
      decipher.setAuthTag(tag);
      decipher.setAAD(Buffer.from('financial-data', 'utf8'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      SecurityAuditor.logSecurityEvent('DECRYPTION_FAILED', { error: String(error) });
      throw new SecurityError('Failed to decrypt data');
    }
  }

  /**
   * Create hash for data integrity validation
   */
  static createHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify data integrity
   */
  static verifyHash(data: string, expectedHash: string): boolean {
    const actualHash = this.createHash(data);
    return crypto.timingSafeEqual(Buffer.from(actualHash), Buffer.from(expectedHash));
  }
}

/**
 * Security auditing and logging for SOX compliance
 */
export class SecurityAuditor {
  private static auditLog: AuditEntry[] = [];

  /**
   * Log security events for audit trail
   */
  static logSecurityEvent(eventType: SecurityEventType, data: Record<string, unknown>): void {
    const auditEntry: AuditEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      eventType,
      data: this.sanitizeAuditData(data),
      integrity: '', // Will be set below
    };

    // Create integrity hash
    const entryString = JSON.stringify({ ...auditEntry, integrity: undefined });
    auditEntry.integrity = DataEncryption.createHash(entryString);

    this.auditLog.push(auditEntry);

    // In production, this should write to a secure, immutable log store
    console.log('SECURITY_AUDIT:', JSON.stringify(auditEntry));

    // Cleanup old entries (keep within retention period)
    this.cleanupOldEntries();
  }

  /**
   * Sanitize audit data to remove sensitive information
   */
  private static sanitizeAuditData(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...data };

    for (const field of SECURITY_CONFIG.AUDIT.SENSITIVE_FIELDS) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Cleanup old audit entries per retention policy
   */
  private static cleanupOldEntries(): void {
    const retentionMs = SECURITY_CONFIG.AUDIT.LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const cutoffTime = new Date(Date.now() - retentionMs).toISOString();

    this.auditLog = this.auditLog.filter(entry => entry.timestamp > cutoffTime);
  }

  /**
   * Get audit trail for compliance reporting
   */
  static getAuditTrail(startDate?: Date, endDate?: Date): AuditEntry[] {
    let filtered = [...this.auditLog];

    if (startDate) {
      filtered = filtered.filter(entry => entry.timestamp >= startDate.toISOString());
    }

    if (endDate) {
      filtered = filtered.filter(entry => entry.timestamp <= endDate.toISOString());
    }

    return filtered.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  /**
   * Verify audit trail integrity
   */
  static verifyAuditIntegrity(): { valid: boolean; corruptedEntries: string[] } {
    const corruptedEntries: string[] = [];

    for (const entry of this.auditLog) {
      const entryString = JSON.stringify({ ...entry, integrity: undefined });
      const expectedHash = DataEncryption.createHash(entryString);

      if (!DataEncryption.verifyHash(entryString, entry.integrity)) {
        corruptedEntries.push(entry.id);
      }
    }

    return {
      valid: corruptedEntries.length === 0,
      corruptedEntries,
    };
  }
}

/**
 * API security wrapper for secure external API calls
 */
export class SecureAPIClient {
  private static instance: SecureAPIClient;
  private requestTracker: Map<string, number> = new Map();

  static getInstance(): SecureAPIClient {
    if (!SecureAPIClient.instance) {
      SecureAPIClient.instance = new SecureAPIClient();
    }
    return SecureAPIClient.instance;
  }

  /**
   * Make secure API request with comprehensive security measures
   */
  async secureRequest<T>(
    url: string,
    options: SecureRequestOptions = {}
  ): Promise<T> {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      // Validate URL
      this.validateURL(url);

      // Check rate limits
      const endpoint = new URL(url).hostname;
      if (!RateLimiter.checkRateLimit('api-client', endpoint)) {
        throw new SecurityError(`Rate limit exceeded for ${endpoint}`);
      }

      // Log security event
      SecurityAuditor.logSecurityEvent('API_REQUEST_INITIATED', {
        requestId,
        url: this.sanitizeURL(url),
        method: options.method || 'GET',
        headers: this.sanitizeHeaders(options.headers),
      });

      // Make request with security headers
      const secureOptions: RequestInit = {
        ...options,
        headers: {
          'User-Agent': 'FinancialApp-SecureClient/1.0',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          ...options.headers,
        },
        // Ensure HTTPS only
        redirect: 'error', // Don't follow redirects for security
      };

      const response = await fetch(url, secureOptions);
      const responseTime = Date.now() - startTime;

      // Validate response
      this.validateResponse(response, url);

      const data = await response.json();

      // Log successful request
      SecurityAuditor.logSecurityEvent('API_REQUEST_COMPLETED', {
        requestId,
        url: this.sanitizeURL(url),
        statusCode: response.status,
        responseTime,
        dataReceived: typeof data !== 'undefined',
      });

      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Log security incident
      SecurityAuditor.logSecurityEvent('API_REQUEST_FAILED', {
        requestId,
        url: this.sanitizeURL(url),
        error: String(error),
        responseTime,
      });

      throw error;
    }
  }

  /**
   * Validate URL for security
   */
  private validateURL(url: string): void {
    try {
      const urlObj = new URL(url);

      // Ensure HTTPS only
      if (urlObj.protocol !== 'https:') {
        throw new SecurityError('Only HTTPS URLs are allowed');
      }

      // Block private IP ranges and localhost
      const hostname = urlObj.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)
      ) {
        throw new SecurityError('Private IP addresses are not allowed');
      }

      // Validate domain format
      if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(hostname)) {
        throw new SecurityError('Invalid domain format');
      }
    } catch (error) {
      if (error instanceof SecurityError) {
        throw error;
      }
      throw new SecurityError('Invalid URL format');
    }
  }

  /**
   * Validate API response for security
   */
  private validateResponse(response: Response, url: string): void {
    if (!response.ok) {
      throw new APIError(
        `API request failed: ${response.status} ${response.statusText}`,
        response.status,
        url
      );
    }

    // Check response size to prevent memory attacks
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
      throw new SecurityError('Response size too large');
    }

    // Validate content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new SecurityError('Invalid response content type');
    }
  }

  /**
   * Sanitize URL for logging (remove query parameters)
   */
  private sanitizeURL(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
    } catch {
      return '[INVALID_URL]';
    }
  }

  /**
   * Sanitize headers for logging
   */
  private sanitizeHeaders(headers?: Record<string, string>): Record<string, string> {
    if (!headers) return {};

    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'x-api-key', 'cookie', 'x-auth-token'];

    for (const header of sensitiveHeaders) {
      if (header in sanitized) {
        sanitized[header] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}

// Type definitions
export type SecurityEventType =
  | 'API_REQUEST_INITIATED'
  | 'API_REQUEST_COMPLETED'
  | 'API_REQUEST_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'RATE_LIMIT_BURST_DETECTED'
  | 'ENCRYPTION_FAILED'
  | 'DECRYPTION_FAILED'
  | 'INPUT_VALIDATION_FAILED'
  | 'SECURITY_VIOLATION'
  | 'AUDIT_ACCESS'
  | 'DATA_ACCESS'
  | 'ANOMALY_DETECTED';

export interface AuditEntry {
  id: string;
  timestamp: string;
  eventType: SecurityEventType;
  data: Record<string, unknown>;
  integrity: string;
}

export interface SecureRequestOptions extends RequestInit {
  timeout?: number;
}

// Custom error classes
export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class APIError extends Error {
  constructor(message: string, public statusCode: number, public url: string) {
    super(message);
    this.name = 'APIError';
  }
}

// Export singleton instances
export const rateLimiter = RateLimiter;
export const inputValidator = InputValidator;
export const dataEncryption = DataEncryption;
export const securityAuditor = SecurityAuditor;
export const secureAPIClient = SecureAPIClient.getInstance();