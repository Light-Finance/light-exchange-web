import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The light-exchange npm package is CommonJS; Vite handles interop, but we help
// it by pre-bundling. `global` shim covers libs that expect a Node-ish global.
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
  },
});
