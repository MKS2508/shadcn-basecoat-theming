import { useState } from "react";
import { Settings, Star, Heart, Zap } from "lucide-react";
import { ComponentExample } from "@/components/component-example";
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
import { ThemeSelector } from "@/components/ThemeSelector";
import {
  SettingsModal,
  type IAnimationSettings
} from "@mks2508/theme-manager-react";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Progress,
  Separator,
  Switch,
  Checkbox,
  Tabs,
  TabsList,
  TabsTab,
  TabsPanel
} from "@mks2508/mks-ui/react";

export function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [animationSettings, setAnimationSettings] = useState<IAnimationSettings>({
    preset: 'wipe',
    direction: 'ltr',
    duration: 500,
  });
  const [notifications, setNotifications] = useState(true);
  const [newsletter, setNewsletter] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Example React</h1>
            <Badge variant="secondary">v1.0</Badge>
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
        {/* Hero Section */}
        <section className="mb-12 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Welcome to Example React
          </h2>
          <p className="text-muted-foreground text-lg mb-6 max-w-2xl mx-auto">
            Example React app for theme-manager-react
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg">
              Get Started
            </Button>
            <Button variant="outline" size="lg">
              View on GitHub
            </Button>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Tabs Demo Section */}
        <section className="mb-12">
          <Tabs defaultValue="components" className="w-full">
            <TabsList className="mb-4">
              <TabsTab value="components">Components</TabsTab>
              <TabsTab value="forms">Forms</TabsTab>
              <TabsTab value="status">Status</TabsTab>
            </TabsList>

            <TabsPanel value="components">
              <ComponentExample />
            </TabsPanel>

            <TabsPanel value="forms">
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>Customize your experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Notifications</div>
                      <div className="text-xs text-muted-foreground">
                        Receive email notifications
                      </div>
                    </div>
                    <Switch
                      checked={notifications}
                      onCheckedChange={setNotifications}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="newsletter"
                      checked={newsletter}
                      onCheckedChange={(c) => setNewsletter(c === true)}
                    />
                    <label htmlFor="newsletter" className="text-sm cursor-pointer">
                      Subscribe to newsletter
                    </label>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save Preferences</Button>
                </CardFooter>
              </Card>
            </TabsPanel>

            <TabsPanel value="status">
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Current application metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Build Progress</span>
                      <span>75%</span>
                    </div>
                    <Progress value={75} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Test Coverage</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Performance Score</span>
                      <span>88%</span>
                    </div>
                    <Progress value={88} />
                  </div>
                </CardContent>
              </Card>
            </TabsPanel>
          </Tabs>
        </section>

        {/* Feature Cards */}
        <section className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="size-5 text-primary" />
                <CardTitle>Modern Stack</CardTitle>
              </div>
              <CardDescription>
                React 19, Vite 8, Tailwind v4
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Built with the latest versions of React, Vite, and Tailwind CSS
                for optimal developer experience and performance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Heart className="size-5 text-primary" />
                <CardTitle>Beautiful Components</CardTitle>
              </div>
              <CardDescription>
                BaseUI primitives + custom styling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Accessible, animated components built on BaseUI primitives
                with smooth transitions and interactions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="size-5 text-primary" />
                <CardTitle>Theme System</CardTitle>
              </div>
              <CardDescription>
                Multiple themes with animated transitions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Switch between themes with beautiful animations.
                Supports light, dark, and system modes.
              </p>
            </CardContent>
          </Card>
        </section>
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
