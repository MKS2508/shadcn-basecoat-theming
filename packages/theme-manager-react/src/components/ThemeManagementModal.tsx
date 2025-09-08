import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Button } from './ui/button';
import * as Dialog from '@radix-ui/react-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { X, Search, RefreshCw, Eye, Download, Trash2, Loader2 } from 'lucide-react';
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
  const { themeManager, installer, isLoaded } = useTheme();
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
    if (!themeManager || !isLoaded) return;

    const loadInstalledThemes = async () => {
      try {
        setIsLoadingInstalled(true);
        console.log('🔍 [ThemeManagement] Loading installed themes...');
        
        const themes = themeManager.getThemeRegistry().getInstalledThemes();
        console.log('📦 [ThemeManagement] Found installed themes:', themes.length);
        
        setInstalledThemes(themes || []);
      } catch (error) {
        console.error('Failed to load installed themes:', error);
        setInstalledThemes([]);
      } finally {
        setIsLoadingInstalled(false);
      }
    };

    if (open) {
      loadInstalledThemes();
    }
  }, [themeManager, isLoaded, open]);

  // Load registry themes
  const loadRegistryThemes = async () => {
    if (!themeManager) return;

    try {
      setIsLoadingRegistry(true);
      console.log('🔍 [ThemeManagement] Loading registry themes...');
      
      // Access ThemeListFetcher from core
      const { ThemeListFetcher } = await import('@mks2508/shadcn-basecoat-theme-manager');
      const fetcher = new ThemeListFetcher();
      await fetcher.init();
      
      // Fetch theme names from registry
      const themeNames = await fetcher.fetchAndCacheThemeNames();
      console.log('🌐 [ThemeManagement] Found registry themes:', themeNames?.length || 0);
      
      if (themeNames && themeNames.length > 0) {
        const themesList = themeNames.map((name: string) => ({
          id: name,
          name,
          label: name,
          description: 'Theme from TweakCN registry',
          source: 'TweakCN',
          category: 'registry',
          fetcher,
        }));
        setRegistryThemes(themesList);
      } else {
        setRegistryThemes([]);
      }
    } catch (error) {
      console.error('Failed to load registry themes:', error);
      setRegistryThemes([]);
    } finally {
      setIsLoadingRegistry(false);
    }
  };

  const applyTheme = (themeId: string) => {
    if (!themeManager) return;
    
    try {
      // Cancel any active preview
      if (previewTimer) {
        clearInterval(previewTimer);
        setPreviewTimer(null);
        setIsPreviewActive(false);
      }
      
      console.log('🎯 [ThemeManagement] Applying theme permanently:', themeId);
      themeManager.setTheme(themeId);
      
      // Update installed themes list
      const themes = themeManager.getThemeRegistry().getInstalledThemes();
      setInstalledThemes(themes || []);
      
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  };

  const previewTheme = async (themeId: string, isRegistry = false) => {
    if (!themeManager) return;

    try {
      // Store original theme for revert
      setOriginalTheme({
        id: themeManager.getCurrentTheme(),
        mode: (themeManager.getCurrentMode?.() || 'light') as 'auto' | 'light' | 'dark',
      });

      if (isRegistry) {
        // Find the theme in registry
        const registryTheme = registryThemes.find(t => t.id === themeId);
        if (!registryTheme?.fetcher) return;

        const themeUrl = registryTheme.fetcher.getThemeInstallUrl(themeId);
        
        // Fetch theme data without installing permanently
        const response = await fetch(themeUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch theme: ${response.status}`);
        }
        
        const themeData = await response.json();
        console.log('🔍 Registry theme data fetched:', themeData.name);
        
        // Install and apply theme for preview
        const installedTheme = await themeManager.installTheme(themeData, themeUrl);
        await themeManager.setTheme(installedTheme.id);
        console.log('✅ Registry preview theme applied:', installedTheme.id);
      } else {
        // Direct theme application for installed themes
        themeManager.setTheme(themeId);
      }
      
      setIsPreviewActive(true);
      setPreviewCountdown(15);
      
      // Start countdown timer
      const timer = setInterval(() => {
        setPreviewCountdown((prev) => {
          if (prev <= 1) {
            // Clear timer before reverting to avoid conflicts
            clearInterval(timer);
            setPreviewTimer(null);
            revertPreview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setPreviewTimer(timer);
      
    } catch (error) {
      console.error('Failed to preview theme:', error);
    }
  };

  const revertPreview = async () => {
    if (!originalTheme || !themeManager) return;

    try {
      console.log('🔄 [ThemeManagement] Reverting preview to:', originalTheme);
      
      // Clear timer first to prevent multiple calls
      if (previewTimer) {
        clearInterval(previewTimer);
        setPreviewTimer(null);
      }
      
      // Revert to original theme
      await themeManager.setTheme(originalTheme.id, originalTheme.mode);
      
      // Clean up preview state
      setIsPreviewActive(false);
      setPreviewCountdown(0);
      setOriginalTheme(null);
      
      console.log('✅ [ThemeManagement] Preview reverted successfully');
      
    } catch (error) {
      console.error('❌ [ThemeManagement] Failed to revert preview:', error);
    }
  };

  const keepPreview = async () => {
    if (!themeManager) return;
    
    try {
      // Get current theme (which is the previewed one)
      const currentThemeId = themeManager.getCurrentTheme();
      console.log('✅ [ThemeManagement] Keeping previewed theme:', currentThemeId);
      
      // The theme is already applied and installed, just clean up preview state
      if (previewTimer) {
        clearInterval(previewTimer);
        setPreviewTimer(null);
      }
      
      setIsPreviewActive(false);
      setPreviewCountdown(0);
      setOriginalTheme(null);
      
      // Refresh installed themes list to show it's now permanent
      const themes = themeManager.getThemeRegistry().getInstalledThemes();
      setInstalledThemes(themes || []);
      
      console.log('✅ [ThemeManagement] Preview theme kept successfully');
      
    } catch (error) {
      console.error('❌ [ThemeManagement] Failed to keep preview theme:', error);
    }
  };

  const installTheme = async (themeId: string) => {
    if (!themeManager) return;

    try {
      const registryTheme = registryThemes.find(t => t.id === themeId);
      if (!registryTheme?.fetcher) return;

      const themeUrl = registryTheme.fetcher.getThemeInstallUrl(themeId);
      
      console.log('📦 [ThemeManagement] Installing theme:', themeId);
      
      // Fetch and install theme
      const response = await fetch(themeUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch theme: ${response.status}`);
      }
      
      const themeData = await response.json();
      await themeManager.installTheme(themeData, themeUrl);
      
      console.log('✅ [ThemeManagement] Theme installed successfully:', themeId);
      
      // Refresh installed themes list
      const themes = themeManager.getThemeRegistry().getInstalledThemes();
      setInstalledThemes(themes || []);
      
    } catch (error) {
      console.error('Failed to install theme:', error);
    }
  };

  const uninstallTheme = async (themeId: string) => {
    if (!themeManager) return;

    try {
      console.log('🗑️ [ThemeManagement] Uninstalling theme:', themeId);
      
      // Check if it's the currently active theme
      const currentThemeId = themeManager.getCurrentTheme();
      if (currentThemeId === themeId) {
        console.log('⚠️ [ThemeManagement] Cannot uninstall active theme, switching to default first');
        await themeManager.setTheme('default');
      }
      
      // Uninstall theme using theme manager (will dispatch event automatically)
      await themeManager.uninstallTheme(themeId);
      
      console.log('✅ [ThemeManagement] Theme uninstalled successfully:', themeId);
      
      // Refresh installed themes list
      const themes = themeManager.getThemeRegistry().getInstalledThemes();
      setInstalledThemes(themes || []);
      
    } catch (error) {
      console.error('❌ [ThemeManagement] Failed to uninstall theme:', error);
    }
  };

  const currentThemeId = themeManager?.getCurrentTheme?.() || '';

  // Filter registry themes by search
  const filteredRegistryThemes = registryThemes.filter(theme =>
    theme.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isLoaded) {
    return null;
  }

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Dialog.Title className="sr-only">Theme Manager</Dialog.Title>
          <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-6">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9a2 2 0 00-2 2v12a4 4 0 004 4h10a2 2 0 002-2V7a2 2 0 00-2-2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-foreground">Theme Manager</h2>
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 mx-6 mt-4">
                  <TabsTrigger value="installed">Installed Themes</TabsTrigger>
                  <TabsTrigger value="browse">Browse Registry</TabsTrigger>
                </TabsList>

                {/* Installed Themes Tab */}
                <TabsContent value="installed" className="flex-1 overflow-hidden p-6">
                  {isLoadingInstalled ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                        <p className="text-sm text-muted-foreground">Loading installed themes...</p>
                      </div>
                    </div>
                  ) : installedThemes.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center text-muted-foreground">
                        <div className="w-12 h-12 mx-auto mb-4 opacity-50">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9a2 2 0 00-2 2v12a4 4 0 004 4h10a2 2 0 002-2V7a2 2 0 00-2-2z" />
                          </svg>
                        </div>
                        <p className="text-sm mb-2">No themes installed</p>
                        <p className="text-xs text-muted-foreground/75">Browse registry to install new themes</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-full overflow-y-auto">
                      {installedThemes.map((theme) => {
                        const isActive = theme.id === currentThemeId;
                        const isBuiltIn = theme.category === 'built-in' || theme.source === 'local';
                        
                        return (
                          <div key={theme.id} className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="font-semibold text-foreground">{theme.label || theme.name || theme.id}</h3>
                                  {isActive && (
                                    <Badge className="bg-primary text-primary-foreground">Active</Badge>
                                  )}
                                  <Badge variant="secondary">Installed</Badge>
                                  {isBuiltIn && (
                                    <Badge variant="outline">Built-in</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{theme.description || 'No description available'}</p>
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <span>Version: {theme.version || '1.0.0'}</span>
                                  <span>Author: {theme.author || 'Unknown'}</span>
                                  {theme.category && <span>Category: {theme.category}</span>}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => previewTheme(theme.id)}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Preview
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => applyTheme(theme.id)}
                                  disabled={isActive}
                                >
                                  Apply
                                </Button>
                                {!isBuiltIn && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="px-2"
                                    onClick={() => uninstallTheme(theme.id)}
                                    disabled={isActive}
                                    title={isActive ? "Cannot delete active theme" : "Delete theme"}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* Browse Registry Tab */}
                <TabsContent value="browse" className="flex-1 overflow-hidden p-6">
                  <div className="space-y-4 h-full flex flex-col">
                    {/* Search bar */}
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search themes..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadRegistryThemes}
                        disabled={isLoadingRegistry}
                      >
                        {isLoadingRegistry ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {/* Registry themes list */}
                    <div className="flex-1 overflow-y-auto">
                      {isLoadingRegistry ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                            <p className="text-sm text-muted-foreground">Loading registry themes...</p>
                          </div>
                        </div>
                      ) : filteredRegistryThemes.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center text-muted-foreground">
                            <div className="w-12 h-12 mx-auto mb-4 opacity-50">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9a2 2 0 00-2 2v12a4 4 0 004 4h10a2 2 0 002-2V7a2 2 0 00-2-2z" />
                              </svg>
                            </div>
                            <p className="text-sm mb-2">
                              {searchQuery ? 'No matching themes found' : 'Click "Refresh" to browse registry themes'}
                            </p>
                            <p className="text-xs text-muted-foreground/75">
                              {searchQuery ? 'Try a different search term' : 'Search for themes from TweakCN and other registries'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredRegistryThemes.map((theme) => (
                            <div key={theme.id} className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <h3 className="font-semibold text-foreground">{theme.name}</h3>
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                                      Registry
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-3">{theme.description}</p>
                                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                    <span>Source: {theme.source}</span>
                                    <span>Type: External</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => previewTheme(theme.id, true)}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Preview
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => installTheme(theme.id)}
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    Install
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-6 border-t space-x-3">
              <Dialog.Close asChild>
                <Button variant="ghost">Close</Button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Root>

      {/* Preview notification */}
      {isPreviewActive && (
        <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg p-4 shadow-lg z-50">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Previewing theme</p>
              <p className="text-xs text-muted-foreground">Reverting in {previewCountdown}s</p>
            </div>
            <Button
              size="sm"
              onClick={keepPreview}
            >
              Keep
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default ThemeManagementModal;