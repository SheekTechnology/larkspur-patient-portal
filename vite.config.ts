import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// Knack only accepts https:// OAuth redirect URIs, so the dev server runs over
// HTTPS with a self-signed certificate. Your browser will warn once on first
// load — that warning is expected here and safe to click through.
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: { port: 5173, strictPort: true },
})
