import { useState } from "react";
import { Settings } from "lucide-react";
import { ComponentExample } from "@/components/component-example";
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
import { ThemeSelector } from "@/components/ThemeSelector";
import { 
  SettingsModal, 
  type IAnimationSettings 
} from "@mks2508/theme-manager-react";
import { Button } from "@mks2508/mks-ui/react";

export function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [animationSettings, setAnimationSettings] = useState<IAnimationSettings>({
    preset: 'wipe',
    direction: 'ltr',
    duration: 500,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Theme Manager Demo</h1>
          </div>

          <div className="flex items-center gap-2">
            <ThemeSelector
              animation={animationSettings.preset}
              direction={animationSettings.direction}
              duration={animationSettings.duration}
            />
            <ThemeTogglerButton
              variant="ghost"
              animation={animationSettings.preset}
              direction={animationSettings.direction}
              duration={animationSettings.duration}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <ComponentExample />
      </main>

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        initialTab="themes"
        animationSettings={animationSettings}
        onAnimationSettingsChange={setAnimationSettings}
      />
    </div>
  );
}

export default App;
