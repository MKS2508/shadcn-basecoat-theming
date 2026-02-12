import React, { useState, useEffect } from 'react';
import { useTheme } from '../index';
import { Button, Input, Badge, AlertDialog as Dialog, AlertDialogPopup as DialogPopup, AlertDialogTitle as DialogTitle, AlertDialogClose as DialogClose, SearchIcon, RefreshCw, DownloadIcon, Trash2 } from '@mks2508/mks-ui/react';
import { Eye, Loader2 } from 'lucide-react';
import {
  type ThemeConfig,
  type RegistryTheme
} from '@mks2508/shadcn-basecoat-theme-manager';
import { cn } from '../lib/utils';

interface ThemeManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ThemeManagementModal: React.FC<ThemeManagementModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { themeManager, installer, initialized } = useTheme();
  const [activeTab, setActiveTab] = useState<'installed' | 'browse'>('installed');
  const [installedThemes, setInstalledThemes] = useState<ThemeConfig[]>([]);
  const [registryThemes, setRegistryThemes] = useState<RegistryTheme[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingInstalled, setIsLoadingInstalled] = useState<boolean>(true);
  const [isLoadingRegistry, setIsLoadingRegistry] = useState<boolean>(false);
  const [previewTimer, setPreviewTimer] = useState<NodeJS.Timeout | null>(null);
  const [previewCountdown, setPreviewCountdown] = useState<number>(0);
  const [originalTheme, setOriginalTheme] = useState<{id: string; mode: 'auto' | 'light' | 'dark'} | null>(null);
  const [isPreviewActive, setIsPreviewActive] = useState(false);

  // Load installed themes
  useEffect(() => {
    if (!themeManager || !initialized) return;

    const loadInstalledThemes = async () => {
      try {
        setIsLoadingInstalled(true);
        console.log('🔍 [ThemeManagement] Loading installed themes...');

        const themes = themeManager.getThemeRegistry().getInstalledThemes();
        console.log('📦 [ThemeManagement] Found installed themes:', themes.length);

        setInstalledThemes(themes || []);
      } catch (error) {
        console.error('Failed to load installed themes:', error);
      } finally {
        setIsLoadingInstalled(false);
      }
    };

    loadInstalledThemes();
  }, [themeManager, initialized]);

  // Fetch registry themes when browse tab is active
  useEffect(() => {
    if (activeTab !== 'browse' || !open) return;

    const fetchRegistryThemes = async () => {
      try {
        setIsLoadingRegistry(true);
        console.log('🔍 [ThemeManagement] Fetching registry themes...');

        const response = await fetch('https://tweakcn.com/api/themes');
        if (!response.ok) throw new Error('Failed to fetch registry');

        const data = await response.json();
        console.log('📦 [ThemeManagement] Found registry themes:', data.length);

        setRegistryThemes(data.themes || []);
      } catch (error) {
        console.error('Failed to fetch registry:', error);
        setRegistryThemes([]);
      } finally {
        setIsLoadingRegistry(false);
      }
    };

    fetchRegistryThemes();
  }, [activeTab, open]);

  const filteredRegistryThemes = registryThemes.filter(theme =>
    theme.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    theme.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInstall = async (themeUrl: string, themeId: string, themeName: string) => {
    if (!installer || !themeManager) return;

    console.log('📥 [ThemeManagement] Installing theme:', themeName);

    try {
      await installer.installFromUrl(themeUrl);
      console.log('✅ [ThemeManagement] Theme installed successfully');

      // Refresh installed themes
      const updated = themeManager.getThemeRegistry().getInstalledThemes();
      setInstalledThemes(updated || []);
    } catch (error) {
      console.error('❌ [ThemeManagement] Failed to install theme:', error);
      alert(`Failed to install ${themeName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUninstall = async (themeId: string) => {
    if (!themeManager) return;

    if (!confirm('Are you sure you want to uninstall this theme?')) return;

    try {
      console.log('🗑️ [ThemeManagement] Uninstalling theme:', themeId);

      themeManager.getThemeRegistry().uninstallTheme(themeId);
      console.log('✅ [ThemeManagement] Theme uninstalled successfully');

      // Refresh installed themes
      const updated = themeManager.getThemeRegistry().getInstalledThemes();
      setInstalledThemes(updated || []);
    } catch (error) {
      console.error('❌ [ThemeManagement] Failed to uninstall theme:', error);
    }
  };

  const startPreview = (themeId: string, mode: 'light' | 'dark') => {
    if (!themeManager) return;

    const current = {
      id: themeManager.getCurrentTheme(),
      mode: themeManager.getCurrentMode()
    };
    setOriginalTheme(current);
    setIsPreviewActive(true);

    // Apply preview theme
    themeManager.setTheme(themeId, mode);
    setPreviewCountdown(10);

    // Start countdown
    const timer = setInterval(() => {
      setPreviewCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          revertPreview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setPreviewTimer(timer);
  };

  const revertPreview = () => {
    if (!themeManager || !originalTheme) return;

    console.log('🔄 [ThemeManagement] Reverting to original theme:', originalTheme);

    themeManager.setTheme(originalTheme.id, originalTheme.mode);
    setIsPreviewActive(false);
    setOriginalTheme(null);

    if (previewTimer) {
      clearInterval(previewTimer);
      setPreviewTimer(null);
    }
  };

  const applyPreview = (themeId: string, mode: 'light' | 'dark') => {
    if (!themeManager) return;
    themeManager.setTheme(themeId, mode);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <DialogTitle>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold leading-none">Theme Management</h2>
                <p className="text-sm text-muted-foreground">
                  Install, preview, and manage your themes
                </p>
              </div>
            </div>
          </DialogTitle>
        </div>

        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex items-center justify-center rounded-lg border p-1">
            <button
              onClick={() => setActiveTab('installed')}
              className={cn(
                "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all",
                activeTab === 'installed'
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              Installed ({installedThemes.length})
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={cn(
                "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all",
                activeTab === 'browse'
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              Browse Registry
            </button>
          </div>

          {/* Installed Themes Tab */}
          {activeTab === 'installed' && (
            <div className="space-y-2">
              {isLoadingInstalled ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading installed themes...</span>
                </div>
              ) : installedThemes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No themes installed yet. Browse the registry to find some!
                </div>
              ) : (
                <div className="max-h-80 space-y-1 overflow-y-auto pr-2">
                  {installedThemes.map(theme => (
                    <div
                      key={theme.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{theme.label || theme.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {theme.category === 'built-in' ? 'Built-in' : 'User installed'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {theme.version}
                        </Badge>
                        {theme.category !== 'built-in' && (
                          <button
                            onClick={() => handleUninstall(theme.id)}
                            className="text-destructive hover:text-destructive/80 p-1"
                            title="Uninstall theme"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Browse Registry Tab */}
          {activeTab === 'browse' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search themes..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {isLoadingRegistry ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading registry...</span>
                </div>
              ) : (
                <div className="max-h-96 space-y-2 overflow-y-auto pr-2">
                  {filteredRegistryThemes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No themes found matching "{searchQuery}"
                    </div>
                  ) : (
                    filteredRegistryThemes.map(theme => (
                      <div
                        key={theme.id}
                        className="rounded-lg border p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{theme.name}</h3>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => startPreview(theme.id, 'light')}
                            disabled={isPreviewActive}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                        </div>

                        {theme.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {theme.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleInstall(
                              `https://tweakcn.com/r/themes/${theme.id}.json`,
                              theme.id,
                              theme.name
                            )}
                            disabled={isPreviewActive}
                          >
                            <DownloadIcon className="h-4 w-4 mr-1" />
                            Install Light
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleInstall(
                              `https://tweakcn.com/r/themes/${theme.id}-dark.json`,
                              `${theme.id}-dark`,
                              `${theme.name} (Dark)`
                            )}
                            disabled={isPreviewActive}
                          >
                            <DownloadIcon className="h-4 w-4 mr-1" />
                            Install Dark
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Preview Notification */}
          {isPreviewActive && (
            <div className="flex items-center justify-between rounded-md bg-primary/10 px-3 py-2 text-sm">
              <span className="text-primary font-medium">
                Preview active! Reverting in {previewCountdown}s...
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={revertPreview}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <DialogClose render={<Button variant="outline" />}>
            Close
          </DialogClose>
        </div>
      </DialogPopup>
    </Dialog>
  );
};

ThemeManagementModal.displayName = 'ThemeManagementModal';

export default ThemeManagementModal;
