'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { normText, type Suggestion } from '@/lib/public';
import { IPin } from './icons';

// Re-export para los componentes que ya importaban el tipo desde aquí.
export type { Suggestion };

// Buscador de texto con dropdown de sugerencias (teclado + click). Reutilizable
// en el hero, el sidebar de propiedades y el contacto. Sin dependencia de mapa.
export function LocationAutocomplete({
  value,
  onChange,
  onPick,
  suggestions,
  placeholder = 'Colonia, alcaldía, zona…',
  className = '',
  leftIcon = true,
  maxItems = 7,
  autoFocus = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onPick?: (v: string) => void;
  suggestions: Suggestion[];
  placeholder?: string;
  className?: string;
  leftIcon?: boolean;
  maxItems?: number;
  autoFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = normText(value);
    if (q.length < 1) return [];
    return suggestions.filter((s) => normText(s.label).includes(q)).slice(0, maxItems);
  }, [value, suggestions, maxItems]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const pick = (s: Suggestion) => {
    onChange(s.label);
    setOpen(false);
    setHi(-1);
    onPick?.(s.label);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (open && hi >= 0 && matches[hi]) return pick(matches[hi]);
      setOpen(false);
      onPick?.(value);
      return;
    }
    if (!open || !matches.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHi((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHi(-1);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 z-[1] flex -translate-y-1/2 text-[#9CA3AF]">
          <IPin s={15} />
        </span>
      )}
      <input
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        autoFocus={autoFocus}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHi(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        className={className}
      />
      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[60] max-h-[290px] overflow-y-auto rounded-xl border border-line bg-white shadow-[0_14px_36px_rgba(15,27,45,0.14)]">
          {matches.map((s, i) => (
            <button
              type="button"
              key={s.kind + s.label}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              onMouseEnter={() => setHi(i)}
              className={[
                'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left',
                hi === i ? 'bg-brand-soft' : 'bg-white',
              ].join(' ')}
            >
              <span className={hi === i ? 'flex shrink-0 text-brand' : 'flex shrink-0 text-[#9CA3AF]'}>
                <IPin s={14} />
              </span>
              <span className="flex-1 truncate text-[13px] text-navy">{s.label}</span>
              <span className="shrink-0 text-[10px] uppercase tracking-wide text-[#9CA3AF]">
                {s.kind}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
