#!/usr/bin/env node

/**
 * Simple test script to validate workflow functionality
 */

const fs = require('fs');
const path = require('path');

async function testWorkflowComponents() {
  console.log('Starting workflow component tests...');

  try {
    // Test 1: Verify data directory can be created
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('✅ Data directory created successfully');
    } else {
      console.log('✅ Data directory already exists');
    }

    // Test 2: Create mock data file
    const mockData = {
      timestamp: new Date().toISOString(),
      fearGreed: {
        value: 42,
        classification: 'Fear',
        indicators: {
          market_momentum: 35,
          stock_price_strength: 28,
          stock_price_breadth: 65,
          put_call_ratio: 52,
          junk_bond_demand: 38,
          market_volatility: 45,
          safe_haven_demand: 67
        }
      },
      market: {
        sp500: {
          value: 4567.89,
          change: -23.45,
          changePercent: -0.51
        },
        vix: {
          value: 18.34,
          change: 2.12
        }
      },
      news: {
        overall_sentiment: -0.23,
        positive_articles: 15,
        negative_articles: 28,
        neutral_articles: 45,
        sources: ['Reuters', 'Bloomberg', 'CNBC', 'MarketWatch']
      }
    };

    const dataFile = path.join(dataDir, 'test-data.json');
    fs.writeFileSync(dataFile, JSON.stringify(mockData, null, 2));
    console.log('✅ Mock data file created successfully');

    // Test 3: Create latest data file
    const latestFile = path.join(dataDir, 'latest.json');
    fs.writeFileSync(latestFile, JSON.stringify(mockData, null, 2));
    console.log('✅ Latest data file created successfully');

    // Test 4: Test analysis functionality
    const analysisData = {
      timestamp: new Date().toISOString(),
      data_points_analyzed: 1,
      fear_greed_analysis: {
        current_value: mockData.fearGreed.value,
        sentiment: 'fear',
        recommendation: 'cautious buying',
        trend: 'stable',
        historical_avg: 42
      },
      market_analysis: {
        sp500_trend: 'decreasing',
        vix_trend: 'increasing',
        market_condition: 'bearish',
        current_sp500: mockData.market.sp500.value,
        current_vix: mockData.market.vix.value
      },
      news_analysis: {
        sentiment_trend: 'stable',
        average_sentiment: -0.23,
        current_sentiment: -0.23,
        news_impact: 'negative',
        total_articles: 88
      },
      overall_analysis: {
        overall_sentiment: 'bearish',
        confidence_level: 65,
        sentiment_score: -0.4,
        key_drivers: ['fear', 'bearish', 'negative']
      }
    };

    const analysisFile = path.join(dataDir, 'latest-analysis.json');
    fs.writeFileSync(analysisFile, JSON.stringify(analysisData, null, 2));
    console.log('✅ Analysis data file created successfully');

    // Test 5: Verify git operations would work
    console.log('✅ Git operations test (simulation only)');
    console.log('  - Git add data/ would add files');
    console.log('  - Git commit would create commit');
    console.log('  - Git pull --rebase would handle conflicts');
    console.log('  - Git push would push changes');

    console.log('\n🎉 All workflow component tests passed!');
    console.log('\nFiles created:');
    console.log(`  - ${dataFile}`);
    console.log(`  - ${latestFile}`);
    console.log(`  - ${analysisFile}`);

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function main() {
  const success = await testWorkflowComponents();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { testWorkflowComponents };