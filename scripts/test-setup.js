#!/usr/bin/env node

// Simple test script to verify setup and dependencies
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing script setup...\n');

// Test 1: Check dependencies
console.log('1. Checking dependencies...');
try {
  await import('axios');
  await import('node-cache');
  await import('vader-sentiment');
  await import('dotenv');
  await import('cheerio');
  await import('rss-parser');
  console.log('   ✅ All dependencies available\n');
} catch (error) {
  console.log('   ❌ Missing dependencies:', error.message);
  process.exit(1);
}

// Test 2: Check directory structure
console.log('2. Checking directory structure...');
const publicDataDir = path.resolve(__dirname, '../public/data');
if (await fs.pathExists(publicDataDir)) {
  console.log('   ✅ public/data directory exists');
} else {
  console.log('   ⚠️  Creating public/data directory...');
  await fs.ensureDir(publicDataDir);
  console.log('   ✅ public/data directory created');
}

// Test 3: Check environment file
console.log('\n3. Checking environment configuration...');
const envPath = path.resolve(__dirname, '../.env.local');
const envExamplePath = path.resolve(__dirname, '../.env.local.example');

if (await fs.pathExists(envPath)) {
  console.log('   ✅ .env.local file exists');
} else if (await fs.pathExists(envExamplePath)) {
  console.log('   ⚠️  .env.local not found, but .env.local.example exists');
  console.log('   📝 Copy .env.local.example to .env.local and add your API keys');
} else {
  console.log('   ❌ No environment files found');
}

// Test 4: Test basic functionality (without API calls)
console.log('\n4. Testing basic script functionality...');
try {
  // Test cache initialization
  const NodeCache = (await import('node-cache')).default;
  const testCache = new NodeCache({ stdTTL: 60 });
  testCache.set('test', 'value');
  const retrieved = testCache.get('test');
  
  if (retrieved === 'value') {
    console.log('   ✅ Cache functionality working');
  } else {
    console.log('   ❌ Cache test failed');
  }

  // Test VADER sentiment
  const vader = await import('vader-sentiment');
  const testSentiment = vader.SentimentIntensityAnalyzer.polarity_scores('This is a positive test message');
  
  if (testSentiment && typeof testSentiment.compound === 'number') {
    console.log('   ✅ VADER sentiment analysis working');
  } else {
    console.log('   ❌ VADER sentiment test failed');
  }

} catch (error) {
  console.log('   ❌ Basic functionality test failed:', error.message);
}

// Test 5: Create sample JSON file
console.log('\n5. Testing JSON file creation...');
try {
  const testData = {
    test: true,
    timestamp: new Date().toISOString(),
    message: 'Test data successfully created'
  };
  
  const testFilePath = path.resolve(publicDataDir, 'test-output.json');
  await fs.writeJSON(testFilePath, testData, { spaces: 2 });
  
  // Verify file was created and is readable
  const readData = await fs.readJSON(testFilePath);
  if (readData.test === true) {
    console.log('   ✅ JSON file creation and reading works');
    // Clean up test file
    await fs.remove(testFilePath);
  } else {
    console.log('   ❌ JSON file test failed');
  }
} catch (error) {
  console.log('   ❌ JSON file test failed:', error.message);
}

console.log('\n🎉 Setup test completed!');
console.log('\nNext steps:');
console.log('1. Copy .env.local.example to .env.local');
console.log('2. Add your API keys to .env.local');
console.log('3. Run: npm run update');
console.log('\nAvailable commands:');
console.log('- npm run fetch        # Fetch market data only');
console.log('- npm run analyze      # Run sentiment analysis only');
console.log('- npm run update       # Run both processes');