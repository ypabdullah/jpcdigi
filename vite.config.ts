import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";




export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://202.10.44.157:5173/.netlify/functions',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/digiflazz-proxy'),
      },
      '/digiflazz-proxy': {
        target: 'https://api.digiflazz.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/digiflazz-proxy/, '')
      }
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "WebSocket": path.resolve(__dirname, "node_modules", "@supabase", "realtime-js", "dist", "module", "websocket.js"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000, // Optional: suppress warnings over 1MB
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          vendor: ['axios', 'lodash'], // Add other big libs here
        },
      },
    },
  },
}));
