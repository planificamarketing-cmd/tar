import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { fetchPropertiesSafe } from '@/lib/public';
import { IVerif } from '@/components/public/icons';

export const metadata: Metadata = {
  title: 'Nosotros',
  description:
    'TAR Internacional: más de 60 años de experiencia en el ramo inmobiliario en México y Estados Unidos. Servicios profesionales de arrendamiento, adquisición y administración.',
};

const STATS = [
  { n: '60+', l: 'Años de experiencia' },
  { n: '300+', l: 'Edificios construidos' },
  { n: '60+', l: 'Inmuebles en administración' },
  { n: '3,000+', l: 'Inquilinos atendidos' },
];

const PILARES = [
  {
    label: 'Misión',
    text: 'Proporcionar servicios integrales en el ramo de la construcción y desarrollo inmobiliario a nivel internacional y local, brindando calidad, conocimiento, eficiencia y experticia en la industria inmobiliaria.',
  },
  {
    label: 'Visión',
    text: 'Ser una empresa eficiente y altamente competitiva para cubrir las necesidades de la industria inmobiliaria y desarrolladora, con una imagen prestigiosa, innovadora y confiable a nivel nacional e internacional.',
  },
  {
    label: 'Filosofía',
    text: 'Mejorar la vida de nuestros clientes generando desarrollos innovadores, confiables y seguros.',
  },
];

const VALORES = [
  { name: 'Honestidad', desc: 'Transparencia total en cada operación y trato con nuestros clientes.' },
  { name: 'Trabajo en equipo', desc: 'Especialistas coordinados para resolver cada necesidad inmobiliaria.' },
  { name: 'Innovación', desc: 'Tecnología propia al servicio de tu patrimonio.' },
  { name: 'Responsabilidad', desc: 'Cuidamos el patrimonio de quienes confían en nosotros.' },
  { name: 'Lealtad', desc: 'Relaciones de largo plazo construidas sobre la confianza.' },
  { name: 'Profesionalismo', desc: 'Seis décadas de conocimiento del mercado inmobiliario.' },
  { name: 'Respeto', desc: 'Atención a la medida para cada cliente y cada propiedad.' },
];

const TIMELINE = [
  {
    year: '1960',
    title: 'Nace TARTAKOVSKI HNOS',
    text: 'Grupo inmobiliario desarrollador y constructor que daría origen a la experiencia que hoy nos respalda.',
  },
  {
    year: '1994',
    title: 'Evolución a TAR Internacional',
    text: 'Fusionamos esfuerzos con la experiencia de TARTAKOVSKI HNOS, consolidando un grupo inmobiliario con presencia en México y Estados Unidos.',
  },
  {
    year: 'Hoy',
    title: 'Plataforma digital propia',
    text: 'Incorporamos las más nuevas tecnologías y capacidades para reforzar el compromiso y entrega con nuestros clientes, inversionistas y amigos.',
  },
];

export default async function NosotrosPage() {
  // `Safe`: esta página se prerrenderiza en el build, sin API disponible.
  const res = await fetchPropertiesSafe({ sort: 'relevancia', limit: 1 });
  const heroImg = res.data.find((p) => p.cover)?.cover?.urlWebp;

  return (
    <div className="bg-white pt-16">
      {/* Hero */}
      <section className="relative flex min-h-[58vh] items-end overflow-hidden bg-navy">
        {heroImg && <Image src={heroImg} alt="" fill priority sizes="100vw" className="object-cover" />}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(107,24,32,0.86)_0%,rgba(139,26,40,0.6)_32%,rgba(15,27,45,0.82)_72%,rgba(26,43,71,0.9)_100%)]" />
        <div className="relative z-[1] mx-auto w-full max-w-[1400px] px-5 pb-10 pt-24 lg:px-10 lg:pb-14 lg:pt-28">
          <div className="mb-5 inline-block border-t border-brand pt-2.5 font-mono text-[11px] uppercase tracking-[3px] text-white/60">
            Nosotros
          </div>
          <h1 className="mb-5 max-w-[880px] font-display text-[clamp(40px,5.5vw,72px)] font-semibold leading-[1.05] tracking-[-1.5px] text-white">
            60 años formando parte de la historia de muchas personas
          </h1>
          <p className="max-w-[600px] text-[17px] leading-relaxed text-white/70">
            Nuestros clientes han puesto en nuestras manos una de las cosas más importantes: su
            patrimonio.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-brand px-5 py-8 lg:px-10 lg:py-9">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-6 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.l} className="text-center">
              <div className="font-display text-[44px] font-bold leading-none tracking-[-1px] text-white">
                {s.n}
              </div>
              <div className="mt-2 text-[13px] text-white/80">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Historia */}
      <section className="mx-auto max-w-[1400px] px-5 py-12 lg:px-10 lg:py-20">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <div>
            <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[2px] text-brand">
              Quiénes somos
            </div>
            <h2 className="font-display text-[clamp(30px,3.5vw,46px)] font-semibold leading-tight tracking-[-1px] text-navy">
              Servicios inmobiliarios profesionales, locales e internacionales
            </h2>
          </div>
          <div className="flex flex-col gap-5 text-base leading-[1.8] text-ink">
            <p>
              TAR Internacional es el resultado de más de{' '}
              <strong className="text-navy">60 años de experiencia</strong> en el ramo inmobiliario en
              México y Estados Unidos. Ofrecemos servicios inmobiliarios profesionales integrados
              tanto a nivel local como internacional.
            </p>
            <p>
              Nace en 1960 y evoluciona en 1994 como grupo inmobiliario, integrando la experiencia de{' '}
              <strong className="text-navy">TARTAKOVSKI HNOS</strong>, compañía desarrolladora y
              constructora con más de <strong className="text-navy">300 edificios</strong> diseñados y
              construidos.
            </p>
            <p>
              Contamos con una vasta experiencia en operaciones de arrendamiento, financiamiento,
              adquisición y disposición, así como en la administración de más de 60 inmuebles que
              representan más de 3,000 inquilinos. Tenemos la experticia, conocimiento, eficiencia y
              recursos para asistir a compañías de cualquier tamaño en México y en cualquier parte del
              mundo.
            </p>
          </div>
        </div>
      </section>

      {/* Trayectoria */}
      <section className="bg-canvas px-5 py-12 lg:px-10 lg:py-[72px]">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="mb-12 text-center font-display text-[clamp(28px,3.5vw,40px)] font-semibold tracking-[-0.5px] text-navy">
            Nuestra trayectoria
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {TIMELINE.map((t) => (
              <div
                key={t.year}
                className="relative overflow-hidden rounded-2xl border border-[#F1F1F0] bg-white p-8"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-brand" />
                <div className="mb-3.5 font-display text-[40px] font-bold tracking-[-1px] text-brand">
                  {t.year}
                </div>
                <div className="mb-2.5 font-display text-xl font-bold text-navy">{t.title}</div>
                <p className="text-sm leading-relaxed text-muted">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Misión / Visión / Filosofía */}
      <section className="mx-auto max-w-[1400px] px-5 py-12 lg:px-10 lg:py-20">
        <div className="grid grid-cols-1 gap-0.5 overflow-hidden rounded-[18px] border border-[#F1F1F0] md:grid-cols-3">
          {PILARES.map((p) => (
            <div key={p.label} className="bg-white p-8 lg:p-9">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <IVerif s={22} />
              </div>
              <h3 className="mb-3.5 font-display text-2xl font-bold text-navy">{p.label}</h3>
              <p className="text-[15px] leading-[1.8] text-muted">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Valores */}
      <section className="bg-navy px-5 py-12 lg:px-10 lg:py-[72px]">
        <div className="mx-auto max-w-[1400px] text-center">
          <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[2px] text-white/50">
            Lo que nos define
          </div>
          <h2 className="mb-10 font-display text-[clamp(28px,3.5vw,42px)] font-semibold tracking-[-0.5px] text-white">
            Nuestros valores
          </h2>
          <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
            {VALORES.map((v) => (
              <div key={v.name} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-brand/40 bg-brand/15 text-brand">
                  <IVerif s={22} />
                </div>
                <div className="mb-1.5 font-display text-lg font-bold text-white">{v.name}</div>
                <p className="text-[13.5px] leading-relaxed text-white/60">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-canvas px-5 py-12 lg:px-10 lg:py-[72px]">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-8">
          <div>
            <h2 className="mb-2 font-display text-[clamp(26px,3vw,40px)] font-semibold leading-tight tracking-[-0.5px] text-navy">
              ¿Listo para encontrar tu próxima propiedad?
            </h2>
            <p className="text-[15px] text-muted">Nuestro equipo te acompaña en cada paso.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/propiedades"
              className="rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-white"
            >
              Ver propiedades
            </Link>
            <Link
              href="/contacto"
              className="rounded-full border border-navy bg-white px-7 py-3.5 text-sm font-semibold text-navy"
            >
              Contactar
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
