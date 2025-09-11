/**
 * Configuración centralizada del proyecto Theme Manager
 * Define componentes, tipos de trabajo, y otras configuraciones compartidas
 */

export interface ProjectComponent {
  id: string
  name: string
  description: string
  buildCommand?: string
  testCommand?: string
  packagePath?: string
}

export interface WorkTypeConfig {
  id: string
  name: string
  description: string
  emoji: string
}

export const PROJECT_COMPONENTS: ProjectComponent[] = [
  {
    id: "core",
    name: "Core",
    description: "Core theme and font management system",
    buildCommand: "build:core",
    testCommand: "test:core",
    packagePath: "packages/theme-manager-core"
  },
  {
    id: "template-engine",
    name: "Template Engine",
    description: "HTML component template system for vanilla JS",
    buildCommand: "build:template-engine",
    testCommand: "test:template-engine",
    packagePath: "packages/template-engine"
  },
  {
    id: "vanilla",
    name: "Vanilla",
    description: "Vanilla JavaScript implementation for Basecoat CSS",
    buildCommand: "build:vanilla",
    testCommand: "test:vanilla",
    packagePath: "packages/theme-manager-vanilla"
  },
  {
    id: "react",
    name: "React",
    description: "React hooks and components with shadcn/ui integration",
    buildCommand: "build:react",
    testCommand: "test:react",
    packagePath: "packages/theme-manager-react"
  },
  {
    id: "astro",
    name: "Astro",
    description: "Astro components and islands for theme management",
    buildCommand: "build:astro",
    testCommand: "test:astro",
    packagePath: "packages/theme-manager-astro"
  },
  {
    id: "web-components",
    name: "Web Components",
    description: "Native Web Components for theme management",
    buildCommand: "build:web-components",
    testCommand: "test:web-components",
    packagePath: "packages/theme-manager-web-components"
  },
  {
    id: "cli",
    name: "CLI",
    description: "Command-line interface for theme installation",
    buildCommand: "build:cli",
    testCommand: "test:cli",
    packagePath: "packages/theme-manager-init"
  },
  {
    id: "docs",
    name: "Documentation",
    description: "Documentation, README files, and guides"
  },
  {
    id: "examples",
    name: "Examples",
    description: "Usage examples and sample applications",
    buildCommand: "build:examples"
  },
  {
    id: "workflows",
    name: "Workflows",
    description: "GitHub Actions workflows and CI/CD configuration"
  }
]

export const WORK_TYPES: WorkTypeConfig[] = [
  {
    id: "feat",
    name: "Feature",
    description: "New functionality or capabilities",
    emoji: "✨"
  },
  {
    id: "fix",
    name: "Fix",
    description: "Bug fixes and issue resolution",
    emoji: "🐛"
  },
  {
    id: "feat-phase",
    name: "Feature Phase",
    description: "Incomplete feature development phase",
    emoji: "🚧"
  },
  {
    id: "refactor",
    name: "Refactor",
    description: "Code improvements without functional changes",
    emoji: "♻️"
  },
  {
    id: "docs",
    name: "Documentation",
    description: "Documentation updates and improvements",
    emoji: "📝"
  },
  {
    id: "test",
    name: "Tests",
    description: "Testing improvements and new test cases",
    emoji: "🧪"
  },
  {
    id: "chore",
    name: "Chore",
    description: "Maintenance tasks and dependency updates",
    emoji: "🔧"
  },
  {
    id: "perf",
    name: "Performance",
    description: "Performance improvements and optimizations",
    emoji: "⚡"
  },
  {
    id: "style",
    name: "Style",
    description: "Code style and formatting changes",
    emoji: "💄"
  }
]

export const BUILD_MODES = [
  {
    id: "all",
    name: "All Packages",
    description: "Build all packages in the monorepo",
    modules: ["core", "template-engine", "vanilla", "react", "astro", "web-components", "cli"]
  },
  {
    id: "core-only",
    name: "Core Only",
    description: "Essential theme management functionality",
    modules: ["core"]
  },
  {
    id: "frontend",
    name: "Frontend Packages",
    description: "All UI framework packages",
    modules: ["core", "vanilla", "react", "astro", "web-components"]
  },
  {
    id: "framework-specific",
    name: "Framework Specific",
    description: "Choose specific framework packages",
    modules: [] // User selects
  },
  {
    id: "examples",
    name: "Examples Only",
    description: "Build only example applications",
    modules: ["examples"]
  },
  {
    id: "skip",
    name: "Skip Build",
    description: "Use existing build artifacts",
    modules: []
  }
]

export const VERSION_PREFIXES = [
  {
    id: "stable",
    name: "Stable",
    description: "Production-ready release",
    npmTag: "latest"
  },
  {
    id: "alpha",
    name: "Alpha",
    description: "Early testing and development",
    npmTag: "alpha"
  },
  {
    id: "beta", 
    name: "Beta",
    description: "Feature-complete testing phase",
    npmTag: "beta"
  },
  {
    id: "rc",
    name: "Release Candidate",
    description: "Final testing before stable release",
    npmTag: "next"
  },
  {
    id: "pre-alpha",
    name: "Pre-Alpha",
    description: "Experimental and unstable features",
    npmTag: "experimental"
  }
]

export const PERFORMANCE_IMPACTS = [
  {
    id: "none",
    name: "None",
    description: "No performance impact expected"
  },
  {
    id: "minor",
    name: "Minor",
    description: "Small performance improvements or negligible impact"
  },
  {
    id: "major",
    name: "Major",
    description: "Significant performance changes or optimizations"
  }
]

// Helper functions
export function getComponentById(id: string): ProjectComponent | undefined {
  return PROJECT_COMPONENTS.find(c => c.id === id)
}

export function getWorkTypeById(id: string): WorkTypeConfig | undefined {
  return WORK_TYPES.find(w => w.id === id)
}

export function getComponentIds(): string[] {
  return PROJECT_COMPONENTS.map(c => c.id)
}

export function getWorkTypeIds(): string[] {
  return WORK_TYPES.map(w => w.id)
}

export function getBuildModeById(id: string) {
  return BUILD_MODES.find(b => b.id === id)
}

export function getVersionPrefixById(id: string) {
  return VERSION_PREFIXES.find(v => v.id === id)
}

export function formatComponentsList(componentIds: string[]): string {
  const components = componentIds
    .map(id => getComponentById(id))
    .filter(Boolean)
    .map(c => c!.name)
  
  if (components.length === 0) return "none"
  if (components.length === 1) return components[0]
  if (components.length === 2) return components.join(" and ")
  
  return components.slice(0, -1).join(", ") + ", and " + components[components.length - 1]
}

// Project metadata
export const PROJECT_INFO = {
  name: "theme-manager-monorepo",
  displayName: "Theme Manager",
  description: "Comprehensive theme management system for shadcn/ui and Basecoat CSS with multi-framework support",
  author: "MKS2508",
  license: "MIT",
  homepage: "https://mks2508.github.io/shadcn-basecoat-theming/",
  repository: "https://github.com/MKS2508/shadcn-basecoat-theming.git"
}

// Monorepo specific configuration
export const WORKSPACE_CONFIG = {
  packagesDir: "packages",
  examplesDir: "examples", 
  packages: PROJECT_COMPONENTS.filter(c => c.packagePath).map(c => ({
    id: c.id,
    name: c.name,
    path: c.packagePath!,
    buildCommand: c.buildCommand
  })),
  publishablePackages: [
    "@mks2508/shadcn-basecoat-theme-manager",
    "@mks2508/simple-html-component-template-engine",
    "@mks2508/theme-manager-vanilla", 
    "@mks2508/theme-manager-react",
    "@mks2508/theme-manager-web-components"
  ],
  buildOrder: [
    "core",
    "template-engine",
    "vanilla", 
    "react",
    "web-components"
  ]
}