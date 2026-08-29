import type { Metadata } from 'next';
import { LeadForm } from '@/components/public/lead-form';
import { IMail, IPhone, IPin } from '@/components/public/icons';

export const metadata: Metadata = {
  title: 'Contacto',
  description:
    'Contacta a TAR Internacional. Un asesor te acompaña para encontrar o vender tu propiedad en México.',
};

const INFO = [
  { Icon: IPhone, label: 'Teléfono', value: '+52 55 1234 5678' },
  { Icon: IMail, label: 'Correo', value: 'info@tarint.mx' },
  { Icon: IPin, label: 'Oficinas', value: 'Av. Paseo de la Reforma 123, Ciudad de México' },
];

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-canvas pt-[76px] lg:pt-[100px]">
      {/* Encabezado */}
      <section className="bg-navy px-5 py-12 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[3px] text-brand">
            Contacto
          </div>
          <h1 className="font-display text-[clamp(34px,4.5vw,56px)] font-semibold leading-tight tracking-[-1px] text-white">
            Hablemos de tu próxima propiedad
          </h1>
          <p className="mt-4 max-w-[560px] text-[15px] leading-relaxed text-white/60">
            Cuéntanos qué buscas y un asesor de TAR Internacional se pondrá en contacto contigo en
            menos de 2 horas hábiles.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-5 py-12 lg:px-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
          {/* Datos de contacto */}
          <div>
            <div className="flex flex-col gap-4">
              {INFO.map(({ Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-4 rounded-2xl border border-[#F1F1F0] bg-white px-6 py-5"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <Icon s={20} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {label}
                    </div>
                    <div className="mt-0.5 text-[15px] font-medium text-navy">{value}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm leading-relaxed text-muted">
              También puedes explorar todo nuestro inventario en la sección de{' '}
              <a href="/propiedades" className="font-medium text-brand underline">
                Propiedades
              </a>{' '}
              y enviar una solicitud desde la ficha de cualquier inmueble.
            </p>
          </div>

          {/* Formulario */}
          <LeadForm title="Envíanos un mensaje" />
        </div>
      </section>
    </div>
  );
}
