# Monitoring & Alerting Documentation

## Overview

This document describes the comprehensive monitoring and alerting system implemented for the Investor Sentiment Tracker v2 application. The system provides real-time monitoring of application health, performance, API dependencies, and user experience.

## Architecture

### Monitoring Stack
- **GitHub Actions** - CI/CD monitoring and workflow notifications
- **Custom API Endpoints** - Health checks and metrics collection
- **Client-side Monitoring** - Performance and error tracking
- **Centralized Logging** - Error tracking and analysis
- **Rate Limit Monitoring** - API quota and usage tracking

### Alert Channels
- **GitHub Issues** - Automated issue creation for critical alerts
- **Console Logging** - Development and debugging information
- **Performance APIs** - Metrics collection and trend analysis

## Monitoring Components

### 1. Health Checks

#### Basic Health Check (`/api/health`)
- **Purpose**: Quick health status overview
- **Frequency**: On-demand and automated monitoring
- **Checks**:
  - Fear & Greed Index API availability
  - Yahoo Finance API availability
  - Data freshness validation
  - Service response times

**Response Codes**:
- `200` - Healthy or degraded but functional
- `503` - Unhealthy, critical failures detected

#### Detailed Health Check (`/api/health/detailed`)
- **Purpose**: Comprehensive system diagnostics
- **Frequency**: On-demand for troubleshooting
- **Additional Checks**:
  - Memory usage and performance
  - Cache hit rates and efficiency
  - Rate limit tracking
  - Detailed dependency analysis

### 2. Performance Monitoring

#### Client-side Performance (`PerformanceMonitor` component)
- **Metrics Collected**:
  - Page load times
  - Time to First Byte (TTFB)
  - Largest Contentful Paint (LCP)
  - First Input Delay (FID)
  - Cumulative Layout Shift (CLS)
  - Resource loading times

#### Performance API (`/api/performance`)
- **Storage**: In-memory (last 1000 entries)
- **Analytics**: Trend analysis and threshold monitoring
- **Alerts**: Automatic detection of performance degradation

### 3. Error Tracking

#### Logger System (`app/lib/logger.ts`)
- **Log Levels**: debug, info, warn, error, critical
- **Features**:
  - Session tracking
  - Context preservation
  - Automatic error aggregation
  - Remote log shipping

#### Error Boundary (`ErrorBoundary` component)
- **Functionality**:
  - React error catching
  - User-friendly error display
  - Automatic error reporting
  - Recovery mechanisms

### 4. API Monitoring

#### Rate Limit Tracking
- **Implementation**: Built into `APIService` class
- **Features**:
  - Per-endpoint rate limit tracking
  - Proactive warnings at 80% threshold
  - Automatic fallback to cached data
  - Error count tracking

#### Dependency Monitoring
- **External APIs**:
  - Fear & Greed Index API (`api.alternative.me`)
  - Yahoo Finance API (`query1.finance.yahoo.com`)
- **Metrics**:
  - Response times
  - Success rates
  - Error patterns
  - Availability status

## GitHub Actions Workflows

### 1. Deployment Workflow (`.github/workflows/deploy.yml`)
- **Triggers**: Push to main, PR creation
- **Monitoring**:
  - Test failures with automatic issue creation
  - Build failures with critical alerts
  - Deployment failures with detailed diagnostics
  - Post-deployment health checks

### 2. Continuous Monitoring (`.github/workflows/monitoring.yml`)
- **Schedule**: Every 15 minutes (market hours), hourly (off-hours)
- **Checks**:
  - Site availability and response times
  - API health and performance
  - Performance regression detection
  - Automatic issue resolution

### 3. Rate Limit Monitoring (`.github/workflows/rate-limit-monitoring.yml`)
- **Schedule**: Every 10 minutes (market hours), 30 minutes (off-hours)
- **Features**:
  - Proactive rate limit testing
  - Multi-endpoint monitoring
  - Threshold-based alerting
  - Trend analysis

## Alert Thresholds

### Health Check Alerts
- **Site Down**: HTTP status ≠ 200
- **Slow Response**: Response time > 5 seconds
- **API Failures**: Multiple endpoint failures

### Performance Alerts
- **Critical Load Time**: > 5 seconds
- **Poor TTFB**: > 1.5 seconds
- **Poor LCP**: > 4 seconds (poor threshold)
- **Poor FID**: > 300ms (poor threshold)
- **Poor CLS**: > 0.25 (poor threshold)
- **Large Page Size**: > 3MB

### Rate Limit Alerts
- **Warning**: 80% of rate limit reached
- **Critical**: 90% of rate limit reached
- **API Failures**: Success rate < 85%

### Error Thresholds
- **Error Rate**: > 10 errors per minute
- **Critical Errors**: ≥ 1 critical error
- **Consecutive Errors**: ≥ 5 consecutive errors

## Runbooks

### 1. Site Down Response

**Symptoms**: Health check returns 503, site inaccessible

**Immediate Actions**:
1. Check GitHub Pages status
2. Verify latest deployment succeeded
3. Check DNS resolution
4. Review recent commits for breaking changes

**Investigation Steps**:
```bash
# Check site status
curl -I https://[username].github.io/sentiment-tracker-v2

# Check health endpoint
curl https://[username].github.io/sentiment-tracker-v2/api/health

# Review GitHub Actions logs
gh run list --repo [username]/sentiment-tracker-v2
```

**Escalation**: If issue persists > 15 minutes during market hours

### 2. API Rate Limit Exceeded

**Symptoms**: Rate limit alerts, API 429 responses, stale data

**Immediate Actions**:
1. Review current API usage patterns
2. Check for runaway requests or loops
3. Implement temporary request throttling

**Investigation Steps**:
```bash
# Check API health
curl https://[username].github.io/sentiment-tracker-v2/api/health/detailed

# Review rate limit status
curl https://[username].github.io/sentiment-tracker-v2/api/metrics
```

**Mitigation**:
- Extend cache duration temporarily
- Reduce update frequency
- Implement circuit breaker pattern

### 3. Performance Degradation

**Symptoms**: Slow load times, poor Core Web Vitals, user complaints

**Immediate Actions**:
1. Check performance metrics endpoint
2. Review resource loading times
3. Analyze recent changes

**Investigation Steps**:
```bash
# Get performance data
curl "https://[username].github.io/sentiment-tracker-v2/api/performance?limit=50"

# Check for large resources
curl -I https://[username].github.io/sentiment-tracker-v2
```

**Optimization Actions**:
- Optimize images and assets
- Review JavaScript bundle sizes
- Check third-party dependencies
- Implement lazy loading

### 4. High Error Rate

**Symptoms**: Multiple error alerts, user-reported issues

**Immediate Actions**:
1. Check error logs for patterns
2. Identify affected components
3. Implement temporary fallbacks

**Investigation Steps**:
```bash
# Get recent error logs
curl "https://[username].github.io/sentiment-tracker-v2/api/logs?level=error&limit=20"

# Check critical errors
curl "https://[username].github.io/sentiment-tracker-v2/api/logs?level=critical"
```

**Resolution**:
- Fix identified bugs
- Deploy hotfix if critical
- Monitor error rates post-fix

## Monitoring Dashboard URLs

### Health & Status
- Basic Health: `/api/health`
- Detailed Health: `/api/health/detailed`
- System Metrics: `/api/metrics`

### Logs & Errors
- Error Logs: `/api/logs?level=error`
- All Logs: `/api/logs`
- Critical Logs: `/api/logs?level=critical`

### Performance
- Performance Data: `/api/performance`
- Performance Trends: `/api/performance?limit=100`

## Maintenance

### Daily Tasks
- Review overnight alerts
- Check performance trends
- Validate API health during market open

### Weekly Tasks
- Analyze error patterns
- Review performance metrics
- Update alert thresholds if needed
- Clean up resolved monitoring issues

### Monthly Tasks
- Review monitoring effectiveness
- Update documentation
- Analyze cost implications of API usage
- Performance baseline updates

## Emergency Contacts

### During Market Hours (9:30 AM - 4:00 PM EST)
- **Critical Issues**: Immediate response required
- **High Priority**: Response within 30 minutes
- **Medium Priority**: Response within 2 hours

### Outside Market Hours
- **Critical Issues**: Response within 2 hours
- **Other Issues**: Next business day

## Continuous Improvement

### Metrics to Track
- Mean Time to Detection (MTTD)
- Mean Time to Resolution (MTTR)
- False positive rate
- Alert fatigue indicators

### Regular Reviews
- Monthly monitoring effectiveness review
- Quarterly threshold optimization
- Semi-annual runbook updates
- Annual monitoring strategy review

---

**Last Updated**: 2025-08-04  
**Version**: 1.0  
**Next Review**: 2025-09-04