import React, { useState } from 'react';
import { Palette, Type, Zap, Settings, X } from 'lucide-react';
import { Button, AlertDialog as Dialog, AlertDialogPopup as DialogPopup, AlertDialogTitle } from '@mks2508/mks-ui/react';
import { cn } from '../lib/utils';
import { ThemeManagementContent } from './ThemeManagementContent';
import { FontSettingsContent } from './FontSettingsContent';
import { AnimationSettings, type IAnimationSettings } from './AnimationSettings';

export interface ISettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: 'themes' | 'typography' | 'animations';
  animationSettings?: IAnimationSettings;
  onAnimationSettingsChange?: (settings: IAnimationSettings) => void;
}

type TabId = 'themes' | 'typography' | 'animations';

interface ITabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: readonly ITabConfig[] = [
  { id: 'themes', label: 'Themes', icon: <Palette className="size-4" /> },
  { id: 'typography', label: 'Typography', icon: <Type className="size-4" /> },
  { id: 'animations', label: 'Animations', icon: <Zap className="size-4" /> },
] as const;

export const SettingsModal: React.FC<ISettingsModalProps> = ({
  open,
  onOpenChange,
  initialTab = 'themes',
  animationSettings = { preset: 'wipe', direction: 'ltr', duration: 500 },
  onAnimationSettingsChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-2xl w-full">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <AlertDialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="size-5" />
            </div>
            Settings
          </AlertDialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex items-center justify-center rounded-lg border p-1 mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[400px] max-h-[60vh] overflow-y-auto">
          {activeTab === 'themes' && <ThemeManagementContent />}
          {activeTab === 'typography' && <FontSettingsContent />}
          {activeTab === 'animations' && (
            <AnimationSettings
              settings={animationSettings}
              onSettingsChange={onAnimationSettingsChange ?? (() => {})}
            />
          )}
        </div>

        <div className="flex justify-end border-t pt-4 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogPopup>
    </Dialog>
  );
};

SettingsModal.displayName = 'SettingsModal';

export default SettingsModal;
