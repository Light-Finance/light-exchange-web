import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// The light-exchange npm package is CommonJS; Vite handles interop, but we help
// it by pre-bundling. `global` shim covers libs that expect a Node-ish global.
export default defineConfig({
  // Vercel serves the app from the domain root, so '/' is the default. cPanel
  // deployments into a subfolder need the asset URLs prefixed to match:
  //   VITE_BASE=/app/ npm run build:cpanel
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  esbuild: {
    // The stores ported from mobile use MobX legacy decorators.
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        useDefineForClassFields: false,
      },
    },
  },
  define: {
    global: 'globalThis',
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: 5173,
  },
});
