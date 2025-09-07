import "./App.css";
import { useState, lazy, Suspense } from "react";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";
import { Settings, Palette } from "lucide-react";

import { ThemeSelector } from "./components/ThemeSelector";
import { ModeToggle } from "./components/ModeToggle";
import { SimpleBenchmark } from "./components/SimpleBenchmark";

const ThemeManagementModal = lazy(() => import("./components/ThemeManagementModal"));
const FontSettingsModal = lazy(() => import("./components/FontSettingsModal"));
const ComponentsTab = lazy(() => import("./components/tabs/ComponentsTab"));
const FormsTab = lazy(() => import("./components/tabs/FormsTab"));
const LayoutTab = lazy(() => import("./components/tabs/LayoutTab"));
const FeedbackTab = lazy(() => import("./components/tabs/FeedbackTab"));

const DynamicTabs = lazy(() => import("./components/DynamicTabs"));

function App() {
  const [progress, setProgress] = useState(50);
  const [showThemeManagement, setShowThemeManagement] = useState(false);
  const [showFontSettings, setShowFontSettings] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">shadcn/ui + ThemeCore</h1>
          <p className="text-lg text-muted-foreground">
            Complete component showcase with dynamic theme management
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            <ThemeSelector 
              onThemeManagement={() => setShowThemeManagement(true)}
              onFontSettings={() => setShowFontSettings(true)}
            />
            <ModeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowThemeManagement(true)}
            >
              <Palette className="h-4 w-4 mr-2" />
              Theme Manager
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFontSettings(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Font Settings
            </Button>
            <Badge variant="secondary">React + TypeScript</Badge>
            <Badge variant="outline">Tailwind CSS v4</Badge>
            <Badge variant="outline">ThemeCore</Badge>
          </div>
        </div>

        {/* Performance Benchmark */}
        <SimpleBenchmark />

      <Separator />

      <Suspense fallback={<div className="flex items-center justify-center p-8">Loading components...</div>}>
        <DynamicTabs progress={progress} setProgress={setProgress} />
      </Suspense>
      </div>

      <Suspense fallback={null}>
        {showThemeManagement && (
          <ThemeManagementModal
            open={showThemeManagement}
            onOpenChange={setShowThemeManagement}
          />
        )}
        {showFontSettings && (
          <FontSettingsModal
            open={showFontSettings}
            onOpenChange={setShowFontSettings}
          />
        )}
      </Suspense>
    </div>
  );
}

export default App;