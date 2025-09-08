// Main exports for @mks2508/theme-manager-astro

// Components
export { default as ThemeSelector } from './components/ThemeSelector.astro';
export { default as FontSettingsIsland } from './components/FontSettingsIsland.astro';
export { default as ThemeManagementIsland } from './components/ThemeManagementIsland.astro';

// Re-export types from core
export type { 
  ThemeManager, 
  FontManager, 
  ThemeInstaller,
  ThemeConfig,
  FontCategory,
  FontOption,
  RegistryTheme
} from '@mks2508/shadcn-basecoat-theme-manager';