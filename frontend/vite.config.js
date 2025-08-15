import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
     import.meta.env.VITE_ALLOWED_HOST_1,
     import.meta.env.VITE_ALLOWED_HOST_2
    ]
  }
})
