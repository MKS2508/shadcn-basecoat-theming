import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  root: path.resolve(__dirname, 'src/web'),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, './src/web/components'),
      "@/pages": path.resolve(__dirname, './src/web/pages'),
      "@/hooks": path.resolve(__dirname, './src/web/hooks'),
      "@/utils": path.resolve(__dirname, './src/web/utils'),
      "@/types": path.resolve(__dirname, './src/types'),
      "@/services": path.resolve(__dirname, './src/server/services'),
      "@/lib": path.resolve(__dirname, './src/web/lib'),
    },
  },
  build: {
    outDir: '../../dist/web',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'radix-ui': ['@radix-ui/react-avatar', '@radix-ui/react-checkbox', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-label', '@radix-ui/react-popover', '@radix-ui/react-progress', '@radix-ui/react-radio-group', '@radix-ui/react-select', '@radix-ui/react-separator', '@radix-ui/react-slider', '@radix-ui/react-slot', '@radix-ui/react-switch', '@radix-ui/react-tabs', '@radix-ui/react-toggle'],
          'lucide': ['lucide-react'],
          'theme-core': ['@mks2508/shadcn-basecoat-theme-manager'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
  },
  server: {
    port: 4000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mks2508/shadcn-basecoat-theme-manager',
    ],
  },
});