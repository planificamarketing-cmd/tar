import { env } from '../env';

// Normaliza un precio a MXN para filtrar/ordenar. El display SIEMPRE usa el
// precio y la moneda originales (la guía del proyecto). Devuelve string (columna numeric).
export function toMxn(
  price: number | null | undefined,
  currency: string | null | undefined,
): string | null {
  if (price == null || !currency) return null;
  const mxn = currency === 'USD' ? price * env.USD_MXN_RATE : price;
  return mxn.toFixed(2);
}
