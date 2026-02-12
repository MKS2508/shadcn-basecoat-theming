import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { viteFOUCPlugin } from "./src/vite-plugin-fouc"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    viteFOUCPlugin({ storageType: 'localStorage', defaultTheme: 'synthwave84' }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})