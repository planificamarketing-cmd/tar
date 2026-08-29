import { describe, it, expect } from 'vitest';
import { locationLine } from './flyer-pdf.service';

// La dirección exacta del folleto es opcional: los folletos que salen hacia un
// prospecto (PDF público y el que viaja en el webhook de leads) solo muestran la
// zona; la copia interna del asesor sí lleva calle y número.
describe('Folleto PDF — línea de ubicación', () => {
  const ZONA = 'Roma Norte, Cuauhtémoc, Ciudad de México';

  it('sin dirección: solo la zona', () => {
    expect(locationLine('Av. Álvaro Obregón 123', ZONA, false)).toBe(ZONA);
  });

  it('con dirección: une calle y zona', () => {
    expect(locationLine('Av. Álvaro Obregón 123', ZONA, true)).toBe(
      `Av. Álvaro Obregón 123, ${ZONA}`,
    );
  });

  it('con dirección: no repite la zona si ya viene dentro de la calle', () => {
    const addr = `Av. Álvaro Obregón 123, ${ZONA}`;
    expect(locationLine(addr, ZONA, true)).toBe(addr);
  });

  it('sin calle capturada: cae a la zona', () => {
    expect(locationLine(null, ZONA, true)).toBe(ZONA);
    expect(locationLine('   ', ZONA, true)).toBe(ZONA);
  });

  it('sin zona: devuelve la calle tal cual', () => {
    expect(locationLine('Av. Álvaro Obregón 123', '', true)).toBe('Av. Álvaro Obregón 123');
  });
});
