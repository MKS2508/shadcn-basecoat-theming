import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  RefreshCw,
  Search,
  Edit,
  Trash2,
  Eye,
  Copy,
  Download
} from 'lucide-react';
import { useThemes, Theme } from '@/hooks/useThemes';

interface ThemeListProps {
  selectedThemeId: string | null;
  onThemeSelect: (themeId: string) => void;
  onThemeCreate: () => void;
  onThemeEdit: (themeId: string) => void;
  onThemeDelete: (themeId: string) => void;
}

export function ThemeList({
  selectedThemeId,
  onThemeSelect,
  onThemeCreate,
  onThemeEdit,
  onThemeDelete
}: ThemeListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const {
    themes,
    loading,
    error,
    refetch,
  } = useThemes();

  const filteredThemes = (themes || []).filter(theme => {
    const matchesSearch = theme.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         theme.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         theme.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'all' || theme.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const getAvailableModes = (theme: Theme) => {
    const modes = [];
    if (theme.modes.light) modes.push('Light');
    if (theme.modes.dark) modes.push('Dark');
    return modes;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'built-in': return 'default';
      case 'custom': return 'secondary';
      case 'external': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Cargando themes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <div>
            <h3 className="font-semibold text-red-600">Error al cargar themes</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button onClick={refetch} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Themes</h2>
            <p className="text-sm text-muted-foreground">
              {filteredThemes.length} de {themes.length} themes
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={refetch} size="sm" variant="ghost">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={onThemeCreate} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar themes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Theme List */}
      <div className="space-y-2">
        {filteredThemes.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">
              {searchTerm || filterCategory !== 'all' ? '🔍' : '🎨'}
            </div>
            <p className="text-muted-foreground">
              {searchTerm || filterCategory !== 'all'
                ? 'No se encontraron themes que coincidan con los filtros'
                : 'No hay themes disponibles. ¡Crea el primero!'}
            </p>
            {(!searchTerm && filterCategory === 'all') && (
              <Button onClick={onThemeCreate} className="mt-4" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Crear Theme
              </Button>
            )}
          </div>
        ) : (
          filteredThemes.map((theme) => (
            <div
              key={theme.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedThemeId === theme.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-accent'
              }`}
              onClick={() => onThemeSelect(theme.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{theme.label}</h3>
                    <Badge variant={getCategoryColor(theme.category)} className="text-xs">
                      {theme.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-2">
                    {theme.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>ID: {theme.id}</span>
                    <span>•</span>
                    <span>{theme.author}</span>
                    <span>•</span>
                    <span>v{theme.version}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {getAvailableModes(theme).map((mode) => (
                      <Badge key={mode} variant="outline" className="text-xs">
                        {mode}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onThemeEdit(theme.id);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement preview
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onThemeDelete(theme.id);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Status */}
      {themes.length > 0 && (
        <>
          <Separator />
          <div className="text-center space-y-2">
            <div className="text-xs text-muted-foreground">
              Total: {themes.length} themes • {themes.filter(t => t.category === 'built-in').length} built-in • {themes.filter(t => t.category === 'custom').length} custom
            </div>
          </div>
        </>
      )}
    </div>
  );
}