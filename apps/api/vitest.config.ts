import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      // Sin BD real en CI: el cliente se conecta a localhost y /health reporta db:false.
      DATABASE_URL: 'postgres://tar:tar@localhost:5432/tar_portal',
    },
  },
});
