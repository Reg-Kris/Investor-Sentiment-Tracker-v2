# Data Fetching and Sentiment Analysis Scripts

This directory contains Node.js scripts for fetching market data and performing sentiment analysis for the Investor Sentiment Dashboard.

## Overview

The scripts system consists of three main components:

1. **fetch-data.js** - Fetches market data from multiple APIs
2. **analyze-sentiment.js** - Performs sentiment analysis on news articles
3. **update-all.js** - Orchestrates both processes and generates reports

## Setup

### 1. Install Dependencies

```bash
cd scripts
npm install
```

### 2. Configure API Keys

Copy the environment template and add your API keys:

```bash
cp ../.env.local.example ../.env.local
```

Edit `.env.local` with your actual API keys:
- **Alpha Vantage API Key**: Required for stock data and news sentiment
  - Get free key at: https://www.alphavantage.co/support/#api-key
- **FRED API Key**: Required for economic indicators
  - Get free key at: https://fred.stlouisfed.org/docs/api/api_key.html

## Usage

### Run Individual Scripts

```bash
# Fetch market data only
npm run fetch

# Run sentiment analysis only
npm run analyze

# Run both processes
npm run update
```

### Run from Project Root

```bash
# From the main project directory
npm run update-data
```

## Data Sources

### Market Data (fetch-data.js)
- **Stock Data**: SPY, QQQ, IWM, DIA via Alpha Vantage
- **News Sentiment**: Stock-specific sentiment via Alpha Vantage
- **Economic Indicators**: FRED API (Unemployment, CPI, Fed Funds Rate, GDP, Payrolls)
- **Cryptocurrency**: Bitcoin, Ethereum, BNB, Cardano, Solana via CoinGecko
- **Fear & Greed Index**: Alternative.me API
- **VIX Data**: Volatility Index via Alpha Vantage

### News Sources (analyze-sentiment.js)
- **General**: Reuters, CNBC, MarketWatch, Yahoo Finance
- **Crypto**: CoinDesk, CoinTelegraph  
- **Economic**: Federal Reserve, Bureau of Labor Statistics

## Output Files

All data is saved to `/public/data/`:

- `market-data.json` - Complete market data with sentiment integration
- `sentiment-analysis.json` - Detailed sentiment analysis results
- `summary-report.json` - Executive summary of all metrics

## Features

### Rate Limiting & Caching
- Intelligent rate limiting respects API limits
- 5-minute caching reduces redundant requests
- Exponential backoff with retry logic

### Error Handling
- Graceful failure handling for individual data sources
- Comprehensive logging with success/failure indicators
- Fallback data when APIs are unavailable

### Sentiment Analysis
- VADER sentiment analysis for news articles
- Keyword-based categorization (bullish/bearish/neutral)
- Multi-source aggregation with confidence scoring
- Integration with market data for comprehensive sentiment score

## API Rate Limits

The scripts respect the following rate limits:
- **Alpha Vantage**: 5 requests/minute (free tier)
- **FRED**: 120 requests/minute
- **CoinGecko**: 50 requests/minute (free tier)

## Automation

To run scripts automatically, set up a cron job:

```bash
# Run every 15 minutes during market hours (9:30 AM - 4:00 PM EST, Mon-Fri)
*/15 9-16 * * 1-5 cd /path/to/sentiment-tracker-v2 && npm run update-data

# Run every hour during extended hours
0 * * * * cd /path/to/sentiment-tracker-v2 && npm run update-data
```

## Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure `.env.local` contains valid API keys
2. **Rate Limiting**: Scripts automatically handle rate limits with delays
3. **Network Timeouts**: Scripts include retry logic for temporary failures
4. **Missing Dependencies**: Run `npm install` in the scripts directory

### Debug Mode

Set environment variable for verbose logging:
```bash
DEBUG=1 npm run update
```

## Architecture

### Data Flow
```
RSS Feeds → News Articles → VADER Analysis → Sentiment Scores
    ↓
Market APIs → Raw Data → Processing → Cache → JSON Output
    ↓
Integration → Combined Analysis → Summary Report
```

### File Structure
```
scripts/
├── package.json          # Dependencies
├── fetch-data.js         # Market data fetching
├── analyze-sentiment.js  # News sentiment analysis  
├── update-all.js         # Orchestration script
└── README.md            # This file

public/data/
├── market-data.json      # Market data with sentiment
├── sentiment-analysis.json # Raw sentiment analysis
└── summary-report.json   # Executive summary
```

## Performance

- **Typical Execution Time**: 30-60 seconds for complete update
- **Cache Hit Ratio**: 80%+ during normal operation
- **Memory Usage**: <100MB peak
- **Concurrent Requests**: Managed by rate limiters

## License

Same as parent project.