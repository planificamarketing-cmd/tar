'use client';

import { useState } from 'react';

const ITEMS: { q: string; a: string }[] = [
  {
    q: '¿Qué tipo de propiedades manejan?',
    a: 'Departamentos residenciales, oficinas corporativas, locales, bodegas y terrenos en venta y renta, distribuidos en las mejores zonas de México.',
  },
  {
    q: '¿Cómo agendar una visita?',
    a: 'Desde la ficha de cada propiedad puedes enviar una solicitud de contacto o de cita con la fecha y hora que prefieras; un asesor de TAR Internacional se pondrá en contacto contigo.',
  },
  {
    q: '¿Atienden compradores internacionales?',
    a: 'Sí, contamos con experiencia atendiendo clientes internacionales y procesos de inversión extranjera.',
  },
  {
    q: '¿Cuánto tiempo toma cerrar una operación?',
    a: 'En promedio entre 30 y 60 días, dependiendo del tipo de propiedad y forma de pago.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="flex flex-col gap-3">
      {ITEMS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="overflow-hidden rounded-[14px] border border-line bg-white">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-3 px-[22px] py-[18px] text-left text-[15px] font-semibold text-navy"
            >
              {f.q}
              <span
                className="shrink-0 text-[22px] font-light leading-none text-[#9CA3AF] transition-transform duration-200"
                style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
              >
                +
              </span>
            </button>
            <div
              className="overflow-hidden transition-all duration-300"
              style={{ maxHeight: isOpen ? 260 : 0, opacity: isOpen ? 1 : 0 }}
            >
              <p className="px-[22px] pb-[18px] text-sm leading-relaxed text-muted">{f.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
