import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useThemeCSS } from '@/hooks/useThemeCSS';

interface CSSEditorProps {
  themeId: string;
  onSave?: (mode: 'light' | 'dark') => void;
}

export function CSSEditor({ themeId, onSave }: CSSEditorProps) {
  const [activeMode, setActiveMode] = useState<'light' | 'dark'>('light');
  const [currentCSS, setCurrentCSS] = useState('');
  const [validation, setValidation] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const {
    css,
    lightCSS,
    darkCSS,
    loading,
    error,
    fetchCSS,
    saveCSS,
    validateCSS,
  } = useThemeCSS(themeId);

  // Load CSS when mode changes
  useEffect(() => {
    fetchCSS(activeMode);
  }, [themeId, activeMode, fetchCSS]);

  // Update current CSS when fetched
  useEffect(() => {
    const targetCSS = activeMode === 'light' ? lightCSS : darkCSS;
    if (targetCSS && targetCSS !== currentCSS) {
      setCurrentCSS(targetCSS);
    }
  }, [lightCSS, darkCSS, activeMode, currentCSS]);

  const handleSave = useCallback(async () => {
    if (!themeId || !currentCSS.trim()) return;

    try {
      await saveCSS(activeMode, currentCSS);
      onSave?.(activeMode);
    } catch (err) {
      console.error('Error saving CSS:', err);
    }
  }, [themeId, currentCSS, activeMode, saveCSS, onSave]);

  const handleValidate = useCallback(async () => {
    if (!currentCSS.trim()) return;

    setIsValidating(true);
    try {
      const result = await validateCSS(currentCSS);
      setValidation(result);
    } catch (err) {
      setValidation({
        valid: false,
        errors: ['Error de validación: ' + (err instanceof Error ? err.message : 'Error desconocido')],
        warnings: [],
      });
    } finally {
      setIsValidating(false);
    }
  }, [currentCSS, validateCSS]);

  const hasChanges = currentCSS !== (activeMode === 'light' ? lightCSS : darkCSS);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Editor CSS</h3>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-xs">
              Cambios sin guardar
            </Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleValidate}
            disabled={isValidating || !currentCSS.trim()}
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Validar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading || !hasChanges || !currentCSS.trim()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar
          </Button>
        </div>
      </div>

      {/* Mode Selector */}
      <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as 'light' | 'dark')}>
        <TabsList>
          <TabsTrigger value="light" className="flex items-center gap-2">
            Light
          </TabsTrigger>
          <TabsTrigger value="dark" className="flex items-center gap-2">
            Dark
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeMode} className="space-y-4">
          {/* CSS Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                CSS Variables ({activeMode === 'light' ? 'Light Mode' : 'Dark Mode'})
              </label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => fetchCSS(activeMode)}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recargar
              </Button>
            </div>
            <textarea
              value={currentCSS}
              onChange={(e) => setCurrentCSS(e.target.value)}
              className="w-full h-96 p-4 font-mono text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={`/* CSS variables para ${activeMode} mode */\n:root {\n  --background: oklch(...);\n  --foreground: oklch(...);\n  /* ... más variables */\n}`}
              spellCheck={false}
            />
          </div>

          {/* Validation Results */}
          {validation && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {validation.valid ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {validation.valid ? 'CSS válido' : 'CSS con errores'}
                </span>
              </div>

              {validation.errors.length > 0 && (
                <div className="space-y-1">
                  {validation.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 dark:text-red-400">
                      • {error}
                    </div>
                  ))}
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div className="space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <div key={index} className="text-sm text-yellow-600 dark:text-yellow-400">
                      • {warning}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              Error: {error}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}