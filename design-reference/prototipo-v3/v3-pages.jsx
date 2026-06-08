// TAR Internacional v3 — Pages (EverGreen-inspired)

const {
  PROPERTIES, TYPE_LABELS, LEADS, ADMIN_STATS, BROKERS, formatPrice,
  PropCard3, PropImg3, Filter3, Footer3, ContactForm3, Modal3,
  I3Search, I3Pin, I3Bed, I3Bath, I3Car, I3Ruler, I3Close, I3ChevL, I3ChevR, I3ChevD,
  I3Heart, I3Map, I3Mail, I3Wapp, I3User, I3Plus, I3Check, I3Grid, I3List, I3Edit, I3Verif,
} = window;

const DEF_F3 = { operation:"all", type:"all", maxPrice:"all", zone:"all", minBeds:"0", search:"" };

// Texto compacto del price-pill (igual que en Map3).
const pillText3 = p => p.operation === "renta"
  ? `$${(p.price/1000).toFixed(0)}k/mes`
  : (p.price >= 1000000 ? `$${(p.price/1000000).toFixed(1).replace(".0","")} MDP` : `$${(p.price/1000).toFixed(0)}k`);

// ── Mini-mapa real (Leaflet) para el Home ────────────────────────────────────
// Refleja el mapa de producción (Google Maps + marcadores price-pill); ya no es
// un dibujo SVG. En la app real el tile provider es Google Maps.
const MiniMap3 = ({ onNavigate }) => {
  const ref  = React.useRef(null);
  const inst = React.useRef(null);
  React.useEffect(() => {
    if (inst.current || !ref.current || !window.L) return;
    const L = window.L;
    const m = L.map(ref.current, { zoomControl:false, scrollWheelZoom:false, attributionControl:false }).setView([19.40, -99.17], 11);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom:19 }).addTo(m);
    inst.current = m;
    const pts = [];
    PROPERTIES.filter(p => p.lat && p.lng).slice(0, 12).forEach(p => {
      const html = `<div class="price-pill ${p.premium ? "premium" : ""}">${p.premium ? '<span class="pp-star">★</span>' : ''}<span>${pillText3(p)}</span><div class="pip"></div></div>`;
      const icon = L.divIcon({ className:"", html, iconSize:[80,32], iconAnchor:[40,32] });
      L.marker([p.lat, p.lng], { icon }).addTo(m).on("click", () => onNavigate && onNavigate("detail", p.id));
      pts.push([p.lat, p.lng]);
    });
    if (pts.length) m.fitBounds(pts, { padding:[40,40], maxZoom:13 });
    return () => { inst.current?.remove(); inst.current = null; };
  }, []);
  return <div ref={ref} style={{ position:"absolute", inset:0 }} />;
};

// ── FAQ acordeón con animación suave (sustituye al <details> brusco) ──────────
const Faq3 = ({ items }) => {
  const [open, setOpen] = React.useState(0);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={i} style={{ border:"1px solid #E5E5E4", borderRadius:14, background:"#fff", overflow:"hidden", transition:"border-color 0.2s" }}>
            <button onClick={() => setOpen(isOpen ? null : i)}
              style={{ width:"100%", textAlign:"left", padding:"18px 22px", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--sans)", fontSize:15, fontWeight:600, color:"#0F1B2D", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
              {f.q}
              <span style={{ color:"#9CA3AF", fontSize:22, fontWeight:300, lineHeight:1, flexShrink:0, transition:"transform 0.25s ease", transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
            </button>
            <div style={{ maxHeight: isOpen ? 260 : 0, opacity: isOpen ? 1 : 0, overflow:"hidden", transition:"max-height 0.32s ease, opacity 0.32s ease" }}>
              <p style={{ fontFamily:"var(--sans)", fontSize:14, color:"#6B7280", lineHeight:1.7, padding:"0 22px 18px" }}>{f.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── HOME ─────────────────────────────────────────────────────────────────────
const Home3 = ({ onNavigate }) => {
  const [op, setOp] = React.useState("venta");
  const [q, setQ]   = React.useState("");
  const [type, setType] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [beds, setBeds] = React.useState("");
  const [saved, setSaved] = React.useState(new Set());
  const premiumProps = PROPERTIES.filter(p => p.premium);
  const featured = premiumProps.length ? premiumProps : PROPERTIES.filter(p => p.featured);
  const all = PROPERTIES;
  const toggleSave = id => setSaved(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div>
      {/* ─── HERO — full bleed photo + overlay card ─── */}
      <section style={{ position:"relative", padding:"100px 24px 28px", background:"#FAFAF8" }}>
        <div style={{ maxWidth:1400, margin:"0 auto" }}>
          <div style={{ position:"relative", borderRadius:24, overflow:"hidden", minHeight:"90vh", display:"flex", flexDirection:"column", justifyContent:"flex-start" }}>
            {/* Background — real featured photo */}
            <div style={{ position:"absolute", inset:0, background:"#0F1B2D" }}>
              {featured[0]?.image && <img src={featured[0].image} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />}
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(105deg, rgba(15,27,45,0.95) 0%, rgba(15,27,45,0.74) 40%, rgba(15,27,45,0.28) 72%, rgba(107,24,32,0.38) 100%)" }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 46%)" }} />
              <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 78% 18%, rgba(196,25,48,0.30) 0%, transparent 55%)" }} />
              <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 60px,rgba(255,255,255,0.02) 60px,rgba(255,255,255,0.02) 120px)" }} />
            </div>

            {/* (Badge "60 años" y tarjeta destacada del hero retirados a pedido del cliente.) */}

            {/* Headline */}
            <div style={{ position:"relative", padding:"96px 48px 40px", zIndex:2 }}>
              <h1 style={{ fontFamily:"var(--display)", fontSize:"clamp(40px,5vw,68px)", fontWeight:600, color:"#fff", lineHeight:1.05, letterSpacing:-1.5, maxWidth:860, marginBottom:22 }}>
                Bienes raíces que <span style={{ fontStyle:"italic", color:"rgba(255,255,255,0.62)" }}>construyen</span> patrimonio.
              </h1>
              <p style={{ fontFamily:"var(--sans)", fontSize:15.5, color:"rgba(255,255,255,0.72)", maxWidth:520, lineHeight:1.65, marginBottom:24 }}>
                {PROPERTIES.length} propiedades en las mejores zonas de México. Departamentos, oficinas, locales y bodegas seleccionados por un equipo con seis décadas de experiencia.
              </p>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[["departamento","Departamentos"],["oficina","Oficinas"],["comercial","Locales"],["bodega","Bodegas"]].map(([t,l]) => (
                  <button key={t} onClick={() => onNavigate("listings",{type:t})}
                    style={{ background:"rgba(255,255,255,0.12)", color:"#fff", border:"1px solid rgba(255,255,255,0.22)", padding:"9px 18px", borderRadius:24, fontFamily:"var(--sans)", fontSize:13, fontWeight:500, cursor:"pointer", backdropFilter:"blur(8px)", transition:"all 0.15s" }}
                    onMouseEnter={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.color="#0F1B2D";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.12)";e.currentTarget.style.color="#fff";}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom search card */}
            <div style={{ position:"relative", padding:"24px 32px 32px", zIndex:2, marginTop:"auto" }}>
              <div style={{ background:"rgba(255,255,255,0.98)", borderRadius:18, padding:"22px 24px", boxShadow:"0 20px 60px rgba(0,0,0,0.2)", backdropFilter:"blur(8px)" }}>
                <div style={{ fontFamily:"var(--display)", fontSize:20, fontWeight:700, color:"#0F1B2D", marginBottom:18 }}>Encuentra el mejor lugar</div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1.4fr 1fr", gap:14, alignItems:"end" }}>
                  <div>
                    <div style={{ fontFamily:"var(--sans)", fontSize:11, fontWeight:600, color:"#6B7280", marginBottom:6 }}>Buscando</div>
                    <select value={type} onChange={e => setType(e.target.value)}
                      style={{ width:"100%", padding:"12px 14px", border:"1px solid #E5E5E4", borderRadius:10, fontFamily:"var(--sans)", fontSize:13, background:"#fff", outline:"none", color:"#0F1B2D", appearance:"none" }}>
                      <option value="">Tipo de propiedad</option>
                      <option value="departamento">Departamentos</option>
                      <option value="oficina">Oficinas</option>
                      <option value="comercial">Locales comerciales</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ fontFamily:"var(--sans)", fontSize:11, fontWeight:600, color:"#6B7280", marginBottom:6 }}>Precio</div>
                    <select value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                      style={{ width:"100%", padding:"12px 14px", border:"1px solid #E5E5E4", borderRadius:10, fontFamily:"var(--sans)", fontSize:13, background:"#fff", outline:"none", color:"#0F1B2D", appearance:"none" }}>
                      <option value="">Cualquier precio</option>
                      <option value="3000000">Hasta $3 MDP</option>
                      <option value="6000000">Hasta $6 MDP</option>
                      <option value="12000000">Hasta $12 MDP</option>
                      <option value="30000">Hasta $30,000/mes</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ fontFamily:"var(--sans)", fontSize:11, fontWeight:600, color:"#6B7280", marginBottom:6 }}>Ubicación</div>
                    <div style={{ position:"relative" }}>
                      <input placeholder="Colonia, zona…" value={q} onChange={e => setQ(e.target.value)}
                        onKeyDown={e => e.key==="Enter" && onNavigate("listings",{search:q,operation:op,type,maxPrice,minBeds:beds})}
                        style={{ width:"100%", padding:"12px 14px 12px 38px", border:"1px solid #E5E5E4", borderRadius:10, fontFamily:"var(--sans)", fontSize:13, background:"#fff", outline:"none", color:"#0F1B2D" }} />
                      <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"#9CA3AF" }}><I3Pin s={15}/></span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily:"var(--sans)", fontSize:11, fontWeight:600, color:"#6B7280", marginBottom:6 }}>Recámaras</div>
                    <select value={beds} onChange={e => setBeds(e.target.value)}
                      style={{ width:"100%", padding:"12px 14px", border:"1px solid #E5E5E4", borderRadius:10, fontFamily:"var(--sans)", fontSize:13, background:"#fff", outline:"none", color:"#0F1B2D", appearance:"none" }}>
                      <option value="">Cualquiera</option>
                      <option value="1">1+ rec.</option>
                      <option value="2">2+ rec.</option>
                      <option value="3">3+ rec.</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop:18, display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ fontFamily:"var(--sans)", fontSize:12, color:"#6B7280", fontWeight:600 }}>Filtros:</span>
                    {[["venta","Venta"],["renta","Renta"]].map(([v,l]) => (
                      <button key={v} onClick={() => setOp(v)}
                        style={{ background:op===v?"#0F1B2D":"#F7F7F6", color:op===v?"#fff":"#374151", border:"none", padding:"7px 16px", borderRadius:20, fontFamily:"var(--sans)", fontSize:12, fontWeight:500, cursor:"pointer", transition:"all 0.15s" }}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => onNavigate("listings",{search:q,operation:op,type,maxPrice,minBeds:beds||"0"})}
                    style={{ background:"#0F1B2D", color:"#fff", border:"none", padding:"11px 28px", borderRadius:24, fontFamily:"var(--sans)", fontSize:14, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                    Buscar propiedades <I3Search s={14}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS strip ─── */}
      <section style={{ padding:"8px 24px 64px", background:"#FAFAF8" }}>
        <div style={{ maxWidth:1400, margin:"0 auto", background:"#fff", borderRadius:20, border:"1px solid #F1F1F0", boxShadow:"0 6px 28px rgba(15,27,45,0.05)", display:"grid", gridTemplateColumns:"repeat(4,1fr)", overflow:"hidden" }}>
          {[
            ["60+","Años de experiencia","Desde 1960"],
            ["300+","Edificios construidos","TARTAKOVSKI HNOS"],
            [String(PROPERTIES.length),"Propiedades disponibles","Venta y renta"],
            ["3,000+","Inquilinos atendidos","México y EUA"],
          ].map(([n,l,sub], i) => (
            <div key={l} style={{ padding:"34px 32px", borderRight: i<3 ? "1px solid #F1F1F0" : "none", position:"relative" }}>
              <div style={{ position:"absolute", top:0, left:32, width:36, height:3, background:"var(--tar)" }} />
              <div style={{ fontFamily:"var(--display)", fontSize:52, fontWeight:700, color:"#0F1B2D", lineHeight:1, marginBottom:8, letterSpacing:-1.5 }}>{n}</div>
              <div style={{ fontFamily:"var(--sans)", fontSize:14, color:"#0F1B2D", fontWeight:600, marginBottom:2 }}>{l}</div>
              <div style={{ fontFamily:"var(--sans)", fontSize:12, color:"#9CA3AF" }}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURED — large editorial heading + cards ─── */}
      <section style={{ padding:"32px 24px 80px", maxWidth:1400, margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:36, gap:32 }}>
          <div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:7, fontFamily:"var(--sans)", fontSize:11, fontWeight:700, color:"#A9802F", letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>
              <span style={{ color:"#BE8C3C" }}>★</span> Destacados
            </div>
            <h2 style={{ fontFamily:"var(--display)", fontSize:"clamp(32px,4.5vw,52px)", fontWeight:600, color:"#0F1B2D", letterSpacing:-1, lineHeight:1.05, maxWidth:640 }}>
              Propiedades<br />destacadas
            </h2>
          </div>
          <button onClick={() => onNavigate("listings")}
            style={{ background:"#0F1B2D", color:"#fff", border:"none", padding:"12px 26px", borderRadius:24, fontFamily:"var(--sans)", fontSize:14, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap" }}>
            Ver todas <I3ChevR s={14}/>
          </button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
          {featured.map(p => <PropCard3 key={p.id} property={p} onClick={pp => onNavigate("detail",pp.id)} saved={saved.has(p.id)} onSave={toggleSave} />)}
        </div>
      </section>

      {/* ─── DISCOVER w/ map snippet ─── */}
      <section style={{ padding:"40px 24px 80px", background:"#fff" }}>
        <div style={{ maxWidth:1400, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, alignItems:"center" }}>
          {/* Map preview — mapa real (Leaflet); en producción será Google Maps */}
          <div style={{ position:"relative", height:380, borderRadius:18, overflow:"hidden", background:"#E8EDE5", border:"1px solid #F1F1F0" }}>
            <MiniMap3 onNavigate={onNavigate} />
            <button onClick={() => onNavigate("map")}
              style={{ position:"absolute", bottom:14, right:14, zIndex:500, background:"rgba(255,255,255,0.96)", border:"none", padding:"9px 15px", borderRadius:20, fontFamily:"var(--sans)", fontSize:12, fontWeight:600, color:"#0F1B2D", cursor:"pointer", boxShadow:"0 2px 12px rgba(0,0,0,0.18)", display:"inline-flex", alignItems:"center", gap:6 }}>
              Ver mapa completo <I3ChevR s={13}/>
            </button>
          </div>

          <div>
            <div style={{ fontFamily:"var(--sans)", fontSize:11, fontWeight:600, color:"var(--tar)", letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Explora la ciudad</div>
            <h2 style={{ fontFamily:"var(--display)", fontSize:"clamp(28px,3.5vw,40px)", fontWeight:600, color:"#0F1B2D", letterSpacing:-0.5, lineHeight:1.1, marginBottom:16 }}>
              Descubre propiedades<br />con el mejor valor
            </h2>
            <p style={{ fontFamily:"var(--sans)", fontSize:15, color:"#6B7280", lineHeight:1.75, marginBottom:24 }}>
              Desde departamentos compactos hasta oficinas corporativas: explora cada inmueble en su contexto real con nuestro mapa interactivo. Ve la zona, los servicios cercanos y descubre qué hace única a cada propiedad.
            </p>
            <button onClick={() => onNavigate("map")}
              style={{ background:"#0F1B2D", color:"#fff", border:"none", padding:"12px 26px", borderRadius:24, fontFamily:"var(--sans)", fontSize:14, fontWeight:600, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:8 }}>
              Encontrar propiedades cercanas <I3ChevR s={14}/>
            </button>
          </div>
        </div>
      </section>

      {/* ─── ALL CATALOG preview ─── */}
      <section style={{ padding:"40px 24px 80px", background:"#FAFAF8" }}>
        <div style={{ maxWidth:1400, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:36, gap:32 }}>
            <div>
              <div style={{ fontFamily:"var(--sans)", fontSize:11, fontWeight:600, color:"var(--tar)", letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Catálogo completo</div>
              <h2 style={{ fontFamily:"var(--display)", fontSize:"clamp(28px,3.5vw,42px)", fontWeight:600, color:"#0F1B2D", letterSpacing:-0.5, lineHeight:1.1 }}>Explora todo el inventario</h2>
              <p style={{ fontFamily:"var(--sans)", fontSize:14, color:"#6B7280", marginTop:8 }}>Departamentos, oficinas, locales y bodegas en las mejores zonas de México.</p>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
            {all.slice(3,9).map(p => <PropCard3 key={p.id} property={p} onClick={pp => onNavigate("detail",pp.id)} saved={saved.has(p.id)} onSave={toggleSave} />)}
          </div>
        </div>
      </section>

      {/* ─── FAQ + EXPERT BAND ─── */}
      <section style={{ padding:"60px 24px 80px", background:"#fff" }}>
        <div style={{ maxWidth:1400, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:48 }}>
          <div>
            <div style={{ fontFamily:"var(--sans)", fontSize:11, fontWeight:600, color:"var(--tar)", letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>FAQ</div>
            <h2 style={{ fontFamily:"var(--display)", fontSize:"clamp(28px,3.5vw,40px)", fontWeight:600, color:"#0F1B2D", letterSpacing:-0.5, lineHeight:1.1, marginBottom:16 }}>Preguntas<br />frecuentes</h2>
            <p style={{ fontFamily:"var(--sans)", fontSize:14, color:"#6B7280", lineHeight:1.7 }}>Nuestros expertos te guían en cada decisión basados en insights del mercado.</p>
          </div>
          <Faq3 items={[
            { q:"¿Qué tipo de propiedades manejan?", a:"Departamentos residenciales, oficinas corporativas, locales, bodegas y terrenos en venta y renta, distribuidos en las mejores zonas de México." },
            { q:"¿Cómo agendar una visita?", a:"Desde la ficha de cada propiedad puedes enviar una solicitud de contacto o de cita con la fecha y hora que prefieras; un asesor de TAR Internacional se pondrá en contacto contigo." },
            { q:"¿Atienden compradores internacionales?", a:"Sí, contamos con experiencia atendiendo clientes internacionales y procesos de inversión extranjera." },
            { q:"¿Cuánto tiempo toma cerrar una operación?", a:"En promedio entre 30 y 60 días, dependiendo del tipo de propiedad y forma de pago." },
          ]} />
        </div>
      </section>

      <Footer3 onNavigate={onNavigate} />
    </div>
  );
};

// ── LISTINGS ─────────────────────────────────────────────────────────────────
const Listings3 = ({ onNavigate, initialFilters = {} }) => {
  const [filters, setFilters] = React.useState({ ...DEF_F3, ...initialFilters });
  const [view, setView] = React.useState("grid");
  const [sort, setSort] = React.useState("recent");
  const [saved, setSaved] = React.useState(new Set());
  const [modal, setModal] = React.useState(null);
  const [page, setPage] = React.useState(1);
  const PER = 9;

  const list = PROPERTIES.filter(p => {
    if (filters.operation !== "all" && p.operation !== filters.operation) return false;
    if (filters.type !== "all" && p.type !== filters.type) return false;
    if (filters.zone !== "all" && p.zone !== filters.zone) return false;
    if (filters.minBeds !== "0" && p.bedrooms < parseInt(filters.minBeds)) return false;
    if (filters.maxPrice !== "all" && p.price > parseInt(filters.maxPrice)) return false;
    if (filters.search) { const q = filters.search.toLowerCase(); if (!p.title.toLowerCase().includes(q) && !p.location.toLowerCase().includes(q)) return false; }
    return true;
  }).sort((a,b) => {
    if (!!a.premium !== !!b.premium) return a.premium ? -1 : 1;
    return sort==="price-asc"?a.price-b.price:sort==="price-desc"?b.price-a.price:sort==="area"?b.area-a.area:b.id-a.id;
  });

  const pages = Math.ceil(list.length / PER);
  const items = list.slice((page-1)*PER, page*PER);
  const toggle = id => setSaved(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });

  return (
    <div style={{ paddingTop:84, minHeight:"100vh", background:"#FAFAF8" }}>
      {/* Top bar */}
      <div style={{ background:"#fff", borderBottom:"1px solid #F1F1F0" }}>
        <div style={{ maxWidth:1400, margin:"0 auto", padding:"16px 32px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:16 }}>
          <div>
            <div style={{ fontFamily:"var(--display)", fontSize:24, fontWeight:600, color:"#0F1B2D", letterSpacing:-0.5 }}>Propiedades</div>
            <div style={{ fontFamily:"var(--sans)", fontSize:13, color:"#6B7280", marginTop:2 }}><strong style={{ color:"#0F1B2D" }}>{list.length}</strong> resultados</div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ border:"1px solid #E5E5E4", padding:"9px 14px", borderRadius:24, fontFamily:"var(--sans)", fontSize:13, color:"#374151", background:"#fff", outline:"none", fontWeight:500 }}>
              <option value="recent">Más recientes</option>
              <option value="price-asc">Precio ↑</option>
              <option value="price-desc">Precio ↓</option>
              <option value="area">Mayor superficie</option>
            </select>
            <div style={{ display:"flex", border:"1px solid #E5E5E4", borderRadius:24, overflow:"hidden", padding:3 }}>
              {[["grid","Grid",I3Grid],["list","Lista",I3List]].map(([v,l,Ic]) => (
                <button key={v} onClick={() => setView(v)} style={{ padding:"6px 12px", border:"none", background:view===v?"#0F1B2D":"transparent", color:view===v?"#fff":"#9CA3AF", cursor:"pointer", borderRadius:20 }}><Ic s={14}/></button>
              ))}
            </div>
            <button onClick={() => onNavigate("map")}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", border:"1px solid #E5E5E4", background:"#fff", fontFamily:"var(--sans)", fontSize:13, color:"#374151", cursor:"pointer", borderRadius:24, fontWeight:500 }}>
              <I3Map s={14}/> Mapa
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1400, margin:"0 auto", padding:"28px 32px", display:"flex", gap:28 }}>
        {/* Sidebar */}
        <div style={{ width:240, flexShrink:0 }}>
          <div style={{ position:"sticky", top:100, background:"#fff", borderRadius:16, padding:"22px 20px", border:"1px solid #F1F1F0" }}>
            <div style={{ fontFamily:"var(--display)", fontSize:16, fontWeight:700, color:"#0F1B2D", marginBottom:18 }}>Filtros</div>
            <Filter3 filters={filters} onChange={f => { setFilters(f); setPage(1); }} />
          </div>
        </div>

        {/* Results */}
        <div style={{ flex:1 }}>
          {items.length === 0 ? (
            <div style={{ textAlign:"center", padding:"80px 0", color:"#6B7280", fontFamily:"var(--sans)" }}>
              <div style={{ fontFamily:"var(--display)", fontSize:24, color:"#0F1B2D", marginBottom:8 }}>Sin resultados</div>
              <div style={{ fontSize:14 }}>Prueba ajustando los filtros</div>
            </div>
          ) : view === "grid" ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {items.map(p => <PropCard3 key={p.id} property={p} onClick={pp => onNavigate("detail",pp.id)} saved={saved.has(p.id)} onSave={toggle} />)}
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {items.map(p => (
                <div key={p.id} onClick={() => onNavigate("detail",p.id)}
                  style={{ background:"#fff", display:"flex", cursor:"pointer", borderRadius:14, overflow:"hidden", border:"1px solid #F1F1F0", transition:"box-shadow 0.2s, transform 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.08)"; e.currentTarget.style.transform="translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; e.currentTarget.style.transform="none"; }}>
                  <div style={{ width:260, flexShrink:0, position:"relative" }}><PropImg3 property={p} height={180} rounded={false} /></div>
                  <div style={{ padding:"20px 24px", flex:1, display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:5, fontFamily:"var(--sans)", fontSize:12, color:"#6B7280", marginBottom:8 }}><I3Pin s={11}/>{p.location}</div>
                      <div style={{ fontFamily:"var(--display)", fontSize:20, fontWeight:600, color:"#0F1B2D", marginBottom:8 }}>{p.title}</div>
                      <div style={{ display:"flex", gap:18, fontFamily:"var(--sans)", fontSize:13, color:"#374151" }}>
                        {p.bedrooms>0&&<span style={{ display:"flex", alignItems:"center", gap:5 }}><I3Bed s={14}/>{p.bedrooms} rec.</span>}
                        {p.bathrooms>0&&<span style={{ display:"flex", alignItems:"center", gap:5 }}><I3Bath s={14}/>{p.bathrooms} baños</span>}
                        <span style={{ display:"flex", alignItems:"center", gap:5 }}><I3Ruler s={14}/>{p.area} m²</span>
                      </div>
                    </div>
                    <div style={{ fontFamily:"var(--display)", fontSize:26, fontWeight:700, color:"#0F1B2D", letterSpacing:-0.5 }}>{formatPrice(p.price,p.currency,p.operation)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pages > 1 && (
            <div style={{ display:"flex", gap:6, justifyContent:"center", marginTop:36 }}>
              {Array.from({length:pages},(_,i) => (
                <button key={i} onClick={() => setPage(i+1)}
                  style={{ width:40, height:40, border:`1px solid ${page===i+1?"#0F1B2D":"#E5E5E4"}`, background:page===i+1?"#0F1B2D":"#fff", color:page===i+1?"#fff":"#374151", borderRadius:20, fontFamily:"var(--sans)", fontSize:13, cursor:"pointer", fontWeight:page===i+1?600:500 }}>
                  {i+1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {modal && <Modal3 property={modal} onClose={() => setModal(null)} />}
      <Footer3 onNavigate={onNavigate} />
    </div>
  );
};

// ── MAP — Habitect-inspired split layout with price pill markers ──────────────
const Map3 = ({ onNavigate }) => {
  const mapRef  = React.useRef(null);
  const mapInst = React.useRef(null);
  const markersRef = React.useRef({});
  const popupRef   = React.useRef(null);

  const [active, setActive] = React.useState(null);
  const [hover,  setHover]  = React.useState(null);
  const [modal,  setModal]  = React.useState(null);
  const [search, setSearch] = React.useState("");
  const [opTab,  setOpTab]  = React.useState("all");
  const [typeF,  setTypeF]  = React.useState("all");
  const [bedsF,  setBedsF]  = React.useState("all");
  const [priceF, setPriceF] = React.useState("all");
  const [saved,  setSaved]  = React.useState(new Set());
  const [sort,   setSort]   = React.useState("recent");

  const toggleSave = id => setSaved(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // ── filtered list ──
  const filtered = React.useMemo(() => {
    let list = PROPERTIES.filter(p => {
      if (opTab !== "all" && p.operation !== opTab) return false;
      if (typeF !== "all" && p.type !== typeF) return false;
      if (bedsF !== "all" && p.bedrooms < parseInt(bedsF)) return false;
      if (priceF !== "all" && p.price > parseInt(priceF)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !p.location.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a,b) => {
      if (!!a.premium !== !!b.premium) return a.premium ? -1 : 1;
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      return 0;
    });
    return list;
  }, [opTab, typeF, bedsF, priceF, search, sort]);

  // ── Format price as compact pill text ──
  const pillText = p => {
    if (p.operation === "renta") return `$${(p.price/1000).toFixed(0)}k/mes`;
    return p.price >= 1000000 ? `$${(p.price/1000000).toFixed(1).replace(".0","")} MDP` : `$${(p.price/1000).toFixed(0)}k`;
  };

  // ── Init Leaflet map (mount once) ──
  React.useEffect(() => {
    if (mapInst.current || !mapRef.current || !window.L) return;
    const L = window.L;
    mapInst.current = L.map(mapRef.current, { zoomControl: false }).setView([19.42, -99.18], 11);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap, © CARTO", maxZoom: 19,
    }).addTo(mapInst.current);
    return () => { mapInst.current?.remove(); mapInst.current = null; markersRef.current = {}; };
  }, []);

  // ── Rebuild markers when filtered list / active changes ──
  React.useEffect(() => {
    if (!mapInst.current || !window.L) return;
    const L = window.L;
    // Clear old
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    filtered.forEach(p => {
      const isActive = active?.id === p.id;
      const html = `
        <div class="price-pill ${isActive ? "is-active" : ""} ${p.premium ? "premium" : ""}" data-id="${p.id}">
          ${p.premium ? '<span class="pp-star">★</span>' : ''}<span>${pillText(p)}</span>
          <div class="pip"></div>
        </div>
      `;
      const icon = L.divIcon({
        className: "",
        html,
        iconSize: [80, 32],
        iconAnchor: [40, 32],
      });
      const marker = L.marker([p.lat, p.lng], { icon, zIndexOffset: isActive ? 1000 : 0 }).addTo(mapInst.current);
      marker.on("click", () => setActive(p));
      markersRef.current[p.id] = marker;
    });

    // Cluster pins (decorative — represent areas with more properties)
    const clusters = [
      { lat: 19.32, lng: -99.16, n: 20 },
      { lat: 19.49, lng: -99.21, n: 5 },
    ];
    clusters.forEach(c => {
      const html = `<div class="cluster-pin">${c.n}</div>`;
      const icon = L.divIcon({ className: "", html, iconSize: [56, 56], iconAnchor: [28, 28] });
      const m = L.marker([c.lat, c.lng], { icon }).addTo(mapInst.current);
      markersRef.current[`c-${c.n}`] = m;
    });
  }, [filtered, active]);

  // ── Render hovered/active property popup on map ──
  React.useEffect(() => {
    if (!mapInst.current || !window.L) return;
    const L = window.L;
    if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
    const showFor = active;
    if (!showFor) return;

    const html = `
      <div class="map-card">
        <div class="map-card-img" style="background:${showFor.color}">
          ${showFor.image ? `<img src="${showFor.image}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" />` : `<div class="map-card-tex"></div>`}
        </div>
        <div class="map-card-body">
          <div class="map-card-price">${formatPrice(showFor.price, showFor.currency, showFor.operation)}</div>
          <div class="map-card-loc"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg> ${showFor.location}</div>
          <div class="map-card-stats">
            ${showFor.bedrooms > 0 ? `<span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7a2 2 0 012-2h16a2 2 0 012 2v10H2V7z"/><path d="M2 13h20"/><path d="M7 13V9"/><path d="M17 13V9"/></svg> ${showFor.bedrooms}</span>` : ""}
            ${showFor.bathrooms > 0 ? `<span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16M4 12V7a1 1 0 011-1h3m-4 6v5a2 2 0 002 2h12a2 2 0 002-2v-5M15 6a2 2 0 012 2v4"/></svg> ${showFor.bathrooms}</span>` : ""}
            <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3L3 21M9.5 14.5l5-5M7 7l2 2M15 11l2 2"/></svg> ${showFor.area} m²</span>
          </div>
        </div>
      </div>
    `;
    popupRef.current = L.popup({
      closeButton: false, autoClose: false, closeOnClick: false,
      offset: [0, -22], className: "tar-map-popup", autoPan: true,
    })
      .setLatLng([showFor.lat, showFor.lng])
      .setContent(html)
      .addTo(mapInst.current);
  }, [active]);

  // ── Click on list card → pan + activate ──
  const selectProp = (p) => {
    setActive(p);
    if (mapInst.current) mapInst.current.flyTo([p.lat, p.lng], 14, { duration: 0.8 });
  };

  // ── Filter pill styles ──
  const filterPill = (active_) => ({
    display: "inline-flex", alignItems: "center", gap: 6,
    background: active_ ? "#0F1B2D" : "rgba(255,255,255,0.96)",
    color: active_ ? "#fff" : "#0F1B2D",
    padding: "8px 14px", borderRadius: 24,
    fontFamily: "var(--sans)", fontSize: 13, fontWeight: 500,
    cursor: "pointer", border: "none",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    backdropFilter: "blur(8px)",
    whiteSpace: "nowrap",
    transition: "all 0.15s",
  });

  return (
    <div style={{ paddingTop: 84, height: "100vh", display: "flex", background: "#FAFAF8" }}>
      {/* ── LEFT: List + search ── */}
      <div style={{ width: 540, background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid #F1F1F0", flexShrink: 0 }}>
        {/* Search */}
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid #F1F1F0" }}>
          <div style={{ position: "relative" }}>
            <input
              placeholder="Departamentos en Polanco, Roma…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width:"100%", padding:"13px 50px 13px 18px", border:"1px solid #E5E5E4", borderRadius:24, fontFamily:"var(--sans)", fontSize:14, outline:"none", boxSizing:"border-box", background:"#fff", color:"#0F1B2D" }}
            />
            <button style={{ position:"absolute", right:5, top:"50%", transform:"translateY(-50%)", background:"#0F1B2D", color:"#fff", border:"none", width:38, height:38, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <I3Search s={16}/>
            </button>
          </div>
          {/* Operation tabs */}
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            {[["all","Todo"],["venta","Venta"],["renta","Renta"]].map(([v,l]) => (
              <button key={v} onClick={() => setOpTab(v)}
                style={{ padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer", fontFamily:"var(--sans)", fontSize:12, fontWeight:500,
                  background: opTab===v ? "#FFF0F2" : "#F7F7F6", color: opTab===v ? "var(--tar)" : "#6B7280" }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Results bar */}
        <div style={{ padding: "14px 24px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontFamily: "var(--sans)", fontSize: 14, color: "#0F1B2D" }}>
            <strong style={{ fontFamily:"var(--display)", fontSize:18, fontWeight:700 }}>{filtered.length}</strong> objetos encontrados
          </div>
          <button onClick={() => setSort(s => s==="price-asc"?"price-desc":s==="price-desc"?"recent":"price-asc")}
            style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"var(--sans)", fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:5, fontWeight:500 }}>
            Ordenar por precio
            <span style={{ color:"#0F1B2D" }}>{sort==="price-asc"?"↑":sort==="price-desc"?"↓":"↕"}</span>
          </button>
        </div>

        {/* 2-col cards grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 18px 18px" }}>
          {filtered.length === 0 ? (
            <div style={{ padding:"60px 0", textAlign:"center", color:"#9CA3AF", fontFamily:"var(--sans)", fontSize:13 }}>Sin resultados — ajusta los filtros</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {filtered.map(p => (
                <div key={p.id}
                  onClick={() => selectProp(p)}
                  onMouseEnter={() => setHover(p.id)}
                  onMouseLeave={() => setHover(null)}
                  style={{ background:"#fff", borderRadius:12, overflow:"hidden", cursor:"pointer",
                    border: `1.5px solid ${p.premium ? "#D9B65E" : active?.id === p.id ? "var(--tar)" : "transparent"}`,
                    boxShadow: p.premium
                      ? (hover === p.id || active?.id === p.id ? "0 8px 20px rgba(190,140,60,0.30)" : "0 2px 10px rgba(190,140,60,0.18)")
                      : (hover === p.id || active?.id === p.id ? "0 6px 16px rgba(0,0,0,0.08)" : "none"),
                    transition: "all 0.2s" }}>
                  {/* Image */}
                  <div style={{ height: 130, position: "relative", background: p.color, overflow:"hidden" }}>
                    {p.image ? (
                      <img src={p.image} alt={p.title} loading="lazy" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                    ) : (
                      <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 12px,rgba(255,255,255,0.04) 12px,rgba(255,255,255,0.04) 24px)" }}/>
                    )}
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,transparent 60%,rgba(0,0,0,0.4) 100%)" }}/>
                    {p.premium && <div style={{ position:"absolute", top:8, left:8, display:"inline-flex", alignItems:"center", gap:3, background:"linear-gradient(135deg, #E4C66A, #BE8C3C)", color:"#3A2A08", padding:"2px 8px", borderRadius:12, fontFamily:"var(--sans)", fontSize:10, fontWeight:700 }}>★ Destacado</div>}
                    {p.isNew && !p.premium && <div style={{ position:"absolute", top:8, left:8, background:"#fff", color:"#0F1B2D", padding:"2px 8px", borderRadius:12, fontFamily:"var(--sans)", fontSize:10, fontWeight:600 }}>Nuevo</div>}
                    {/* Guardar/favoritos oculto por ahora (requiere cuentas de usuario público). */}
                  </div>
                  {/* Info */}
                  <div style={{ padding: "10px 14px 14px" }}>
                    <div style={{ fontFamily:"var(--display)", fontSize:18, fontWeight:700, color:"#0F1B2D", letterSpacing:-0.3, marginBottom:6 }}>
                      $ {p.operation==="renta" ? (p.price/1000).toFixed(0)+"k" : (p.price/1000).toLocaleString("es-MX")}
                    </div>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:3, fontFamily:"var(--sans)", fontSize:11, color:"#6B7280", marginBottom:10, lineHeight:1.3 }}>
                      <I3Pin s={11}/>
                      <span style={{ flex:1 }}>{p.location}</span>
                    </div>
                    <div style={{ display:"flex", gap:10, fontFamily:"var(--sans)", fontSize:11, color:"#6B7280", paddingTop:8, borderTop:"1px solid #F1F1F0" }}>
                      {p.bedrooms>0 && <span style={{ display:"flex", alignItems:"center", gap:3 }}><I3Bed s={11}/>{p.bedrooms}</span>}
                      {p.bathrooms>0 && <span style={{ display:"flex", alignItems:"center", gap:3 }}><I3Bath s={11}/>{p.bathrooms}</span>}
                      <span style={{ display:"flex", alignItems:"center", gap:3, marginLeft:"auto" }}><I3Ruler s={11}/>{p.area} m²</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Map ── */}
      <div style={{ flex: 1, position: "relative" }}>
        <div ref={mapRef} style={{ position:"absolute", inset:0 }} />

        {/* "Buscar en esta área" — re-busca por el área visible al desplazar el mapa (PRD §7.1) */}
        <button title="Re-busca por el área visible del mapa"
          style={{ position:"absolute", top:74, left:"50%", transform:"translateX(-50%)", zIndex:6, background:"#0F1B2D", color:"#fff", border:"none", padding:"10px 18px", borderRadius:24, fontFamily:"var(--sans)", fontSize:13, fontWeight:600, cursor:"pointer", boxShadow:"0 4px 14px rgba(0,0,0,0.25)", display:"inline-flex", alignItems:"center", gap:7 }}>
          <I3Search s={14}/> Buscar en esta área
        </button>

        {/* Filter pills overlay (top) */}
        <div style={{ position:"absolute", top:20, left:20, right:20, display:"flex", gap:8, zIndex:5, flexWrap:"wrap" }}>
          {/* Price pill (dropdown emulation) */}
          <select value={priceF} onChange={e => setPriceF(e.target.value)} style={{ ...filterPill(priceF!=="all"), appearance:"none", paddingRight:30, backgroundImage:"url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath stroke='%230F1B2D' stroke-width='1.5' fill='none' d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")", backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center", backgroundSize:"12px" }}>
            <option value="all">Cualquier precio</option>
            <option value="3000000">Hasta $3 MDP</option>
            <option value="6000000">Hasta $6 MDP</option>
            <option value="12000000">Hasta $12 MDP</option>
            <option value="30000">Hasta $30k/mes</option>
          </select>
          {/* Type */}
          <select value={typeF} onChange={e => setTypeF(e.target.value)} style={{ ...filterPill(typeF!=="all"), appearance:"none", paddingRight:30, backgroundImage:"url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath stroke='%230F1B2D' stroke-width='1.5' fill='none' d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")", backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center", backgroundSize:"12px" }}>
            <option value="all">Tipo</option>
            <option value="departamento">Departamentos</option>
            <option value="oficina">Oficinas</option>
            <option value="comercial">Comerciales</option>
          </select>
          {/* Beds */}
          <select value={bedsF} onChange={e => setBedsF(e.target.value)} style={{ ...filterPill(bedsF!=="all"), appearance:"none", paddingRight:30, backgroundImage:"url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath stroke='%230F1B2D' stroke-width='1.5' fill='none' d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")", backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center", backgroundSize:"12px" }}>
            <option value="all">Recámaras</option>
            <option value="1">1+ rec.</option>
            <option value="2">2+ rec.</option>
            <option value="3">3+ rec.</option>
          </select>
          {/* All filters */}
          <button onClick={() => onNavigate("listings")} style={{ ...filterPill(false), marginLeft:"auto", background:"#0F1B2D", color:"#fff" }}>
            Todos los filtros ⇆
          </button>
        </div>

        {/* Zoom controls */}
        <div style={{ position:"absolute", bottom:20, right:20, display:"flex", flexDirection:"column", gap:6, zIndex:5 }}>
          <button onClick={() => mapInst.current?.zoomIn()} style={mapBtnStyle}>＋</button>
          <button onClick={() => mapInst.current?.zoomOut()} style={mapBtnStyle}>−</button>
          <button onClick={() => mapInst.current?.setView([19.42,-99.18],11)} style={mapBtnStyle} title="Centrar">⟲</button>
        </div>

        {/* Action buttons for active property (overlay on top of popup) */}
        {active && (
          <div style={{ position:"absolute", bottom:20, left:20, background:"#fff", padding:"10px 12px", borderRadius:14, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", display:"flex", gap:8, zIndex:6 }}>
            <button onClick={() => onNavigate("detail", active.id)} style={{ background:"#0F1B2D", color:"#fff", border:"none", padding:"8px 16px", borderRadius:20, fontFamily:"var(--sans)", fontSize:12, fontWeight:600, cursor:"pointer" }}>Ver detalle</button>
            <button onClick={() => setModal(active)} style={{ background:"var(--tar)", color:"#fff", border:"none", padding:"8px 16px", borderRadius:20, fontFamily:"var(--sans)", fontSize:12, fontWeight:600, cursor:"pointer" }}>Contactar</button>
          </div>
        )}
      </div>
      {modal && <Modal3 property={modal} onClose={() => setModal(null)} />}
    </div>
  );
};

const mapBtnStyle = {
  width:36, height:36, background:"#fff", border:"1px solid #F1F1F0", borderRadius:8,
  cursor:"pointer", fontFamily:"var(--sans)", fontSize:18, color:"#0F1B2D",
  display:"flex", alignItems:"center", justifyContent:"center",
  boxShadow:"0 2px 8px rgba(0,0,0,0.08)",
};

// ── DETAIL ────────────────────────────────────────────────────────────────────
const Detail3 = ({ propertyId, onNavigate }) => {
  const p = PROPERTIES.find(x => x.id === propertyId) || PROPERTIES[0];
  const similar = PROPERTIES.filter(x => x.type===p.type && x.id!==p.id).slice(0,3);
  const [saved, setSaved] = React.useState(false);
  const [img, setImg] = React.useState(0);
  const gallery = (p.images && p.images.length) ? p.images : [];
  const mainImg = gallery[img] || gallery[0] || null;
  const thumbs = gallery.slice(1, 4);
  const extraCount = Math.max(0, gallery.length - 4);

  return (
    <div style={{ paddingTop:84, background:"#FAFAF8", minHeight:"100vh" }}>
      {/* Breadcrumbs (navegación + SEO/JSON-LD BreadcrumbList) */}
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"12px 32px", display:"flex", alignItems:"center", gap:7, flexWrap:"wrap", fontFamily:"var(--sans)", fontSize:13 }}>
        {[
          ["Inicio", () => onNavigate("home")],
          [p.operation === "venta" ? "Venta" : "Renta", () => onNavigate("listings", { operation:p.operation })],
          [p.colony || p.location, () => onNavigate("listings", { search:p.colony || "" })],
        ].map(([label, go], i) => (
          <React.Fragment key={i}>
            <button onClick={go} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"var(--sans)", fontSize:13, color:"#6B7280", padding:0 }}
              onMouseEnter={e => e.currentTarget.style.color="var(--tar)"} onMouseLeave={e => e.currentTarget.style.color="#6B7280"}>{label}</button>
            <span style={{ color:"#D1D5DB" }}>/</span>
          </React.Fragment>
        ))}
        <span style={{ color:"#0F1B2D", fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:360 }}>{p.title}</span>
      </div>

      {/* Gallery — main + 3 thumb grid */}
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"0 32px 24px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:8, borderRadius:18, overflow:"hidden", height:480 }}>
          <div style={{ position:"relative", overflow:"hidden", background:p.color }}>
            {mainImg ? (
              <img src={mainImg} alt={p.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
            ) : (
              <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 20px,rgba(255,255,255,0.02) 20px,rgba(255,255,255,0.02) 40px)" }} />
            )}
            <div style={{ position:"absolute", top:18, left:18, background:"#fff", color:"#0F1B2D", padding:"6px 14px", borderRadius:20, fontFamily:"var(--sans)", fontSize:12, fontWeight:600 }}>
              {p.operation === "venta" ? "En venta" : "En renta"}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateRows:"1fr 1fr 1fr", gap:8 }}>
            {thumbs.map((src,i) => (
              <div key={i} onClick={() => setImg(i+1)} style={{ position:"relative", cursor:"pointer", overflow:"hidden", background:p.color, border: img===i+1 ? "2px solid var(--tar)" : "none" }}>
                <img src={src} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                {i === 2 && extraCount > 0 && (
                  <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontFamily:"var(--sans)", fontSize:14, fontWeight:600 }}>+{extraCount} fotos</div>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Thumbnail strip */}
        {gallery.length > 1 && (
          <div style={{ display:"flex", gap:8, marginTop:8, overflowX:"auto", paddingBottom:4 }}>
            {gallery.map((src,i) => (
              <div key={i} onClick={() => setImg(i)} style={{ width:88, height:60, flexShrink:0, borderRadius:8, overflow:"hidden", cursor:"pointer", border: img===i ? "2px solid var(--tar)" : "2px solid transparent", position:"relative" }}>
                <img src={src} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content + Sidebar */}
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"16px 32px 48px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 400px", gap:36 }}>
          {/* Left */}
          <div>
            {/* Title block */}
            <div style={{ background:"#fff", borderRadius:18, padding:"28px 32px", border:"1px solid #F1F1F0", marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, marginBottom:14 }}>
                <div>
                  <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
                    {p.premium && <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"linear-gradient(135deg, #E4C66A, #BE8C3C)", color:"#3A2A08", padding:"4px 12px", borderRadius:20, fontFamily:"var(--sans)", fontSize:11, fontWeight:700, letterSpacing:0.5 }}>★ Destacado</span>}
                    <span style={{ background:"#FFF0F2", color:"var(--tar)", padding:"4px 12px", borderRadius:20, fontFamily:"var(--sans)", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>{TYPE_LABELS[p.type]}</span>
                    {p.isNew && <span style={{ background:"#DCFCE7", color:"#16A34A", padding:"4px 12px", borderRadius:20, fontFamily:"var(--sans)", fontSize:11, fontWeight:600 }}>Nuevo</span>}
                  </div>
                  <h1 style={{ fontFamily:"var(--display)", fontSize:"clamp(26px,3vw,38px)", fontWeight:600, color:"#0F1B2D", letterSpacing:-0.5, lineHeight:1.15, marginBottom:8 }}>{p.title}</h1>
                  <div style={{ display:"flex", alignItems:"center", gap:5, fontFamily:"var(--sans)", fontSize:14, color:"#6B7280" }}><I3Pin s={13}/>{p.location}</div>
                </div>
                {/* Botón "Guardar" oculto por ahora (requiere cuentas de usuario público). */}
              </div>

              {/* Price + stats row */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:18, borderTop:"1px solid #F1F1F0", gap:16, flexWrap:"wrap" }}>
                <div style={{ fontFamily:"var(--display)", fontSize:36, fontWeight:700, color:"#0F1B2D", letterSpacing:-1 }}>{formatPrice(p.price,p.currency,p.operation)}</div>
                <div style={{ display:"flex", gap:20, fontFamily:"var(--sans)", fontSize:14, color:"#374151" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}><I3Ruler s={16}/><strong>{p.area}</strong> m²</div>
                  {p.bedrooms>0 && <div style={{ display:"flex", alignItems:"center", gap:6 }}><I3Bed s={16}/><strong>{p.bedrooms}</strong> rec.</div>}
                  {p.bathrooms>0 && <div style={{ display:"flex", alignItems:"center", gap:6 }}><I3Bath s={16}/><strong>{p.bathrooms}</strong> baños</div>}
                  {p.parking>0 && <div style={{ display:"flex", alignItems:"center", gap:6 }}><I3Car s={16}/><strong>{p.parking}</strong> caj.</div>}
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{ background:"#fff", borderRadius:18, padding:"28px 32px", border:"1px solid #F1F1F0", marginBottom:20 }}>
              <h3 style={{ fontFamily:"var(--display)", fontSize:22, fontWeight:700, color:"#0F1B2D", marginBottom:16 }}>Descripción</h3>
              <p style={{ fontFamily:"var(--sans)", fontSize:15, color:"#374151", lineHeight:1.8 }}>{p.description}</p>
            </div>

            {/* Features */}
            <div style={{ background:"#fff", borderRadius:18, padding:"28px 32px", border:"1px solid #F1F1F0", marginBottom:20 }}>
              <h3 style={{ fontFamily:"var(--display)", fontSize:22, fontWeight:700, color:"#0F1B2D", marginBottom:18 }}>Características</h3>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display:"flex", alignItems:"center", gap:10, fontFamily:"var(--sans)", fontSize:14, color:"#374151", padding:"8px 0" }}>
                    <div style={{ width:24, height:24, borderRadius:"50%", background:"#FFF0F2", color:"var(--tar)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><I3Check s={13}/></div>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick facts */}
            <div style={{ background:"#fff", borderRadius:18, padding:"28px 32px", border:"1px solid #F1F1F0" }}>
              <h3 style={{ fontFamily:"var(--display)", fontSize:22, fontWeight:700, color:"#0F1B2D", marginBottom:18 }}>Datos</h3>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:0 }}>
                {[["Tipo",TYPE_LABELS[p.type]],["Operación",p.operation.charAt(0).toUpperCase()+p.operation.slice(1)],["Superficie",`${p.area} m²`],
                  ...(p.area>0 ? [["Precio por m²",`$${Math.round(p.price/p.area).toLocaleString("es-MX")} ${p.currency}/m²${p.operation==="renta"?"/mes":""}`]] : []),
                  ["Antigüedad",p.age>0?`${p.age} años`:"Nueva"],["Ubicación",p.location],["Estatus","Disponible"]].map(([k,v]) => (
                  <div key={k} style={{ padding:"12px 0", borderBottom:"1px solid #F1F1F0", display:"flex", justifyContent:"space-between", fontFamily:"var(--sans)", fontSize:14 }}>
                    <span style={{ color:"#6B7280" }}>{k}</span>
                    <span style={{ color:"#0F1B2D", fontWeight:500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Sticky contact form */}
          <div>
            <div style={{ position:"sticky", top:100 }}>
              <ContactForm3 property={p} />

              {/* Trust badge */}
              <div style={{ marginTop:16, padding:"16px 20px", background:"#fff", borderRadius:14, border:"1px solid #F1F1F0", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:38, height:38, borderRadius:"50%", background:"#FFF0F2", color:"var(--tar)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><I3Verif s={18}/></div>
                <div>
                  <div style={{ fontFamily:"var(--sans)", fontSize:13, fontWeight:600, color:"#0F1B2D" }}>Anunciado por TAR Internacional</div>
                  <div style={{ fontFamily:"var(--sans)", fontSize:11, color:"#6B7280", marginTop:2 }}>Inmobiliaria verificada · 15+ años</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar */}
        {similar.length > 0 && (
          <div style={{ marginTop:60 }}>
            <h2 style={{ fontFamily:"var(--display)", fontSize:32, fontWeight:600, color:"#0F1B2D", letterSpacing:-0.5, marginBottom:24 }}>Propiedades similares</h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {similar.map(pp => <PropCard3 key={pp.id} property={pp} onClick={x => onNavigate("detail",x.id)} />)}
            </div>
          </div>
        )}
      </div>

      <Footer3 onNavigate={onNavigate} />
    </div>
  );
};


Object.assign(window, { Home3, Listings3, Map3, Detail3 });
