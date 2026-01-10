import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // 这里的配置可以防止在浏览器环境中访问 process.env 报错
    'process.env': {}
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});