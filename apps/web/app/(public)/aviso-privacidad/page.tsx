import type { Metadata } from 'next';
import Link from 'next/link';
import { IChevL, ICheck } from '@/components/public/icons';

export const metadata: Metadata = {
  title: 'Aviso de Privacidad',
  description:
    'Aviso de Privacidad de TAR Internacional conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).',
  robots: { index: false },
};

type Section = { h: string; p: string[]; list?: string[]; p2?: string[] };

const SECCIONES: Section[] = [
  {
    h: '1. Responsable del tratamiento de sus datos personales',
    p: [
      'TAR Internacional, con domicilio en Av. Paseo de la Reforma 123, Ciudad de México, es responsable del uso, tratamiento y protección de los datos personales que usted nos proporcione, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).',
    ],
  },
  {
    h: '2. Datos personales que recabamos',
    p: [
      'Para las finalidades señaladas en el presente aviso, podemos recabar sus datos personales de distintas formas: cuando usted los proporciona directamente a través de nuestros formularios de contacto, correo electrónico o teléfono.',
    ],
    list: [
      'Nombre completo',
      'Correo electrónico',
      'Número telefónico',
      'Propiedad o tipo de inmueble de interés',
      'Información financiera para procesos de compra, renta o financiamiento (cuando aplique)',
    ],
  },
  {
    h: '3. Finalidades del tratamiento de datos',
    p: [
      'Sus datos personales serán utilizados para las siguientes finalidades primarias, necesarias para el servicio que solicita:',
    ],
    list: [
      'Atender sus solicitudes de información sobre propiedades',
      'Contactarle para agendar visitas y dar seguimiento a su interés',
      'Gestionar operaciones de compra, venta, renta o arrendamiento',
      'Brindar asesoría inmobiliaria personalizada',
    ],
    p2: [
      'De manera adicional, y solo si usted no se opone, podremos utilizar sus datos para fines secundarios como el envío de promociones, boletines y campañas de marketing de propiedades similares.',
    ],
  },
  {
    h: '4. Transferencia de datos',
    p: [
      'Sus datos personales pueden ser compartidos con los asesores de TAR Internacional asignados a su solicitud, así como con terceros que nos presten servicios necesarios para concretar la operación inmobiliaria (notarías, instituciones financieras). En todos los casos exigimos el cumplimiento de las medidas de seguridad y confidencialidad correspondientes.',
    ],
  },
  {
    h: '5. Derechos ARCO',
    p: [
      'Usted tiene derecho a Acceder, Rectificar y Cancelar sus datos personales, así como a Oponerse al tratamiento de los mismos o revocar el consentimiento que para tal fin nos haya otorgado, enviando su solicitud al correo electrónico privacidad@tarint.mx.',
    ],
  },
  {
    h: '6. Uso de cookies y tecnologías de rastreo',
    p: [
      'Nuestro portal utiliza cookies y tecnologías similares mediante las cuales es posible monitorear su comportamiento como usuario de internet, brindarle un mejor servicio y experiencia al navegar en nuestra página. Usted puede deshabilitarlas en la configuración de su navegador.',
    ],
  },
  {
    h: '7. Cambios al aviso de privacidad',
    p: [
      'El presente aviso de privacidad puede sufrir modificaciones derivadas de nuevos requerimientos legales o de nuestras propias necesidades. Cualquier cambio será publicado en esta misma sección del portal.',
    ],
  },
];

export default function AvisoPrivacidadPage() {
  return (
    <div className="min-h-screen bg-canvas pt-[76px] lg:pt-[100px]">
      {/* Encabezado */}
      <section className="bg-navy px-5 py-10 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-[900px]">
          <Link
            href="/"
            className="mb-6 flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white"
          >
            <IChevL s={14} /> Volver al inicio
          </Link>
          <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[3px] text-brand">Legal</div>
          <h1 className="font-display text-[clamp(34px,4.5vw,56px)] font-semibold leading-tight tracking-[-1px] text-white">
            Aviso de Privacidad
          </h1>
        </div>
      </section>

      {/* Contenido */}
      <section className="mx-auto max-w-[900px] px-5 py-10 lg:px-10 lg:py-14">
        <div className="rounded-2xl border border-[#F1F1F0] bg-white p-6 lg:p-14">
          <p className="mb-9 border-b border-[#F1F1F0] pb-7 text-base leading-[1.8] text-ink">
            En <strong className="text-navy">TAR Internacional</strong> tu privacidad es muy importante
            para nosotros. A continuación te explicamos cómo recabamos, usamos y protegemos tus datos
            personales.
          </p>
          {SECCIONES.map((s) => (
            <div key={s.h} className="mb-8">
              <h2 className="mb-3.5 font-display text-[21px] font-bold text-navy">{s.h}</h2>
              {s.p.map((para, j) => (
                <p key={j} className="mb-3 text-[15px] leading-[1.8] text-ink">
                  {para}
                </p>
              ))}
              {s.list && (
                <ul className="my-3 flex flex-col gap-2">
                  {s.list.map((li) => (
                    <li key={li} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-ink">
                      <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                        <ICheck s={11} />
                      </span>
                      {li}
                    </li>
                  ))}
                </ul>
              )}
              {s.p2?.map((para, j) => (
                <p key={j} className="mt-3 text-[15px] leading-[1.8] text-ink">
                  {para}
                </p>
              ))}
            </div>
          ))}

          <div className="mt-10 rounded-xl border border-[#F1F1F0] bg-canvas px-7 py-6">
            <div className="mb-2 font-display text-lg font-bold text-navy">¿Dudas sobre tus datos?</div>
            <p className="mb-1 text-sm leading-relaxed text-muted">
              Contáctanos para ejercer tus derechos ARCO o resolver cualquier duda sobre el tratamiento
              de tus datos personales:
            </p>
            <div className="text-sm font-semibold text-navy">privacidad@tarint.mx · +52 55 1234 5678</div>
          </div>
        </div>
      </section>
    </div>
  );
}
