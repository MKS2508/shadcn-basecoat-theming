import './style.css';
import { VanillaThemeManager } from '@mks2508/theme-manager-vanilla';

/**
 * 🎨 Vanilla Theme Manager Example
 * 
 * This example demonstrates how to build a complete theme management UI
 * using the modular @mks2508/theme-manager-vanilla package.
 * 
 * The package provides granular control over what to render and where,
 * using the template engine internally for consistent styling.
 */
async function buildCompleteThemeUI(): Promise<void> {
  try {
    console.log('🚀 Building Complete Theme UI with Vanilla Theme Manager');

    // ===================================
    // STEP 1: Initialize the Theme Manager
    // ===================================
    
    const themeManager = new VanillaThemeManager({
      enableLogging: true,
      autoSetupEventListeners: true  // Handles system dark mode changes automatically
    });
    
    // Must initialize before using any render methods
    await themeManager.init();

    // ===================================
    // STEP 2: Build the Header Components
    // ===================================
    
    console.log('🔨 Rendering header components...');
    
    // Render theme dropdown in the existing header
    // The HTML already has the structure, we just render the dropdown functionality
    themeManager.renderThemeDropdown('#theme-button', {
      showInstallOption: true,    // Shows "Install New Theme..." option
      showManageOption: true,     // Shows "Manage Themes" option
      customClasses: ''          // Additional CSS classes if needed
    });
    
    // Render mode toggle (light/dark/auto)
    themeManager.renderModeToggle('#mode-toggle', {
      customClasses: '',
      initialMode: 'auto'        // Starts in auto mode (follows system)
    });
    
    // Render font selector button
    themeManager.renderFontSelector('#font-selector-btn', {
      customClasses: '',
      buttonText: 'Configure Fonts'
    });

    // ===================================
    // STEP 3: Setup Modal Systems
    // ===================================
    
    console.log('🔧 Setting up modal systems...');
    
    // Setup modals (they render on-demand when triggered)
    themeManager.setupThemeInstaller();     // Modal for installing themes from URLs
    themeManager.setupFontModal();          // Modal for font selection and customization
    themeManager.setupThemeManagement();    // Modal for managing installed themes

    // ===================================
    // STEP 4: Additional Demonstrations
    // ===================================
    
    // Show how to render additional components in different locations
    if (document.querySelector('#sidebar')) {
      console.log('📱 Adding sidebar components...');
      
      // Example: Add a second theme dropdown in sidebar
      themeManager.renderThemeDropdown('#sidebar .theme-controls', {
        showInstallOption: false,   // Hide install option in sidebar
        showManageOption: false,    // Hide manage option in sidebar  
        customClasses: 'w-full'     // Full width in sidebar
      });
    }

    // Show programmatic theme control
    setupProgrammaticControls(themeManager);
    
    // Show debugging information
    setupDebuggingInfo(themeManager);

    console.log('✅ Complete Theme UI Successfully Built!');
    console.log('');
    console.log('🎯 What was rendered:');
    console.log('   • Theme dropdown with install/manage options');
    console.log('   • Mode toggle (light/dark/auto)');
    console.log('   • Font selector button');
    console.log('   • Theme installer modal (on-demand)');
    console.log('   • Font selection modal (on-demand)');
    console.log('   • Theme management modal (on-demand)');
    console.log('');
    console.log('🔧 Available in console:');
    console.log('   • window.__vanillaThemeManager - Full API access');
    console.log('   • window.__demoSetTheme(name) - Quick theme switching');
    console.log('   • window.__demoInstallTheme(url) - Quick theme installation');

  } catch (error) {
    console.error('❌ Failed to build theme UI:', error);
    showErrorFallback(error as Error);
  }
}

/**
 * 🎮 Setup programmatic controls for demonstration
 */
function setupProgrammaticControls(themeManager: VanillaThemeManager): void {
  // Expose demo functions globally for easy testing
  if (typeof window !== 'undefined') {
    // Quick theme switching
    (window as any).__demoSetTheme = async (themeName: string, mode?: 'light' | 'dark' | 'auto') => {
      try {
        await themeManager.setTheme(themeName, mode);
        console.log(`✅ Switched to theme: ${themeName}${mode ? ` (${mode})` : ''}`);
      } catch (error) {
        console.error('❌ Failed to switch theme:', error);
      }
    };
    
    // Quick theme installation
    (window as any).__demoInstallTheme = async (url: string) => {
      try {
        await themeManager.installThemeFromUrl(url);
        console.log('✅ Theme installed successfully!');
        console.log('Available themes:', themeManager.getAvailableThemes().map((t: any) => t.name));
      } catch (error) {
        console.error('❌ Failed to install theme:', error);
      }
    };
    
    // Show current state
    (window as any).__demoStatus = () => {
      console.log('📊 Current Theme Manager State:');
      console.log('   Current Theme:', themeManager.getCurrentTheme());
      console.log('   Current Mode:', themeManager.getCurrentMode());
      console.log('   Available Themes:', themeManager.getAvailableThemes().map((t: any) => t.label));
      console.log('   Rendered Components:', Array.from(themeManager.getRenderedComponents().keys()));
    };
  }
}

/**
 * 🐛 Setup debugging information display
 */
function setupDebuggingInfo(themeManager: VanillaThemeManager): void {
  // Add debug panel to page (optional)
  const debugPanel = document.createElement('div');
  debugPanel.id = 'debug-panel';
  debugPanel.className = 'fixed bottom-4 right-4 bg-card border rounded-lg p-4 text-sm max-w-xs shadow-lg z-50';
  debugPanel.innerHTML = `
    <div class="font-semibold mb-2 text-foreground">🔧 Debug Panel</div>
    <div class="space-y-1 text-muted-foreground">
      <div>Theme: <span id="debug-theme" class="font-mono text-foreground">${themeManager.getCurrentTheme()}</span></div>
      <div>Mode: <span id="debug-mode" class="font-mono text-foreground">${themeManager.getCurrentMode()}</span></div>
      <div>Components: <span id="debug-components" class="font-mono text-foreground">${themeManager.getRenderedComponents().size}</span></div>
    </div>
    <button 
      onclick="this.parentElement.style.display='none'" 
      class="absolute top-1 right-1 w-5 h-5 text-muted-foreground hover:text-foreground"
    >×</button>
  `;
  
  document.body.appendChild(debugPanel);
  
  // Update debug info on theme changes (simple polling for demo)
  setInterval(() => {
    const themeEl = document.getElementById('debug-theme');
    const modeEl = document.getElementById('debug-mode');
    const componentsEl = document.getElementById('debug-components');
    
    if (themeEl) themeEl.textContent = themeManager.getCurrentTheme();
    if (modeEl) modeEl.textContent = themeManager.getCurrentMode();
    if (componentsEl) componentsEl.textContent = themeManager.getRenderedComponents().size.toString();
  }, 1000);
}

/**
 * ⚠️ Show error fallback when initialization fails
 */
function showErrorFallback(error: Error): void {
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
          
          <h1 class="text-xl font-semibold">Vanilla Theme Manager Example Failed</h1>
          
          <p class="text-sm text-muted-foreground">
            ${error.message || 'An unexpected error occurred while building the theme management UI.'}
          </p>
          
          <details class="text-xs text-left mt-4">
            <summary class="cursor-pointer text-muted-foreground hover:text-foreground mb-2">
              Technical Details
            </summary>
            <pre class="bg-muted rounded p-2 text-xs overflow-auto">${error.stack || error.message}</pre>
          </details>
          
          <button 
            onclick="location.reload()" 
            class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Reload Example
          </button>
        </div>
      </div>
    `;
  }
}

/**
 * 🚀 Bootstrap the application
 */
function bootstrap(): void {
  // Setup error handling
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildCompleteThemeUI);
  } else {
    buildCompleteThemeUI();
  }
}

// 🎬 Start the example
bootstrap();