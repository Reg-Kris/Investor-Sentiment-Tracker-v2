# Deployment Guide: Sentiment Tracker v2

## Quick Fix Summary

### Root Cause
The sentiment tracker was displaying mock data instead of real market data due to **basePath configuration issues**. The application was trying to fetch data from `/data/market-data.json` but GitHub Pages serves the app from `/Investor-Sentiment-Tracker-v2/data/market-data.json`.

### Solution Implemented
1. **Fixed basePath awareness** in data loading
2. **Enhanced cache-busting** for GitHub Pages
3. **Added build-time data injection** as fallback
4. **Improved GitHub Actions pipeline** with verification steps

---

## Deployment Architecture

### Current Setup
- **Platform**: GitHub Pages (Static Hosting)
- **Framework**: Next.js with static export (`output: 'export'`)
- **Data Source**: Yahoo Finance API + Alternative.me Fear & Greed API
- **Update Frequency**: Daily via GitHub Actions (13:00 UTC)
- **Fallback Strategy**: JSON → Embedded Data → Mock Data

### Data Flow
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  GitHub Actions │    │   Data Sources   │    │  GitHub Pages   │
│                 │    │                  │    │                 │
│ 1. Fetch Data   │───▶│ Yahoo Finance    │    │ Static Website  │
│ 2. Build App    │    │ Fear & Greed API │    │                 │
│ 3. Deploy       │    │                  │    │ Real-time Data  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                                               ▲
        │               ┌──────────────────┐           │
        └──────────────▶│  Build Process   │───────────┘
                        │                  │
                        │ • Data Injection │
                        │ • Static Export  │
                        │ • Asset Bundling │
                        └──────────────────┘
```

---

## Step-by-Step Implementation Plan

### Phase 1: Immediate Fixes ✅ COMPLETED
1. **Fix basePath in API calls**
   ```typescript
   const basePath = process.env.NODE_ENV === 'production' ? '/Investor-Sentiment-Tracker-v2' : '';
   const url = `${basePath}/data/market-data.json?v=${Date.now()}`;
   ```

2. **Enhanced cache control**
   ```typescript
   headers: {
     'Cache-Control': 'no-cache, no-store, must-revalidate',
     'Pragma': 'no-cache',
     'Expires': '0'
   }
   ```

3. **Cache-busting with timestamps**

### Phase 2: Build-Time Data Injection ✅ COMPLETED
1. **Created build-time injection script** (`scripts/inject-build-data.js`)
2. **Updated API service** with embedded data fallback
3. **Modified build process** to include data injection
4. **Enhanced GitHub Actions** with verification steps

### Phase 3: Testing & Validation ✅ COMPLETED
1. **Comprehensive test suite** (`scripts/test-data-loading.js`)
2. **Build verification steps** in CI/CD
3. **Data structure validation**
4. **End-to-end deployment testing**

---

## Configuration Files

### Next.js Configuration (`next.config.js`)
```javascript
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/Investor-Sentiment-Tracker-v2' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/Investor-Sentiment-Tracker-v2/' : '',
  images: { unoptimized: true }
}
```

### GitHub Actions Pipeline (`.github/workflows/simple-pipeline.yml`)
```yaml
- name: Fetch market data
  run: |
    node simple-fetch.js
    # Verification steps...

- name: Build application  
  run: |
    npm run inject-data    # Build-time data injection
    npm run build:ci       # Clean build without injection
    # Verification steps...
```

### Package.json Scripts
```json
{
  "scripts": {
    "build": "npm run inject-data && next build",
    "build:ci": "next build",
    "inject-data": "node scripts/inject-build-data.js",
    "test-data": "node scripts/test-data-loading.js"
  }
}
```

---

## Testing Strategy

### Local Testing
```bash
# Test data fetching
npm run fetch-data

# Test build-time injection
npm run inject-data

# Test complete build process
npm run build

# Run comprehensive tests
npm run test-data
```

### Production Verification
1. **Check browser console** for data loading logs
2. **Verify network requests** in DevTools
3. **Confirm real prices** are displayed
4. **Test cache-busting** with hard refresh

### Debugging Steps
```bash
# Check if data exists
ls -la public/data/

# Verify build output
ls -la out/data/

# Check embedded data
cat app/lib/embedded-data.ts

# View GitHub Actions logs
# Navigate to: Repository → Actions → Latest workflow
```

---

## Troubleshooting Guide

### Issue: Still Showing Mock Data
**Symptoms**: Website displays SPY $620, QQQ $540 (hardcoded values)

**Debugging**:
1. Open browser DevTools → Console
2. Look for data loading logs:
   ```
   🔍 Attempting to load pre-fetched data from JSON file...
   📥 Fetching: /Investor-Sentiment-Tracker-v2/data/market-data.json?v=1234567890
   📡 Response received: {status: 200, ok: true}
   ```

**Common Causes**:
- **404 on data file**: BasePath configuration issue
- **Cached old data**: Clear browser cache or use incognito
- **Build-time injection failed**: Check GitHub Actions logs
- **Network blocking**: Some networks block financial APIs

**Solutions**:
```bash
# Force fresh deployment
git commit --allow-empty -m "Force fresh deployment"
git push origin main

# Manual data refresh
npm run fetch-data
git add . && git commit -m "Update market data"
git push origin main
```

### Issue: Build Failures
**Symptoms**: GitHub Actions failing on build step

**Debugging**:
1. Check GitHub Actions logs
2. Look for specific error messages
3. Verify data file existence

**Common Causes**:
- API rate limiting during data fetch
- Missing dependencies
- TypeScript compilation errors

**Solutions**:
```bash
# Test locally first
npm ci
npm run fetch-data
npm run build

# If API issues, check manual trigger
# Repository → Actions → Simple Daily Pipeline → Run workflow
```

### Issue: Stale Data
**Symptoms**: Old prices being displayed

**Solutions**:
1. **Hard refresh**: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. **Clear browser cache**
3. **Check last update timestamp** on the website
4. **Trigger manual pipeline**: GitHub → Actions → Run workflow

---

## Performance Optimizations

### GitHub Pages Caching
- **Static assets**: Cached for 1 year
- **Data files**: 5-minute browser cache, 10-minute CDN cache
- **Cache-busting**: Automatic timestamp parameter

### Bundle Optimization
```javascript
experimental: {
  optimizePackageImports: [
    '@tremor/react',
    'lucide-react', 
    'framer-motion'
  ]
}
```

### Loading Strategy
1. **JSON file** (primary, ~100ms)
2. **Embedded data** (fallback, ~50ms)
3. **Mock data** (last resort, ~0ms)

---

## Alternative Deployment Strategies

### Option 1: Serverless Functions (Future Enhancement)
- **Platform**: Vercel/Netlify
- **Benefits**: Real-time API calls, no basePath issues
- **Trade-offs**: Cost, complexity

### Option 2: CDN with Edge Functions
- **Platform**: Cloudflare Pages
- **Benefits**: Global edge caching, real-time updates
- **Trade-offs**: Migration effort

### Option 3: Client-Side Only
- **Approach**: Remove static JSON, use direct API calls
- **Benefits**: Always fresh data
- **Trade-offs**: CORS issues, rate limiting

---

## Monitoring & Maintenance

### Daily Checks
- [ ] Website loads correctly
- [ ] Real prices displayed (not mock data)
- [ ] GitHub Actions successful
- [ ] Data timestamp is recent

### Weekly Reviews
- [ ] API rate limits status
- [ ] Performance metrics
- [ ] Error logs review
- [ ] User feedback

### Monthly Tasks
- [ ] Dependency updates
- [ ] Security patches
- [ ] Performance optimization
- [ ] Feature enhancements

---

## Security Considerations

### API Keys
- **Not required**: Using free, public APIs
- **Rate limiting**: Implemented client-side
- **CORS**: Handled by API providers

### Data Validation
- **Input sanitization**: All API responses validated
- **Error handling**: Graceful fallbacks implemented
- **Anomaly detection**: Built into API service

### Deployment Security
- **GitHub token**: Automatic, scoped permissions
- **No secrets**: All configuration in public files
- **Static hosting**: No server-side vulnerabilities

---

## Contact & Support

### Repository
- **GitHub**: [Your Repository URL]
- **Issues**: Use GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions

### Documentation
- **Technical**: `/app/lib/api.ts` (detailed comments)
- **Architecture**: This deployment guide
- **API**: Individual script files with JSDoc

### Emergency Procedures
1. **Immediate fix**: Revert to previous working commit
2. **Data issues**: Trigger manual workflow run
3. **Complete failure**: Redeploy from scratch using this guide

---

*Last updated: August 4, 2025*
*Version: 2.0 (GitHub Pages Optimized)*