# Operations Runbook - Sentiment Tracker v2

## Quick Reference

### Emergency Response
- **Site Down**: Check GitHub Pages, recent deployments
- **API Issues**: Review rate limits, check external API status  
- **Performance**: Check metrics, recent changes, resource usage
- **Errors**: Review logs, identify patterns, implement fallbacks

### Key URLs
- Health Check: `/api/health`
- Detailed Health: `/api/health/detailed`
- Metrics: `/api/metrics`
- Logs: `/api/logs`
- Performance: `/api/performance`

---

## Incident Response Procedures

### 1. CRITICAL: Site Completely Down

**Detection**: 
- HTTP 5xx responses across all endpoints
- GitHub Actions health check failures
- Zero successful health checks

**Immediate Response (0-5 minutes)**:
```bash
# 1. Verify the issue
curl -I https://[username].github.io/sentiment-tracker-v2/
curl https://[username].github.io/sentiment-tracker-v2/api/health

# 2. Check GitHub Pages status
curl -I https://[username].github.io/
```

**Investigation (5-15 minutes)**:
```bash
# 3. Check recent deployments
gh run list --repo [username]/sentiment-tracker-v2 --limit 5

# 4. Review build logs
gh run view [run-id] --repo [username]/sentiment-tracker-v2

# 5. Check for recent commits
git log --oneline -10
```

**Resolution Steps**:
1. If deployment failed: Re-run deployment workflow
2. If build issue: Revert last commit and redeploy
3. If GitHub Pages issue: Wait for service recovery
4. If DNS issue: Check domain configuration

**Communication**:
- Create GitHub issue with "critical" label
- Update status if external status page exists
- Notify stakeholders if downtime > 15 minutes

---

### 2. HIGH: API Dependencies Failing

**Detection**:
- Multiple API timeout errors
- High error rates in logs
- Rate limit exceeded alerts
- Stale data warnings

**Immediate Response (0-5 minutes)**:
```bash
# 1. Check API health
curl https://[username].github.io/sentiment-tracker-v2/api/health/detailed

# 2. Test external APIs directly
curl "https://api.alternative.me/fng/"
curl "https://query1.finance.yahoo.com/v8/finance/chart/SPY?interval=1d&range=1d"
```

**Investigation (5-15 minutes)**:
```bash
# 3. Check rate limit status
curl https://[username].github.io/sentiment-tracker-v2/api/metrics

# 4. Review recent error logs
curl "https://[username].github.io/sentiment-tracker-v2/api/logs?level=error&limit=20"

# 5. Check for error patterns
curl "https://[username].github.io/sentiment-tracker-v2/api/logs" | grep -E "(rate.limit|timeout|503|429)"
```

**Resolution Steps**:
1. **Rate Limiting**: Implement circuit breaker, extend cache TTL
2. **API Outage**: Switch to mock data, extend cache duration
3. **Network Issues**: Retry with exponential backoff
4. **Quota Exceeded**: Reduce request frequency

**Code Changes for Rate Limiting**:
```typescript
// Temporary rate limit mitigation
private readonly CACHE_DURATION = 15 * 60 * 1000; // Extend to 15 minutes
private readonly MAX_RETRIES = 3;
private readonly BACKOFF_DELAY = 2000; // 2 seconds
```

---

### 3. HIGH: Performance Degradation

**Detection**:
- Page load times > 5 seconds
- Core Web Vitals in "poor" range
- Performance monitoring alerts
- User complaints

**Immediate Response (0-5 minutes)**:
```bash
# 1. Check current performance
curl -w "@perf-format.txt" https://[username].github.io/sentiment-tracker-v2/

# Create perf-format.txt:
# time_namelookup:  %{time_namelookup}\n
# time_connect:     %{time_connect}\n
# time_starttransfer: %{time_starttransfer}\n
# time_total:       %{time_total}\n
```

**Investigation (5-15 minutes)**:
```bash
# 2. Get performance metrics
curl "https://[username].github.io/sentiment-tracker-v2/api/performance?limit=10"

# 3. Check resource sizes
curl -I https://[username].github.io/sentiment-tracker-v2/_next/static/chunks/main-*.js

# 4. Review recent changes
git log --oneline --since="24 hours ago"
```

**Resolution Steps**:
1. **Large Bundles**: Implement code splitting, lazy loading
2. **Image Issues**: Optimize images, implement WebP
3. **API Slowness**: Implement caching, parallel requests
4. **Third-party**: Review and optimize external dependencies

**Performance Optimization Checklist**:
- [ ] Enable gzip compression
- [ ] Optimize images (WebP, proper sizing)
- [ ] Minimize JavaScript bundles
- [ ] Implement service worker caching
- [ ] Use CDN for static assets

---

### 4. MEDIUM: High Error Rate

**Detection**:
- Error rate > 10 errors/minute
- Multiple consecutive errors
- JavaScript console errors
- User-reported issues

**Immediate Response (0-10 minutes)**:
```bash
# 1. Check error patterns
curl "https://[username].github.io/sentiment-tracker-v2/api/logs?level=error&limit=50"

# 2. Identify most common errors
curl "https://[username].github.io/sentiment-tracker-v2/api/logs?level=error" | \
  jq -r '.logs[].message' | sort | uniq -c | sort -nr
```

**Investigation (10-30 minutes)**:
```bash
# 3. Check for recent deployments
gh run list --repo [username]/sentiment-tracker-v2 --limit 3

# 4. Review error context
curl "https://[username].github.io/sentiment-tracker-v2/api/logs?level=error" | \
  jq '.logs[] | {message, context, timestamp}'

# 5. Check browser console (if client-side errors)
# Open browser dev tools, check console and network tabs
```

**Resolution Steps**:
1. **API Errors**: Implement better error handling, fallbacks
2. **Client Errors**: Fix JavaScript bugs, add error boundaries
3. **Network Errors**: Implement retry logic, timeout handling
4. **Data Errors**: Add validation, sanitization

---

## Monitoring Playbooks

### Daily Health Check (Market Open - 9:30 AM EST)

```bash
#!/bin/bash
echo "=== Daily Health Check ==="
echo "Time: $(date)"

# 1. Overall health
echo "1. Health Status:"
curl -s https://[username].github.io/sentiment-tracker-v2/api/health | jq '.status'

# 2. API status
echo "2. API Dependencies:"
curl -s https://[username].github.io/sentiment-tracker-v2/api/health/detailed | \
  jq '.dependencies | to_entries[] | "\(.key): \(.value.status)"'

# 3. Error summary
echo "3. Recent Errors:"
curl -s "https://[username].github.io/sentiment-tracker-v2/api/logs?level=error&limit=5" | \
  jq '.statistics.byLevel'

# 4. Performance check
echo "4. Performance:"
curl -w "Load Time: %{time_total}s\n" -o /dev/null -s \
  https://[username].github.io/sentiment-tracker-v2/

echo "=== Health Check Complete ==="
```

### Weekly Performance Review

```bash
#!/bin/bash
echo "=== Weekly Performance Review ==="

# 1. Performance trends (last 7 days)
curl -s "https://[username].github.io/sentiment-tracker-v2/api/performance?limit=1000" | \
  jq '.statistics'

# 2. Error rate analysis
curl -s "https://[username].github.io/sentiment-tracker-v2/api/logs" | \
  jq '.statistics'

# 3. API health summary
curl -s https://[username].github.io/sentiment-tracker-v2/api/metrics | \
  jq '.api_dependencies'
```

---

## Alert Response Matrix

| Alert Type | Severity | Response Time | Escalation |
|------------|----------|---------------|------------|
| Site Down | Critical | 0-5 minutes | Immediate |
| API Failure | High | 0-15 minutes | 30 minutes |
| Performance | Medium | 0-30 minutes | 2 hours |
| High Errors | Medium | 0-30 minutes | 2 hours |
| Rate Limits | High | 0-15 minutes | 1 hour |

---

## Troubleshooting Common Issues

### "Fear & Greed API Timeout"
```bash
# Check API directly
curl -v "https://api.alternative.me/fng/"

# If slow/failing, extend cache:
# Update CACHE_DURATION in APIService to 15 minutes
```

### "Yahoo Finance Rate Limited"
```bash
# Check current usage
curl -s https://[username].github.io/sentiment-tracker-v2/api/metrics | \
  jq '.api_dependencies'

# Implement delays between requests
# Add circuit breaker to APIService
```

### "High Memory Usage"
```bash
# Check memory stats
curl -s https://[username].github.io/sentiment-tracker-v2/api/health/detailed | \
  jq '.environment.memory'

# Clear caches, restart if needed
```

### "JavaScript Errors in Browser"
1. Open browser dev tools
2. Check console for errors
3. Check network tab for failed requests
4. Review error boundary logs
5. Test in incognito mode

---

## Recovery Procedures

### Rollback Deployment
```bash
# 1. Find last good commit
git log --oneline -10

# 2. Create rollback branch
git checkout -b rollback-[issue-number]
git reset --hard [good-commit-hash]

# 3. Force push to main (emergency only)
git push origin rollback-[issue-number]:main --force

# 4. Monitor deployment
gh run watch
```

### Clear Application Caches
```bash
# Client-side cache clear (inform users)
# Add cache busting parameter to assets
# Update service worker to force cache refresh

# Server-side cache clear
# Clear APIService cache via app restart
```

### Enable Maintenance Mode
```bash
# Create maintenance page
# Update deployment to show maintenance message
# Communicate expected resolution time
```

---

## Prevention Strategies

### Code Quality
- [ ] Comprehensive error handling
- [ ] Input validation and sanitization
- [ ] Proper timeout configuration
- [ ] Circuit breaker patterns
- [ ] Graceful degradation

### Monitoring
- [ ] Proactive alerting
- [ ] Performance budgets
- [ ] Error rate thresholds
- [ ] Dependency monitoring
- [ ] User experience tracking

### Infrastructure
- [ ] CDN configuration
- [ ] Caching strategies
- [ ] Rate limiting
- [ ] Fallback mechanisms
- [ ] Auto-scaling policies

---

## Escalation Contacts

### Level 1 - Automated Response
- GitHub Actions workflows
- Automated alerts and notifications
- Self-healing mechanisms

### Level 2 - Development Team
- Repository maintainers
- On-call developer
- Technical lead

### Level 3 - Business Impact
- Project stakeholders
- Business continuity team
- External communications

---

**Document Version**: 1.0  
**Last Updated**: 2025-08-04  
**Next Review**: Monthly