import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const noopPath = path.resolve(__dirname, 'src/lib/noop.ts');
const cryptoPath = path.resolve(__dirname, 'src/lib/noop-crypto.ts');

const NODE_BUILTINS = [
  'node:stream/promises',
  'node:fs/promises',
  'node:child_process',
  'node:readline',
  'node:buffer',
  'node:stream',
  'node:path',
  'node:util',
  'node:url',
  'node:os',
  'node:fs',
];

const nodeNoopPlugin: Plugin = {
  name: 'node-noop',
  resolveId(id) {
    if (id === 'node:crypto') return cryptoPath;
    if (NODE_BUILTINS.includes(id)) return noopPath;
    return null;
  },
};

export default defineConfig({
  plugins: [react(), nodeNoopPlugin],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      'node:crypto': cryptoPath,
      'node:stream/promises': noopPath,
      'node:fs/promises': noopPath,
      'node:child_process': noopPath,
      'node:readline': noopPath,
      'node:buffer': noopPath,
      'node:stream': noopPath,
      'node:path': noopPath,
      'node:util': noopPath,
      'node:url': noopPath,
      'node:os': noopPath,
      'node:fs': noopPath,
    },
  },
  build: {
    rollupOptions: {
      external: (id) => id.startsWith('node:'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    alias: {
      'node:crypto': cryptoPath,
      'node:stream/promises': noopPath,
      'node:fs/promises': noopPath,
      'node:child_process': noopPath,
      'node:readline': noopPath,
      'node:buffer': noopPath,
      'node:stream': noopPath,
      'node:path': noopPath,
      'node:util': noopPath,
      'node:url': noopPath,
      'node:os': noopPath,
      'node:fs': noopPath,
    },
  },
});
