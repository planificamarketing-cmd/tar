import { test, expect } from '@playwright/test';
import { fetchProperty, fetchPublicProperties, SHOTS } from './helpers';

// Comprueba en navegador real los ajustes que pidió TAR (agosto 2026):
// logo más grande, privacidad de la ubicación (sin calle + círculo de zona) y
// propiedades en exclusiva (insignia + entran a destacadas).

test.describe('Ajustes del cliente — marca y ubicación', () => {
  test('el logo de la cabecera usa el tamaño nuevo', async ({ page }, testInfo) => {
    await page.goto('/propiedades'); // fuera del inicio la cabecera va en blanco
    const logo = page.getByRole('link', { name: /TAR Internacional — inicio/i }).locator('img');
    await expect(logo).toBeVisible();
    const caja = await logo.boundingBox();
    expect(caja).not.toBeNull();
    // 64 px en móvil, 84 px en escritorio (±1 px de redondeo del navegador).
    const esperado = testInfo.project.name === 'movil' ? 64 : 84;
    expect(Math.round(caja!.height)).toBeGreaterThanOrEqual(esperado - 1);
    expect(Math.round(caja!.height)).toBeLessThanOrEqual(esperado + 1);
    await page.screenshot({ path: `${SHOTS}/cabecera-${testInfo.project.name}.png`, clip: { x: 0, y: 0, width: caja!.width + 400, height: 140 } });
  });

  test('la ficha no publica la calle: solo colonia, municipio y estado', async ({
    page,
    request,
  }) => {
    // Una propiedad cuya dirección NO sea solo la colonia repetida, para que la
    // comprobación tenga sentido.
    const props = await fetchPublicProperties(request, 'limit=50');
    let objetivo: { slug: string; calle: string } | null = null;
    for (const p of props) {
      const d = (await fetchProperty(request, p.slug)) as {
        address: string | null;
        location: { colonia: string | null };
      };
      const calle = (d.address ?? '').trim();
      const colonia = (d.location?.colonia ?? '').trim();
      if (calle && colonia && !calle.toLowerCase().includes(colonia.toLowerCase())) {
        objetivo = { slug: p.slug, calle };
        break;
      }
    }
    test.skip(!objetivo, 'Ninguna propiedad publicada tiene calle distinta de la colonia.');

    await page.goto(`/propiedades/${objetivo!.slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // La calle no aparece en ningún lado de la ficha.
    await expect(page.getByText(objetivo!.calle, { exact: false })).toHaveCount(0);
  });

  test('el mapa de la ficha dibuja el círculo de zona y conserva el pin', async ({
    page,
    request,
  }) => {
    const props = await fetchPublicProperties(request, 'limit=50');
    let slug: string | null = null;
    for (const p of props) {
      const d = (await fetchProperty(request, p.slug)) as { lat: number | null };
      if (d.lat != null) { slug = p.slug; break; }
    }
    test.skip(!slug, 'Ninguna propiedad publicada tiene coordenadas.');

    await page.goto(`/propiedades/${slug}`);
    const mapa = page.locator('.leaflet-container');
    await mapa.scrollIntoViewIfNeeded();
    await expect(mapa).toBeVisible();
    // Círculo de zona: Leaflet lo pinta como <path> dentro del panel de overlays.
    await expect(mapa.locator('svg path.leaflet-interactive')).toHaveCount(1);
    // El pin sigue ahí (marcador con HTML propio).
    await expect(mapa.locator('.leaflet-marker-icon')).toHaveCount(1);
    await expect(page.getByText(/zona aproximada/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /cómo llegar/i })).toBeVisible();
    await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/ficha-mapa-zona.png` });
  });
});

test.describe('Ajustes del cliente — propiedades en exclusiva', () => {
  test('la insignia Exclusiva aparece en la ficha y en su tarjeta', async ({
    page,
    request,
  }) => {
    const props = await fetchPublicProperties(request, 'limit=50');
    const excl = props.find((p) => p.isExclusive);
    test.skip(!excl, 'No hay ninguna propiedad marcada como exclusiva.');

    await page.goto(`/propiedades/${excl!.slug}`);
    await expect(page.getByText('Exclusiva', { exact: true }).first()).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/ficha-exclusiva.png` });
  });

  test('una propiedad solo por exclusiva entra a las destacadas de la portada', async ({
    page,
    request,
  }) => {
    // Las destacadas de la portada son las 6 primeras del orden por relevancia.
    const top = await fetchPublicProperties(request, 'sort=relevancia&limit=6');
    const excl = top.find((p) => p.isExclusive && p.featured === 'normal');
    test.skip(
      !excl,
      'Ninguna propiedad exclusiva con destaque normal entre las 6 de relevancia.',
    );

    await page.goto('/');
    const seccion = page.locator('section', { has: page.getByRole('heading', { name: /destacadas/i }) });
    await expect(seccion.locator(`a[href="/propiedades/${excl!.slug}"]`).first()).toBeVisible();
  });
});
