
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Isso impede que o Vite copie a pasta "public" (criada pelo Firebase) 
  // por cima do seu site, o que estava causando a tela de "Welcome"
  publicDir: false, 
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
