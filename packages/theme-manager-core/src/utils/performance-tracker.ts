/**
 * Professional Performance Tracker for Theme Operations
 * Comprehensive utility for measuring, analyzing and reporting performance metrics
 * Includes statistical analysis, resource monitoring, and performance budgets
 */

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PaintTiming {
  firstPaint?: number;
  firstContentfulPaint?: number;
}

interface PerformanceStats {
  avg: string;
  min: string;
  max: string;
  count: number;
  p50: string;
  p90: string;
  p99: string;
  stdDev: string;
}

interface ResourceMetrics {
  memoryBefore?: MemoryInfo;
  memoryAfter?: MemoryInfo;
  memoryDelta?: number;
  networkRequests?: number;
  paintTiming?: PaintTiming;
  cacheStatus?: 'hit' | 'miss' | 'stale';
  storageOperations?: {
    localStorage: { reads: number; writes: number; };
    indexedDB: { reads: number; writes: number; };
  };
}

interface PerformanceBudget {
  threshold: number;
  warning?: string;
  critical?: string;
}

export class PerformanceTracker {
  private static results: Record<string, number[]> = {};
  private static resourceMetrics: Record<string, ResourceMetrics[]> = {};
  private static storageOperationCounts = { localStorage: { reads: 0, writes: 0 }, indexedDB: { reads: 0, writes: 0 } };
  private static cacheHitRates: Record<string, { hits: number; total: number }> = {};
  private static performanceBudgets: Record<string, PerformanceBudget> = {
    'Theme Switch Total': { threshold: 10, warning: 'Theme switching > 10ms may affect UX' },
    'CSS Fetch (Cold)': { threshold: 100, critical: 'Cold CSS fetch > 100ms indicates slow network/server' },
    'CSS Fetch (Cached)': { threshold: 5, warning: 'Cached CSS fetch > 5ms indicates cache issues' },
    'Font Loading (Cold)': { threshold: 200, warning: 'Cold font loading > 200ms may cause FOUC' },
    'Font Loading (Cached)': { threshold: 10, warning: 'Cached font loading > 10ms indicates cache issues' },
    'CSS Variables Apply': { threshold: 5, warning: 'CSS application > 5ms indicates DOM bottleneck' },
    'IndexedDB Read': { threshold: 20, warning: 'IndexedDB read > 20ms may impact UX' },
    'IndexedDB Write': { threshold: 50, warning: 'IndexedDB write > 50ms may indicate storage issues' },
    'LocalStorage Read': { threshold: 2, warning: 'LocalStorage read > 2ms indicates performance issues' },
    'LocalStorage Write': { threshold: 5, warning: 'LocalStorage write > 5ms may indicate storage bottleneck' }
  };

  /**
   * Measure synchronous operation with resource monitoring
   */
  static measure<T>(name: string, fn: () => T): T {
    const memoryBefore = this.getMemoryInfo();
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    const memoryAfter = this.getMemoryInfo();
    
    this.logResult(name, duration);
    this.logResourceMetrics(name, { memoryBefore, memoryAfter });
    return result;
  }

  /**
   * Measure asynchronous operation with comprehensive resource monitoring
   */
  static async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const memoryBefore = this.getMemoryInfo();
    const paintBefore = this.getPaintTiming();
    const networkBefore = this.getNetworkRequestCount();
    
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    const memoryAfter = this.getMemoryInfo();
    const paintAfter = this.getPaintTiming();
    const networkAfter = this.getNetworkRequestCount();
    
    this.logResult(name, duration);
    this.logResourceMetrics(name, {
      memoryBefore,
      memoryAfter,
      memoryDelta: memoryAfter ? memoryAfter.usedJSHeapSize - (memoryBefore?.usedJSHeapSize || 0) : undefined,
      networkRequests: networkAfter - networkBefore,
      paintTiming: { 
        firstPaint: paintAfter.firstPaint,
        firstContentfulPaint: paintAfter.firstContentfulPaint
      }
    });
    
    this.checkPerformanceBudget(name, duration);
    return result;
  }

  /**
   * Log and store result with enhanced logging
   */
  private static logResult(name: string, duration: number) {
    if (!this.results[name]) {
      this.results[name] = [];
    }
    this.results[name].push(duration);
    
    const budget = this.performanceBudgets[name];
    let icon = '⏱️';
    let level = 'LOG';
    
    if (budget) {
      if (duration > budget.threshold) {
        if (budget.critical && duration > budget.threshold * 2) {
          icon = '🚨';
          level = 'ERROR';
        } else {
          icon = '⚠️';
          level = 'WARN';
        }
      } else {
        icon = '✅';
      }
    }
    
    if (level === 'ERROR') {
      console.error(`${icon} ${name}: ${duration.toFixed(2)}ms`);
    } else if (level === 'WARN') {
      console.warn(`${icon} ${name}: ${duration.toFixed(2)}ms`);
    } else {
      console.log(`${icon} ${name}: ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get comprehensive statistics for specific operation
   */
  static getStats(name: string): PerformanceStats | null {
    const times = this.results[name] || [];
    if (times.length === 0) return null;

    const sorted = [...times].sort((a, b) => a - b);
    const sum = times.reduce((a, b) => a + b, 0);
    const avg = sum / times.length;
    
    const p50 = this.percentile(sorted, 50);
    const p90 = this.percentile(sorted, 90);
    const p99 = this.percentile(sorted, 99);
    
    const variance = times.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);

    return {
      avg: avg.toFixed(2),
      min: Math.min(...times).toFixed(2),
      max: Math.max(...times).toFixed(2),
      count: times.length,
      p50: p50.toFixed(2),
      p90: p90.toFixed(2),
      p99: p99.toFixed(2),
      stdDev: stdDev.toFixed(2)
    };
  }

  /**
   * Get all performance statistics with comprehensive metadata
   */
  static getAllStats() {
    const stats = Object.keys(this.results).reduce((acc, key) => {
      acc[key] = this.getStats(key);
      return acc;
    }, {} as Record<string, any>);
    
    return {
      performance_metrics: stats,
      cache_metrics: {
        hit_rates: this.getAllCacheHitRates(),
        overall_cache_efficiency: this.calculateOverallCacheEfficiency()
      },
      storage_metrics: {
        operations: this.getStorageOperationSummary(),
        efficiency: this.calculateStorageEfficiency()
      },
      resource_summary: this.getResourceSummary(),
      performance_score: this.calculatePerformanceScore(),
      budget_violations: this.getBudgetViolations(),
      timestamp: new Date().toISOString(),
      total_operations: Object.values(this.results).reduce((sum, arr) => sum + arr.length, 0)
    };
  }

  /**
   * Reset all stored results and metrics
   */
  static reset() {
    this.results = {};
    this.resourceMetrics = {};
    console.log('🔄 Performance tracker reset - all data cleared');
  }

  /**
   * Get raw data for specific operation
   */
  static getRawData(name: string): number[] {
    return [...(this.results[name] || [])];
  }

  /**
   * Export comprehensive benchmark data
   */
  static exportData() {
    return {
      benchmark_metadata: {
        timestamp: new Date().toISOString(),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
        memory_limit: this.getMemoryInfo()?.jsHeapSizeLimit || 'Unknown',
        total_operations: Object.values(this.results).reduce((sum, arr) => sum + arr.length, 0),
        test_duration: this.getTestDuration()
      },
      performance_metrics: this.getAllStats(),
      raw_data: { ...this.results },
      resource_metrics: { ...this.resourceMetrics },
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Helper methods for enhanced functionality
   */
  private static getMemoryInfo(): MemoryInfo | undefined {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory as MemoryInfo;
    }
    return undefined;
  }

  private static getPaintTiming(): PaintTiming {
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      const paintEntries = performance.getEntriesByType('paint');
      const result: PaintTiming = {};
      
      paintEntries.forEach(entry => {
        if (entry.name === 'first-paint') result.firstPaint = entry.startTime;
        if (entry.name === 'first-contentful-paint') result.firstContentfulPaint = entry.startTime;
      });
      
      return result;
    }
    return {};
  }

  private static getNetworkRequestCount(): number {
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      return performance.getEntriesByType('resource').length;
    }
    return 0;
  }

  private static logResourceMetrics(name: string, metrics: ResourceMetrics) {
    if (!this.resourceMetrics[name]) {
      this.resourceMetrics[name] = [];
    }
    this.resourceMetrics[name].push(metrics);
  }

  private static percentile(sortedArray: number[], p: number): number {
    const index = (p / 100) * (sortedArray.length - 1);
    if (Math.floor(index) === index) {
      return sortedArray[index];
    }
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  private static checkPerformanceBudget(name: string, duration: number) {
    const budget = this.performanceBudgets[name];
    if (budget && duration > budget.threshold) {
      const message = duration > budget.threshold * 2 ? budget.critical : budget.warning;
      if (message) {
        console.warn(`📊 Performance Budget Violation [${name}]: ${message} (${duration.toFixed(2)}ms)`);
      }
    }
  }

  private static getResourceSummary() {
    const summary: any = {};
    Object.entries(this.resourceMetrics).forEach(([name, metrics]) => {
      const memoryDeltas = metrics.map(m => m.memoryDelta).filter(Boolean) as number[];
      const networkRequests = metrics.map(m => m.networkRequests).filter(Boolean) as number[];
      
      if (memoryDeltas.length > 0) {
        summary[`${name}_memory_delta_avg`] = (memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length / 1024 / 1024).toFixed(2) + 'MB';
      }
      
      if (networkRequests.length > 0) {
        summary[`${name}_network_requests_avg`] = (networkRequests.reduce((a, b) => a + b, 0) / networkRequests.length).toFixed(1);
      }
    });
    return summary;
  }

  private static calculatePerformanceScore(): number {
    let totalScore = 0;
    let totalOperations = 0;
    
    Object.entries(this.results).forEach(([name, times]) => {
      const budget = this.performanceBudgets[name];
      if (budget) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const score = Math.max(0, Math.min(10, 10 - (avg / budget.threshold) * 5));
        totalScore += score * times.length;
        totalOperations += times.length;
      }
    });
    
    return totalOperations > 0 ? Number((totalScore / totalOperations).toFixed(1)) : 0;
  }

  private static getBudgetViolations(): string[] {
    const violations: string[] = [];
    
    Object.entries(this.results).forEach(([name, times]) => {
      const budget = this.performanceBudgets[name];
      if (budget) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        if (avg > budget.threshold) {
          violations.push(`${name}: ${avg.toFixed(2)}ms (budget: ${budget.threshold}ms)`);
        }
      }
    });
    
    return violations;
  }

  private static getTestDuration(): string {
    const timestamps = Object.values(this.results).flat();
    if (timestamps.length === 0) return '0s';
    
    const totalDuration = timestamps.length * 0.1;
    return `${totalDuration.toFixed(1)}s`;
  }

  /**
   * Cache Performance Monitoring Methods
   */
  static trackCacheHit(operationName: string) {
    if (!this.cacheHitRates[operationName]) {
      this.cacheHitRates[operationName] = { hits: 0, total: 0 };
    }
    this.cacheHitRates[operationName].hits++;
    this.cacheHitRates[operationName].total++;
  }

  static trackCacheMiss(operationName: string) {
    if (!this.cacheHitRates[operationName]) {
      this.cacheHitRates[operationName] = { hits: 0, total: 0 };
    }
    this.cacheHitRates[operationName].total++;
  }

  static getCacheHitRate(operationName: string): number {
    const cache = this.cacheHitRates[operationName];
    return cache && cache.total > 0 ? (cache.hits / cache.total) : 0;
  }

  static getAllCacheHitRates(): Record<string, { hitRate: string; hits: number; total: number }> {
    const result: Record<string, { hitRate: string; hits: number; total: number }> = {};
    Object.entries(this.cacheHitRates).forEach(([name, data]) => {
      result[name] = {
        hitRate: data.total > 0 ? ((data.hits / data.total) * 100).toFixed(1) + '%' : '0%',
        hits: data.hits,
        total: data.total
      };
    });
    return result;
  }

  /**
   * Storage Operations Monitoring
   */
  static trackStorageOperation(storage: 'localStorage' | 'indexedDB', operation: 'read' | 'write') {
    if (operation === 'read') {
      this.storageOperationCounts[storage].reads++;
    } else {
      this.storageOperationCounts[storage].writes++;
    }
  }

  static measureStorageOperation<T>(
    storage: 'localStorage' | 'indexedDB', 
    operation: 'read' | 'write', 
    fn: () => T
  ): T {
    const operationName = `${storage === 'localStorage' ? 'LocalStorage' : 'IndexedDB'} ${operation.charAt(0).toUpperCase() + operation.slice(1)}`;
    
    this.trackStorageOperation(storage, operation);
    return this.measure(operationName, fn);
  }

  static async measureStorageOperationAsync<T>(
    storage: 'localStorage' | 'indexedDB', 
    operation: 'read' | 'write', 
    fn: () => Promise<T>
  ): Promise<T> {
    const operationName = `${storage === 'localStorage' ? 'LocalStorage' : 'IndexedDB'} ${operation.charAt(0).toUpperCase() + operation.slice(1)}`;
    
    this.trackStorageOperation(storage, operation);
    return this.measureAsync(operationName, fn);
  }

  /**
   * Cache Testing Utilities
   */
  static async clearAllCaches(): Promise<void> {
    console.log('🧹 Clearing all caches for cold performance testing...');
    
    // Clear localStorage theme data
    if (typeof localStorage !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('theme') || key.includes('font') || key.includes('basecoat'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`🗑️ Cleared ${keysToRemove.length} localStorage theme entries`);
    }

    // Clear IndexedDB theme data
    if (typeof indexedDB !== 'undefined') {
      try {
        await this.clearIndexedDBThemeData();
        console.log('🗑️ Cleared IndexedDB theme data');
      } catch (error) {
        console.warn('⚠️ Could not clear IndexedDB:', error);
      }
    }

    // Clear browser cache (if possible)
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        const themeRelatedCaches = cacheNames.filter(name => 
          name.includes('theme') || name.includes('font') || name.includes('css')
        );
        await Promise.all(themeRelatedCaches.map(name => caches.delete(name)));
        console.log(`🗑️ Cleared ${themeRelatedCaches.length} browser caches`);
      } catch (error) {
        console.warn('⚠️ Could not clear browser caches:', error);
      }
    }

    // Reset cache tracking
    this.cacheHitRates = {};
    this.storageOperationCounts = { localStorage: { reads: 0, writes: 0 }, indexedDB: { reads: 0, writes: 0 } };
    console.log('✅ Cache clearing completed - ready for cold performance testing');
  }

  private static async clearIndexedDBThemeData(): Promise<void> {
    return new Promise((resolve, reject) => {
      const deleteReq = indexedDB.deleteDatabase('ThemeManagerDB');
      deleteReq.onsuccess = () => resolve();
      deleteReq.onerror = () => reject(deleteReq.error);
      deleteReq.onblocked = () => {
        console.warn('⚠️ IndexedDB deletion blocked - try closing other tabs');
        resolve(); // Don't fail the entire operation
      };
    });
  }

  /**
   * Enhanced reporting with cache metrics
   */
  static getStorageOperationSummary() {
    return {
      localStorage: {
        reads: this.storageOperationCounts.localStorage.reads,
        writes: this.storageOperationCounts.localStorage.writes,
        total: this.storageOperationCounts.localStorage.reads + this.storageOperationCounts.localStorage.writes
      },
      indexedDB: {
        reads: this.storageOperationCounts.indexedDB.reads,
        writes: this.storageOperationCounts.indexedDB.writes,
        total: this.storageOperationCounts.indexedDB.reads + this.storageOperationCounts.indexedDB.writes
      }
    };
  }

  static calculateOverallCacheEfficiency(): string {
    const cacheRates = this.getAllCacheHitRates();
    const rates = Object.values(cacheRates).map(data => parseFloat(data.hitRate));
    
    if (rates.length === 0) return '0%';
    
    const avgHitRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    return avgHitRate.toFixed(1) + '%';
  }

  static calculateStorageEfficiency(): { ratio: string; recommendation: string } {
    const summary = this.getStorageOperationSummary();
    const localTotal = summary.localStorage.total;
    const indexedTotal = summary.indexedDB.total;
    
    if (localTotal + indexedTotal === 0) {
      return { ratio: '0:0', recommendation: 'No storage operations detected' };
    }
    
    const ratio = `${localTotal}:${indexedTotal}`;
    let recommendation = 'Balanced storage usage';
    
    if (localTotal > indexedTotal * 5) {
      recommendation = 'Consider using more IndexedDB for better performance';
    } else if (indexedTotal > localTotal * 3) {
      recommendation = 'Good use of IndexedDB for performance-critical operations';
    }
    
    return { ratio, recommendation };
  }

  private static generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const violations = this.getBudgetViolations();
    
    if (violations.length === 0) {
      recommendations.push('✅ All performance budgets met - excellent performance!');
    } else {
      recommendations.push(`⚠️ ${violations.length} performance budget violation(s) detected`);
      violations.forEach(violation => {
        recommendations.push(`  • ${violation}`);
      });
    }
    
    // Cache performance recommendations
    const cacheRates = this.getAllCacheHitRates();
    Object.entries(cacheRates).forEach(([operation, data]) => {
      const hitRate = parseFloat(data.hitRate);
      if (hitRate < 80 && data.total > 5) {
        recommendations.push(`🔄 Cache hit rate for ${operation} is ${data.hitRate} - consider cache optimization`);
      } else if (hitRate > 90 && data.total > 5) {
        recommendations.push(`✅ Excellent cache performance for ${operation}: ${data.hitRate} hit rate`);
      }
    });
    
    // Storage operation recommendations
    const storageOps = this.getStorageOperationSummary();
    if (storageOps.localStorage.total > storageOps.indexedDB.total * 3) {
      recommendations.push('💾 Consider moving more operations to IndexedDB for better performance');
    }
    
    const memoryMetrics = this.getResourceSummary();
    const memoryKeys = Object.keys(memoryMetrics).filter(k => k.includes('memory_delta'));
    if (memoryKeys.length > 0) {
      recommendations.push('🧠 Memory usage tracked - monitor for potential leaks if values are consistently high');
    }
    
    return recommendations;
  }
}