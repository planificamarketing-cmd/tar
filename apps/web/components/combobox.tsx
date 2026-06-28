'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { normalizeText } from '@/lib/text';

type Props = {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
};

// Autocompletado de texto libre: sugiere valores existentes (sin distinguir acentos
// ni mayúsculas) y permite escribir uno nuevo. Si lo tecleado coincide —normalizado—
// con una opción existente, al elegirla o al salir del campo se guarda la GRAFÍA
// CANÓNICA (p.ej. "cuauhtemoc" → "Cuauhtémoc"), evitando duplicados.
export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className,
  inputClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const q = normalizeText(value);

  // Opciones que coinciden (substring normalizado). Vacío → todas.
  const matches = useMemo(() => {
    const uniq = Array.from(new Set(options.filter((o) => o && o.trim())));
    const list = q ? uniq.filter((o) => normalizeText(o).includes(q)) : uniq;
    return list.sort((a, b) => a.localeCompare(b, 'es')).slice(0, 50);
  }, [options, q]);

  // ¿Existe ya una opción que, normalizada, sea idéntica a lo tecleado?
  const canonical = useMemo(
    () => options.find((o) => normalizeText(o) === q),
    [options, q],
  );
  const showCreate = q.length > 0 && !canonical;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    setActive(0);
  }, [q, open]);

  function commit(v: string) {
    onChange(v);
    setOpen(false);
  }

  // Al salir, normaliza a la grafía canónica si existe.
  function handleBlur() {
    if (canonical && canonical !== value) onChange(canonical);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && matches[active]) {
        e.preventDefault();
        commit(matches[active]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const inputCls =
    inputClassName ??
    'w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand';

  return (
    <div ref={wrapRef} className={`relative ${className ?? ''}`}>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={inputCls}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
      />
      {open && (matches.length > 0 || showCreate) && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-line bg-white py-1 shadow-lg"
        >
          {matches.map((o, i) => (
            <li key={o} role="option" aria-selected={i === active}>
              <button
                type="button"
                // onMouseDown (no onClick): se dispara antes del blur del input.
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(o);
                }}
                className={`flex w-full items-center px-3 py-2 text-left text-sm ${
                  i === active ? 'bg-canvas text-ink' : 'text-ink hover:bg-canvas'
                }`}
              >
                {o}
              </button>
            </li>
          ))}
          {showCreate && (
            <li className="border-t border-line">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(value.trim());
                }}
                className="flex w-full items-center px-3 py-2 text-left text-sm text-brand hover:bg-canvas"
              >
                + Crear «{value.trim()}»
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
