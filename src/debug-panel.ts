/**
 * Debug panel component to show theme information and CSS variables
 */
export class DebugPanel {
  private panel: HTMLElement | null = null;

  /**
   * Initialize debug panel
   */
  init(): void {
    this.createPanel();
    this.updateDebugInfo();
    
    // Update debug info every second
    // TEMPORARILY DISABLED FOR FOCUS DEBUGGING
    // setInterval(() => {
    //   this.updateDebugInfo();
    // }, 1000);
  }

  /**
   * Create debug panel HTML
   */
  private createPanel(): void {
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 350px;
      max-height: 500px;
      overflow-y: auto;
      background: rgba(0, 0, 0, 0.9);
      color: #fff;
      padding: 15px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      z-index: 10000;
      border: 1px solid #333;
    `;

    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="margin: 0; color: #4ade80;">🐛 Theme Debug</h3>
        <button id="toggle-debug" style="background: #333; color: #fff; border: 1px solid #555; padding: 4px 8px; cursor: pointer; border-radius: 4px;">Hide</button>
      </div>
      <div id="debug-content"></div>
    `;

    document.body.appendChild(panel);
    this.panel = panel;

    // Toggle functionality
    const toggleBtn = document.getElementById('toggle-debug');
    const content = document.getElementById('debug-content');
    let isVisible = true;

    toggleBtn?.addEventListener('click', () => {
      if (isVisible) {
        content!.style.display = 'none';
        toggleBtn.textContent = 'Show';
        panel.style.height = '40px';
      } else {
        content!.style.display = 'block';
        toggleBtn.textContent = 'Hide';
        panel.style.height = 'auto';
      }
      isVisible = !isVisible;
    });
  }

  /**
   * Update debug information
   */
  private updateDebugInfo(): void {
    const content = document.getElementById('debug-content');
    if (!content) return;

    const root = document.documentElement;
    const classList = Array.from(root.classList);
    const dataTheme = root.getAttribute('data-theme');
    
    // Get current theme from localStorage
    const storedTheme = localStorage.getItem('theme');
    
    // Get CSS variables
    const computedStyle = getComputedStyle(root);
    const cssVariables = [
      'background',
      'foreground', 
      'primary',
      'primary-foreground',
      'secondary',
      'accent',
      'destructive',
      'border',
      'ring'
    ].map(varName => {
      const value = computedStyle.getPropertyValue(`--${varName}`).trim();
      return { name: varName, value: value || 'not set' };
    });

    content.innerHTML = `
      <div style="margin-bottom: 10px;">
        <strong style="color: #fbbf24;">HTML Classes:</strong><br>
        ${classList.length ? classList.map(c => `<span style="color: #34d399;">.${c}</span>`).join(' ') : '<span style="color: #f87171;">none</span>'}
      </div>
      
      <div style="margin-bottom: 10px;">
        <strong style="color: #fbbf24;">Data Theme:</strong><br>
        <span style="color: ${dataTheme ? '#34d399' : '#f87171'}">${dataTheme || 'not set'}</span>
      </div>
      
      <div style="margin-bottom: 10px;">
        <strong style="color: #fbbf24;">Stored Theme:</strong><br>
        <span style="color: ${storedTheme ? '#34d399' : '#f87171'}">${storedTheme || 'not set'}</span>
      </div>
      
      <div style="margin-bottom: 10px;">
        <strong style="color: #fbbf24;">CSS Variables:</strong><br>
        ${cssVariables.map(v => 
          `<div style="margin: 2px 0; padding-left: 10px;">
            <span style="color: #60a5fa;">--${v.name}:</span> 
            <span style="color: ${v.value !== 'not set' ? '#a78bfa' : '#f87171'}">${v.value}</span>
          </div>`
        ).join('')}
      </div>
      
      <div>
        <strong style="color: #fbbf24;">Theme Options:</strong><br>
        ${this.getThemeOptionsDebug()}
      </div>
    `;
  }

  /**
   * Get debug info about theme options in dropdown
   */
  private getThemeOptionsDebug(): string {
    const themeOptions = document.querySelectorAll('.theme-option');
    const dropdown = document.querySelector('[role="menu"]');
    
    return `
      <div style="padding-left: 10px;">
        <div>Dropdown found: <span style="color: ${dropdown ? '#34d399' : '#f87171'}">${dropdown ? 'yes' : 'no'}</span></div>
        <div>Theme options: <span style="color: #34d399">${themeOptions.length}</span></div>
        ${Array.from(themeOptions).slice(0, 3).map((option, i) => {
          const theme = option.getAttribute('data-theme');
          return `<div style="margin-left: 10px; font-size: 11px;">Option ${i + 1}: <span style="color: #a78bfa">${theme}</span></div>`;
        }).join('')}
        ${themeOptions.length > 3 ? `<div style="margin-left: 10px; font-size: 11px;">...and ${themeOptions.length - 3} more</div>` : ''}
      </div>
    `;
  }
}