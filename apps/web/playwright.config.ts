import { defineConfig, devices } from '@playwright/test';

// Pruebas end-to-end del sitio público (§10 del PRD). Levantan API + web si no
// están ya corriendo, así que basta `pnpm test:e2e` con Docker (`tar-db`) arriba
// y la base sembrada (`pnpm db:seed`).
//
// Requisito del sistema: el navegador de Playwright necesita tres librerías del SO
// (libnspr4, libnss3, libasound2t64). Ver docs/VERIFICACION.md.
const WEB = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const API = process.env.E2E_API_URL ?? 'http://localhost:4000';

export default defineConfig({
  testDir: './e2e',
  // Las pruebas leen datos reales de la API; en serie evitan que un cambio de una
  // interfiera con otra.
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: WEB,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'es-MX',
  },
  projects: [
    {
      name: 'escritorio',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      // Mismo ancho con el que se revisó el panel en sesiones anteriores.
      name: 'movil',
      use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter api dev',
      url: `${API}/health`,
      reuseExistingServer: true,
      timeout: 90_000,
      stdout: 'ignore',
    },
    {
      command: 'pnpm --filter web dev',
      url: WEB,
      reuseExistingServer: true,
      timeout: 120_000,
      stdout: 'ignore',
    },
  ],
});
