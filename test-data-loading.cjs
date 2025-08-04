#!/usr/bin/env node

/**
 * Data Loading Test Suite
 * Comprehensive testing strategy for sentiment tracker data loading
 */

const fs = require('fs/promises');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class DataLoadingTester {
  constructor() {
    this.testResults = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addTestResult(testName, passed, message, details = null) {
    const result = {
      testName,
      passed,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.tests.push(result);
    this.testResults.summary.total++;
    
    if (passed) {
      this.testResults.summary.passed++;
      this.log(`${testName}: ${message}`, 'success');
    } else {
      this.testResults.summary.failed++;
      this.log(`${testName}: ${message}`, 'error');
      if (details) {
        this.log(`Details: ${JSON.stringify(details, null, 2)}`, 'error');
      }
    }
  }

  async testDataFetch() {
    this.log('🚀 Testing data fetch functionality...');
    
    try {
      // Test simple fetch script
      const { stdout, stderr } = await execAsync('node simple-fetch.js');
      
      if (stderr && stderr.includes('Error')) {
        this.addTestResult('Data Fetch', false, 'Simple fetch script reported errors', { stderr });
        return false;
      }
      
      // Check if data files were created
      const publicDataExists = await this.fileExists('public/data/market-data.json');
      const dataDataExists = await this.fileExists('data/latest.json');
      
      if (!publicDataExists) {
        this.addTestResult('Data Fetch', false, 'Public data file not created');
        return false;
      }
      
      if (!dataDataExists) {
        this.addTestResult('Data Fetch', false, 'Data directory file not created');
        return false;
      }
      
      this.addTestResult('Data Fetch', true, 'Data fetch completed successfully');
      return true;
      
    } catch (error) {
      this.addTestResult('Data Fetch', false, 'Data fetch failed', { error: error.message });
      return false;
    }
  }

  async testDataStructure() {
    this.log('🔍 Testing data structure validity...');
    
    try {
      const dataPath = path.resolve(process.cwd(), 'public/data/market-data.json');
      const dataContent = await fs.readFile(dataPath, 'utf8');
      const marketData = JSON.parse(dataContent);
      
      // Test required structure
      const requiredFields = ['timestamp', 'stocks', 'fearGreed'];
      const missingFields = requiredFields.filter(field => !marketData[field]);
      
      if (missingFields.length > 0) {
        this.addTestResult('Data Structure', false, 'Missing required fields', { missingFields });
        return false;
      }
      
      // Test stocks data
      const requiredStocks = ['SPY', 'QQQ', '^VIX'];
      const missingStocks = requiredStocks.filter(stock => !marketData.stocks[stock]);
      
      if (missingStocks.length > 0) {
        this.addTestResult('Data Structure', false, 'Missing required stock data', { missingStocks });
        return false;
      }
      
      // Test stock data structure
      for (const stock of requiredStocks) {
        const stockData = marketData.stocks[stock];
        if (typeof stockData.price !== 'number' || typeof stockData.change !== 'number') {
          this.addTestResult('Data Structure', false, `Invalid ${stock} data structure`, { stockData });
          return false;
        }
      }
      
      // Test fear & greed data
      if (typeof marketData.fearGreed.value !== 'number') {
        this.addTestResult('Data Structure', false, 'Invalid Fear & Greed data structure', { 
          fearGreed: marketData.fearGreed 
        });
        return false;
      }
      
      this.addTestResult('Data Structure', true, 'Data structure is valid');
      return true;
      
    } catch (error) {
      this.addTestResult('Data Structure', false, 'Data structure test failed', { error: error.message });
      return false;
    }
  }

  async testBuildTimeInjection() {
    this.log('📦 Testing build-time data injection...');
    
    try {
      // Test build-time data injection
      await execAsync('npm run inject-data');
      
      const embeddedDataExists = await this.fileExists('app/lib/embedded-data.ts');
      if (!embeddedDataExists) {
        this.addTestResult('Build-Time Injection', false, 'Build-time data injection failed');
        return false;
      }
      
      const embeddedContent = await fs.readFile('app/lib/embedded-data.ts', 'utf8');
      
      // Check for required exports
      const hasDataExport = embeddedContent.includes('export const BUILD_TIME_MARKET_DATA');
      const hasTimestampExport = embeddedContent.includes('export const DATA_INJECTION_TIMESTAMP');
      
      if (!hasDataExport || !hasTimestampExport) {
        this.addTestResult('Build-Time Injection', false, 'Embedded data file missing required exports');
        return false;
      }
      
      this.addTestResult('Build-Time Injection', true, 'Build-time data injection successful');
      return true;
      
    } catch (error) {
      this.addTestResult('Build-Time Injection', false, 'Build-time injection failed', { error: error.message });
      return false;
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(path.resolve(process.cwd(), filePath));
      return true;
    } catch {
      return false;
    }
  }

  async runQuickTests() {
    this.log('🧪 Starting quick data loading tests...');
    
    const tests = [
      { name: 'Data Fetch', fn: () => this.testDataFetch() },
      { name: 'Data Structure', fn: () => this.testDataStructure() },
      { name: 'Build-Time Injection', fn: () => this.testBuildTimeInjection() }
    ];
    
    for (const test of tests) {
      try {
        await test.fn();
      } catch (error) {
        this.addTestResult(test.name, false, 'Test execution failed', { error: error.message });
      }
    }
    
    // Generate summary
    this.log('📊 Test Summary:');
    this.log(`Total tests: ${this.testResults.summary.total}`);
    this.log(`Passed: ${this.testResults.summary.passed}`, 'success');
    this.log(`Failed: ${this.testResults.summary.failed}`, this.testResults.summary.failed > 0 ? 'error' : 'info');
    
    const successRate = (this.testResults.summary.passed / this.testResults.summary.total) * 100;
    this.log(`Success rate: ${successRate.toFixed(1)}%`);
    
    return this.testResults.summary.failed === 0;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new DataLoadingTester();
  tester.runQuickTests()
    .then((allTestsPassed) => {
      if (allTestsPassed) {
        console.log('🎉 All tests passed!');
        process.exit(0);
      } else {
        console.log('💥 Some tests failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Test suite execution failed:', error);
      process.exit(1);
    });
}

module.exports = DataLoadingTester;