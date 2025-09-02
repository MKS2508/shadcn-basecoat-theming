import './style.css';
import { AppController } from './components/app-controller';

/**
 * Application entry point
 * Initializes the modular application controller
 */
async function initializeApp(): Promise<void> {
  try {
    console.log('🚀 Starting Theme Manager Application');
    
    // Create and initialize application controller
    const app = new AppController();
    await app.init();
    
    console.log('✅ Application initialized successfully');
    
    // Store app instance globally for debugging (development only)
    if (import.meta.env?.DEV) {
      (window as any).__app = app;
      console.log('🔧 App instance available at window.__app');
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    
    // Show fallback error UI
    showFallbackError(error as Error);
  }
}

/**
 * Show fallback error UI when app fails to initialize
 */
function showFallbackError(error: Error): void {
  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div class="max-w-md mx-auto text-center space-y-4 p-6">
          <div class="text-destructive">
            <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          
          <h1 class="text-xl font-semibold">Application Failed to Load</h1>
          
          <p class="text-sm text-muted-foreground">
            ${error.message || 'An unexpected error occurred while initializing the theme manager.'}
          </p>
          
          <div class="space-y-2">
            <button 
              onclick="location.reload()" 
              class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Reload Application
            </button>
            
            <details class="text-xs text-left">
              <summary class="cursor-pointer text-muted-foreground hover:text-foreground">
                Technical Details
              </summary>
              <pre class="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
${error.stack || error.message}
              </pre>
            </details>
          </div>
        </div>
      </div>
    `;
  }
}

/**
 * Handle unhandled errors
 */
function setupErrorHandling(): void {
  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('❌ Global error:', event.error);
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled promise rejection:', event.reason);
  });
}

/**
 * Initialize application when DOM is ready
 */
function bootstrap(): void {
  // Set up error handling first
  setupErrorHandling();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }
}

// Start the application
bootstrap();