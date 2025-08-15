import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['https://gta-exams.onrender.com/', 'http://localhost:5173/'  ]
  }
})
