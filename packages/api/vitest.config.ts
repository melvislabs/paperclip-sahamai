import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const prismaClientJs = path.resolve(__dirname, 'src/generated/prisma/client.js');
const prismaClientTs = path.resolve(__dirname, 'src/generated/prisma/client.ts');

export default defineConfig({
  resolve: {
    alias: [
      {
        find: prismaClientJs,
        replacement: prismaClientTs
      }
    ]
  },
  test: {
    environment: 'node'
  }
});
