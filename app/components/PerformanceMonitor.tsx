'use client';

import { useEffect, useRef } from 'react';
// Removed logger import for static build compatibility

interface PerformanceMetrics {
  navigation: {
    loadComplete: number;
    domContentLoaded: number;
    timeToFirstByte: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    cumulativeLayoutShift?: number;
    firstInputDelay?: number;
  };
  resources: {
    totalSize: number;
    resourceCount: number;
    slowestResource: string;
    slowestResourceTime: number;
  };
  vitals: {
    lcp?: number;
    fid?: number;
    cls?: number;
  };
}

declare global {
  interface Window {
    webVitals?: any;
  }
}

const PerformanceMonitor = () => {
  const hasReported = useRef(false);
  const observer = useRef<PerformanceObserver | null>(null);
  const vitalsData = useRef<{ lcp?: number; fid?: number; cls?: number }>({});

  useEffect(() => {
    if (typeof window === 'undefined' || hasReported.current) return;

    const reportPerformanceMetrics = () => {
      try {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

        // Navigation timing metrics
        const navigationMetrics = {
          loadComplete: Math.round(navigation.loadEventEnd - navigation.fetchStart),
          domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
          timeToFirstByte: Math.round(navigation.responseStart - navigation.fetchStart),
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
          largestContentfulPaint: vitalsData.current.lcp,
          cumulativeLayoutShift: vitalsData.current.cls,
          firstInputDelay: vitalsData.current.fid
        };

        // Resource timing metrics
        let totalSize = 0;
        let slowestResource = '';
        let slowestResourceTime = 0;

        resources.forEach(resource => {
          const size = resource.transferSize || resource.encodedBodySize || 0;
          totalSize += size;

          const duration = resource.responseEnd - resource.requestStart;
          if (duration > slowestResourceTime) {
            slowestResourceTime = duration;
            slowestResource = resource.name;
          }
        });

        const metrics: PerformanceMetrics = {
          navigation: navigationMetrics,
          resources: {
            totalSize: Math.round(totalSize / 1024), // KB
            resourceCount: resources.length,
            slowestResource: slowestResource.split('/').pop() || 'unknown',
            slowestResourceTime: Math.round(slowestResourceTime)
          },
          vitals: vitalsData.current
        };

        // Log performance metrics
        console.info('Performance metrics collected', metrics);

        // Check for performance issues and warn
        const warnings = [];
        
        if (navigationMetrics.loadComplete > 3000) {
          warnings.push(`Slow page load: ${navigationMetrics.loadComplete}ms`);
        }
        
        if (navigationMetrics.timeToFirstByte > 1000) {
          warnings.push(`High TTFB: ${navigationMetrics.timeToFirstByte}ms`);
        }
        
        if (vitalsData.current.lcp && vitalsData.current.lcp > 2500) {
          warnings.push(`Poor LCP: ${vitalsData.current.lcp}ms (should be < 2500ms)`);
        }
        
        if (vitalsData.current.fid && vitalsData.current.fid > 100) {
          warnings.push(`Poor FID: ${vitalsData.current.fid}ms (should be < 100ms)`);
        }
        
        if (vitalsData.current.cls && vitalsData.current.cls > 0.1) {
          warnings.push(`Poor CLS: ${vitalsData.current.cls} (should be < 0.1)`);
        }
        
        if (metrics.resources.totalSize > 2048) { // 2MB
          warnings.push(`Large page size: ${metrics.resources.totalSize}KB`);
        }

        if (warnings.length > 0) {
          console.warn('Performance issues detected', { warnings, metrics });
        }

        // Send to performance monitoring endpoint
        fetch('/api/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            connectionType: (navigator as any).connection?.effectiveType || 'unknown',
            metrics,
            warnings
          })
        }).catch(error => {
          console.error('Failed to send performance metrics', error);
        });

        hasReported.current = true;

      } catch (error) {
        console.error('Error collecting performance metrics', error as Error);
      }
    };

    // Setup Web Vitals collection
    const setupWebVitals = () => {
      if ('PerformanceObserver' in window) {
        // Largest Contentful Paint
        try {
          const lcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            vitalsData.current.lcp = Math.round(lastEntry.startTime);
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          console.log('LCP observer not supported');
        }

        // First Input Delay
        try {
          const fidObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach((entry: any) => {
              if (entry.processingStart && entry.startTime) {
                vitalsData.current.fid = Math.round(entry.processingStart - entry.startTime);
              }
            });
          });
          fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (e) {
          console.log('FID observer not supported');
        }

        // Cumulative Layout Shift
        try {
          const clsObserver = new PerformanceObserver((entryList) => {
            let clsValue = 0;
            entryList.getEntries().forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            });
            vitalsData.current.cls = Math.round(clsValue * 10000) / 10000;
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          console.log('CLS observer not supported');
        }
      }
    };

    // Setup monitoring
    setupWebVitals();

    // Report metrics after page load
    const reportTimer = setTimeout(() => {
      reportPerformanceMetrics();
    }, 3000); // Wait 3 seconds after mount

    // Also report on page unload
    const handleBeforeUnload = () => {
      if (!hasReported.current) {
        reportPerformanceMetrics();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(reportTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  // Monitor resource loading errors
  useEffect(() => {
    const handleResourceError = (event: ErrorEvent | Event) => {
      const target = event.target as HTMLElement;
      if (target && target.tagName) {
        console.error('Resource loading failed', new Error('Resource load error'), {
          tagName: target.tagName,
          src: (target as any).src || (target as any).href,
          currentSrc: (target as any).currentSrc,
          error: event
        });
      }
    };

    // Listen for resource loading errors
    window.addEventListener('error', handleResourceError, true);

    return () => {
      window.removeEventListener('error', handleResourceError, true);
    };
  }, []);

  // Monitor JavaScript errors
  useEffect(() => {
    const handleUnhandledError = (event: ErrorEvent) => {
      console.error('Unhandled JavaScript error', new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection', new Error(String(event.reason)), {
        reason: event.reason,
        promise: event.promise
      });
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null; // This is a monitoring component, no UI
};

export default PerformanceMonitor;