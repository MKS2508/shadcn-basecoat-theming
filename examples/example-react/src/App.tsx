import { ComponentExample } from "@/components/component-example";
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
import { ThemeSelector } from "@/components/ThemeSelector";
import { AnimationPicker } from "@/components/AnimationPicker";

export function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Theme Manager Demo</h1>
          </div>

          <div className="flex items-center gap-2">
            <ThemeSelector />
            <ThemeTogglerButton variant="ghost" />
            <AnimationPicker onSettingsClick={() => console.log('Open settings')} />
          </div>
        </div>
      </header>

      <main className="container py-8">
        <ComponentExample />
      </main>
    </div>
  );
}

export default App;
