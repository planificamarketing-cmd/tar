'use client';

import {
  CURRENCIES,
  FEATURED_LEVELS,
  PROPERTY_TYPES,
  type Currency,
  type FeaturedLevel,
  type PropertyType,
} from '@tar/shared';
import { useState } from 'react';
import { useAmenities, useCreateAmenity } from '@/lib/queries';
import type { PropertyFormValues } from '@/lib/property-form';
import { FEATURED_META, PROPERTY_TYPE_LABEL } from '@/lib/format';
import { LocationPicker } from './location-picker';

type Props = {
  value: PropertyFormValues;
  onChange: (patch: Partial<PropertyFormValues>) => void;
};

const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted';
const inputCls =
  'w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand';

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <h2 className="font-display text-lg text-navy">{title}</h2>
      {desc && <p className="mt-0.5 text-sm text-muted">{desc}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function PropertyFields({ value, onChange }: Props) {
  const { data: amenities } = useAmenities();
  const createAmenity = useCreateAmenity();
  const [newAmenity, setNewAmenity] = useState('');

  // Aplicabilidad por tipo: m² útil/rentable solo en oficina; patio/terraza/balcón
  // en depto/casa/oficina; jardín en casa/depto.
  const isOffice = value.propertyType === 'oficina';
  const showPatioTerraceBalcony = (
    ['departamento', 'casa', 'oficina'] as PropertyType[]
  ).includes(value.propertyType);
  const showGarden = (['casa', 'departamento'] as PropertyType[]).includes(
    value.propertyType,
  );

  const Text = (
    key: keyof PropertyFormValues,
    label: string,
    opts?: { type?: string; placeholder?: string },
  ) => (
    <div>
      <label className={labelCls}>{label}</label>
      <input
        type={opts?.type ?? 'text'}
        value={value[key] as string}
        placeholder={opts?.placeholder}
        onChange={(e) => onChange({ [key]: e.target.value })}
        className={inputCls}
      />
    </div>
  );

  function toggleAmenity(id: string) {
    const has = value.amenities.includes(id);
    onChange({
      amenities: has
        ? value.amenities.filter((a) => a !== id)
        : [...value.amenities, id],
    });
  }

  async function addAmenity() {
    const name = newAmenity.trim();
    if (name.length < 2 || createAmenity.isPending) return;
    try {
      const { data } = await createAmenity.mutateAsync({ name });
      setNewAmenity('');
      // Selecciona la amenidad (nueva o ya existente con ese nombre).
      if (!value.amenities.includes(data.id)) {
        onChange({ amenities: [...value.amenities, data.id] });
      }
    } catch {
      /* el error se refleja en createAmenity.isError abajo */
    }
  }

  return (
    <div className="space-y-5">
      {/* Datos generales */}
      <Section title="Datos generales">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">{Text('title', 'Título')}</div>
          <div>
            <label className={labelCls}>Tipo</label>
            <select
              value={value.propertyType}
              onChange={(e) =>
                onChange({ propertyType: e.target.value as PropertyType })
              }
              className={inputCls}
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PROPERTY_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          {Text('floor', 'Piso / nivel', { placeholder: 'Ej. PB, 3' })}
          <div className="md:col-span-2">
            <label className={labelCls}>Descripción</label>
            <textarea
              value={value.description}
              onChange={(e) => onChange({ description: e.target.value })}
              rows={4}
              className={`${inputCls} resize-y`}
            />
          </div>
        </div>
      </Section>

      {/* Precios */}
      <Section
        title="Precios"
        desc="Captura venta y/o renta en su moneda original. Se requiere al menos uno."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PriceField
            label="Precio de venta"
            price={value.priceSale}
            currency={value.currencySale}
            onPrice={(priceSale) => onChange({ priceSale })}
            onCurrency={(currencySale) => onChange({ currencySale })}
          />
          <PriceField
            label="Precio de renta (mensual)"
            price={value.priceRent}
            currency={value.currencyRent}
            onPrice={(priceRent) => onChange({ priceRent })}
            onCurrency={(currencyRent) => onChange({ currencyRent })}
          />
        </div>
      </Section>

      {/* Características */}
      <Section title="Características">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Text('bedrooms', 'Recámaras', { type: 'number' })}
          {Text('bathrooms', 'Baños', { type: 'number' })}
          {Text('halfBathrooms', 'Medios baños', { type: 'number' })}
          {Text('parking', 'Estacionamientos', { type: 'number' })}
          {Text('areaM2', 'Construcción (m²)', { type: 'number' })}
          {Text('lotM2', 'Terreno (m²)', { type: 'number' })}
        </div>
        {isOffice && (
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {Text('usableAreaM2', 'Superficie útil (m²)', { type: 'number' })}
            {Text('rentableAreaM2', 'Superficie rentable (m²)', { type: 'number' })}
          </div>
        )}
      </Section>

      {/* Áreas exteriores (con metraje) — aplicabilidad por tipo de inmueble */}
      {(showPatioTerraceBalcony || showGarden) && (
        <Section
          title="Áreas exteriores"
          desc="Opcionales, con su metraje. Se muestran según el tipo de inmueble."
        >
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {showPatioTerraceBalcony && Text('patioM2', 'Patio (m²)', { type: 'number' })}
            {showPatioTerraceBalcony && Text('terraceM2', 'Terraza (m²)', { type: 'number' })}
            {showPatioTerraceBalcony && Text('balconyM2', 'Balcón (m²)', { type: 'number' })}
            {showGarden && Text('gardenM2', 'Jardín (m²)', { type: 'number' })}
          </div>
        </Section>
      )}

      {/* Ubicación */}
      <Section
        title="Ubicación"
        desc="Estado / municipio / colonia y el punto exacto en el mapa (requerido para publicar)."
      >
        <LocationPicker value={value} onChange={onChange} />
      </Section>

      {/* Amenidades */}
      <Section
        title="Amenidades"
        desc="Selecciona las que apliquen o agrega una nueva al catálogo."
      >
        {!amenities?.length ? (
          <p className="text-sm text-muted">No hay amenidades en el catálogo.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {amenities.map((a) => {
              const on = value.amenities.includes(a.id);
              return (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => toggleAmenity(a.id)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    on
                      ? 'bg-navy text-white'
                      : 'bg-white text-ink ring-1 ring-inset ring-line hover:bg-canvas'
                  }`}
                >
                  {a.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Alta de amenidad nueva */}
        <div className="mt-4 border-t border-line pt-4">
          <label className={labelCls}>Agregar amenidad</label>
          <div className="flex gap-2">
            <input
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void addAmenity();
                }
              }}
              className={inputCls}
              placeholder="Ej. Alberca climatizada"
              maxLength={60}
            />
            <button
              type="button"
              onClick={() => void addAmenity()}
              disabled={newAmenity.trim().length < 2 || createAmenity.isPending}
              className="shrink-0 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {createAmenity.isPending ? 'Agregando…' : 'Agregar'}
            </button>
          </div>
          {createAmenity.isError && (
            <p className="mt-1.5 text-xs text-red-600">
              No se pudo agregar la amenidad. Revisa el nombre e inténtalo de nuevo.
            </p>
          )}
        </div>
      </Section>

      {/* Destaque */}
      <Section
        title="Destaque"
        desc="Premium y Destacada suben en la relevancia del listado público."
      >
        <div className="flex flex-wrap gap-2">
          {FEATURED_LEVELS.map((lvl) => {
            const meta = FEATURED_META[lvl];
            const on = value.featured === lvl;
            return (
              <button
                type="button"
                key={lvl}
                onClick={() => onChange({ featured: lvl as FeaturedLevel })}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  on
                    ? 'bg-brand text-white'
                    : 'bg-white text-ink ring-1 ring-inset ring-line hover:bg-canvas'
                }`}
              >
                {meta ? meta.label : 'Normal'}
              </button>
            );
          })}
        </div>

        {/* Etiqueta "en remate" — independiente del destaque; aplica a venta y renta */}
        <label className="mt-4 flex items-center gap-3 border-t border-line pt-4">
          <input
            type="checkbox"
            checked={value.isRemate}
            onChange={(e) => onChange({ isRemate: e.target.checked })}
            className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
          />
          <span className="text-sm font-medium text-ink">
            En remate
            <span className="ml-2 font-normal text-muted">
              Muestra una etiqueta de remate en el listado (venta y renta).
            </span>
          </span>
        </label>
      </Section>
    </div>
  );
}

function PriceField({
  label,
  price,
  currency,
  onPrice,
  onCurrency,
}: {
  label: string;
  price: string;
  currency: Currency;
  onPrice: (v: string) => void;
  onCurrency: (v: Currency) => void;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex gap-2">
        <input
          type="number"
          value={price}
          onChange={(e) => onPrice(e.target.value)}
          placeholder="0"
          className={inputCls}
        />
        <select
          value={currency}
          onChange={(e) => onCurrency(e.target.value as Currency)}
          className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
