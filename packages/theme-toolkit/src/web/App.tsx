import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Palette, Plus, RefreshCw } from "lucide-react";

import { ThemeProvider, ThemeSelector, ModeToggle } from "@mks2508/theme-manager-react";
import { ThemeList } from "@/components/ThemeList";
import { CSSEditor } from "@/components/CSSEditor";

function App() {
  const [showThemeManagement, setShowThemeManagement] = useState(false);
  const [showFontSettings, setShowFontSettings] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  const handleThemeCreate = () => {
    // TODO: Implement create theme modal
    console.log('Create theme');
  };

  const handleThemeEdit = (themeId: string) => {
    setSelectedThemeId(themeId);
  };

  const handleThemeDelete = (themeId: string) => {
    // TODO: Implement delete theme confirmation
    console.log('Delete theme:', themeId);
  };

  const handleThemeSelect = (themeId: string) => {
    setSelectedThemeId(themeId);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex h-screen">
          {/* Sidebar - Theme List */}
          <aside className="w-80 border-r border-border bg-muted/50">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    🎨 Theme Toolkit
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gestor de themes MedModerna
                  </p>
                </div>
                <div className="flex gap-2">
                  <ThemeSelector
                    onThemeManagement={() => setShowThemeManagement(true)}
                    onFontSettings={() => setShowFontSettings(true)}
                  />
                  <ModeToggle />
                </div>
              </div>

              <Separator />

              <ThemeList
                selectedThemeId={selectedThemeId}
                onThemeSelect={handleThemeSelect}
                onThemeCreate={handleThemeCreate}
                onThemeEdit={handleThemeEdit}
                onThemeDelete={handleThemeDelete}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col">
            {/* Header */}
            <header className="border-b border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {selectedThemeId ? 'Editor de Theme' : 'Seleccionar Theme'}
                  </h2>
                  <p className="text-muted-foreground">
                    {selectedThemeId
                      ? 'Editando configuración del theme seleccionado'
                      : 'Selecciona un theme para comenzar a editar'
                    }
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configuración
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowThemeManagement(true)}>
                    <Palette className="h-4 w-4 mr-2" />
                    Theme Manager
                  </Button>
                </div>
              </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 p-6">
              {!selectedThemeId ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <div className="text-6xl">🎨</div>
                    <h3 className="text-2xl font-bold">Bienvenido a Theme Toolkit</h3>
                    <p className="text-muted-foreground max-w-md">
                      Selecciona un theme existente del sidebar o crea uno nuevo para comenzar
                      a personalizar la apariencia de tu aplicación.
                    </p>
                    <Button className="mt-4" onClick={handleThemeCreate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Nuevo Theme
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Theme Editor */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* CSS Editor */}
                    <CSSEditor
                      themeId={selectedThemeId}
                      onSave={(mode) => {
                        console.log('Saved CSS for mode:', mode);
                      }}
                    />

                    {/* Live Preview */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Vista Previa</h3>
                      <div className="border border-border rounded-lg p-4 bg-muted/30 h-96 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <div className="text-4xl mb-2">👁</div>
                          <p>Preview del theme</p>
                          <p className="text-sm mt-2">Theme ID: {selectedThemeId}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline">Exportar Theme</Button>
                    <Button variant="outline">Validar Completo</Button>
                    <Button variant="destructive">Eliminar Theme</Button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Theme Management Modal */}
        {/* Font Settings Modal */}
      </div>
    </ThemeProvider>
  );
}

export default App;