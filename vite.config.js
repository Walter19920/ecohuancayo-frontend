import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Builds ligeros: sin mapas de origen y con CSS minificado (plan gratuito de Render).
    sourcemap: false,
    cssMinify: true,
  },
})
