import { useState, useEffect } from 'react';

export interface Theme {
  id: string;
  label: string;
  description: string;
  category: string;
  author: string;
  version: string;
  modes: {
    light?: boolean;
    dark?: boolean;
  };
  metadata?: {
    updatedAt?: string;
    createdAt?: string;
  };
}

export interface ThemeListResponse {
  themes: Theme[];
  total: number;
}

export function useThemes() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThemes = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/themes');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ThemeListResponse = await response.json();
      setThemes(data.themes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching themes:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTheme = async (themeData: Partial<Theme>) => {
    try {
      const response = await fetch('/api/themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(themeData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newTheme: Theme = await response.json();
      setThemes(prev => [...prev, newTheme]);
      return newTheme;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateTheme = async (id: string, updates: Partial<Theme>) => {
    try {
      const response = await fetch(`/api/themes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedTheme: Theme = await response.json();
      setThemes(prev => prev.map(theme =>
        theme.id === id ? updatedTheme : theme
      ));
      return updatedTheme;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteTheme = async (id: string) => {
    try {
      const response = await fetch(`/api/themes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setThemes(prev => prev.filter(theme => theme.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  return {
    themes,
    loading,
    error,
    refetch: fetchThemes,
    createTheme,
    updateTheme,
    deleteTheme,
  };
}