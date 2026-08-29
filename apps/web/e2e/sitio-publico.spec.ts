import { test, expect } from '@playwright/test';
import { esperarMosaicos, fetchPublicProperties, SHOTS } from './helpers';

// Humo del sitio público: que las rutas de §7.1 respondan y muestren contenido real.
test.describe('Sitio público — humo', () => {
  test('la portada carga con el buscador y propiedades destacadas', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/TAR Internacional/i);
    await expect(page.getByRole('heading', { name: /destacadas/i })).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/portada.png`, fullPage: false });
  });

  test('el listado muestra tarjetas y responde a un filtro', async ({ page }) => {
    await page.goto('/propiedades');
    const tarjetas = page.locator('a[href^="/propiedades/"]');
    await expect(tarjetas.first()).toBeVisible();
    const todas = await tarjetas.count();

    await page.goto('/propiedades?type=oficina');
    await expect(page.locator('a[href^="/propiedades/"]').first()).toBeVisible();
    const oficinas = await page.locator('a[href^="/propiedades/"]').count();
    expect(oficinas).toBeLessThanOrEqual(todas);
  });

  test('la ficha de una propiedad publicada abre y ofrece la ficha en PDF', async ({
    page,
    request,
  }) => {
    const [prop] = await fetchPublicProperties(request, 'limit=1');
    test.skip(!prop, 'No hay propiedades publicadas en la base.');
    await page.goto(`/propiedades/${prop!.slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('a[href*="flyer.pdf"]')).toHaveCount(1);
  });

  test('la página de mapa carga el split de lista y mapa', async ({ page }) => {
    await page.goto('/mapa');
    const mapa = page.locator('.leaflet-container');
    await expect(mapa).toBeVisible();
    await esperarMosaicos(mapa);
    await page.screenshot({ path: `${SHOTS}/mapa.png` });
  });
});
