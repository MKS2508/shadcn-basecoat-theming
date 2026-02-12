import { useState } from "react";
import { ComponentExample } from "@/components/component-example";
import {
  ThemeSelector,
  AnimatedThemeToggler,
  ThemeManagementModal,
  FontSettingsModal,
} from "@mks2508/theme-manager-react";

export function App() {
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [fontModalOpen, setFontModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Theme Manager Demo</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSelector
              onThemeManagement={() => setThemeModalOpen(true)}
              onFontSettings={() => setFontModalOpen(true)}
            />
            <AnimatedThemeToggler />
          </div>
        </div>
      </header>

      <main className="container py-8">
        <ComponentExample />
      </main>

      <ThemeManagementModal open={themeModalOpen} onOpenChange={setThemeModalOpen} />
      <FontSettingsModal open={fontModalOpen} onOpenChange={setFontModalOpen} />
    </div>
  );
}

export default App;
