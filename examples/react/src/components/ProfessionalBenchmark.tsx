import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';

interface BenchmarkResults {
  scenario_results: Record<string, any>;
  performance_metrics: Record<string, any>;
  cache_metrics: {
    hit_rates: Record<string, { hitRate: string; hits: number; total: number }>;
    overall_cache_efficiency: string;
  };
  storage_metrics: {
    operations: {
      localStorage: { reads: number; writes: number; total: number };
      indexedDB: { reads: number; writes: number; total: number };
    };
    efficiency: { ratio: string; recommendation: string };
  };
  performance_score: number;
  budget_violations: string[];
  total_operations: number;
}

interface DeviceInfo {
  memory: string;
  connection: string;
  hardwareConcurrency: number;
  devicePixelRatio: number;
}

export const ProfessionalBenchmark: React.FC = () => {
  const { themeManager } = useTheme();
  const [isRunning, setIsRunning] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<string>('');
  const [results, setResults] = useState<BenchmarkResults | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [scenarioProgress, setScenarioProgress] = useState<Record<string, 'pending' | 'running' | 'completed' | 'failed'>>({});
  
  const PROFESSIONAL_TEST_SCENARIOS = [
    {
      id: 'cold_start_test',
      name: '🧊 Cold Start Test',
      description: 'Tests performance after clearing all caches',
      operation: 'cold_start'
    },
    {
      id: 'hot_switching_test', 
      name: '🔥 Hot Switching Test',
      description: 'Rapid theme switches (realistic user behavior)',
      operation: 'hot_switching'
    },
    {
      id: 'stress_test',
      name: '⚡ Stress Test', 
      description: 'Maximum speed theme switching (edge case testing)',
      operation: 'stress_test'
    },
    {
      id: 'font_combination_test',
      name: '🔤 Font Combination Test',
      description: 'Multiple font family switches and loading',
      operation: 'font_combinations'
    },
    {
      id: 'storage_performance_test',
      name: '💾 Storage Performance Test',
      description: 'localStorage vs IndexedDB performance comparison',
      operation: 'storage_performance'
    },
    {
      id: 'memory_leak_test',
      name: '🧠 Memory Leak Detection',
      description: 'Multiple operations with memory monitoring',
      operation: 'memory_leak_detection'
    },
    {
      id: 'cache_effectiveness_test',
      name: '🔄 Cache Effectiveness Test',
      description: 'Cache hit/miss ratio analysis',
      operation: 'cache_effectiveness'
    }
  ];

  useEffect(() => {
    // Collect device information
    const info: DeviceInfo = {
      memory: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory}GB` : 'Unknown',
      connection: (navigator as any).connection?.effectiveType || 'Unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      devicePixelRatio: window.devicePixelRatio || 1
    };
    setDeviceInfo(info);
  }, []);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const updateScenarioStatus = (scenarioId: string, status: 'pending' | 'running' | 'completed' | 'failed') => {
    setScenarioProgress(prev => ({ ...prev, [scenarioId]: status }));
  };

  const runColdStartTest = async () => {
    updateScenarioStatus('cold_start_test', 'running');
    console.log('🧊 Starting Cold Start Test - clearing all caches...');
    
    try {
      // Clear all caches using PerformanceTracker
      await (window as any).PerformanceTracker?.clearAllCaches();
      await delay(1000); // Let caches clear completely
      
      // Test theme loading from cold state
      const themes = ['default', 'supabase'];
      const modes: ('light' | 'dark')[] = ['light', 'dark'];
      
      for (const theme of themes) {
        for (const mode of modes) {
          console.log(`❄️ Cold load: ${theme}-${mode}`);
          await themeManager.setTheme(theme, mode);
          await delay(100); // Let DOM settle
        }
      }
      
      updateScenarioStatus('cold_start_test', 'completed');
      console.log('✅ Cold Start Test completed');
    } catch (error) {
      console.error('❌ Cold Start Test failed:', error);
      updateScenarioStatus('cold_start_test', 'failed');
    }
  };

  const runHotSwitchingTest = async () => {
    updateScenarioStatus('hot_switching_test', 'running');
    console.log('🔥 Starting Hot Switching Test - realistic user behavior...');
    
    try {
      // Simulate realistic user theme switching patterns
      const userScenarios = [
        ['default', 'light'], ['default', 'dark'], // User explores default theme
        ['supabase', 'light'], ['supabase', 'dark'], // User tries supabase theme  
        ['default', 'light'], ['supabase', 'dark'], // User compares themes
        ['default', 'dark'], ['supabase', 'light']  // More exploration
      ];
      
      for (const [theme, mode] of userScenarios) {
        console.log(`🔥 Hot switch: ${theme}-${mode}`);
        await themeManager.setTheme(theme, mode as 'light' | 'dark');
        await delay(200 + Math.random() * 300); // Simulate realistic user timing
      }
      
      updateScenarioStatus('hot_switching_test', 'completed');
      console.log('✅ Hot Switching Test completed');
    } catch (error) {
      console.error('❌ Hot Switching Test failed:', error);
      updateScenarioStatus('hot_switching_test', 'failed');
    }
  };

  const runStressTest = async () => {
    updateScenarioStatus('stress_test', 'running');
    console.log('⚡ Starting Stress Test - rapid theme changes...');
    
    try {
      const themes = ['default', 'supabase'];
      const modes: ('light' | 'dark')[] = ['light', 'dark'];
      
      // Rapid fire theme changes
      for (let iteration = 0; iteration < 3; iteration++) {
        console.log(`⚡ Stress iteration ${iteration + 1}/3`);
        for (const theme of themes) {
          for (const mode of modes) {
            await themeManager.setTheme(theme, mode);
            await delay(50); // Minimal delay - stress the system
          }
        }
      }
      
      updateScenarioStatus('stress_test', 'completed');
      console.log('✅ Stress Test completed');
    } catch (error) {
      console.error('❌ Stress Test failed:', error);
      updateScenarioStatus('stress_test', 'failed');
    }
  };

  const runFontCombinationTest = async () => {
    updateScenarioStatus('font_combination_test', 'running');
    console.log('🔤 Starting Font Combination Test...');
    
    try {
      const fontManager = themeManager.getFontManager();
      
      // Test different font combinations
      const fontCombinations = [
        { sans: 'Inter', serif: 'Playfair Display', mono: 'Fira Code' },
        { sans: 'Roboto', serif: 'Lora', mono: 'Source Code Pro' },
        { sans: 'Open Sans', serif: 'Merriweather', mono: 'Monaco' }
      ];
      
      for (const [index, fonts] of fontCombinations.entries()) {
        console.log(`🔤 Testing font combination ${index + 1}:`, fonts);
        
        // Apply font overrides
        await fontManager.setFontOverride('sans', fonts.sans);
        await fontManager.setFontOverride('serif', fonts.serif);
        await fontManager.setFontOverride('mono', fonts.mono);
        
        // Switch themes to test font loading with different themes
        await themeManager.setTheme('default', 'light');
        await delay(150);
        await themeManager.setTheme('supabase', 'dark');
        await delay(150);
      }
      
      updateScenarioStatus('font_combination_test', 'completed');
      console.log('✅ Font Combination Test completed');
    } catch (error) {
      console.error('❌ Font Combination Test failed:', error);
      updateScenarioStatus('font_combination_test', 'failed');
    }
  };

  const runStoragePerformanceTest = async () => {
    updateScenarioStatus('storage_performance_test', 'running');
    console.log('💾 Starting Storage Performance Test...');
    
    try {
      // Test multiple theme changes to generate storage operations
      const testOperations = [
        ['default', 'light'], ['default', 'dark'],
        ['supabase', 'light'], ['supabase', 'dark'],
        ['default', 'light'], // Back to start for comparison
      ];
      
      for (const [theme, mode] of testOperations) {
        console.log(`💾 Storage test: ${theme}-${mode}`);
        await themeManager.setTheme(theme, mode as 'light' | 'dark');
        await delay(100); // Allow storage operations to complete
      }
      
      updateScenarioStatus('storage_performance_test', 'completed');
      console.log('✅ Storage Performance Test completed');
    } catch (error) {
      console.error('❌ Storage Performance Test failed:', error);
      updateScenarioStatus('storage_performance_test', 'failed');
    }
  };

  const runMemoryLeakTest = async () => {
    updateScenarioStatus('memory_leak_test', 'running');
    console.log('🧠 Starting Memory Leak Detection Test...');
    
    try {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      console.log(`🧠 Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
      
      // Perform many operations to detect memory leaks
      for (let cycle = 0; cycle < 5; cycle++) {
        console.log(`🧠 Memory test cycle ${cycle + 1}/5`);
        
        // Multiple theme operations per cycle
        const operations = [
          ['default', 'light'], ['supabase', 'dark'], 
          ['default', 'dark'], ['supabase', 'light']
        ];
        
        for (const [theme, mode] of operations) {
          await themeManager.setTheme(theme, mode as 'light' | 'dark');
          await delay(25);
        }
        
        // Check memory after each cycle
        const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;
        console.log(`🧠 Memory after cycle ${cycle + 1}: ${(currentMemory / 1024 / 1024).toFixed(2)}MB`);
      }
      
      updateScenarioStatus('memory_leak_test', 'completed');
      console.log('✅ Memory Leak Test completed');
    } catch (error) {
      console.error('❌ Memory Leak Test failed:', error);
      updateScenarioStatus('memory_leak_test', 'failed');
    }
  };

  const runCacheEffectivenessTest = async () => {
    updateScenarioStatus('cache_effectiveness_test', 'running');
    console.log('🔄 Starting Cache Effectiveness Test...');
    
    try {
      // First, clear caches to start fresh
      await (window as any).PerformanceTracker?.clearAllCaches();
      await delay(500);
      
      // Test cache misses (first loads)
      console.log('🔄 Testing cache misses...');
      await themeManager.setTheme('default', 'light'); // Cache miss
      await themeManager.setTheme('supabase', 'dark'); // Cache miss
      await delay(200);
      
      // Test cache hits (repeat loads)
      console.log('🔄 Testing cache hits...');
      await themeManager.setTheme('default', 'light'); // Should be cache hit
      await themeManager.setTheme('supabase', 'dark'); // Should be cache hit
      await themeManager.setTheme('default', 'light'); // Should be cache hit
      
      updateScenarioStatus('cache_effectiveness_test', 'completed');
      console.log('✅ Cache Effectiveness Test completed');
    } catch (error) {
      console.error('❌ Cache Effectiveness Test failed:', error);
      updateScenarioStatus('cache_effectiveness_test', 'failed');
    }
  };

  const runFullBenchmark = async () => {
    if (!themeManager || isRunning) return;
    
    setIsRunning(true);
    setResults(null);
    setCurrentScenario('');
    
    // Initialize all scenarios as pending
    const initialProgress = PROFESSIONAL_TEST_SCENARIOS.reduce((acc, scenario) => {
      acc[scenario.id] = 'pending';
      return acc;
    }, {} as Record<string, 'pending' | 'running' | 'completed' | 'failed'>);
    setScenarioProgress(initialProgress);
    
    // Reset performance tracker
    (window as any).PerformanceTracker?.reset();
    
    console.log('🚀 Starting Professional Benchmark Suite...');
    console.log('📊 Device Info:', deviceInfo);
    
    try {
      // Run all test scenarios
      await runColdStartTest();
      await runHotSwitchingTest();
      await runStressTest();
      await runFontCombinationTest();
      await runStoragePerformanceTest();
      await runMemoryLeakTest();
      await runCacheEffectivenessTest();
      
      // Get comprehensive results
      const stats = (window as any).PerformanceTracker?.getAllStats();
      setResults(stats);
      
      console.log('🎉 Professional Benchmark Suite completed!');
      console.log('📊 Final Results:', stats);
      
    } catch (error) {
      console.error('❌ Benchmark suite failed:', error);
    } finally {
      setIsRunning(false);
      setCurrentScenario('');
    }
  };

  const exportResults = () => {
    if (!results || !deviceInfo) return;
    
    const exportData = {
      benchmark_metadata: {
        framework: 'React',
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        device_info: deviceInfo,
        test_scenarios_completed: Object.values(scenarioProgress).filter(s => s === 'completed').length,
        test_scenarios_failed: Object.values(scenarioProgress).filter(s => s === 'failed').length
      },
      scenario_status: scenarioProgress,
      ...results,
      quality_assessment: {
        overall_performance_grade: getPerformanceGrade(results.performance_score),
        cache_efficiency_grade: getCacheEfficiencyGrade(results.cache_metrics.overall_cache_efficiency),
        storage_efficiency_grade: getStorageEfficiencyGrade(results.storage_metrics.efficiency.ratio),
        recommendations: generateDetailedRecommendations(results)
      }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `react-professional-benchmark-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getPerformanceGrade = (score: number): string => {
    if (score >= 9) return 'A+ (Excellent)';
    if (score >= 8) return 'A (Very Good)';
    if (score >= 7) return 'B+ (Good)';
    if (score >= 6) return 'B (Acceptable)';
    if (score >= 5) return 'C (Needs Improvement)';
    return 'D (Poor)';
  };

  const getCacheEfficiencyGrade = (efficiency: string): string => {
    const value = parseFloat(efficiency);
    if (value >= 90) return 'A+ (Excellent Cache Performance)';
    if (value >= 80) return 'A (Very Good Cache Performance)';
    if (value >= 70) return 'B+ (Good Cache Performance)';
    if (value >= 60) return 'B (Acceptable Cache Performance)';
    return 'C (Cache Needs Optimization)';
  };

  const getStorageEfficiencyGrade = (ratio: string): string => {
    const [local, indexed] = ratio.split(':').map(Number);
    const total = local + indexed;
    if (total === 0) return 'No Data';
    
    const indexedDBRatio = indexed / total;
    if (indexedDBRatio >= 0.7) return 'A (Optimal IndexedDB Usage)';
    if (indexedDBRatio >= 0.5) return 'B (Good Storage Mix)';
    if (indexedDBRatio >= 0.3) return 'C (Consider More IndexedDB)';
    return 'D (Over-reliance on localStorage)';
  };

  const generateDetailedRecommendations = (results: BenchmarkResults): string[] => {
    const recommendations: string[] = [...results.budget_violations];
    
    // Add performance-specific recommendations
    if (results.performance_score < 7) {
      recommendations.push('🚨 Overall performance score below 7.0 - consider optimization');
    }
    
    const cacheEfficiency = parseFloat(results.cache_metrics.overall_cache_efficiency);
    if (cacheEfficiency < 80) {
      recommendations.push('📈 Cache hit rate below 80% - implement better caching strategy');
    }
    
    return recommendations;
  };

  const getScenarioIcon = (status: 'pending' | 'running' | 'completed' | 'failed') => {
    switch (status) {
      case 'running': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div style={{ 
      padding: '1.5rem', 
      border: '2px solid var(--border)', 
      borderRadius: '12px',
      margin: '1rem 0',
      backgroundColor: 'var(--card)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: 'var(--foreground)', fontSize: '1.25rem' }}>
        🏆 Professional Performance Benchmark Suite
      </h3>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button 
          onClick={runFullBenchmark}
          disabled={isRunning || !themeManager}
          style={{ 
            padding: '0.75rem 1.5rem',
            backgroundColor: isRunning ? 'var(--muted)' : 'var(--primary)',
            color: isRunning ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
            border: 'none',
            borderRadius: '6px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '0.95rem'
          }}
        >
          {isRunning ? '⏳ Running Professional Benchmark...' : '🏆 Run Full Benchmark Suite'}
        </button>
        
        {results && (
          <button 
            onClick={exportResults}
            style={{ 
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--secondary)',
              color: 'var(--secondary-foreground)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem'
            }}
          >
            📊 Export Professional Report
          </button>
        )}
      </div>

      {/* Device Information */}
      {deviceInfo && (
        <div style={{ 
          marginBottom: '1.5rem', 
          padding: '1rem',
          backgroundColor: 'var(--muted)',
          borderRadius: '8px',
          border: '1px solid var(--border)'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--foreground)', fontSize: '1rem' }}>
            🖥️ Device Information
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: 'var(--muted-foreground)'
          }}>
            <div>💾 Memory: {deviceInfo.memory}</div>
            <div>🌐 Connection: {deviceInfo.connection}</div>
            <div>🔧 CPU Cores: {deviceInfo.hardwareConcurrency}</div>
            <div>🖼️ Pixel Ratio: {deviceInfo.devicePixelRatio}x</div>
          </div>
        </div>
      )}

      {/* Test Scenarios Status */}
      {Object.keys(scenarioProgress).length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--foreground)', fontSize: '1rem' }}>
            📋 Test Scenarios Status
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '0.5rem' 
          }}>
            {PROFESSIONAL_TEST_SCENARIOS.map(scenario => (
              <div 
                key={scenario.id}
                style={{ 
                  padding: '0.75rem',
                  backgroundColor: 'var(--muted)',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '0.875rem'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.25rem'
                }}>
                  <span>{getScenarioIcon(scenarioProgress[scenario.id])}</span>
                  <span style={{ fontWeight: '600', color: 'var(--foreground)' }}>
                    {scenario.name}
                  </span>
                </div>
                <div style={{ color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>
                  {scenario.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!themeManager && (
        <p style={{ 
          color: 'var(--muted-foreground)',
          fontStyle: 'italic',
          margin: 0,
          textAlign: 'center'
        }}>
          Theme manager not available
        </p>
      )}

      {results && (
        <div style={{ marginTop: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--foreground)', fontSize: '1.1rem' }}>
            📊 Professional Benchmark Results
          </h4>
          
          {/* Performance Summary */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ 
              padding: '1rem',
              backgroundColor: 'var(--muted)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                {results.performance_score}/10
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Performance Score
              </div>
            </div>
            
            <div style={{ 
              padding: '1rem',
              backgroundColor: 'var(--muted)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                {results.cache_metrics.overall_cache_efficiency}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Cache Efficiency
              </div>
            </div>
            
            <div style={{ 
              padding: '1rem',
              backgroundColor: 'var(--muted)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                {results.total_operations}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Total Operations
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <pre style={{ 
            backgroundColor: 'var(--muted)', 
            color: 'var(--muted-foreground)',
            padding: '1.5rem', 
            borderRadius: '8px',
            fontSize: '11px',
            overflow: 'auto',
            margin: 0,
            border: '1px solid var(--border)',
            maxHeight: '400px'
          }}>
            {JSON.stringify(results, null, 2)}
          </pre>
          
          <div style={{ 
            marginTop: '1rem', 
            fontSize: '0.875rem', 
            color: 'var(--muted-foreground)',
            textAlign: 'center'
          }}>
            💡 Professional benchmark results include cache metrics, storage analysis, and performance budgets
          </div>
        </div>
      )}
    </div>
  );
};