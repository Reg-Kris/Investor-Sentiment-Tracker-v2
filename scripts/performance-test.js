#!/usr/bin/env node

/**
 * Performance Testing and Monitoring Script
 * Measures build performance, bundle size, and resource usage
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  maxBundleSize: 2 * 1024 * 1024, // 2MB
  maxBuildTime: 120, // 2 minutes
  maxLargeFileSize: 100 * 1024, // 100KB
  maxLargeFileCount: 10
};

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      timestamp: new Date().toISOString(),
      bundleSize: 0,
      buildTime: 0,
      largeFiles: [],
      warnings: [],
      errors: []
    };
  }

  async analyzeBundleSize() {
    const outDir = path.join(projectRoot, 'out');
    
    if (!fs.existsSync(outDir)) {
      this.metrics.errors.push('Output directory not found. Run build first.');
      return;
    }

    try {
      const { stdout } = await import('child_process').then(cp => 
        new Promise((resolve, reject) => {
          cp.exec(`du -sb ${outDir}`, (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve({ stdout, stderr });
          });
        })
      );

      this.metrics.bundleSize = parseInt(stdout.split('\t')[0]);
      
      // Check bundle size threshold
      if (this.metrics.bundleSize > PERFORMANCE_THRESHOLDS.maxBundleSize) {
        this.metrics.warnings.push(
          `Bundle size (${(this.metrics.bundleSize / 1024 / 1024).toFixed(2)}MB) exceeds threshold (${PERFORMANCE_THRESHOLDS.maxBundleSize / 1024 / 1024}MB)`
        );
      }

      // Find large files
      await this.findLargeFiles(outDir);
      
    } catch (error) {
      this.metrics.errors.push(`Bundle analysis failed: ${error.message}`);
    }
  }

  async findLargeFiles(dir) {
    try {
      const { stdout } = await import('child_process').then(cp => 
        new Promise((resolve, reject) => {
          cp.exec(`find ${dir} -type f -size +${PERFORMANCE_THRESHOLDS.maxLargeFileSize}c -exec ls -lh {} \\;`, 
            (error, stdout, stderr) => {
              if (error && error.code !== 1) reject(error); // code 1 means no files found
              else resolve({ stdout, stderr });
            }
          );
        })
      );

      if (stdout.trim()) {
        const files = stdout.trim().split('\n').map(line => {
          const parts = line.split(/\s+/);
          return {
            size: parts[4],
            path: parts.slice(8).join(' ').replace(dir, '')
          };
        });

        this.metrics.largeFiles = files;

        if (files.length > PERFORMANCE_THRESHOLDS.maxLargeFileCount) {
          this.metrics.warnings.push(
            `Too many large files (${files.length}) exceeds threshold (${PERFORMANCE_THRESHOLDS.maxLargeFileCount})`
          );
        }
      }
    } catch (error) {
      this.metrics.errors.push(`Large file analysis failed: ${error.message}`);
    }
  }

  generateReport() {
    const report = {
      ...this.metrics,
      summary: {
        bundleSizeMB: (this.metrics.bundleSize / 1024 / 1024).toFixed(2),
        buildTimeMinutes: (this.metrics.buildTime / 60).toFixed(2),
        status: this.metrics.errors.length > 0 ? 'ERROR' : 
                this.metrics.warnings.length > 0 ? 'WARNING' : 'PASS',
        score: this.calculatePerformanceScore()
      }
    };

    return report;
  }

  calculatePerformanceScore() {
    let score = 100;
    
    // Bundle size penalty
    if (this.metrics.bundleSize > PERFORMANCE_THRESHOLDS.maxBundleSize) {
      score -= 20;
    }
    
    // Large files penalty
    if (this.metrics.largeFiles.length > PERFORMANCE_THRESHOLDS.maxLargeFileCount) {
      score -= 15;
    }
    
    // Warnings penalty
    score -= this.metrics.warnings.length * 5;
    
    // Errors penalty
    score -= this.metrics.errors.length * 10;
    
    return Math.max(0, score);
  }

  async saveReport(report) {
    const reportsDir = path.join(projectRoot, 'performance-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `performance-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(reportsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    
    // Also save as latest
    fs.writeFileSync(
      path.join(reportsDir, 'latest.json'), 
      JSON.stringify(report, null, 2)
    );
    
    console.log(`Performance report saved to: ${filepath}`);
  }

  printReport(report) {
    console.log('\n=== PERFORMANCE REPORT ===');
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Bundle Size: ${report.summary.bundleSizeMB}MB`);
    console.log(`Build Time: ${report.summary.buildTimeMinutes} minutes`);
    console.log(`Performance Score: ${report.summary.score}/100`);
    console.log(`Status: ${report.summary.status}`);
    
    if (report.largeFiles.length > 0) {
      console.log('\nLarge Files:');
      report.largeFiles.forEach(file => {
        console.log(`  - ${file.path}: ${file.size}`);
      });
    }
    
    if (report.warnings.length > 0) {
      console.log('\nWarnings:');
      report.warnings.forEach(warning => {
        console.log(`  ⚠️  ${warning}`);
      });
    }
    
    if (report.errors.length > 0) {
      console.log('\nErrors:');
      report.errors.forEach(error => {
        console.log(`  ❌ ${error}`);
      });
    }
    
    console.log('\n=========================\n');
  }
}

async function main() {
  const monitor = new PerformanceMonitor();
  
  console.log('Starting performance analysis...');
  
  // Analyze current build
  await monitor.analyzeBundleSize();
  
  // Generate and save report
  const report = monitor.generateReport();
  await monitor.saveReport(report);
  monitor.printReport(report);
  
  // Exit with appropriate code
  if (report.summary.status === 'ERROR') {
    process.exit(1);
  } else if (report.summary.status === 'WARNING') {
    process.exit(0); // Don't fail CI for warnings
  } else {
    process.exit(0);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Performance test failed:', error);
    process.exit(1);
  });
}