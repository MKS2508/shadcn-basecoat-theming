/**
 * Vanilla Theme Manager CLI Initialization Script
 * 
 * Este script inicializa el sistema de gestión de temas vanilla en el index.html
 * usando los packages compilados localmente.
 */

// Importar los packages compilados localmente
import { createThemeManager } from '../packages/theme-manager-vanilla/dist/index.mjs';
import { ThemeCore } from '../packages/theme-manager-core/dist/index.mjs';

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('🚀 Inicializando Vanilla Theme Manager CLI...');
    
    // Inicializar el core del sistema de temas
    await ThemeCore.init({
      debug: true
    });
    
    // Crear instancia del vanilla theme manager
    const vanillaManager = createThemeManager({
      enableLogging: true,
      autoSetupEventListeners: true
    });
    
    // Inicializar el vanilla manager
    await vanillaManager.init();
    
    // ===========================================
    // CONFIGURAR COMPONENTES PRINCIPALES
    // ===========================================
    
    // 1. Renderizar dropdown de temas en el contenedor existente
    const themeDropdownContainer = document.querySelector('[data-dropdown]');
    if (themeDropdownContainer) {
      vanillaManager.renderThemeDropdown('[data-dropdown]', {
        showInstallOption: true,
        showManageOption: true
      });
    }
    
    // 2. Configurar botón de toggle de modo (usando el selector existente)
    vanillaManager.renderModeToggle('#mode-toggle');
    
    // 3. Configurar botón de selector de fuentes (usando el selector existente)
    vanillaManager.renderFontSelector('#font-selector-btn');
    
    // 4. Configurar modales
    vanillaManager.setupThemeInstaller('#browse-more-themes');
    vanillaManager.setupFontModal('#font-selector-btn');
    vanillaManager.setupThemeManagement('#theme-settings-btn');
    
    // ===========================================
    // SINCRONIZAR ESTADO INICIAL
    // ===========================================
    
    // Actualizar etiqueta de tema actual
    const currentTheme = vanillaManager.getCurrentTheme();
    const currentThemeLabel = document.getElementById('current-theme-label');
    if (currentThemeLabel) {
      const themes = vanillaManager.getAvailableThemes();
      const themeConfig = themes.find(t => t.name === currentTheme);
      currentThemeLabel.textContent = themeConfig?.label || currentTheme;
    }
    
    // Actualizar icono de modo actual
    const modeToggle = document.getElementById('mode-toggle');
    if (modeToggle) {
      const currentMode = vanillaManager.getCurrentMode();
      vanillaManager.updateModeToggleIcon(modeToggle, currentMode);
    }
    
    // ===========================================
    // EXPOSICIÓN PARA DEBUG
    // ===========================================
    
    // Exponer globalmente para debugging
    if (typeof window !== 'undefined') {
      (window as any).vanillaThemeManager = vanillaManager;
      (window as any).ThemeCore = ThemeCore;
      console.log('🔧 Vanilla Theme Manager disponible en window.vanillaThemeManager');
      console.log('🔧 Theme Core disponible en window.ThemeCore');
    }
    
    console.log('✅ Vanilla Theme Manager CLI inicializado correctamente');
    
  } catch (error) {
    console.error('❌ Error al inicializar Vanilla Theme Manager CLI:', error);
  }
});

// Exportar para uso modular
export { createThemeManager, ThemeCore };