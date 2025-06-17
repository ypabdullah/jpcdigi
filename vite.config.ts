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
        target: 'https://api.digiflazz.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/digiflazz-proxy': {
        target: 'https://api.digiflazz.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/digiflazz-proxy/, ''),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Proxy Error');
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxy Request:', req.method, req.url);
            console.log('Request Headers:', req.headers);
            console.log('Proxy Request Headers:', proxyReq.getHeaders());
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Proxy Response:', proxyRes.statusCode, req.url);
            console.log('Response Headers:', proxyRes.headers);
          });
        },
      },
      '/digiflazz-proxy/v1/price-list': {
        target: 'https://api.digiflazz.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/digiflazz-proxy/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxy Request:', req.method, req.url);
            console.log('Request Headers:', req.headers);
            console.log('Proxy Request Headers:', proxyReq.getHeaders());
            if (req.method === 'POST') {
              console.log('Note: Request body logging requires additional middleware in Vite proxy.');
            }
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Proxy Response:', proxyRes.statusCode, req.url);
            console.log('Response Headers:', proxyRes.headers);
          });
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "WebSocket": "ws",
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
