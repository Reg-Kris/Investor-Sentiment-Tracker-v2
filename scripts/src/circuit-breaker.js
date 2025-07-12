import { CONFIG } from './config.js';

export class CircuitBreaker {
  constructor() {
    this.failures = new Map();
  }

  isOpen(url) {
    const failureCount = this.failures.get(url) || 0;
    return failureCount >= CONFIG.maxFailures;
  }

  recordFailure(url) {
    const failures = this.failures.get(url) || 0;
    this.failures.set(url, failures + 1);
  }

  reset(url) {
    this.failures.delete(url);
  }

  getActiveCount() {
    return this.failures.size;
  }
}