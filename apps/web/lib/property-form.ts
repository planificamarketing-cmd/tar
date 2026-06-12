import type {
  CreatePropertyInput,
  Currency,
  FeaturedLevel,
  PropertyType,
} from '@tar/shared';
import type { PropertyDetail } from './types';

// Estado del formulario: todo como string (inputs controlados); la conversión a
// número/null ocurre al construir el payload.
export type PropertyFormValues = {
  title: string;
  description: string;
  propertyType: PropertyType;
  priceSale: string;
  currencySale: Currency;
  priceRent: string;
  currencyRent: Currency;
  bedrooms: string;
  bathrooms: string;
  halfBathrooms: string;
  parking: string;
  floor: string;
  areaM2: string;
  lotM2: string;
  address: string;
  postalCode: string;
  estado: string;
  municipio: string;
  colonia: string;
  lat: string;
  lng: string;
  featured: FeaturedLevel;
  amenities: string[];
};

export const EMPTY_PROPERTY: PropertyFormValues = {
  title: '',
  description: '',
  propertyType: 'casa',
  priceSale: '',
  currencySale: 'MXN',
  priceRent: '',
  currencyRent: 'MXN',
  bedrooms: '',
  bathrooms: '',
  halfBathrooms: '',
  parking: '',
  floor: '',
  areaM2: '',
  lotM2: '',
  address: '',
  postalCode: '',
  estado: '',
  municipio: '',
  colonia: '',
  lat: '',
  lng: '',
  featured: 'normal',
  amenities: [],
};

// Carga los valores de una propiedad existente al formulario.
export function fromDetail(p: PropertyDetail): PropertyFormValues {
  const s = (v: string | number | null | undefined) =>
    v === null || v === undefined ? '' : String(v);
  return {
    title: p.title ?? '',
    description: p.description ?? '',
    propertyType: p.propertyType,
    priceSale: s(p.priceSale),
    currencySale: (p.currencySale as Currency) ?? 'MXN',
    priceRent: s(p.priceRent),
    currencyRent: (p.currencyRent as Currency) ?? 'MXN',
    bedrooms: s(p.bedrooms),
    bathrooms: s(p.bathrooms),
    halfBathrooms: s(p.halfBathrooms),
    parking: s(p.parking),
    floor: s(p.floor),
    areaM2: s(p.areaM2),
    lotM2: s(p.lotM2),
    address: s(p.address),
    postalCode: s(p.postalCode),
    estado: p.location?.estado ?? '',
    municipio: p.location?.municipio ?? '',
    colonia: p.location?.colonia ?? '',
    lat: s(p.lat),
    lng: s(p.lng),
    featured: p.featured,
    amenities: p.amenities.map((a) => a.id),
  };
}

const num = (v: string): number | undefined => {
  const t = v.trim();
  if (t === '') return undefined;
  const n = Number(t);
  return Number.isNaN(n) ? undefined : n;
};
const str = (v: string): string | undefined => {
  const t = v.trim();
  return t === '' ? undefined : t;
};

// Construye el payload create/update. El backend valida con Zod (regla de oro 4);
// aquí sólo normalizamos tipos y omitimos vacíos.
export function toPayload(v: PropertyFormValues): CreatePropertyInput {
  const priceSale = num(v.priceSale);
  const priceRent = num(v.priceRent);
  return {
    title: v.title.trim(),
    description: str(v.description),
    propertyType: v.propertyType,
    priceSale,
    currencySale: priceSale != null ? v.currencySale : undefined,
    priceRent,
    currencyRent: priceRent != null ? v.currencyRent : undefined,
    bedrooms: num(v.bedrooms),
    bathrooms: num(v.bathrooms),
    halfBathrooms: num(v.halfBathrooms),
    parking: num(v.parking),
    floor: str(v.floor),
    areaM2: num(v.areaM2),
    lotM2: num(v.lotM2),
    address: str(v.address),
    postalCode: str(v.postalCode),
    estado: str(v.estado),
    municipio: str(v.municipio),
    colonia: str(v.colonia),
    lat: num(v.lat),
    lng: num(v.lng),
    featured: v.featured,
    amenities: v.amenities,
  } as CreatePropertyInput;
}

// Validación mínima en cliente (UX). La fuente de verdad es Zod en la API.
export function validate(v: PropertyFormValues): string | null {
  if (v.title.trim().length < 3) return 'El título debe tener al menos 3 caracteres.';
  if (!num(v.priceSale) && !num(v.priceRent))
    return 'Indica al menos un precio (venta o renta).';
  return null;
}
