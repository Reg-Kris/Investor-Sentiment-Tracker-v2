#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

console.log('🚀 Starting simple data fetch...');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchYahooFinance(symbol) {
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; sentiment-tracker)' }
    });
    const data = await response.json();
    
    if (!data.chart?.result?.[0]?.indicators?.quote?.[0]?.close) {
      throw new Error(`No data for ${symbol}`);
    }
    
    const prices = data.chart.result[0].indicators.quote[0].close.filter(p => p !== null);
    if (prices.length < 2) throw new Error(`Insufficient data for ${symbol}`);
    
    const current = prices[prices.length - 1];
    const previous = prices[prices.length - 2];
    const change = ((current - previous) / previous) * 100;
    
    return {
      symbol,
      price: current,
      change: change,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`❌ Failed to fetch ${symbol}:`, error.message);
    return { symbol, error: error.message, timestamp: new Date().toISOString() };
  }
}

async function fetchFearGreedIndex() {
  try {
    const response = await fetch('https://api.alternative.me/fng/?limit=1');
    const data = await response.json();
    
    if (!data.data?.[0]) throw new Error('No Fear & Greed data');
    
    const current = data.data[0];
    return {
      value: parseInt(current.value),
      classification: current.value_classification,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Failed to fetch Fear & Greed Index:', error.message);
    return { error: error.message, timestamp: new Date().toISOString() };
  }
}

async function calculateSentiment(marketData) {
  // Simple sentiment calculation based on market movements
  let sentimentScore = 50; // Neutral baseline
  
  // Factor in major indices
  if (marketData.SPY && marketData.SPY.change) {
    sentimentScore += marketData.SPY.change * 2; // SPY has 2x weight
  }
  
  if (marketData.QQQ && marketData.QQQ.change) {
    sentimentScore += marketData.QQQ.change * 1.5; // QQQ has 1.5x weight
  }
  
  // Factor in VIX (inverse relationship)
  if (marketData['^VIX'] && marketData['^VIX'].change) {
    sentimentScore -= marketData['^VIX'].change * 1.5; // VIX change inversely affects sentiment
  }
  
  // Clamp between 0 and 100
  sentimentScore = Math.max(0, Math.min(100, sentimentScore));
  
  let sentiment = 'Neutral';
  if (sentimentScore > 60) sentiment = 'Bullish';
  else if (sentimentScore < 40) sentiment = 'Bearish';
  
  return {
    score: Math.round(sentimentScore),
    label: sentiment,
    timestamp: new Date().toISOString()
  };
}

async function main() {
  const symbols = ['SPY', 'QQQ', '^VIX'];
  const results = {
    timestamp: new Date().toISOString(),
    stocks: {},
    sentiment: null,
    fearGreed: null
  };
  
  // Fetch stock data
  console.log('📊 Fetching market data...');
  for (const symbol of symbols) {
    results.stocks[symbol] = await fetchYahooFinance(symbol);
    console.log(`✅ ${symbol}: $${results.stocks[symbol].price?.toFixed(2)} (${results.stocks[symbol].change?.toFixed(2)}%)`);
    await sleep(1000); // Be nice to Yahoo's servers
  }
  
  // Calculate simple sentiment
  console.log('🧠 Calculating sentiment...');
  results.sentiment = await calculateSentiment(results.stocks);
  console.log(`✅ Market Sentiment: ${results.sentiment.label} (${results.sentiment.score}/100)`);
  
  // Fetch Fear & Greed Index
  console.log('😨 Fetching Fear & Greed Index...');
  results.fearGreed = await fetchFearGreedIndex();
  console.log(`✅ Fear & Greed: ${results.fearGreed.value}/100 (${results.fearGreed.classification})`);
  
  // Save data to multiple locations for app consumption
  const dataDir = path.resolve(process.cwd(), 'data');
  const publicDataDir = path.resolve(process.cwd(), 'public/data');
  
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(publicDataDir, { recursive: true });
  
  // Save to data directory
  await fs.writeFile(
    path.join(dataDir, 'latest.json'),
    JSON.stringify(results, null, 2)
  );
  
  // Save to public directory for app
  await fs.writeFile(
    path.join(publicDataDir, 'market-data.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log('💾 Data saved successfully!');
  console.log('🎉 Simple fetch completed - no enterprise bloat!');
  
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Fetch failed:', error);
      process.exit(1);
    });
}

export default main;