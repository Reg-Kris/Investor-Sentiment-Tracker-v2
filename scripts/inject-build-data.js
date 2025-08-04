#!/usr/bin/env node

/**
 * Build-time data injection script
 * Embeds market data directly into the application build for GitHub Pages
 */

const fs = require('fs').promises;
const path = require('path');

async function injectBuildTimeData() {
  console.log('🔧 Starting build-time data injection...');
  
  try {
    // Read the latest market data
    const dataPath = path.resolve(process.cwd(), 'public/data/market-data.json');
    const marketDataContent = await fs.readFile(dataPath, 'utf8');
    const marketData = JSON.parse(marketDataContent);
    
    console.log('📊 Market data loaded:', {
      timestamp: marketData.timestamp,
      spy_price: marketData.stocks?.SPY?.price,
      qqq_price: marketData.stocks?.QQQ?.price,
      fear_greed: marketData.fearGreed?.value
    });
    
    // Create a TypeScript file with embedded data
    const embeddedDataContent = `// Auto-generated build-time data injection
// Generated at: ${new Date().toISOString()}

export const BUILD_TIME_MARKET_DATA = ${JSON.stringify(marketData, null, 2)} as const;

export const DATA_INJECTION_TIMESTAMP = "${new Date().toISOString()}";

export const isDataEmbedded = true;
`;
    
    // Write the embedded data file
    const outputPath = path.resolve(process.cwd(), 'app/lib/embedded-data.ts');
    await fs.writeFile(outputPath, embeddedDataContent);
    
    console.log('✅ Build-time data injected successfully');
    console.log(`📁 Output file: ${outputPath}`);
    
    return marketData;
    
  } catch (error) {
    console.error('❌ Build-time data injection failed:', error.message);
    
    // Create fallback embedded data
    const fallbackData = {
      timestamp: new Date().toISOString(),
      stocks: {
        SPY: { symbol: 'SPY', price: 450, change: 0, timestamp: new Date().toISOString() },
        QQQ: { symbol: 'QQQ', price: 380, change: 0, timestamp: new Date().toISOString() },
        IWM: { symbol: 'IWM', price: 200, change: 0, timestamp: new Date().toISOString() },
        '^VIX': { symbol: '^VIX', price: 20, change: 0, timestamp: new Date().toISOString() }
      },
      fearGreed: { value: 50, classification: 'Neutral', timestamp: new Date().toISOString() },
      putCallRatio: 0.9,
      error: 'Fallback data used due to injection failure'
    };
    
    const fallbackContent = `// Fallback build-time data (injection failed)
// Generated at: ${new Date().toISOString()}

export const BUILD_TIME_MARKET_DATA = ${JSON.stringify(fallbackData, null, 2)} as const;

export const DATA_INJECTION_TIMESTAMP = "${new Date().toISOString()}";

export const isDataEmbedded = true;

export const injectionError = "${error.message}";
`;
    
    const outputPath = path.resolve(process.cwd(), 'app/lib/embedded-data.ts');
    await fs.writeFile(outputPath, fallbackContent);
    
    console.log('⚠️ Fallback data injection completed');
    return fallbackData;
  }
}

// Run if called directly
if (require.main === module) {
  injectBuildTimeData()
    .then(() => {
      console.log('🎉 Data injection completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Data injection failed:', error);
      process.exit(1);
    });
}

module.exports = injectBuildTimeData;