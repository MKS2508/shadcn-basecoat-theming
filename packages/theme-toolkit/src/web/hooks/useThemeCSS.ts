import { useState } from 'react';

export interface ThemeCSSResponse {
  css: string;
  mode: 'light' | 'dark';
  themeId: string;
}

export function useThemeCSS(themeId: string) {
  const [css, setCss] = useState<string>('');
  const [lightCSS, setLightCSS] = useState<string>('');
  const [darkCSS, setDarkCSS] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCSS = async (mode: 'light' | 'dark' = 'light') => {
    if (!themeId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/themes/${themeId}/css?mode=${mode}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ThemeCSSResponse = await response.json();

      if (mode === 'light') {
        setLightCSS(data.css);
        setCss(data.css);
      } else {
        setDarkCSS(data.css);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching theme CSS:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveCSS = async (mode: 'light' | 'dark', cssContent: string) => {
    if (!themeId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/themes/${themeId}/css?mode=${mode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ css: cssContent }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ThemeCSSResponse = await response.json();

      if (mode === 'light') {
        setLightCSS(data.css);
      } else {
        setDarkCSS(data.css);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateCSS = async (cssContent: string) => {
    try {
      const response = await fetch('/api/themes/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ css: cssContent }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    css,
    lightCSS,
    darkCSS,
    loading,
    error,
    fetchCSS,
    saveCSS,
    validateCSS,
  };
}