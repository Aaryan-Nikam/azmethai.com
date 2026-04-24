import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3002, // Different port from expert dashboard
        proxy: {
            '/ws': {
                target: 'ws://localhost:18789',
                ws: true,
            }
        }
    }
})
