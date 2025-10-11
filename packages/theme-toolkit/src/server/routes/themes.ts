import type { ThemeManager } from '@/server/services/theme-manager.js';
import type { ThemeCreateRequest, ThemeEditRequest } from '@/types/theme.js';
import logger from '@mks2508/better-logger';

const themesLogger = logger.create('[ThemesAPI]');

export function setupThemeRoutes(app: any, themeManager: ThemeManager) {
  themesLogger.info('Setting up theme API routes');

  // GET /api/themes - Get all themes
  app.get('/api/themes', async (request: Request) => {
    try {
      themesLogger.info('Fetching all themes');
      const themes = await themeManager.getAllThemes();

      return new Response(JSON.stringify({
        success: true,
        data: themes,
        count: themes.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      themesLogger.error('Failed to fetch themes:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch themes'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });

  // GET /api/themes/:id - Get specific theme
  app.get('/api/themes/:id', async (request: Request, params: any) => {
    try {
      const { id } = params;
      themesLogger.info(`Fetching theme: ${id}`);

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
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      themesLogger.error('Failed to fetch theme:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch theme'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });

  // POST /api/themes - Create new theme
  app.post('/api/themes', async (request: Request) => {
    try {
      const body = await request.json() as ThemeCreateRequest;
      themesLogger.info(`Creating new theme: ${body.name}`);

      // Validate required fields
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
      themesLogger.error('Failed to create theme:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create theme'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });

  // PUT /api/themes/:id - Update theme
  app.put('/api/themes/:id', async (request: Request, params: any) => {
    try {
      const { id } = params;
      const updates = await request.json();
      themesLogger.info(`Updating theme: ${id}`);

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
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      themesLogger.error('Failed to update theme:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to update theme'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });

  // DELETE /api/themes/:id - Delete theme
  app.delete('/api/themes/:id', async (request: Request, params: any) => {
    try {
      const { id } = params;
      themesLogger.info(`Deleting theme: ${id}`);

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
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      themesLogger.error('Failed to delete theme:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to delete theme'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });

  // GET /api/themes/:id/:mode - Get theme CSS
  app.get('/api/themes/:id/:mode', async (request: Request, params: any) => {
    try {
      const { id, mode } = params;

      if (mode !== 'light' && mode !== 'dark') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid mode. Must be light or dark'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      themesLogger.info(`Fetching CSS for theme ${id} in ${mode} mode`);

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

      return new Response(css, {
        status: 200,
        headers: { 'Content-Type': 'text/css' }
      });
    } catch (error) {
      themesLogger.error('Failed to fetch theme CSS:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch theme CSS'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });

  // POST /api/themes/:id/:mode - Save theme CSS
  app.post('/api/themes/:id/:mode', async (request: Request, params: any) => {
    try {
      const { id, mode } = params;
      const { css } = await request.json();

      if (mode !== 'light' && mode !== 'dark') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid mode. Must be light or dark'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (!css) {
        return new Response(JSON.stringify({
          success: false,
          error: 'CSS content is required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      themesLogger.info(`Saving CSS for theme ${id} in ${mode} mode`);

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
        success: true,
        message: 'CSS saved successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      themesLogger.error('Failed to save theme CSS:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to save theme CSS'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });

  themesLogger.success('Theme API routes configured successfully');
}