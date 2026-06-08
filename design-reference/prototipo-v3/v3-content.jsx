// TAR Internacional v3 — Content pages: Nosotros + Aviso de Privacidad

const { Footer3, S, I3Check, I3ChevL, I3Pin, I3Verif } = window;

// ── NOSOTROS ──────────────────────────────────────────────────────────────────
const Nosotros3 = ({ onNavigate }) => {
  // Foto real del inventario para el hero (en lugar de solo el degradado).
  const heroImg = (window.PROPERTIES || []).find(p => p.image)?.image;
  const valores = [
    { name:"Honestidad",        desc:"Transparencia total en cada operación y trato con nuestros clientes.", d:["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z","M9 12l2 2 4-4"] },
    { name:"Trabajo en equipo", desc:"Especialistas coordinados para resolver cada necesidad inmobiliaria.", d:["M17 21v-2a4 4 0 00-3-3.87","M9 21v-2a4 4 0 013-3.87","M7 7a3 3 0 106 0 3 3 0 00-6 0z","M15 11a3 3 0 100-6"] },
    { name:"Innovación",        desc:"Tecnología propia al servicio de tu patrimonio.", d:["M9 18h6","M10 22h4","M12 2a7 7 0 00-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0012 2z"] },
    { name:"Responsabilidad",   desc:"Cuidamos el patrimonio de quienes confían en nosotros.", d:["M12 22a10 10 0 100-20 10 10 0 000 20z","M8 12l3 3 5-6"] },
    { name:"Lealtad",           desc:"Relaciones de largo plazo construidas sobre la confianza.", d:"M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" },
    { name:"Profesionalismo",   desc:"Seis décadas de conocimiento del mercado inmobiliario.", d:["M12 15a6 6 0 100-12 6 6 0 000 12z","M8.5 14l-1.5 7 5-3 5 3-1.5-7"] },
    { name:"Respeto",           desc:"Atención a la medida para cada cliente y cada propiedad.", d:["M12 3v18","M3 7h18","M6 7l-3 6a3 3 0 006 0z","M18 7l-3 6a3 3 0 006 0z"] },
  ];
  const pilares = [
    {
      label: "Misión",
      text: "Proporcionar servicios integrales en el ramo de la construcción y desarrollo inmobiliario a nivel internacional y local, brindando calidad, conocimiento, eficiencia y experticia en la industria inmobiliaria.",
    },
    {
      label: "Visión",
      text: "Ser una empresa eficiente y altamente competitiva para cubrir las necesidades de la industria inmobiliaria y desarrolladora, con una imagen prestigiosa, innovadora y confiable a nivel nacional e internacional.",
    },
    {
      label: "Filosofía",
      text: "Mejorar la vida de nuestros clientes generando desarrollos innovadores, confiables y seguros.",
    },
  ];
  const stats = [
    { n: "60+", l: "Años de experiencia" },
    { n: "300+", l: "Edificios construidos" },
    { n: "60+", l: "Inmuebles en administración" },
    { n: "3,000+", l: "Inquilinos atendidos" },
  ];
  const timeline = [
    { year: "1960", title: "Nace TARTAKOVSKI HNOS", text: "Grupo inmobiliario desarrollador y constructor que daría origen a la experiencia que hoy nos respalda." },
    { year: "1994", title: "Evolución a TAR Internacional", text: "Fusionamos esfuerzos con la experiencia de TARTAKOVSKI HNOS, consolidando un grupo inmobiliario con presencia en México y Estados Unidos." },
    { year: "Hoy", title: "Plataforma digital propia", text: "Incorporamos las más nuevas tecnologías y capacidades para reforzar el compromiso y entrega con nuestros clientes, inversionistas y amigos." },
  ];

  return (
    <div style={{ paddingTop:64, background:"#fff" }}>
      {/* Hero */}
      <section style={{ position:"relative", minHeight:"58vh", display:"flex", alignItems:"flex-end", overflow:"hidden", background:"#0F1B2D" }}>
        {heroImg && <img src={heroImg} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg, rgba(107,24,32,0.86) 0%, rgba(139,26,40,0.6) 32%, rgba(15,27,45,0.82) 72%, rgba(26,43,71,0.9) 100%)" }}>
          <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 50px,rgba(255,255,255,0.025) 50px,rgba(255,255,255,0.025) 100px)" }} />
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 40%, rgba(0,0,0,0.55) 100%)" }} />
        </div>
        <div style={{ position:"relative", zIndex:1, maxWidth:1400, margin:"0 auto", padding:"100px 40px 56px", width:"100%" }}>
          <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"rgba(255,255,255,0.6)", letterSpacing:3, textTransform:"uppercase", marginBottom:20, borderTop:"1px solid var(--tar)", paddingTop:10, display:"inline-block" }}>Nosotros</div>
          <h1 style={{ fontFamily:"var(--display)", fontSize:"clamp(40px,5.5vw,72px)", fontWeight:600, color:"#fff", lineHeight:1.05, letterSpacing:-1.5, maxWidth:880, marginBottom:20 }}>
            60 años formando parte de la historia de muchas personas
          </h1>
          <p style={{ fontFamily:"var(--sans)", fontSize:17, color:"rgba(255,255,255,0.7)", maxWidth:600, lineHeight:1.7 }}>
            Nuestros clientes han puesto en nuestras manos una de las cosas más importantes: su patrimonio.
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <section style={{ background:"var(--tar)", padding:"36px 40px" }}>
        <div style={{ maxWidth:1400, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:24 }}>
          {stats.map(s => (
            <div key={s.l} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"var(--display)", fontSize:44, fontWeight:700, color:"#fff", letterSpacing:-1, lineHeight:1 }}>{s.n}</div>
              <div style={{ fontFamily:"var(--sans)", fontSize:13, color:"rgba(255,255,255,0.8)", marginTop:8 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section style={{ padding:"80px 40px", maxWidth:1400, margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1.3fr", gap:64, alignItems:"start" }}>
          <div>
            <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--tar)", letterSpacing:2, textTransform:"uppercase", marginBottom:14 }}>Quiénes somos</div>
            <h2 style={{ fontFamily:"var(--display)", fontSize:"clamp(30px,3.5vw,46px)", fontWeight:600, color:"#0F1B2D", letterSpacing:-1, lineHeight:1.1 }}>
              Servicios inmobiliarios profesionales, locales e internacionales
            </h2>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:20, fontFamily:"var(--sans)", fontSize:16, color:"#374151", lineHeight:1.8 }}>
            <p>TAR Internacional es el resultado de más de <strong style={{ color:"#0F1B2D" }}>60 años de experiencia</strong> en el ramo inmobiliario en México y Estados Unidos. Ofrecemos servicios inmobiliarios profesionales integrados tanto a nivel local como internacional.</p>
            <p>Nace en 1960 y evoluciona en 1994 como grupo inmobiliario, integrando la experiencia de <strong style={{ color:"#0F1B2D" }}>TARTAKOVSKI HNOS</strong>, compañía desarrolladora y constructora con más de <strong style={{ color:"#0F1B2D" }}>300 edificios</strong> diseñados y construidos.</p>
            <p>Contamos con una vasta experiencia en operaciones de arrendamiento, financiamiento, adquisición y disposición, así como en la administración de más de 60 inmuebles que representan más de 3,000 inquilinos. Tenemos la experticia, conocimiento, eficiencia y recursos para asistir a compañías de cualquier tamaño en México y en cualquier parte del mundo.</p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section style={{ background:"#FAFAF8", padding:"72px 40px" }}>
        <div style={{ maxWidth:1400, margin:"0 auto" }}>
          <h2 style={{ fontFamily:"var(--display)", fontSize:"clamp(28px,3.5vw,40px)", fontWeight:600, color:"#0F1B2D", letterSpacing:-0.5, marginBottom:48, textAlign:"center" }}>Nuestra trayectoria</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
            {timeline.map((t, i) => (
              <div key={i} style={{ background:"#fff", borderRadius:16, padding:"32px 28px", border:"1px solid #F1F1F0", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background:"var(--tar)" }} />
                <div style={{ fontFamily:"var(--display)", fontSize:40, fontWeight:700, color:"var(--tar)", letterSpacing:-1, marginBottom:14 }}>{t.year}</div>
                <div style={{ fontFamily:"var(--display)", fontSize:20, fontWeight:700, color:"#0F1B2D", marginBottom:10 }}>{t.title}</div>
                <p style={{ fontFamily:"var(--sans)", fontSize:14, color:"#6B7280", lineHeight:1.7 }}>{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Misión / Visión / Filosofía */}
      <section style={{ padding:"80px 40px", maxWidth:1400, margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:2, borderRadius:18, overflow:"hidden", border:"1px solid #F1F1F0" }}>
          {pilares.map((p, i) => (
            <div key={p.label} style={{ background:"#fff", padding:"40px 36px", borderRight: i<2 ? "1px solid #F1F1F0" : "none" }}>
              <div style={{ width:44, height:44, borderRadius:12, background:"#FFF0F2", color:"var(--tar)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
                <I3Verif s={22}/>
              </div>
              <h3 style={{ fontFamily:"var(--display)", fontSize:24, fontWeight:700, color:"#0F1B2D", marginBottom:14 }}>{p.label}</h3>
              <p style={{ fontFamily:"var(--sans)", fontSize:15, color:"#6B7280", lineHeight:1.8 }}>{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Valores */}
      <section style={{ background:"#0F1B2D", padding:"72px 40px" }}>
        <div style={{ maxWidth:1400, margin:"0 auto", textAlign:"center" }}>
          <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"rgba(255,255,255,0.5)", letterSpacing:2, textTransform:"uppercase", marginBottom:14 }}>Lo que nos define</div>
          <h2 style={{ fontFamily:"var(--display)", fontSize:"clamp(28px,3.5vw,42px)", fontWeight:600, color:"#fff", letterSpacing:-0.5, marginBottom:40 }}>Nuestros valores</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16, maxWidth:1120, margin:"0 auto", textAlign:"left" }}>
            {valores.map(v => (
              <div key={v.name} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:"26px 24px" }}>
                <div style={{ width:44, height:44, borderRadius:12, background:"rgba(210,16,62,0.15)", border:"1px solid rgba(210,16,62,0.4)", color:"var(--tar)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                  <S s={22} d={v.d}/>
                </div>
                <div style={{ fontFamily:"var(--display)", fontSize:19, fontWeight:700, color:"#fff", marginBottom:6 }}>{v.name}</div>
                <p style={{ fontFamily:"var(--sans)", fontSize:13.5, color:"rgba(255,255,255,0.62)", lineHeight:1.6 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:"72px 40px", background:"#FAFAF8" }}>
        <div style={{ maxWidth:1400, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", gap:32, flexWrap:"wrap" }}>
          <div>
            <h2 style={{ fontFamily:"var(--display)", fontSize:"clamp(26px,3vw,40px)", fontWeight:600, color:"#0F1B2D", letterSpacing:-0.5, lineHeight:1.1, marginBottom:8 }}>
              ¿Listo para encontrar tu próxima propiedad?
            </h2>
            <p style={{ fontFamily:"var(--sans)", fontSize:15, color:"#6B7280" }}>Nuestro equipo te acompaña en cada paso.</p>
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <button onClick={() => onNavigate("listings")}
              style={{ background:"var(--tar)", color:"#fff", border:"none", padding:"14px 30px", borderRadius:24, fontFamily:"var(--sans)", fontSize:14, fontWeight:600, cursor:"pointer" }}>
              Ver propiedades
            </button>
            <button onClick={() => onNavigate("contact")}
              style={{ background:"#fff", color:"#0F1B2D", border:"1px solid #0F1B2D", padding:"14px 30px", borderRadius:24, fontFamily:"var(--sans)", fontSize:14, fontWeight:600, cursor:"pointer" }}>
              Contactar
            </button>
          </div>
        </div>
      </section>

      <Footer3 onNavigate={onNavigate} />
    </div>
  );
};

// ── AVISO DE PRIVACIDAD ───────────────────────────────────────────────────────
const Privacidad3 = ({ onNavigate }) => {
  const secciones = [
    {
      h: "1. Responsable del tratamiento de sus datos personales",
      p: ["TAR Internacional, con domicilio en Av. Paseo de la Reforma 123, Ciudad de México, es responsable del uso, tratamiento y protección de los datos personales que usted nos proporcione, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)."],
    },
    {
      h: "2. Datos personales que recabamos",
      p: ["Para las finalidades señaladas en el presente aviso, podemos recabar sus datos personales de distintas formas: cuando usted los proporciona directamente a través de nuestros formularios de contacto, correo electrónico o teléfono."],
      list: ["Nombre completo", "Correo electrónico", "Número telefónico", "Propiedad o tipo de inmueble de interés", "Información financiera para procesos de compra, renta o financiamiento (cuando aplique)"],
    },
    {
      h: "3. Finalidades del tratamiento de datos",
      p: ["Sus datos personales serán utilizados para las siguientes finalidades primarias, necesarias para el servicio que solicita:"],
      list: ["Atender sus solicitudes de información sobre propiedades", "Contactarle para agendar visitas y dar seguimiento a su interés", "Gestionar operaciones de compra, venta, renta o arrendamiento", "Brindar asesoría inmobiliaria personalizada"],
      p2: ["De manera adicional, y solo si usted no se opone, podremos utilizar sus datos para fines secundarios como el envío de promociones, boletines y campañas de marketing de propiedades similares."],
    },
    {
      h: "4. Transferencia de datos",
      p: ["Sus datos personales pueden ser compartidos con los asesores de TAR Internacional asignados a su solicitud, así como con terceros que nos presten servicios necesarios para concretar la operación inmobiliaria (notarías, instituciones financieras). En todos los casos exigimos el cumplimiento de las medidas de seguridad y confidencialidad correspondientes."],
    },
    {
      h: "5. Derechos ARCO",
      p: ["Usted tiene derecho a Acceder, Rectificar y Cancelar sus datos personales, así como a Oponerse al tratamiento de los mismos o revocar el consentimiento que para tal fin nos haya otorgado, enviando su solicitud al correo electrónico privacidad@tarint.mx."],
    },
    {
      h: "6. Uso de cookies y tecnologías de rastreo",
      p: ["Nuestro portal utiliza cookies y tecnologías similares (como Google Analytics y Google Tag Manager) mediante las cuales es posible monitorear su comportamiento como usuario de internet, brindarle un mejor servicio y experiencia al navegar en nuestra página. Usted puede deshabilitarlas en la configuración de su navegador."],
    },
    {
      h: "7. Cambios al aviso de privacidad",
      p: ["El presente aviso de privacidad puede sufrir modificaciones derivadas de nuevos requerimientos legales o de nuestras propias necesidades. Cualquier cambio será publicado en esta misma sección del portal."],
    },
  ];

  return (
    <div style={{ paddingTop:64, background:"#FAFAF8", minHeight:"100vh" }}>
      {/* Header band */}
      <section style={{ background:"#0F1B2D", padding:"56px 40px" }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          <button onClick={() => onNavigate("home")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"var(--sans)", fontSize:13, color:"rgba(255,255,255,0.6)", display:"flex", alignItems:"center", gap:6, marginBottom:24 }}>
            <I3ChevL s={14}/> Volver al inicio
          </button>
          <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--tar)", letterSpacing:3, textTransform:"uppercase", marginBottom:14 }}>Legal</div>
          <h1 style={{ fontFamily:"var(--display)", fontSize:"clamp(34px,4.5vw,56px)", fontWeight:600, color:"#fff", letterSpacing:-1, lineHeight:1.1 }}>Aviso de Privacidad</h1>
          <p style={{ fontFamily:"var(--sans)", fontSize:14, color:"rgba(255,255,255,0.55)", marginTop:14 }}>Última actualización: junio 2026</p>
        </div>
      </section>

      {/* Notice banner */}
      <div style={{ maxWidth:900, margin:"0 auto", padding:"24px 40px 0" }}>
        <div style={{ background:"#FFF8E1", border:"1px solid #FCD34D", borderRadius:10, padding:"14px 18px", fontFamily:"var(--sans)", fontSize:13, color:"#92400E", lineHeight:1.6 }}>
          <strong>Nota interna (no visible en producción):</strong> este es un texto base conforme a la LFPDPPP. Sustituye cada sección con el texto oficial de tu aviso de privacidad (el PDF entregado es escaneado y no se pudo extraer automáticamente).
        </div>
      </div>

      {/* Content */}
      <section style={{ maxWidth:900, margin:"0 auto", padding:"32px 40px 80px" }}>
        <div style={{ background:"#fff", borderRadius:16, padding:"48px 56px", border:"1px solid #F1F1F0" }}>
          <p style={{ fontFamily:"var(--sans)", fontSize:16, color:"#374151", lineHeight:1.8, marginBottom:36, paddingBottom:28, borderBottom:"1px solid #F1F1F0" }}>
            En <strong style={{ color:"#0F1B2D" }}>TAR Internacional</strong> tu privacidad es muy importante para nosotros. A continuación te explicamos cómo recabamos, usamos y protegemos tus datos personales.
          </p>
          {secciones.map((s, i) => (
            <div key={i} style={{ marginBottom:32 }}>
              <h2 style={{ fontFamily:"var(--display)", fontSize:21, fontWeight:700, color:"#0F1B2D", marginBottom:14 }}>{s.h}</h2>
              {s.p.map((para, j) => (
                <p key={j} style={{ fontFamily:"var(--sans)", fontSize:15, color:"#374151", lineHeight:1.8, marginBottom:12 }}>{para}</p>
              ))}
              {s.list && (
                <ul style={{ margin:"8px 0 12px", paddingLeft:0, listStyle:"none", display:"flex", flexDirection:"column", gap:8 }}>
                  {s.list.map((li, k) => (
                    <li key={k} style={{ display:"flex", alignItems:"flex-start", gap:10, fontFamily:"var(--sans)", fontSize:15, color:"#374151", lineHeight:1.6 }}>
                      <span style={{ width:18, height:18, borderRadius:"50%", background:"#FFF0F2", color:"var(--tar)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}><I3Check s={11}/></span>
                      {li}
                    </li>
                  ))}
                </ul>
              )}
              {s.p2 && s.p2.map((para, j) => (
                <p key={j} style={{ fontFamily:"var(--sans)", fontSize:15, color:"#374151", lineHeight:1.8, marginTop:12 }}>{para}</p>
              ))}
            </div>
          ))}

          {/* Contact box */}
          <div style={{ marginTop:40, padding:"24px 28px", background:"#FAFAF8", borderRadius:12, border:"1px solid #F1F1F0" }}>
            <div style={{ fontFamily:"var(--display)", fontSize:18, fontWeight:700, color:"#0F1B2D", marginBottom:8 }}>¿Dudas sobre tus datos?</div>
            <p style={{ fontFamily:"var(--sans)", fontSize:14, color:"#6B7280", lineHeight:1.7, marginBottom:4 }}>
              Contáctanos para ejercer tus derechos ARCO o resolver cualquier duda sobre el tratamiento de tus datos personales:
            </p>
            <div style={{ fontFamily:"var(--sans)", fontSize:14, color:"#0F1B2D", fontWeight:600 }}>privacidad@tarint.mx · +52 55 1234 5678</div>
          </div>
        </div>
      </section>

      <Footer3 onNavigate={onNavigate} />
    </div>
  );
};

Object.assign(window, { Nosotros3, Privacidad3 });
