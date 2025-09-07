import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeCore } from '@mks2508/shadcn-basecoat-theme-manager'

// Unified initialization with new ThemeCore configuration
async function initializeApp() {
  try {
    console.log('🎨 Initializing ThemeCore (React)...');
    
    // Unified initialization with FOUC prevention and optional defaults
    await ThemeCore.init({
      debug: true,
      fouc: {
        prevent: true,
        method: 'auto', // Auto-detect the best method
        revealDelay: 0
      }
      // Optional: Add default configuration
      // defaults: {
      //   theme: 'default',
      //   mode: 'auto',
      //   fonts: {
      //     sans: 'Inter',
      //     serif: 'Georgia',
      //     mono: 'JetBrains Mono'
      //   }
      // }
    });
    
    // Ensure body is revealed after ThemeCore initialization
    document.body.style.visibility = 'visible';
    document.body.style.opacity = '1';
    document.body.style.transition = 'opacity 0.15s ease-out';
    
    console.log('🚀 ThemeCore ready, mounting React app...');
    
  } catch (error) {
    console.error('❌ ThemeCore initialization failed:', error);
    // Fallback: reveal body manually if ThemeCore fails
    document.body.style.visibility = 'visible';
    document.body.style.opacity = '1';
    document.body.style.transition = 'opacity 0.15s ease-out';
  }
  
  // Safety fallback - ensure body is always revealed
  setTimeout(() => {
    if (document.body.style.visibility !== 'visible') {
      console.warn('⚠️ Safety fallback: Revealing body manually');
      document.body.style.visibility = 'visible';
      document.body.style.opacity = '1';
      document.body.style.transition = 'opacity 0.15s ease-out';
    }
  }, 1000);
  
  // Mount React app
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Initialize app
initializeApp();
