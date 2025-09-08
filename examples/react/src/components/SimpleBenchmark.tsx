import React, { useState } from 'react';
import { useTheme } from '@mks2508/theme-manager-react';

export const SimpleBenchmark: React.FC = () => {
  const { setTheme, initialized } = useTheme();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  const runBenchmark = async () => {
    if (!initialized || isRunning) return;
    
    setIsRunning(true);
    setResults(null);
    
    // Reset previous results
    (window as any).PerformanceTracker?.reset();
    
    console.log('🚀 Starting React benchmark...');
    
    try {
      // Test theme switches with available themes
      const themes = ['default', 'supabase']; // Start with basic themes
      const modes: ('light' | 'dark')[] = ['light', 'dark'];
      
      // Run multiple iterations for better average
      for (let iteration = 0; iteration < 2; iteration++) {
        console.log(`📊 Iteration ${iteration + 1}`);
        
        for (const theme of themes) {
          for (const mode of modes) {
            try {
              await setTheme(theme, mode);
              // Small delay to let UI update
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
              console.warn(`Failed to apply ${theme}-${mode}:`, error);
            }
          }
        }
      }
      
      // Get results
      const stats = (window as any).PerformanceTracker?.getAllStats();
      setResults(stats);
      
      console.log('📊 React Benchmark Results:', stats);
      
    } catch (error) {
      console.error('❌ Benchmark failed:', error);
    } finally {
      setIsRunning(false);
    }
  };
  
  const exportResults = () => {
    if (!results) return;
    
    const exportData = {
      framework: 'React',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      results
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `react-theme-benchmark-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div style={{ 
      padding: '1rem', 
      border: '2px solid var(--border)', 
      borderRadius: '8px',
      margin: '1rem 0',
      backgroundColor: 'var(--card)'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: 'var(--foreground)' }}>
        🔥 Performance Benchmark (React)
      </h3>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button 
          onClick={runBenchmark}
          disabled={isRunning || !initialized}
          style={{ 
            padding: '0.5rem 1rem',
            backgroundColor: isRunning ? 'var(--muted)' : 'var(--primary)',
            color: isRunning ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontWeight: '500'
          }}
        >
          {isRunning ? '⏳ Running Benchmark...' : '🔥 Run Benchmark'}
        </button>
        
        {results && (
          <button 
            onClick={exportResults}
            style={{ 
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--secondary)',
              color: 'var(--secondary-foreground)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            💾 Export Results
          </button>
        )}
      </div>
      
      {!initialized && (
        <p style={{ 
          color: 'var(--muted-foreground)',
          fontStyle: 'italic',
          margin: 0
        }}>
          Theme manager not initialized
        </p>
      )}
      
      {results && (
        <div style={{ marginTop: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--foreground)' }}>
            📊 Benchmark Results:
          </h4>
          <pre style={{ 
            backgroundColor: 'var(--muted)', 
            color: 'var(--muted-foreground)',
            padding: '1rem', 
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto',
            margin: 0,
            border: '1px solid var(--border)'
          }}>
            {JSON.stringify(results, null, 2)}
          </pre>
          
          <div style={{ 
            marginTop: '0.5rem', 
            fontSize: '12px', 
            color: 'var(--muted-foreground)' 
          }}>
            💡 Check browser console for detailed timing logs
          </div>
        </div>
      )}
    </div>
  );
};