export class CircuitBreaker {
  constructor(maxFailures = 3) {
    this.failures = new Map();
    this.maxFailures = maxFailures;
  }

  isOpen(url) {
    const failures = this.failures.get(url) || 0;
    return failures >= this.maxFailures;
  }

  recordFailure(url) {
    const failures = this.failures.get(url) || 0;
    this.failures.set(url, failures + 1);
  }

  reset(url) {
    this.failures.delete(url);
  }

  getStatus() {
    return {
      activeCircuits: this.failures.size,
      failures: Array.from(this.failures.entries())
    };
  }
}