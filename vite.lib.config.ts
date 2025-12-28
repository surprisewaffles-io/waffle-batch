import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src'],
      exclude: ['src/App.tsx', 'src/main.tsx', 'src/vite-env.d.ts', '**/*.test.ts', '**/*.test.tsx'],
      outDir: 'dist/lib',
      insertTypesEntry: true,
      tsconfigPath: './tsconfig.lib.json'
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WaffleBatch',
      fileName: 'waffle-batch',
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      // Externalize deps that shouldn't be bundled
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
    outDir: 'dist/lib',
    emptyOutDir: true,
  }
});
