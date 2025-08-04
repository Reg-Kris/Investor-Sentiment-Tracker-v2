#!/usr/bin/env node

import fetchAllData from './fetch-data.js';
import runSentimentAnalysis from './analyze-sentiment.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function updateAllData() {
  const startTime = Date.now();
  
  try {
    colorLog('cyan', '🚀 Starting complete data update process...');
    colorLog('cyan', '=' .repeat(60));
    
    // Step 1: Fetch market data
    colorLog('blue', '\n📊 Step 1: Fetching market data from APIs...');
    const marketData = await fetchAllData();
    colorLog('green', '✅ Market data fetch completed successfully');
    
    // Step 2: Perform sentiment analysis
    colorLog('blue', '\n📰 Step 2: Performing sentiment analysis...');
    const sentimentData = await runSentimentAnalysis();
    colorLog('green', '✅ Sentiment analysis completed successfully');
    
    // Step 3: Generate summary report
    colorLog('blue', '\n📋 Step 3: Generating summary report...');
    const summary = await generateSummaryReport(marketData, sentimentData);
    colorLog('green', '✅ Summary report generated successfully');
    
    const totalTime = Date.now() - startTime;
    
    colorLog('cyan', '\n' + '=' .repeat(60));
    colorLog('green', '🎉 All data updates completed successfully!');
    colorLog('cyan', `⏱️  Total execution time: ${(totalTime / 1000).toFixed(2)} seconds`);
    colorLog('cyan', '=' .repeat(60));
    
    // Print quick summary
    console.log('\n📈 Quick Summary:');
    if (summary.market_sentiment_score) {
      console.log(`   Market Sentiment: ${summary.market_sentiment_score.classification} (${summary.market_sentiment_score.score})`);
    }
    if (summary.fear_greed_index) {
      console.log(`   Fear & Greed Index: ${summary.fear_greed_index} (${summary.fear_greed_classification})`);
    }
    if (summary.news_sentiment) {
      console.log(`   News Sentiment: ${summary.news_sentiment.overall_sentiment} (${summary.news_sentiment.sentiment_score.toFixed(3)})`);
    }
    if (summary.stock_performance && summary.stock_performance.length > 0) {
      console.log(`   Top Stock: ${summary.stock_performance[0].symbol} (${summary.stock_performance[0].change.toFixed(2)}%)`);
    }
    
    return {
      success: true,
      execution_time: totalTime,
      market_data: marketData,
      sentiment_data: sentimentData,
      summary: summary
    };
    
  } catch (error) {
    colorLog('red', '\n❌ Data update process failed!');
    colorLog('red', `Error: ${error.message}`);
    
    if (error.stack) {
      colorLog('yellow', '\nStack trace:');
      console.error(error.stack);
    }
    
    throw error;
  }
}

async function generateSummaryReport(marketData, sentimentData) {
  try {
    const summary = {
      timestamp: new Date().toISOString(),
      data_sources: {
        market_data_available: !!marketData,
        sentiment_data_available: !!sentimentData,
        stock_symbols: marketData?.stocks ? Object.keys(marketData.stocks) : [],
        news_sources: sentimentData?.sources ? Object.keys(sentimentData.sources) : []
      }
    };

    // Extract key metrics
    if (marketData) {
      // Fear & Greed Index
      if (marketData.fear_greed) {
        summary.fear_greed_index = marketData.fear_greed.value;
        summary.fear_greed_classification = marketData.fear_greed.classification;
      }
      
      // VIX
      if (marketData.vix) {
        summary.vix_level = marketData.vix.value;
        summary.vix_classification = marketData.vix.classification;
      }
      
      // Stock performance
      if (marketData.stocks) {
        summary.stock_performance = Object.entries(marketData.stocks)
          .filter(([_, data]) => data.change !== undefined)
          .map(([symbol, data]) => ({
            symbol,
            change: data.change,
            price: data.price
          }))
          .sort((a, b) => b.change - a.change);
      }
      
      // Crypto performance
      if (marketData.crypto && marketData.crypto.data) {
        summary.crypto_performance = marketData.crypto.data
          .slice(0, 5)
          .map(coin => ({
            symbol: coin.symbol,
            change_24h: coin.change_24h,
            price: coin.price
          }));
      }
      
      // Market sentiment score
      if (marketData.market_sentiment_score) {
        summary.market_sentiment_score = marketData.market_sentiment_score;
      }
    }

    // Extract sentiment metrics
    if (sentimentData && sentimentData.aggregates) {
      summary.news_sentiment = sentimentData.aggregates.overall;
      summary.sentiment_by_category = sentimentData.aggregates;
    }

    // Economic indicators
    if (marketData && marketData.economic_indicators) {
      summary.economic_indicators = Object.entries(marketData.economic_indicators)
        .filter(([_, data]) => data.value !== null)
        .map(([series, data]) => ({
          indicator: data.name,
          value: data.value,
          change: data.change
        }));
    }

    // Data quality metrics
    summary.data_quality = {
      successful_stock_fetches: marketData?.stocks ? 
        Object.values(marketData.stocks).filter(stock => !stock.error).length : 0,
      failed_stock_fetches: marketData?.stocks ? 
        Object.values(marketData.stocks).filter(stock => stock.error).length : 0,
      successful_news_sources: sentimentData?.sources ? 
        Object.values(sentimentData.sources).filter(source => !source.error).length : 0,
      failed_news_sources: sentimentData?.sources ? 
        Object.values(sentimentData.sources).filter(source => source.error).length : 0,
      total_articles_analyzed: sentimentData?.metadata?.total_articles || 0
    };

    // Save summary report
    const summaryPath = path.resolve(__dirname, '../public/data/summary-report.json');
    await fs.ensureDir(path.dirname(summaryPath));
    await fs.writeJSON(summaryPath, summary, { spaces: 2 });
    
    return summary;

  } catch (error) {
    console.error('Failed to generate summary report:', error);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  colorLog('red', 'Unhandled Rejection at: ' + promise);
  colorLog('red', 'Reason: ' + reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  colorLog('red', 'Uncaught Exception: ' + error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateAllData()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      process.exit(1);
    });
}

export default updateAllData;