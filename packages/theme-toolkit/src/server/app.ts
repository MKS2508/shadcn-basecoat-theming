import { serve } from 'bun';
import { join } from 'path';
import { ThemeManager } from './services/theme-manager.js';
import { setupThemeRoutes } from './routes/themes.js';
import { setupPreviewRoutes } from './routes/preview.js';
import logger from '@mks2508/better-logger';

// Configure logger
logger.preset('cyberpunk');
logger.showTimestamp();
logger.showLocation();

const serverLogger = logger;

// Initialize theme manager
const themeManager = new ThemeManager(join(process.cwd(), 'themes'));

// Create Bun server
const server = serve({
  port: 4002,
  hostname: 'localhost',
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;

    serverLogger.info(`${method} ${url.pathname}`);

    try {
      // Serve static files from public directory
      if (url.pathname === '/' || url.pathname === '/index.html') {
        const file = Bun.file(join(process.cwd(), 'public', 'index.html'));
        return new Response(file);
      }

      if (url.pathname === '/styles.css') {
        const file = Bun.file(join(process.cwd(), 'public', 'styles.css'));
        return new Response(file, {
          headers: { 'Content-Type': 'text/css' }
        });
      }

      if (url.pathname === '/script.js') {
        const file = Bun.file(join(process.cwd(), 'public', 'script.js'));
        return new Response(file, {
          headers: { 'Content-Type': 'application/javascript' }
        });
      }

      if (url.pathname === '/preview.html') {
        const file = Bun.file(join(process.cwd(), 'public', 'preview.html'));
        return new Response(file);
      }

      // API Routes
      if (url.pathname.startsWith('/api/themes/')) {
        if (url.pathname.match(/^\/api\/themes\/[^\/]+\/css$/)) {
          // Handle /api/themes/{id}/css?mode=light|dark
          const parts = url.pathname.split('/');
          const themeId = parts[3];
          const mode = url.searchParams.get('mode') || 'light';

          if (method === 'GET') {
            req.params = { id: themeId, mode };
            return handleThemeCSS(req, themeManager);
          } else if (method === 'PUT') {
            req.params = { id: themeId, mode };
            return handleSaveThemeCSS(req, themeManager);
          }
        } else if (url.pathname.match(/^\/api\/themes\/[^\/]+\/(light|dark)$/)) {
          const parts = url.pathname.split('/');
          const themeId = parts[3];
          const mode = parts[4];

          if (method === 'GET') {
            req.params = { id: themeId, mode };
            return handleThemeCSS(req, themeManager);
          } else if (method === 'PUT') {
            req.params = { id: themeId, mode };
            return handleSaveThemeCSS(req, themeManager);
          }
        } else if (url.pathname.match(/^\/api\/themes\/[^\/]+$/)) {
          const parts = url.pathname.split('/');
          const themeId = parts[3];

          if (method === 'GET') {
            req.params = { id: themeId };
            return handleGetTheme(req, themeManager);
          } else if (method === 'PUT') {
            req.params = { id: themeId };
            return handleUpdateTheme(req, themeManager);
          } else if (method === 'DELETE') {
            req.params = { id: themeId };
            return handleDeleteTheme(req, themeManager);
          }
        }
      }

      if (url.pathname.startsWith('/api/preview/')) {
        if (url.pathname.match(/^\/api\/preview\/[^\/]+\/(light|dark)$/)) {
          const parts = url.pathname.split('/');
          const themeId = parts[3];
          const mode = parts[4];

          if (method === 'GET') {
            req.params = { id: themeId, mode };
            return handlePreview(req, themeManager);
          }
        }
      }

      // Other API routes
      if (url.pathname === '/api/themes') {
        if (method === 'GET') {
          return handleListThemes(req, themeManager);
        } else if (method === 'POST') {
          return handleCreateTheme(req, themeManager);
        }
      }

      if (url.pathname === '/api/validate') {
        if (method === 'POST') {
          return handleValidateCSS(req, themeManager);
        }
      }

      if (url.pathname === '/api/themes/validate') {
        if (method === 'POST') {
          return handleValidateCSS(req, themeManager);
        }
      }

      // 404 for unknown routes
      return new Response('Not Found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });

    } catch (error) {
      serverLogger.error('Request error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});

serverLogger.success('🚀 Theme Toolkit Server started on http://localhost:4002');

// API Handlers
async function handleListThemes(req: Request, themeManager: ThemeManager) {
  try {
    const themes = await themeManager.getAllThemes();
    return new Response(JSON.stringify({
      themes: themes,
      total: themes.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    serverLogger.error('Failed to list themes:', error);
    return new Response(JSON.stringify({
      themes: [],
      total: 0
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleGetTheme(req: Request, themeManager: ThemeManager) {
  try {
    const { id } = req.params;
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

    return new Response(JSON.stringify({
      success: true,
      data: theme
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    serverLogger.error('Failed to get theme:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch theme'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleCreateTheme(req: Request, themeManager: ThemeManager) {
  try {
    const body = await req.json();

    if (!body.name || !body.label || !body.description) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: name, label, description'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const newTheme = await themeManager.createTheme(body);
    return new Response(JSON.stringify({
      success: true,
      data: newTheme
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    serverLogger.error('Failed to create theme:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create theme'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleUpdateTheme(req: Request, themeManager: ThemeManager) {
  try {
    const { id } = req.params;
    const updates = await req.json();

    const updatedTheme = await themeManager.updateTheme(id, updates);

    if (!updatedTheme) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Theme not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: updatedTheme
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    serverLogger.error('Failed to update theme:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update theme'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleDeleteTheme(req: Request, themeManager: ThemeManager) {
  try {
    const { id } = req.params;
    const deleted = await themeManager.deleteTheme(id);

    if (!deleted) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Theme not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Theme deleted successfully'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    serverLogger.error('Failed to delete theme:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete theme'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleThemeCSS(req: Request, themeManager: ThemeManager) {
  try {
    const { id, mode } = req.params;
    const css = await themeManager.getThemeCSS(id, mode);

    if (!css) {
      return new Response(JSON.stringify({
        success: false,
        error: 'CSS not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return CSS as JSON instead of raw CSS
    return new Response(JSON.stringify({
      css: css,
      mode: mode,
      themeId: id
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    serverLogger.error('Failed to get theme CSS:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch theme CSS'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleSaveThemeCSS(req: Request, themeManager: ThemeManager) {
  try {
    const { id, mode } = req.params;
    const { css } = await req.json();

    if (!css) {
      return new Response(JSON.stringify({
        success: false,
        error: 'CSS content is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const saved = await themeManager.saveThemeCSS(id, mode, css);

    if (!saved) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to save CSS'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      css: css,
      mode: mode,
      themeId: id
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    serverLogger.error('Failed to save theme CSS:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to save theme CSS'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handlePreview(req: Request, themeManager: ThemeManager) {
  try {
    const { id, mode } = req.params;

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
        error: 'CSS not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate preview HTML
    const previewHTML = generatePreviewHTML(css, theme, mode);
    return new Response(previewHTML, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    serverLogger.error('Failed to generate preview:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to generate preview'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleValidateCSS(req: Request, themeManager: ThemeManager) {
  try {
    const { css } = await req.json();

    if (!css) {
      return new Response(JSON.stringify({
        success: false,
        error: 'CSS content is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = themeManager.validateCSS(css);
    return new Response(JSON.stringify({
      success: true,
      data: result
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    serverLogger.error('Failed to validate CSS:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to validate CSS'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
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
        }

        .preview-button:hover {
          opacity: 0.9;
        }

        .preview-input {
          background: var(--input);
          color: var(--foreground);
          border: 1px solid var(--border);
          padding: 0.75rem;
          border-radius: var(--radius);
          width: 100%;
          margin-bottom: 1rem;
        }

        .color-swatch {
          display: inline-block;
          width: 60px;
          height: 60px;
          border-radius: var(--radius);
          border: 2px solid var(--border);
          margin: 0.5rem;
          text-align: center;
          line-height: 60px;
          font-size: 0.8rem;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <header class="preview-section">
            <h1 class="preview-title">🎨 ${theme.label} - ${mode} Preview</h1>
            <p>${theme.description}</p>
        </header>

        <section class="preview-section">
            <h2 class="preview-title">Buttons</h2>
            <div class="component-card">
                <button class="preview-button">Primary Button</button>
                <button class="preview-button" style="background: var(--secondary); color: var(--secondary-foreground);">Secondary</button>
                <button class="preview-button" style="background: var(--accent); color: var(--accent-foreground);">Accent</button>
                <button class="preview-button" style="background: var(--destructive); color: var(--destructive-foreground);">Destructive</button>
            </div>
        </section>

        <section class="preview-section">
            <h2 class="preview-title">Form Elements</h2>
            <div class="component-card">
                <input type="text" class="preview-input" placeholder="Text input">
                <input type="email" class="preview-input" placeholder="Email input">
            </div>
        </section>

        <section class="preview-section">
            <h2 class="preview-title">Colors</h2>
            <div class="component-card">
                <div class="color-swatch" style="background: var(--primary); color: var(--primary-foreground);">Primary</div>
                <div class="color-swatch" style="background: var(--secondary); color: var(--secondary-foreground);">Secondary</div>
                <div class="color-swatch" style="background: var(--accent); color: var(--accent-foreground);">Accent</div>
                <div class="color-swatch" style="background: var(--background); color: var(--foreground);">Background</div>
                <div class="color-swatch" style="background: var(--foreground); color: var(--background);">Foreground</div>
            </div>
        </section>
    </div>
</body>
</html>`;
}