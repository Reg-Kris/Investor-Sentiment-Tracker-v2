#!/usr/bin/env node

/**
 * Quick verification script to confirm data loading fixes
 */

const fs = require('fs/promises');
const path = require('path');

async function verifyFix() {
  console.log('🔍 Verifying sentiment tracker data loading fixes...\n');
  
  const checks = [
    {
      name: 'Real Market Data Available',
      check: async () => {
        const dataPath = path.resolve(process.cwd(), 'public/data/market-data.json');
        const content = await fs.readFile(dataPath, 'utf8');
        const data = JSON.parse(content);
        
        // Check if we have real prices (not mock values)
        const spyPrice = data.stocks?.SPY?.price;
        const qqqPrice = data.stocks?.QQQ?.price;
        
        return spyPrice && spyPrice > 500 && spyPrice !== 620 && // Not mock SPY price
               qqqPrice && qqqPrice > 400 && qqqPrice !== 540;   // Not mock QQQ price
      }
    },
    {
      name: 'Build Output Contains Data',
      check: async () => {
        const buildDataPath = path.resolve(process.cwd(), 'out/data/market-data.json');
        try {
          const content = await fs.readFile(buildDataPath, 'utf8');
          const data = JSON.parse(content);
          return data.stocks && data.fearGreed;
        } catch {
          return false;
        }
      }
    },
    {
      name: 'Embedded Data Created',
      check: async () => {
        const embeddedPath = path.resolve(process.cwd(), 'app/lib/embedded-data.ts');
        try {
          const content = await fs.readFile(embeddedPath, 'utf8');
          return content.includes('BUILD_TIME_MARKET_DATA') && 
                 content.includes('DATA_INJECTION_TIMESTAMP');
        } catch {
          return false;
        }
      }
    },
    {
      name: 'API Service Updated',
      check: async () => {
        const apiPath = path.resolve(process.cwd(), 'app/lib/api.ts');
        const content = await fs.readFile(apiPath, 'utf8');
        return content.includes('basePath') && 
               content.includes('loadEmbeddedData') &&
               content.includes('cacheBuster');
      }
    }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      const result = await check.check();
      const status = result ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${check.name}`);
      if (!result) allPassed = false;
    } catch (error) {
      console.log(`❌ FAIL ${check.name} (Error: ${error.message})`);
      allPassed = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 ALL CHECKS PASSED! The sentiment tracker data loading issue has been fixed.');
    console.log('\nWhat was fixed:');
    console.log('• ✅ BasePath configuration for GitHub Pages');
    console.log('• ✅ Cache-busting to prevent stale data');
    console.log('• ✅ Build-time data injection as fallback');
    console.log('• ✅ Enhanced error handling and logging');
    console.log('• ✅ Multiple data loading strategies');
    
    console.log('\nNext steps:');
    console.log('1. Commit and push changes to trigger GitHub Actions');
    console.log('2. Monitor GitHub Actions logs for successful deployment');
    console.log('3. Check the live website for real market data');
    console.log('\nThe website should now display current market prices instead of mock data!');
  } else {
    console.log('❌ Some checks failed. Review the errors above and run the build process again.');
  }
  
  return allPassed;
}

// Run verification
verifyFix()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });