/**
 * Simple Performance Tracker for Theme Operations
 * Minimal utility to measure and compare performance metrics
 */

export class PerformanceTracker {
  private static results: Record<string, number[]> = {};

  /**
   * Measure synchronous operation
   */
  static measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    this.logResult(name, duration);
    return result;
  }

  /**
   * Measure asynchronous operation  
   */
  static async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    this.logResult(name, duration);
    return result;
  }

  /**
   * Log and store result
   */
  private static logResult(name: string, duration: number) {
    if (!this.results[name]) {
      this.results[name] = [];
    }
    this.results[name].push(duration);
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
  }

  /**
   * Get statistics for specific operation
   */
  static getStats(name: string) {
    const times = this.results[name] || [];
    if (times.length === 0) return null;

    const sum = times.reduce((a, b) => a + b, 0);
    const avg = sum / times.length;

    return {
      avg: avg.toFixed(2),
      min: Math.min(...times).toFixed(2),
      max: Math.max(...times).toFixed(2),
      count: times.length
    };
  }

  /**
   * Get all performance statistics
   */
  static getAllStats() {
    return Object.keys(this.results).reduce((acc, key) => {
      acc[key] = this.getStats(key);
      return acc;
    }, {} as Record<string, any>);
  }

  /**
   * Reset all stored results
   */
  static reset() {
    this.results = {};
    console.log('🔄 Performance tracker reset');
  }

  /**
   * Get raw data for specific operation
   */
  static getRawData(name: string): number[] {
    return [...(this.results[name] || [])];
  }

  /**
   * Export all data as JSON
   */
  static exportData() {
    return {
      timestamp: new Date().toISOString(),
      stats: this.getAllStats(),
      raw: { ...this.results }
    };
  }
}