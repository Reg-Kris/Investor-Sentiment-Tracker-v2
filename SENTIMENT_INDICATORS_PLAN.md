# Fear vs Greed Sentiment Indicators - Data Collection Plan

## Executive Summary
This document outlines key sentiment indicators to automate for retail investors, focusing on clear fear vs greed signals using **FREE** data sources. All indicators are designed to update daily and provide actionable insights for retail trading decisions.

## 1. PUT/CALL RATIOS 🎯

### Primary Indicators
- **SPY Put/Call Ratio**: Most liquid equity options market indicator
- **QQQ Put/Call Ratio**: Tech sector sentiment (growth vs defensive rotation)
- **IWM Put/Call Ratio**: Small-cap risk appetite indicator
- **VIX Put/Call Ratio**: Volatility sentiment (fear of fear vs greed for calm)

### Interpretation Guidelines
| Ratio | Sentiment | Action Signal |
|-------|-----------|---------------|
| > 1.20 | Extreme Fear | Strong Buy Signal |
| 1.00-1.20 | Fear | Cautious Buy |
| 0.80-1.00 | Neutral | Hold/Wait |
| 0.60-0.80 | Greed | Cautious Sell |
| < 0.60 | Extreme Greed | Strong Sell Signal |

### Free Data Sources
- **Primary**: Yahoo Finance API (`https://query1.finance.yahoo.com`)
- **Backup**: CBOE Market Statistics (web scraping)
- **Historical**: FRED API (CBOE data)
- **Update Frequency**: Daily after market close

## 2. SAFE HAVEN FLOWS 🏦

### Key Indicators
- **GLD (Gold ETF) vs SPY Ratio**: Classic fear gauge
- **TLT (20+ Year Treasury) Performance**: Long-term safety demand
- **SHY (1-3 Year Treasury) Flows**: Short-term cash parking
- **USD Index (DXY) Strength**: Global flight to safety

### Interpretation Framework
```
Fear Signals:
- GLD/SPY ratio increasing (gold outperforming stocks)
- TLT outperforming SPY by >2% (bond rally)
- DXY strengthening while stocks fall
- SHY volume spikes (cash hoarding)

Greed Signals:
- GLD/SPY ratio declining (risk-on behavior)
- TLT underperforming SPY (bond selling)
- DXY weakening with rising stocks
- Low SHY volume (cash deployment)
```

### Data Collection Strategy
```javascript
const SAFE_HAVEN_TICKERS = {
  gold: ['GLD', 'IAU'],           // Gold ETFs
  treasury_long: ['TLT', 'EDV'],  // Long-term bonds
  treasury_short: ['SHY', 'BIL'], // Short-term bonds
  dollar: ['UUP', 'DXY'],         // Dollar strength
  equity: ['SPY', 'QQQ', 'IWM']   // Risk assets
};
```

## 3. RISK-ON/RISK-OFF SIGNALS ⚡

### Market Structure Indicators
- **High Beta vs Low Vol Performance**: Risk appetite measurement
- **Growth (QQQ) vs Value (IWM) Rotation**: Style preference
- **Emerging Markets (EEM) vs Developed (SPY)**: Geographic risk tolerance
- **High Yield (HYG) vs Investment Grade (LQD)**: Credit risk appetite

### Calculation Methodology
```
Risk-On Score = (
  (High_Beta_ETF_Performance - Low_Vol_ETF_Performance) * 0.25 +
  (QQQ_Performance - IWM_Performance) * 0.25 +
  (EEM_Performance - SPY_Performance) * 0.25 +
  (HYG_Performance - LQD_Performance) * 0.25
) * 100

Score > 5: Strong Risk-On (Greed)
Score 2-5: Moderate Risk-On
Score -2-2: Neutral
Score -5-(-2): Moderate Risk-Off
Score < -5: Strong Risk-Off (Fear)
```

## 4. MARKET STRUCTURE INDICATORS 📊

### VIX Term Structure Analysis
- **VIX vs VIX9D**: Short-term fear spikes
- **VIX vs VIX3M**: Medium-term volatility expectations
- **VIX vs VIX6M**: Long-term uncertainty pricing

### Term Structure Signals
```
Backwardation (Fear):
- VIX9D > VIX > VIX3M (immediate panic)
- Steep curve indicates event risk

Contango (Greed):
- VIX < VIX3M < VIX6M (normal structure)
- Flat curve indicates complacency
```

### Free Data Sources
- **CBOE Direct**: VIX family indices
- **Yahoo Finance**: ^VIX, ^VIX9D historical data
- **FRED API**: VIXCLS series

## 5. CRYPTO CORRELATION INDICATOR 🚀

### Bitcoin-Stock Correlation Analysis
- **BTC vs SPY Correlation** (30-day rolling)
- **ETH vs QQQ Correlation** (tech sentiment proxy)
- **Crypto Fear & Greed Index** (alternative.me API)

### Interpretation Logic
```
High Correlation (>0.7): Risk-asset mode (dangerous for diversification)
Medium Correlation (0.3-0.7): Normal market conditions
Low/Negative Correlation (<0.3): Crypto as hedge/independent asset
```

## 6. DATA PIPELINE ARCHITECTURE 🔧

### Current Integration Points
Your existing system already has:
- ✅ Yahoo Finance API integration
- ✅ VIX data collection
- ✅ Fear & Greed Index (alternative.me)
- ✅ Caching and error handling

### Required Enhancements
```javascript
// Enhanced data collection for sentiment indicators
const SENTIMENT_TICKERS = {
  // Put/Call Ratio Proxies (using volume analysis)
  equity_options: ['SPY', 'QQQ', 'IWM'],
  
  // Safe Haven Assets
  safe_havens: ['GLD', 'TLT', 'SHY', 'DXY'],
  
  // Risk Assets
  risk_assets: ['ARKK', 'EEM', 'HYG', 'TQQQ'],
  
  // Low Risk Assets  
  defensive: ['SPLV', 'LQD', 'USMV', 'VEA'],
  
  // Crypto Proxies
  crypto_etfs: ['BITO', 'ETHE']
};
```

## 7. IMPLEMENTATION ROADMAP 📅

### Phase 1: Core Indicators (Week 1)
1. **Enhance existing VIX collection** to include VIX9D, VIX3M
2. **Add safe haven ETF tracking** (GLD, TLT, SHY performance vs SPY)
3. **Implement risk-on/risk-off scoring** using existing ticker data

### Phase 2: Advanced Analytics (Week 2)
1. **Add correlation analysis** between crypto and equity markets
2. **Implement term structure analysis** for VIX family
3. **Create composite sentiment scoring** algorithm

### Phase 3: Visualization & Alerts (Week 3)
1. **Build sentiment dashboard** with clear fear/greed indicators
2. **Add threshold-based alerting** system
3. **Create interpretive guidelines** for retail investors

## 8. SPECIFIC API ENDPOINTS 🌐

### Free Data Sources Matrix
| Indicator | Primary Source | Backup Source | Update Frequency |
|-----------|----------------|---------------|------------------|
| VIX Term Structure | Yahoo Finance | CBOE Direct | Daily |
| ETF Performance | Yahoo Finance | Alpha Vantage | Daily |
| Put/Call Ratios | Yahoo Finance | CBOE Scraping | Daily |
| Crypto Correlation | CoinGecko | CoinMarketCap | Hourly |
| Fear & Greed Index | Alternative.me | Manual Calculation | Daily |
| Treasury Yields | FRED API | Yahoo Finance | Daily |

### Rate Limits & Costs
- **Yahoo Finance**: Unlimited (unofficial API)
- **Alternative.me**: 1000 requests/day (free)
- **CoinGecko**: 50 requests/minute (free)
- **FRED API**: 120 requests/minute (free)
- **CBOE**: Web scraping (respectful rate limiting)

## 9. SENTIMENT SCORING ALGORITHM 🧮

### Composite Fear/Greed Score
```
Fear_Greed_Score = (
  VIX_Signal * 0.20 +           // Market volatility
  Safe_Haven_Signal * 0.20 +    // Flight to quality
  Risk_OnOff_Signal * 0.20 +    // Risk appetite
  Put_Call_Signal * 0.15 +      // Options sentiment  
  Crypto_Correlation * 0.10 +   // Risk asset correlation
  Term_Structure_Signal * 0.15   // Volatility expectations
) * 100

0-20: Extreme Fear (Strong Buy)
21-40: Fear (Buy)
41-60: Neutral (Hold)
61-80: Greed (Sell)
81-100: Extreme Greed (Strong Sell)
```

## 10. RETAIL INVESTOR INTERPRETATION 📖

### Clear Action Signals
- **🟢 Extreme Fear (0-20)**: "Markets oversold, consider buying quality stocks"
- **🟡 Fear (21-40)**: "Cautious optimism, selective buying opportunities"
- **⚪ Neutral (41-60)**: "Mixed signals, maintain current positions"
- **🟠 Greed (61-80)**: "Markets heating up, consider taking profits"
- **🔴 Extreme Greed (81-100)**: "Dangerous territory, reduce risk exposure"

### Key Questions Answered
1. **"Should I buy the dip?"** → Fear indicators show if selling is overdone
2. **"Is this a bull trap?"** → Greed indicators reveal unsustainable rallies
3. **"What's the market mood?"** → Clear numerical score with historical context
4. **"Where is smart money going?"** → Safe haven flows show institutional behavior

## 11. MONITORING & ALERTS 🚨

### Critical Thresholds
- **VIX Spike Alert**: VIX > 30 (fear opportunity)
- **Complacency Alert**: VIX < 15 (greed warning)
- **Safe Haven Alert**: GLD outperforms SPY by >5% in 5 days
- **Risk-Off Alert**: All risk assets negative while defensives positive
- **Correlation Break**: Crypto correlation with stocks < 0.2

This plan provides a comprehensive, FREE solution for retail investors to understand market sentiment through quantifiable, actionable indicators that update daily and provide clear buy/sell guidance.