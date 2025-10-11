import type { ThemeManager } from '@/server/services/theme-manager.js';
import logger from '@mks2508/better-logger';

const previewLogger = logger.create('[PreviewAPI]');

export function setupPreviewRoutes(app: any, themeManager: ThemeManager) {
  previewLogger.info('Setting up preview API routes');

  // POST /api/validate - Validate CSS
  app.post('/api/validate', async (request: Request) => {
    try {
      const { css } = await request.json();

      if (!css) {
        return new Response(JSON.stringify({
          success: false,
          error: 'CSS content is required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      previewLogger.info('Validating CSS');
      const result = themeManager.validateCSS(css);

      return new Response(JSON.stringify({
        success: true,
        data: result
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      previewLogger.error('Failed to validate CSS:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to validate CSS'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });

  // GET /api/preview/:id/:mode - Generate preview with theme
  app.get('/api/preview/:id/:mode', async (request: Request, params: any) => {
    try {
      const { id, mode } = params;
      previewLogger.info(`Generating preview for theme ${id} in ${mode} mode`);

      const theme = await themeManager.getThemeById(id);
      if (!theme) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Theme not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const css = await themeManager.getThemeCSS(id, mode);
      if (!css) {
        return new Response(JSON.stringify({
          success: false,
          error: 'CSS not found for this theme and mode'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Generate preview HTML with the theme CSS
      const previewHTML = generatePreviewHTML(css, theme, mode);

      return new Response(previewHTML, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    } catch (error) {
      previewLogger.error('Failed to generate preview:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to generate preview'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });

  previewLogger.success('Preview API routes configured successfully');
}

function generatePreviewHTML(css: string, theme: any, mode: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${theme.label} - ${mode} Preview</title>
    <style>
        ${css}

        /* Additional preview styles */
        body {
          padding: 2rem;
          background: var(--background);
          color: var(--foreground);
          font-family: var(--font-sans);
          min-height: 100vh;
        }

        .preview-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .preview-section {
          margin-bottom: 3rem;
        }

        .preview-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--foreground);
        }

        .component-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .component-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.5rem;
          box-shadow: var(--shadow);
        }

        .preview-button {
          background: var(--primary);
          color: var(--primary-foreground);
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius);
          cursor: pointer;
          margin-right: 0.5rem;
          margin-bottom: 0.5rem;
          font-family: var(--font-sans);
        }

        .preview-button:hover {
          opacity: 0.9;
        }

        .preview-button-secondary {
          background: var(--secondary);
          color: var(--secondary-foreground);
        }

        .preview-button-accent {
          background: var(--accent);
          color: var(--accent-foreground);
        }

        .preview-button-destructive {
          background: var(--destructive);
          color: var(--destructive-foreground);
        }

        .preview-input {
          background: var(--input);
          color: var(--foreground);
          border: 1px solid var(--border);
          padding: 0.75rem;
          border-radius: var(--radius);
          width: 100%;
          margin-bottom: 1rem;
          font-family: var(--font-sans);
        }

        .preview-input:focus {
          outline: 2px solid var(--ring);
          outline-offset: 2px;
        }

        .preview-textarea {
          background: var(--input);
          color: var(--foreground);
          border: 1px solid var(--border);
          padding: 0.75rem;
          border-radius: var(--radius);
          width: 100%;
          min-height: 100px;
          font-family: var(--font-sans);
          resize: vertical;
        }

        .preview-badge {
          background: var(--secondary);
          color: var(--secondary-foreground);
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          display: inline-block;
          margin-right: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .color-palette {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .color-swatch {
          width: 80px;
          height: 80px;
          border-radius: var(--radius);
          border: 2px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          text-align: center;
        }

        .typography-sample {
          line-height: 1.6;
        }

        .font-sans { font-family: var(--font-sans); }
        .font-serif { font-family: var(--font-serif); }
        .font-mono { font-family: var(--font-mono); }

        .shadow-box {
          background: var(--card);
          padding: 1rem;
          border-radius: var(--radius);
          margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <header class="preview-section">
            <h1 class="preview-title">🎨 ${theme.label} - ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode</h1>
            <p>${theme.description}</p>
        </header>

        <section class="preview-section">
            <h2 class="preview-title">Buttons</h2>
            <div class="component-card">
                <button class="preview-button">Primary Button</button>
                <button class="preview-button preview-button-secondary">Secondary Button</button>
                <button class="preview-button preview-button-accent">Accent Button</button>
                <button class="preview-button preview-button-destructive">Destructive Button</button>
            </div>
        </section>

        <section class="preview-section">
            <h2 class="preview-title">Form Elements</h2>
            <div class="component-card">
                <input type="text" class="preview-input" placeholder="Text input">
                <input type="email" class="preview-input" placeholder="Email input">
                <textarea class="preview-textarea" placeholder="Textarea input"></textarea>
            </div>
        </section>

        <section class="preview-section">
            <h2 class="preview-title">Cards & Components</h2>
            <div class="component-grid">
                <div class="component-card">
                    <h3 style="margin-top: 0; color: var(--foreground);">Card Title</h3>
                    <p style="color: var(--muted-foreground);">This is a sample card component with text and borders.</p>
                </div>
                <div class="component-card" style="background: var(--muted);">
                    <h3 style="margin-top: 0; color: var(--foreground);">Muted Card</h3>
                    <p style="color: var(--muted-foreground);">This card uses the muted background color.</p>
                </div>
            </div>
        </section>

        <section class="preview-section">
            <h2 class="preview-title">Badges</h2>
            <div class="component-card">
                <span class="preview-badge">Default</span>
                <span class="preview-badge" style="background: var(--primary); color: var(--primary-foreground);">Primary</span>
                <span class="preview-badge" style="background: var(--accent); color: var(--accent-foreground);">Accent</span>
                <span class="preview-badge" style="background: var(--destructive); color: var(--destructive-foreground);">Destructive</span>
            </div>
        </section>

        <section class="preview-section">
            <h2 class="preview-title">Color Palette</h2>
            <div class="component-card">
                <div class="color-palette">
                    <div class="color-swatch" style="background: var(--primary); color: var(--primary-foreground);">
                        Primary
                    </div>
                    <div class="color-swatch" style="background: var(--secondary); color: var(--secondary-foreground);">
                        Secondary
                    </div>
                    <div class="color-swatch" style="background: var(--accent); color: var(--accent-foreground);">
                        Accent
                    </div>
                    <div class="color-swatch" style="background: var(--destructive); color: var(--destructive-foreground);">
                        Destructive
                    </div>
                    <div class="color-swatch" style="background: var(--background); color: var(--foreground); border-color: var(--border);">
                        Background
                    </div>
                    <div class="color-swatch" style="background: var(--foreground); color: var(--background);">
                        Foreground
                    </div>
                </div>
            </div>
        </section>

        <section class="preview-section">
            <h2 class="preview-title">Typography</h2>
            <div class="component-grid">
                <div class="component-card">
                    <h3 style="margin-top: 0; color: var(--foreground);">Sans Serif</h3>
                    <div class="typography-sample font-sans">
                        <p style="font-size: 2rem; font-weight: 700; margin: 0 0 1rem 0;">Heading Sans</p>
                        <p style="margin: 0;">This text uses the sans-serif font family: var(--font-sans)</p>
                    </div>
                </div>
                <div class="component-card">
                    <h3 style="margin-top: 0; color: var(--foreground);">Serif</h3>
                    <div class="typography-sample font-serif">
                        <p style="font-size: 2rem; font-weight: 700; margin: 0 0 1rem 0;">Heading Serif</p>
                        <p style="margin: 0;">This text uses the serif font family: var(--font-serif)</p>
                    </div>
                </div>
                <div class="component-card">
                    <h3 style="margin-top: 0; color: var(--foreground);">Monospace</h3>
                    <div class="typography-sample font-mono">
                        <p style="font-size: 2rem; font-weight: 700; margin: 0 0 1rem 0;">Heading Mono</p>
                        <p style="margin: 0;">This text uses the monospace font family: var(--font-mono)</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="preview-section">
            <h2 class="preview-title">Shadows</h2>
            <div class="component-card">
                <div class="shadow-box" style="box-shadow: var(--shadow-sm);">Small Shadow</div>
                <div class="shadow-box" style="box-shadow: var(--shadow-md);">Medium Shadow</div>
                <div class="shadow-box" style="box-shadow: var(--shadow-lg);">Large Shadow</div>
                <div class="shadow-box" style="box-shadow: var(--shadow-xl);">Extra Large Shadow</div>
            </div>
        </section>
    </div>
</body>
</html>`;
}