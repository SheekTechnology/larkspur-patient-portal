import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// HTTPS locally because Knack OAuth only accepts https redirect URIs.
// The browser will warn about the self-signed cert on first load — accept it once.
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: { port: 5173, strictPort: true },
})
