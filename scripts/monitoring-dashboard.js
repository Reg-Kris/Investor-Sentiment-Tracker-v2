#!/usr/bin/env node

/**
 * Comprehensive Monitoring Dashboard
 * Integrates performance metrics, cost analysis, and system health
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { cacheManager } from './cache-manager.js';
import { CostAnalyzer } from './cost-analysis.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class MonitoringDashboard {
  constructor() {
    this.metrics = {
      timestamp: new Date().toISOString(),
      system: {},
      performance: {},
      costs: {},
      alerts: [],
      recommendations: []
    };
  }

  /**
   * Collect system health metrics
   */
  async collectSystemMetrics() {
    const systemHealth = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };

    // Add cache health
    const cacheHealth = await cacheManager.getHealthReport();
    systemHealth.cache = cacheHealth;

    // Check disk space
    try {
      const diskUsage = await this.getDiskUsage();
      systemHealth.disk = diskUsage;
    } catch (error) {
      console.warn('Could not get disk usage:', error.message);
    }

    this.metrics.system = systemHealth;
    return systemHealth;
  }

  /**
   * Get disk usage information
   */
  async getDiskUsage() {
    try {
      const { stdout } = await import('child_process').then(cp => 
        new Promise((resolve, reject) => {
          cp.exec('df -h .', (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve({ stdout, stderr });
          });
        })
      );

      const lines = stdout.trim().split('\n');
      if (lines.length > 1) {
        const data = lines[1].split(/\s+/);
        return {
          filesystem: data[0],
          size: data[1],
          used: data[2],
          available: data[3],
          usePercent: data[4],
          mountPoint: data[5]
        };
      }
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Collect performance metrics
   */
  async collectPerformanceMetrics() {
    const performance = {
      build: null,
      runtime: {
        responseTime: await this.measureResponseTime(),
        memoryUsage: process.memoryUsage(),
        activeHandles: process._getActiveHandles().length,
        activeRequests: process._getActiveRequests().length
      },
      cache: cacheManager.getStats()
    };

    // Load latest build performance
    try {
      const reportPath = path.join(__dirname, '..', 'performance-reports', 'latest.json');
      if (await fs.pathExists(reportPath)) {
        performance.build = await fs.readJson(reportPath);
      }
    } catch (error) {
      console.warn('Could not load build performance:', error.message);
    }

    this.metrics.performance = performance;
    return performance;
  }

  /**
   * Measure application response time
   */
  async measureResponseTime() {
    const start = process.hrtime.bigint();
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 1));
    
    const end = process.hrtime.bigint();
    return Number(end - start) / 1000000; // Convert to milliseconds
  }

  /**
   * Collect cost metrics
   */
  async collectCostMetrics() {
    try {
      const costAnalyzer = new CostAnalyzer();
      const costReport = await costAnalyzer.generateReport();
      this.metrics.costs = costReport;
      return costReport;
    } catch (error) {
      console.warn('Could not collect cost metrics:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Generate alerts based on thresholds
   */
  generateAlerts() {
    const alerts = [];

    // Memory usage alerts
    const memoryUsage = this.metrics.system.memory;
    if (memoryUsage) {
      const memoryPercent = (memoryUsage.used / memoryUsage.total) * 100;
      if (memoryPercent > 90) {
        alerts.push({
          level: 'critical',
          type: 'memory',
          message: `Memory usage at ${memoryPercent.toFixed(1)}%`,
          threshold: 90,
          current: memoryPercent.toFixed(1)
        });
      } else if (memoryPercent > 75) {
        alerts.push({
          level: 'warning',
          type: 'memory',
          message: `Memory usage at ${memoryPercent.toFixed(1)}%`,
          threshold: 75,
          current: memoryPercent.toFixed(1)
        });
      }
    }

    // Cache performance alerts
    const cacheStats = this.metrics.performance.cache;
    if (cacheStats && cacheStats.hitRate < 0.5) {
      alerts.push({
        level: 'warning',
        type: 'cache',
        message: `Low cache hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`,
        threshold: 50,
        current: (cacheStats.hitRate * 100).toFixed(1)
      });
    }

    // Build performance alerts
    const buildPerf = this.metrics.performance.build;
    if (buildPerf && buildPerf.summary) {
      const buildTime = parseFloat(buildPerf.summary.buildTimeMinutes);
      if (buildTime > 5) {
        alerts.push({
          level: 'warning',
          type: 'build',
          message: `Long build time: ${buildTime} minutes`,
          threshold: 5,
          current: buildTime
        });
      }

      const bundleSize = parseInt(buildPerf.summary['bundle-size-bytes']) || 0;
      if (bundleSize > 2 * 1024 * 1024) { // 2MB
        alerts.push({
          level: 'warning',
          type: 'bundle',
          message: `Large bundle size: ${(bundleSize / 1024 / 1024).toFixed(2)}MB`,
          threshold: 2,
          current: (bundleSize / 1024 / 1024).toFixed(2)
        });
      }
    }

    // Cost alerts
    const costs = this.metrics.costs;
    if (costs && costs.costs && costs.costs.totalMonthlyCost > 50) {
      alerts.push({
        level: 'info',
        type: 'cost',
        message: `Monthly costs: $${costs.costs.totalMonthlyCost.toFixed(2)}`,
        threshold: 50,
        current: costs.costs.totalMonthlyCost.toFixed(2)
      });
    }

    this.metrics.alerts = alerts;
    return alerts;
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // Performance recommendations
    const cacheStats = this.metrics.performance.cache;
    if (cacheStats && cacheStats.hitRate < 0.7) {
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        title: 'Improve Cache Hit Rate',
        description: 'Consider increasing cache TTL or optimizing cache keys',
        impact: 'Reduce API calls and improve response times'
      });
    }

    const memoryUsage = this.metrics.system.memory;
    if (memoryUsage) {
      const memoryPercent = (memoryUsage.used / memoryUsage.total) * 100;
      if (memoryPercent > 70) {
        recommendations.push({
          category: 'system',
          priority: 'high',
          title: 'Optimize Memory Usage',
          description: 'Consider reducing memory footprint or increasing available memory',
          impact: 'Prevent out-of-memory errors and improve stability'
        });
      }
    }

    // Cost recommendations
    const costs = this.metrics.costs;
    if (costs && costs.recommendations && costs.recommendations.length > 0) {
      costs.recommendations.forEach(rec => {
        recommendations.push({
          category: 'cost',
          priority: rec.priority.toLowerCase(),
          title: rec.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: rec.message,
          impact: rec.estimatedSavings ? `Save $${rec.estimatedSavings.toFixed(2)}/month` : 'Reduce operational costs'
        });
      });
    }

    this.metrics.recommendations = recommendations;
    return recommendations;
  }

  /**
   * Generate health score (0-100)
   */
  calculateHealthScore() {
    let score = 100;
    
    // Deduct points for alerts
    this.metrics.alerts.forEach(alert => {
      switch (alert.level) {
        case 'critical':
          score -= 20;
          break;
        case 'warning':
          score -= 10;
          break;
        case 'info':
          score -= 2;
          break;
      }
    });

    // Performance factors
    const cacheStats = this.metrics.performance.cache;
    if (cacheStats && cacheStats.hitRate < 0.5) {
      score -= 15;
    }

    const memoryUsage = this.metrics.system.memory;
    if (memoryUsage) {
      const memoryPercent = (memoryUsage.used / memoryUsage.total) * 100;
      if (memoryPercent > 90) {
        score -= 25;
      } else if (memoryPercent > 75) {
        score -= 10;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate comprehensive dashboard report
   */
  async generateDashboard() {
    console.log('Collecting system metrics...');
    await this.collectSystemMetrics();
    
    console.log('Collecting performance metrics...');
    await this.collectPerformanceMetrics();
    
    console.log('Collecting cost metrics...');
    await this.collectCostMetrics();
    
    console.log('Generating alerts and recommendations...');
    this.generateAlerts();
    this.generateRecommendations();
    
    const healthScore = this.calculateHealthScore();
    
    const dashboard = {
      ...this.metrics,
      healthScore,
      status: healthScore >= 90 ? 'excellent' : healthScore >= 75 ? 'good' : healthScore >= 60 ? 'fair' : 'poor',
      summary: {
        totalAlerts: this.metrics.alerts.length,
        criticalAlerts: this.metrics.alerts.filter(a => a.level === 'critical').length,
        warningAlerts: this.metrics.alerts.filter(a => a.level === 'warning').length,
        totalRecommendations: this.metrics.recommendations.length,
        highPriorityRecommendations: this.metrics.recommendations.filter(r => r.priority === 'high').length
      }
    };

    return dashboard;
  }

  /**
   * Save dashboard to file
   */
  async saveDashboard(dashboard) {
    const dashboardDir = path.join(__dirname, '..', 'monitoring-reports');
    await fs.ensureDir(dashboardDir);
    
    const filename = `dashboard-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(dashboardDir, filename);
    
    await fs.writeJson(filepath, dashboard, { spaces: 2 });
    await fs.writeJson(path.join(dashboardDir, 'latest.json'), dashboard, { spaces: 2 });
    
    console.log(`Dashboard saved to: ${filepath}`);
    return filepath;
  }

  /**
   * Print dashboard summary
   */
  printSummary(dashboard) {
    console.log('\n=== MONITORING DASHBOARD ===');
    console.log(`Health Score: ${dashboard.healthScore}/100 (${dashboard.status.toUpperCase()})`);
    console.log(`Timestamp: ${dashboard.timestamp}`);
    
    console.log('\n--- SYSTEM STATUS ---');
    console.log(`Memory Usage: ${((dashboard.system.memory.used / dashboard.system.memory.total) * 100).toFixed(1)}%`);
    console.log(`Cache Hit Rate: ${(dashboard.performance.cache.hitRate * 100).toFixed(1)}%`);
    console.log(`Active Handles: ${dashboard.performance.runtime.activeHandles}`);
    
    if (dashboard.costs && dashboard.costs.costs) {
      console.log('\n--- COST ANALYSIS ---');
      console.log(`Monthly Cost: $${dashboard.costs.costs.totalMonthlyCost.toFixed(2)}`);
      console.log(`Cost Reduction: ${dashboard.costs.costs.costReduction}%`);
      console.log(`Optimization Score: ${dashboard.costs.summary.optimizationScore}/100`);
    }
    
    if (dashboard.alerts.length > 0) {
      console.log('\n--- ALERTS ---');
      dashboard.alerts.forEach(alert => {
        const icon = alert.level === 'critical' ? '🚨' : alert.level === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${icon} [${alert.level.toUpperCase()}] ${alert.message}`);
      });
    }
    
    if (dashboard.recommendations.length > 0) {
      console.log('\n--- RECOMMENDATIONS ---');
      dashboard.recommendations.slice(0, 5).forEach((rec, i) => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        console.log(`${i + 1}. ${priority} ${rec.title}: ${rec.description}`);
      });
    }
    
    console.log('\n=============================\n');
  }

  /**
   * Generate HTML dashboard report
   */
  generateHTMLReport(dashboard) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monitoring Dashboard</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .score { font-size: 3em; font-weight: bold; color: ${dashboard.healthScore >= 90 ? '#10b981' : dashboard.healthScore >= 75 ? '#f59e0b' : '#ef4444'}; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .alert { padding: 10px; margin: 5px 0; border-radius: 4px; border-left: 4px solid; }
        .alert.critical { background: #fef2f2; border-color: #ef4444; }
        .alert.warning { background: #fffbeb; border-color: #f59e0b; }
        .alert.info { background: #eff6ff; border-color: #3b82f6; }
        .metric { display: flex; justify-content: between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .metric:last-child { border-bottom: none; }
        .recommendation { background: #f9fafb; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #6366f1; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>System Monitoring Dashboard</h1>
            <div class="score">${dashboard.healthScore}/100</div>
            <p>Status: <strong>${dashboard.status.toUpperCase()}</strong></p>
            <p>Last Updated: ${new Date(dashboard.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h2>System Health</h2>
                <div class="metric">
                    <span>Memory Usage</span>
                    <span>${((dashboard.system.memory.used / dashboard.system.memory.total) * 100).toFixed(1)}%</span>
                </div>
                <div class="metric">
                    <span>Cache Hit Rate</span>
                    <span>${(dashboard.performance.cache.hitRate * 100).toFixed(1)}%</span>
                </div>
                <div class="metric">
                    <span>Active Handles</span>
                    <span>${dashboard.performance.runtime.activeHandles}</span>
                </div>
            </div>
            
            ${dashboard.costs && dashboard.costs.costs ? `
            <div class="card">
                <h2>Cost Analysis</h2>
                <div class="metric">
                    <span>Monthly Cost</span>
                    <span>$${dashboard.costs.costs.totalMonthlyCost.toFixed(2)}</span>
                </div>
                <div class="metric">
                    <span>Savings</span>
                    <span>$${dashboard.costs.costs.optimizationSavings.toFixed(2)}</span>
                </div>
                <div class="metric">
                    <span>Optimization Score</span>
                    <span>${dashboard.costs.summary.optimizationScore}/100</span>
                </div>
            </div>
            ` : ''}
            
            ${dashboard.alerts.length > 0 ? `
            <div class="card">
                <h2>Alerts</h2>
                ${dashboard.alerts.map(alert => 
                    `<div class="alert ${alert.level}">${alert.message}</div>`
                ).join('')}
            </div>
            ` : ''}
            
            ${dashboard.recommendations.length > 0 ? `
            <div class="card">
                <h2>Recommendations</h2>
                ${dashboard.recommendations.slice(0, 5).map(rec => 
                    `<div class="recommendation">
                        <strong>${rec.title}</strong><br>
                        ${rec.description}<br>
                        <small>Impact: ${rec.impact}</small>
                    </div>`
                ).join('')}
            </div>
            ` : ''}
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * Save HTML report
   */
  async saveHTMLReport(dashboard) {
    const html = this.generateHTMLReport(dashboard);
    const dashboardDir = path.join(__dirname, '..', 'monitoring-reports');
    const filepath = path.join(dashboardDir, 'dashboard.html');
    
    await fs.writeFile(filepath, html);
    console.log(`HTML dashboard saved to: ${filepath}`);
    return filepath;
  }
}

async function main() {
  const monitor = new MonitoringDashboard();
  
  console.log('Generating monitoring dashboard...');
  
  const dashboard = await monitor.generateDashboard();
  await monitor.saveDashboard(dashboard);
  await monitor.saveHTMLReport(dashboard);
  monitor.printSummary(dashboard);
  
  return dashboard;
}

export { MonitoringDashboard };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Monitoring dashboard failed:', error);
    process.exit(1);
  });
}