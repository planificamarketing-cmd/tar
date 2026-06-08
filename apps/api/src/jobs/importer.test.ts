import { describe, it, expect, afterAll } from 'vitest';
import { eq, inArray } from 'drizzle-orm';
import { db, schema, pool } from '@tar/db';
import {
  COL,
  buildAddress,
  currency,
  mapPropertyType,
  mapRow,
  parseImageUrls,
  parseMoney,
  runImport,
  type CsvRow,
} from './importer';

// Fila sintética con los encabezados EXACTOS del export EB.
function row(over: Record<string, string>): CsvRow {
  const base: CsvRow = {
    [COL.ref]: '',
    [COL.title]: '',
    [COL.priceSale]: '',
    [COL.currencySale]: '',
    [COL.priceRent]: '',
    [COL.currencyRent]: '',
    [COL.type]: '',
    [COL.description]: '',
    [COL.area]: '',
    [COL.lot]: '',
    [COL.baths]: '',
    [COL.halfBaths]: '',
    [COL.bedrooms]: '',
    [COL.floor]: '',
    [COL.parking]: '',
    [COL.street]: '',
    [COL.extNum]: '',
    [COL.intNum]: '',
    [COL.postalCode]: '',
    [COL.estado]: '',
    [COL.ciudad]: '',
    [COL.colonia]: '',
    [COL.features]: '',
    [COL.images]: '',
  };
  return { ...base, ...over };
}

describe('Importador — helpers puros', () => {
  it('parsea dinero con $ y comas', () => {
    expect(parseMoney('$4,350,000.00')).toBe(4350000);
    expect(parseMoney('')).toBeNull();
    expect(parseMoney('0')).toBeNull();
  });

  it('mapea tipos del CSV al enum', () => {
    expect(mapPropertyType('Departamento').type).toBe('departamento');
    expect(mapPropertyType('Bodega industrial').type).toBe('bodega_industrial');
    expect(mapPropertyType('Local comercial').type).toBe('local_comercial');
    expect(mapPropertyType('Terreno industrial').type).toBe('terreno_industrial');
    expect(mapPropertyType('algo raro').guessed).toBe(true);
  });

  it('normaliza moneda y arma la dirección', () => {
    expect(currency('usd')).toBe('USD');
    expect(currency('mxn')).toBe('MXN');
    expect(currency('')).toBeNull();
    expect(
      buildAddress(row({ [COL.street]: 'Homero', [COL.extNum]: '109', [COL.intNum]: '1103' })),
    ).toBe('Homero 109 Int 1103');
  });

  it('la columna "0" se mapea a recámaras', () => {
    const m = mapRow(row({ [COL.ref]: 'EB-1', [COL.title]: 'X', [COL.bedrooms]: '3' }));
    expect(m.bedrooms).toBe(3);
  });

  it('parsea la lista de URLs de imágenes', () => {
    const urls = parseImageUrls('https://a.com/1.jpg,https://a.com/2.jpg, nope ');
    expect(urls).toHaveLength(2);
  });
});

describe('Importador — dry-run (sin BD)', () => {
  it('cuenta tipos, precios y deja todo en borrador', async () => {
    const rows = [
      row({ [COL.ref]: 'EB-A', [COL.title]: 'Depto', [COL.type]: 'Departamento', [COL.priceSale]: '$4,000,000.00', [COL.currencySale]: 'MXN', [COL.bedrooms]: '2' }),
      row({ [COL.ref]: 'EB-B', [COL.title]: 'Bodega', [COL.type]: 'Bodega industrial', [COL.priceRent]: '$95,000.00', [COL.currencyRent]: 'MXN' }),
      row({ [COL.ref]: '', [COL.title]: '' }), // inválida
    ];
    const r = await runImport(rows, { dryRun: true });
    expect(r.total).toBe(3);
    expect(r.failed).toHaveLength(1);
    expect(r.byType.departamento).toBe(1);
    expect(r.byType.bodega_industrial).toBe(1);
    expect(r.withSale).toBe(1);
    expect(r.withRent).toBe(1);
  });
});

const REFS = ['ITEST-1', 'ITEST-2'];

describe('Importador — idempotencia en BD', () => {
  afterAll(async () => {
    const props = await db
      .select({ id: schema.properties.id })
      .from(schema.properties)
      .where(inArray(schema.properties.externalRef, REFS));
    const ids = props.map((p) => p.id);
    if (ids.length) {
      await db
        .delete(schema.propertyAmenities)
        .where(inArray(schema.propertyAmenities.propertyId, ids));
      await db
        .delete(schema.properties)
        .where(inArray(schema.properties.id, ids));
    }
    await db
      .delete(schema.amenities)
      .where(inArray(schema.amenities.name, ['Alberca Importador', 'Gym Importador']));
    await pool.end();
  });

  it('re-ejecutar actualiza, no duplica (external_ref)', async () => {
    const rows = [
      row({
        [COL.ref]: 'ITEST-1',
        [COL.title]: 'Casa importador',
        [COL.type]: 'Casa',
        [COL.priceSale]: '$3,000,000.00',
        [COL.currencySale]: 'MXN',
        [COL.bedrooms]: '3',
        [COL.features]: 'Alberca Importador, Gym Importador',
      }),
      row({
        [COL.ref]: 'ITEST-2',
        [COL.title]: 'Oficina importador',
        [COL.type]: 'Oficina',
        [COL.priceRent]: '$50,000.00',
        [COL.currencyRent]: 'MXN',
      }),
    ];

    const first = await runImport(rows, { noImages: true, noGeo: true });
    expect(first.created).toBe(2);
    expect(first.updated).toBe(0);
    // Sin geocoding → quedan en borrador.
    expect(first.borrador).toBe(2);

    const second = await runImport(rows, { noImages: true, noGeo: true });
    expect(second.created).toBe(0);
    expect(second.updated).toBe(2);

    const count = await db
      .select({ id: schema.properties.id })
      .from(schema.properties)
      .where(inArray(schema.properties.externalRef, REFS));
    expect(count).toHaveLength(2); // no duplicó

    // Amenidades creadas y vinculadas.
    const [casa] = await db
      .select({ id: schema.properties.id })
      .from(schema.properties)
      .where(eq(schema.properties.externalRef, 'ITEST-1'))
      .limit(1);
    const ams = await db
      .select()
      .from(schema.propertyAmenities)
      .where(eq(schema.propertyAmenities.propertyId, casa!.id));
    expect(ams.length).toBe(2);
  });
});
