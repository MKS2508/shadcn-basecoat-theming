class ThemeToolkit {
  constructor() {
    this.themes = [];
    this.currentTheme = null;
    this.currentMode = 'light';
    this.editor = null;
    this.autoSaveTimeout = null;

    this.init();
  }

  async init() {
    await this.loadThemes();
    this.setupEventListeners();
    this.setupCodeEditor();
    this.showNotification('Theme Toolkit inicializado', 'success');
  }

  setupEventListeners() {
    // Header buttons
    document.getElementById('create-theme-btn').addEventListener('click', () => this.showCreateThemeModal());
    document.getElementById('refresh-btn').addEventListener('click', () => this.loadThemes());

    // Mode selector
    document.getElementById('light-mode-btn').addEventListener('click', () => this.switchMode('light'));
    document.getElementById('dark-mode-btn').addEventListener('click', () => this.switchMode('dark'));

    // Editor actions
    document.getElementById('validate-btn').addEventListener('click', () => this.validateCurrentCSS());
    document.getElementById('preview-btn').addEventListener('click', () => this.openPreview());
    document.getElementById('save-btn').addEventListener('click', () => this.saveCurrentTheme());
    document.getElementById('export-btn').addEventListener('click', () => this.exportCurrentTheme());

    // Editor tools
    document.getElementById('format-btn').addEventListener('click', () => this.formatCSS());
    document.getElementById('copy-btn').addEventListener('click', () => this.copyCSS());

    // Preview tools
    document.getElementById('refresh-preview-btn').addEventListener('click', () => this.refreshPreview());
    document.getElementById('open-fullscreen-btn').addEventListener('click', () => this.openFullscreenPreview());

    // Modal
    this.setupModal('create-theme-modal', 'create-theme-form', (formData) => this.createTheme(formData));

    // No selection button
    document.getElementById('create-first-theme').addEventListener('click', () => this.showCreateThemeModal());

    // Auto-save on editor change
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        this.saveCurrentTheme();
      }
    });
  }

  setupCodeEditor() {
    const textarea = document.getElementById('css-editor');
    if (textarea && typeof CodeMirror !== 'undefined') {
      this.editor = CodeMirror.fromTextArea(textarea, {
        mode: 'css',
        theme: 'monokai',
        lineNumbers: true,
        lineWrapping: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        foldGutter: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter']
      });

      // Auto-update preview on change
      this.editor.on('change', () => {
        this.debounceUpdatePreview();
      });
    }
  }

  setupModal(modalId, formId, submitHandler) {
    const modal = document.getElementById(modalId);
    const form = document.getElementById(formId);
    const closeButtons = modal.querySelectorAll('.modal-close');

    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.hideModal(modalId));
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideModal(modalId);
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      try {
        await submitHandler(data);
        this.hideModal(modalId);
        form.reset();
      } catch (error) {
        this.showNotification('Error al procesar el formulario', 'error');
      }
    });
  }

  async loadThemes() {
    try {
      this.showLoading(true);
      const response = await fetch('/api/themes');
      const result = await response.json();

      if (result.success) {
        this.themes = result.data;
        this.renderThemeList();
        this.updateThemeCount();
        this.populateBaseThemeSelect();
      } else {
        this.showNotification('Error al cargar themes', 'error');
      }
    } catch (error) {
      this.showNotification('Error de conexión al cargar themes', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  renderThemeList() {
    const themeList = document.getElementById('theme-list');

    if (this.themes.length === 0) {
      themeList.innerHTML = '<div class="empty-state">No hay themes disponibles</div>';
      return;
    }

    themeList.innerHTML = this.themes.map(theme => `
      <div class="theme-item ${this.currentTheme?.id === theme.id ? 'active' : ''}" data-theme-id="${theme.id}">
        <div class="theme-item-header">
          <div class="theme-item-title">${theme.label}</div>
          <div class="theme-item-category">${theme.category}</div>
        </div>
        <div class="theme-item-description">${theme.description}</div>
        <div class="theme-item-modes">
          ${theme.modes.light ? '<span class="theme-mode-badge light">Light</span>' : ''}
          ${theme.modes.dark ? '<span class="theme-mode-badge dark">Dark</span>' : ''}
        </div>
      </div>
    `).join('');

    // Add click listeners
    themeList.querySelectorAll('.theme-item').forEach(item => {
      item.addEventListener('click', () => {
        const themeId = item.dataset.themeId;
        this.selectTheme(themeId);
      });
    });
  }

  updateThemeCount() {
    const countElement = document.getElementById('theme-count');
    const count = this.themes.length;
    countElement.textContent = `${count} theme${count !== 1 ? 's' : ''}`;
  }

  populateBaseThemeSelect() {
    const select = document.getElementById('base-theme');
    if (!select) return;

    select.innerHTML = '<option value="">Ninguno</option>' +
      this.themes.map(theme => `<option value="${theme.id}">${theme.label}</option>`).join('');
  }

  async selectTheme(themeId) {
    try {
      const theme = this.themes.find(t => t.id === themeId);
      if (!theme) return;

      this.currentTheme = theme;
      this.showEditor();
      this.updateEditorHeader();
      this.loadThemeCSS();
      this.updateActiveTheme(themeId);

      // Enable/disable mode buttons based on available modes
      this.updateModeButtons();

    } catch (error) {
      this.showNotification('Error al seleccionar theme', 'error');
    }
  }

  updateActiveTheme(themeId) {
    document.querySelectorAll('.theme-item').forEach(item => {
      item.classList.toggle('active', item.dataset.themeId === themeId);
    });
  }

  updateModeButtons() {
    const lightBtn = document.getElementById('light-mode-btn');
    const darkBtn = document.getElementById('dark-mode-btn');

    if (this.currentTheme) {
      lightBtn.disabled = !this.currentTheme.modes.light;
      darkBtn.disabled = !this.currentTheme.modes.dark;
    }
  }

  showEditor() {
    document.getElementById('no-theme-selected').style.display = 'none';
    document.getElementById('theme-editor').style.display = 'flex';
  }

  hideEditor() {
    document.getElementById('no-theme-selected').style.display = 'flex';
    document.getElementById('theme-editor').style.display = 'none';
  }

  updateEditorHeader() {
    document.getElementById('editor-title').textContent = this.currentTheme.label;
    document.getElementById('editor-description').textContent = this.currentTheme.description;
  }

  async loadThemeCSS() {
    if (!this.currentTheme) return;

    try {
      const response = await fetch(`/api/themes/${this.currentTheme.id}/${this.currentMode}`);

      if (response.ok) {
        const css = await response.text();
        if (this.editor) {
          this.editor.setValue(css);
        }
        this.updatePreview();
      } else if (response.status === 404) {
        // CSS doesn't exist, create default
        const defaultCSS = this.generateDefaultCSS();
        if (this.editor) {
          this.editor.setValue(defaultCSS);
        }
      }
    } catch (error) {
      this.showNotification('Error al cargar CSS del theme', 'error');
    }
  }

  generateDefaultCSS() {
    return `/* ${this.currentTheme.label} - ${this.currentMode.charAt(0).toUpperCase() + this.currentMode.slice(1)} Theme */
:root {
  /* Core theme tokens */
  --background: oklch(${this.currentMode === 'dark' ? '0.2089 0.0961 264.05' : '1.0000 0 0'});
  --foreground: oklch(${this.currentMode === 'dark' ? '0.9850 0.0071 240.34' : '0.2089 0.0961 264.05'});

  /* Primary tokens */
  --primary: oklch(${this.currentMode === 'dark' ? '0.7278 0.1745 142.74' : '0.6124 0.1584 142.74'});
  --primary-foreground: oklch(0.9850 0.0071 240.34);

  /* Secondary tokens */
  --secondary: oklch(${this.currentMode === 'dark' ? '0.2545 0.0256 264.05' : '0.5214 0 0'});
  --secondary-foreground: oklch(0.9850 0.0071 240.34);

  /* Add more variables as needed */
}`;
  }

  switchMode(mode) {
    if (this.currentMode === mode) return;

    this.currentMode = mode;

    // Update button states
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Load CSS for new mode
    this.loadThemeCSS();
  }

  async saveCurrentTheme() {
    if (!this.currentTheme || !this.editor) return;

    try {
      this.showLoading(true);
      const css = this.editor.getValue();

      const response = await fetch(`/api/themes/${this.currentTheme.id}/${this.currentMode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ css })
      });

      const result = await response.json();

      if (result.success) {
        this.showNotification('Theme guardado exitosamente', 'success');
      } else {
        this.showNotification('Error al guardar theme', 'error');
      }
    } catch (error) {
      this.showNotification('Error de conexión al guardar theme', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async validateCurrentCSS() {
    if (!this.editor) return;

    try {
      const css = this.editor.getValue();

      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ css })
      });

      const result = await response.json();

      if (result.success) {
        this.showValidationResults(result.data);
      } else {
        this.showNotification('Error al validar CSS', 'error');
      }
    } catch (error) {
      this.showNotification('Error de conexión al validar CSS', 'error');
    }
  }

  showValidationResults(validation) {
    const resultsDiv = document.getElementById('validation-results');
    const contentDiv = document.getElementById('validation-content');

    let html = '';

    if (validation.isValid) {
      html += '<div class="validation-success">✓ CSS válido</div>';
    } else {
      html += '<div class="validation-error">✗ CSS inválido</div>';
    }

    if (validation.errors.length > 0) {
      html += '<h4>Errores:</h4>';
      validation.errors.forEach(error => {
        html += `<div class="validation-error">Línea ${error.line}: ${error.message}</div>`;
      });
    }

    if (validation.warnings.length > 0) {
      html += '<h4>Advertencias:</h4>';
      validation.warnings.forEach(warning => {
        html += `<div class="validation-warning">Línea ${warning.line}: ${warning.message}</div>`;
      });
    }

    if (validation.variables.length > 0) {
      html += '<h4>Variables encontradas:</h4>';
      const colorVars = validation.variables.filter(v => v.category === 'color');
      const otherVars = validation.variables.filter(v => v.category !== 'color');

      if (colorVars.length > 0) {
        html += '<div class="validation-success">Colores: ' + colorVars.length + '</div>';
      }

      if (otherVars.length > 0) {
        html += '<div class="validation-success">Otras variables: ' + otherVars.length + '</div>';
      }
    }

    contentDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
  }

  updatePreview() {
    if (!this.currentTheme) return;

    const iframe = document.getElementById('preview-frame');
    if (!iframe) return;

    const css = this.editor ? this.editor.getValue() : '';

    // Create preview HTML with current CSS
    const previewHTML = this.generatePreviewHTML(css);

    iframe.srcdoc = previewHTML;
  }

  generatePreviewHTML(css) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <style>
        ${css}

        body {
          padding: 2rem;
          font-family: system-ui, -apple-system, sans-serif;
          min-height: 100vh;
        }

        .preview-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .preview-section {
          margin-bottom: 2rem;
        }

        .preview-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .component-card {
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 0.5rem;
          padding: 1.5rem;
          background: var(--card, var(--background));
          box-shadow: var(--shadow, 0 1px 3px rgba(0,0,0,0.1));
        }

        .preview-button {
          background: var(--primary, #3b82f6);
          color: var(--primary-foreground, white);
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          margin-right: 0.5rem;
          margin-bottom: 0.5rem;
          font-family: inherit;
        }

        .preview-button:hover {
          opacity: 0.9;
        }

        .preview-button.secondary {
          background: var(--secondary, #f1f5f9);
          color: var(--secondary-foreground, #1e293b);
        }

        .preview-input {
          background: var(--input, var(--background));
          color: var(--foreground);
          border: 1px solid var(--border, #e2e8f0);
          padding: 0.75rem;
          border-radius: 0.5rem;
          width: 100%;
          margin-bottom: 1rem;
          font-family: inherit;
        }

        .color-swatch {
          display: inline-block;
          width: 50px;
          height: 50px;
          border-radius: 0.5rem;
          border: 2px solid var(--border, #e2e8f0);
          margin: 0.25rem;
          text-align: center;
          line-height: 46px;
          font-size: 0.7rem;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <section class="preview-section">
            <h2 class="preview-title">Buttons</h2>
            <div class="component-card">
                <button class="preview-button">Primary</button>
                <button class="preview-button secondary">Secondary</button>
            </div>
        </section>

        <section class="preview-section">
            <h2 class="preview-title">Forms</h2>
            <div class="component-card">
                <input type="text" class="preview-input" placeholder="Input field">
                <input type="email" class="preview-input" placeholder="Email field">
            </div>
        </section>

        <section class="preview-section">
            <h2 class="preview-title">Colors</h2>
            <div class="component-card">
                <div class="color-swatch" style="background: var(--primary); color: var(--primary-foreground);">Primary</div>
                <div class="color-swatch" style="background: var(--secondary); color: var(--secondary-foreground);">Secondary</div>
                <div class="color-swatch" style="background: var(--background); color: var(--foreground);">Background</div>
            </div>
        </section>
    </div>
</body>
</html>`;
  }

  debounceUpdatePreview() {
    clearTimeout(this.autoSaveTimeout);
    this.autoSaveTimeout = setTimeout(() => {
      this.updatePreview();
    }, 500);
  }

  refreshPreview() {
    this.updatePreview();
  }

  openPreview() {
    if (!this.currentTheme) return;

    window.open(`/api/preview/${this.currentTheme.id}/${this.currentMode}`, '_blank');
  }

  openFullscreenPreview() {
    if (!this.currentTheme) return;

    const previewHTML = this.generatePreviewHTML(this.editor ? this.editor.getValue() : '');
    const newWindow = window.open('', '_blank');
    newWindow.document.write(previewHTML);
    newWindow.document.close();
  }

  formatCSS() {
    if (!this.editor) return;

    try {
      const css = this.editor.getValue();
      const formatted = this.formatCSSString(css);
      this.editor.setValue(formatted);
      this.showNotification('CSS formateado', 'success');
    } catch (error) {
      this.showNotification('Error al formatear CSS', 'error');
    }
  }

  formatCSSString(css) {
    // Simple CSS formatter
    return css
      .replace(/\s*{\s*/g, ' {\n  ')
      .replace(/;\s*/g, ';\n  ')
      .replace(/\s*}\s*/g, '\n}\n\n')
      .replace(/\n\s*\n/g, '\n')
      .replace(/:\s+/g, ': ')
      .trim();
  }

  copyCSS() {
    if (!this.editor) return;

    navigator.clipboard.writeText(this.editor.getValue()).then(() => {
      this.showNotification('CSS copiado al portapapeles', 'success');
    }).catch(() => {
      this.showNotification('Error al copiar CSS', 'error');
    });
  }

  exportCurrentTheme() {
    if (!this.currentTheme || !this.editor) return;

    const css = this.editor.getValue();
    const filename = `${this.currentTheme.name}-${this.currentMode}.css`;

    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showNotification(`Theme exportado como ${filename}`, 'success');
  }

  showCreateThemeModal() {
    document.getElementById('create-theme-modal').style.display = 'flex';
  }

  hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
  }

  async createTheme(formData) {
    try {
      this.showLoading(true);

      const response = await fetch('/api/themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        await this.loadThemes();
        this.selectTheme(result.data.id);
        this.showNotification('Theme creado exitosamente', 'success');
      } else {
        this.showNotification(result.error || 'Error al crear theme', 'error');
      }
    } catch (error) {
      this.showNotification('Error de conexión al crear theme', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
  }

  showNotification(message, type = 'info') {
    const notifications = document.getElementById('notifications');

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-header">
        <div class="notification-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
        <button class="notification-close">&times;</button>
      </div>
      <div class="notification-message">${message}</div>
    `;

    notifications.appendChild(notification);

    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.remove();
    });

    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ThemeToolkit();
});