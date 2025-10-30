import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({

  base: process.env.NODE_ENV === 'production' ? '/cavernaTextura2D/' : '',

  plugins: [
    basicSsl()
  ],
  server: {
    https: true, // Força o uso de HTTPS
    host: true  // Torna o servidor acessível na rede local
  }
});