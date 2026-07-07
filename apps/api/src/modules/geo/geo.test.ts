import { describe, it, expect } from 'vitest';
import { parseGoogleMapsUrl, isShortMapsUrl, isGoogleMapsUrl } from '@tar/shared';

describe('parseGoogleMapsUrl', () => {
  it('extrae dirección completa + coords de un enlace largo (formato MX)', () => {
    const url =
      'https://www.google.com/maps/place/C.+Colima+143,+Roma+Nte.,+Cuauht%C3%A9moc,+06700+Ciudad+de+M%C3%A9xico,+CDMX/@19.4189,-99.1605,17z/data=!3m1!4b1!4d-99.16!3d19.42';
    expect(parseGoogleMapsUrl(url)).toMatchObject({
      address: 'C. Colima 143',
      colonia: 'Roma Nte.',
      municipio: 'Cuauhtémoc',
      estado: 'Ciudad de México', // CDMX normalizado
      postalCode: '06700',
    });
  });

  it('prefiere el pin real (!3d!4d) sobre el centro del mapa (@)', () => {
    const url = 'https://www.google.com/maps/place/X/@19.0,-99.0,17z/data=!3d19.55!4d-99.55';
    const r = parseGoogleMapsUrl(url);
    expect(r.lat).toBe(19.55);
    expect(r.lng).toBe(-99.55);
  });

  it('parsea coords de un enlace ?q=lat,lng', () => {
    const r = parseGoogleMapsUrl('https://maps.google.com/?q=25.6866,-100.3161');
    expect(r.lat).toBeCloseTo(25.6866);
    expect(r.lng).toBeCloseTo(-100.3161);
  });

  it('no confunde un place que son coordenadas con una dirección', () => {
    const r = parseGoogleMapsUrl('https://www.google.com/maps/place/19.42,-99.16/@19.42,-99.16,17z');
    expect(r.address).toBeUndefined();
    expect(r.lat).toBe(19.42);
  });

  it('detecta enlaces cortos y hosts de Google', () => {
    expect(isShortMapsUrl('https://maps.app.goo.gl/abc')).toBe(true);
    expect(isShortMapsUrl('https://www.google.com/maps/place/X/@1,1')).toBe(false);
    expect(isGoogleMapsUrl('https://example.com/x')).toBe(false);
    expect(isGoogleMapsUrl('https://maps.app.goo.gl/abc')).toBe(true);
  });
});
