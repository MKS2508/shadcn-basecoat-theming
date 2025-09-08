// Main exports for @mks2508/theme-manager-react

// Hooks
export { useTheme } from './hooks/useTheme';

// Components
export { ThemeSelector } from './components/ThemeSelector';
export { ModeToggle } from './components/ModeToggle'; 
export { FontSettingsModal } from './components/FontSettingsModal';
export { ThemeManagementModal } from './components/ThemeManagementModal';

// Utilities
export { cn } from './lib/utils';

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