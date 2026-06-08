// TAR Internacional v3 — UI (EverGreen-inspired modern cards + Inmuebles24 contact form)

const { TYPE_LABELS, formatPrice, ZONES } = window;

// ── Minimal icons ────────────────────────────────────────────────────────────
const S = ({ d, s = 16, f = "none", sw = 1.8 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={f} stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display:"block", flexShrink:0 }}>
    {(Array.isArray(d) ? d : [d]).map((pd, i) => <path key={i} d={pd} />)}
  </svg>
);
const I3Search = ({s=16}) => <S s={s} d={["M11 19a8 8 0 100-16 8 8 0 000 16z","M21 21l-4.35-4.35"]} />;
const I3Pin    = ({s=16}) => <S s={s} f="currentColor" sw={0} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />;
const I3Bed    = ({s=16}) => <S s={s} d={["M2 7a2 2 0 012-2h16a2 2 0 012 2v10H2V7z","M2 13h20","M7 13V9","M17 13V9"]} />;
const I3Bath   = ({s=16}) => <S s={s} d="M4 12h16M4 12V7a1 1 0 011-1h3m-4 6v5a2 2 0 002 2h12a2 2 0 002-2v-5M15 6a2 2 0 012 2v4" />;
const I3Car    = ({s=16}) => <S s={s} d={["M5 17H3v-7l2-5h14l2 5v7h-2","M5 17v2h2v-2","M17 17v2h2v-2","M5 12h14"]} />;
const I3Ruler  = ({s=16}) => <S s={s} d="M21 3L3 21M9.5 14.5l5-5M7 7l2 2M15 11l2 2" />;
const I3Close  = ({s=16}) => <S s={s} d="M18 6L6 18M6 6l12 12" />;
const I3ChevL  = ({s=16}) => <S s={s} d="M15 18l-6-6 6-6" />;
const I3ChevR  = ({s=16}) => <S s={s} d="M9 18l6-6-6-6" />;
const I3ChevD  = ({s=16}) => <S s={s} d="M6 9l6 6 6-6" />;
const I3Heart  = ({s=16, on=false}) => <S s={s} f={on?"currentColor":"none"} d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />;
const I3Map    = ({s=16}) => <S s={s} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />;
const I3Mail   = ({s=16}) => <S s={s} d={["M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z","M22 6l-10 7L2 6"]} />;
const I3Wapp   = ({s=16}) => <S s={s} f="currentColor" sw={0} d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />;
const I3User   = ({s=16}) => <S s={s} d={["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2","M12 11a4 4 0 100-8 4 4 0 000 8z"]} />;
const I3Plus   = ({s=16}) => <S s={s} d="M12 5v14M5 12h14" />;
const I3Check  = ({s=16}) => <S s={s} d="M20 6L9 17l-5-5" />;
const I3Grid   = ({s=16}) => <S s={s} d={["M3 3h7v7H3z","M14 3h7v7h-7z","M3 14h7v7H3z","M14 14h7v7h-7z"]} />;
const I3List   = ({s=16}) => <S s={s} d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />;
const I3Edit   = ({s=16}) => <S s={s} d={["M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7","M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"]} />;
const I3Share  = ({s=16}) => <S s={s} d={["M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8","M16 6l-4-4-4 4","M12 2v13"]} />;
const I3Verif  = ({s=16}) => <S s={s} d={["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z","M9 12l2 2 4-4"]} />;

// ── Property image with For Sale/Renta badge ─────────────────────────────────
const PropImg3 = ({ property, height = 220, rounded = true }) => (
  <div style={{
    height, position:"relative", overflow:"hidden", background:property.color,
    borderRadius: rounded ? "14px 14px 0 0" : 0, flexShrink:0,
  }}>
    {property.image ? (
      <img src={property.image} alt={property.title} loading="lazy"
        style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}
        onError={e => { e.target.style.display="none"; }} />
    ) : (
      <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 18px,rgba(255,255,255,0.025) 18px,rgba(255,255,255,0.025) 36px)" }} />
    )}
    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.4) 100%)" }} />
    {/* Top-left badges (stacked): Destacado (gold) + operation */}
    <div style={{ position:"absolute", top:14, left:14, display:"flex", flexDirection:"column", gap:6, alignItems:"flex-start" }}>
      {property.premium && (
        <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"linear-gradient(135deg, #E4C66A 0%, #BE8C3C 100%)", color:"#3A2A08", padding:"5px 11px", borderRadius:20, fontFamily:"var(--sans)", fontSize:11, fontWeight:700, letterSpacing:0.5, boxShadow:"0 2px 10px rgba(190,140,60,0.5)" }}>
          <span style={{ fontSize:11 }}>★</span> DESTACADO
        </div>
      )}
      <div style={{ background:"#fff", color:"#0F1B2D", padding:"5px 12px", borderRadius:20, fontFamily:"var(--sans)", fontSize:11, fontWeight:600, boxShadow:"0 2px 8px rgba(0,0,0,0.12)" }}>
        {property.operation === "venta" ? "En venta" : "En renta"}
      </div>
    </div>
    {property.isNew && (
      <div style={{ position:"absolute", top:14, right:14, background:"var(--tar)", color:"#fff", padding:"5px 12px", borderRadius:20, fontFamily:"var(--sans)", fontSize:11, fontWeight:700 }}>Nuevo</div>
    )}
    <div style={{ position:"absolute", bottom:10, left:14, color:"rgba(255,255,255,0.85)", fontFamily:"var(--sans)", fontSize:11, fontWeight:500, textShadow:"0 1px 3px rgba(0,0,0,0.5)" }}>{TYPE_LABELS[property.type]}</div>
  </div>
);

// ── Property Card (rounded, photo-dominant, EverGreen style) ─────────────────
const PropCard3 = ({ property, onClick, saved, onSave }) => {
  const [hov, setHov] = React.useState(false);
  const premium = !!property.premium;
  return (
    <div onClick={() => onClick(property)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:"#fff", borderRadius:14, overflow:"hidden", cursor:"pointer",
        border: premium ? "1.5px solid #D9B65E" : "1px solid transparent",
        boxShadow: premium
          ? (hov ? "0 16px 40px rgba(190,140,60,0.28)" : "0 4px 18px rgba(190,140,60,0.20)")
          : (hov ? "0 12px 32px rgba(0,0,0,0.10)" : "0 1px 3px rgba(0,0,0,0.04)"),
        transform: hov ? "translateY(-3px)" : "none",
        transition:"transform 0.25s, box-shadow 0.25s",
        display:"flex", flexDirection:"column", position:"relative" }}>
      {premium && <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background:"linear-gradient(90deg, #E4C66A, #BE8C3C)", zIndex:3 }} />}
      <div style={{ position:"relative" }}>
        <PropImg3 property={property} height={220} />
        {/* "Guardar" preparado para futuro (requiere cuenta de usuario). */}
        <button onClick={e => { e.stopPropagation(); onSave && onSave(property.id); }}
          title="Guardar — disponible próximamente (requiere cuenta)"
          style={{ position:"absolute", bottom:14, right:14, background:"rgba(255,255,255,0.95)", border:"none", cursor:"pointer", width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color: saved ? "var(--tar)" : "#374151", boxShadow:"0 2px 8px rgba(0,0,0,0.1)" }}>
          <I3Heart s={16} on={saved} />
        </button>
      </div>
      <div style={{ padding:"18px 20px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:5, fontFamily:"var(--sans)", fontSize:12, color:"#6B7280", marginBottom:10 }}>
          <I3Pin s={11}/>{property.location}
        </div>
        <div style={{ fontFamily:"var(--display)", fontSize:18, fontWeight:600, color:"#0F1B2D", marginBottom:6, lineHeight:1.3 }}>{property.title}</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:14, paddingTop:14, borderTop:"1px solid #F1F1F0" }}>
          <div style={{ display:"flex", gap:13, fontFamily:"var(--sans)", fontSize:12, color:"#374151", alignItems:"center" }}>
            {property.bedrooms > 0 && <span style={{ display:"flex", alignItems:"center", gap:4 }}><I3Bed s={13}/>{property.bedrooms}</span>}
            {property.bathrooms > 0 && <span style={{ display:"flex", alignItems:"center", gap:4 }}><I3Bath s={13}/>{property.bathrooms}</span>}
            <span style={{ display:"flex", alignItems:"center", gap:4 }}><I3Ruler s={13}/>{property.area}m²</span>
          </div>
        </div>
        <div style={{ marginTop:12, fontFamily:"var(--display)", fontSize:24, fontWeight:700, color:"#0F1B2D", letterSpacing:-0.5 }}>
          {formatPrice(property.price, property.currency, property.operation)}
        </div>
      </div>
    </div>
  );
};

// ── Header — light/sticky/white ───────────────────────────────────────────────
const Header3 = ({ page, onNavigate }) => {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const el = document.getElementById("v3-scroll");
    if (!el) return;
    const fn = () => setScrolled(el.scrollTop > 40);
    el.addEventListener("scroll", fn);
    return () => el.removeEventListener("scroll", fn);
  }, []);
  const isHome = page === "home";
  const floating = isHome && !scrolled;

  const nav = (k, l) => (
    <button key={k} onClick={() => onNavigate(k)}
      style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"var(--sans)", fontSize:14, fontWeight:500,
        color: page===k ? "var(--tar)" : floating ? "#0F1B2D" : "#374151",
        padding:"8px 14px", borderRadius:24, transition:"all 0.15s",
        background: page===k ? (floating?"rgba(255,255,255,0.85)":"#FFF0F2") : "transparent" }}>
      {l}
    </button>
  );

  return (
    <header style={{ position:"fixed", top:0, left:0, right:0, zIndex:100,
      background: floating ? "transparent" : "rgba(255,255,255,0.96)",
      borderBottom: floating ? "none" : "1px solid #F1F1F0",
      backdropFilter: floating ? "none" : "blur(8px)",
      transition:"background 0.3s, border-color 0.3s" }}>
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"16px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:24 }}>
        {/* Logo */}
        <div onClick={() => onNavigate("home")} style={{ cursor:"pointer", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <img src="assets/tar-logo.svg" alt="TAR Internacional" style={{ height:46, width:"auto", display:"block", borderRadius:4, boxShadow: floating ? "0 2px 10px rgba(0,0,0,0.18)" : "none" }} />
        </div>
        {/* Nav — pill container */}
        <nav style={{ display:"flex", alignItems:"center", gap:4, background: floating?"rgba(255,255,255,0.7)":"#F7F7F6", padding:"5px", borderRadius:30, border: floating?"1px solid rgba(255,255,255,0.4)":"1px solid #F1F1F0", backdropFilter:"blur(6px)" }}>
          {nav("home","Inicio")}
          {nav("listings","Propiedades")}
          {nav("map","Mapa")}
          {nav("nosotros","Nosotros")}
          {/* Admin NO se expone en la navegación pública. Acceso restringido:
              en producción será un subdominio aparte (p.ej. panel.tarinternacional.com)
              detrás de login. En el prototipo se entra con doble clic en el © del footer. */}
        </nav>
        {/* CTA */}
        <button onClick={() => onNavigate("contact")}
          style={{ background:"var(--tar)", color:"#fff", border:"none", cursor:"pointer",
            fontFamily:"var(--sans)", fontSize:14, fontWeight:600, padding:"10px 22px", borderRadius:24, letterSpacing:0.3, whiteSpace:"nowrap", flexShrink:0 }}>
          Contacto
        </button>
      </div>
    </header>
  );
};

// ── Filter Sidebar v3 ─────────────────────────────────────────────────────────
const Filter3 = ({ filters, onChange }) => {
  const set = (k, v) => onChange({ ...filters, [k]: v });
  const inp = { width:"100%", padding:"11px 14px", border:"1px solid #E5E5E4", borderRadius:10, fontFamily:"var(--sans)", fontSize:13, color:"#0F1B2D", background:"#fff", outline:"none", boxSizing:"border-box" };
  const lbl = { fontSize:11, fontFamily:"var(--sans)", fontWeight:600, color:"#6B7280", display:"block", marginBottom:8 };
  const chip = (on) => ({ padding:"7px 14px", border:`1px solid ${on?"var(--tar)":"#E5E5E4"}`, background:on?"var(--tar)":"#fff", color:on?"#fff":"#374151", fontFamily:"var(--sans)", fontSize:12, fontWeight:500, cursor:"pointer", borderRadius:20, transition:"all 0.15s" });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
      <div>
        <span style={lbl}>Operación</span>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {[["all","Todo"],["venta","Venta"],["renta","Renta"]].map(([v,l]) => (
            <button key={v} style={chip(filters.operation===v)} onClick={() => set("operation",v)}>{l}</button>
          ))}
        </div>
      </div>
      <div>
        <span style={lbl}>Tipo</span>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {[["all","Todos"],["departamento","Depto."],["oficina","Oficina"],["comercial","Local"],["bodega","Bodega"],["casa","Casa"],["edificio","Edificio"],["terreno","Terreno"]].map(([v,l]) => (
            <button key={v} style={chip(filters.type===v)} onClick={() => set("type",v)}>{l}</button>
          ))}
        </div>
      </div>
      <div>
        <span style={lbl}>Precio máximo</span>
        <select value={filters.maxPrice} onChange={e => set("maxPrice",e.target.value)} style={inp}>
          <option value="all">Sin límite</option>
          <option value="5000000">$5 MDP</option>
          <option value="10000000">$10 MDP</option>
          <option value="20000000">$20 MDP</option>
          <option value="50000000">$50 MDP</option>
          <option value="50000">$50,000/mes</option>
          <option value="150000">$150,000/mes</option>
        </select>
      </div>
      <div>
        <span style={lbl}>Zona</span>
        <select value={filters.zone} onChange={e => set("zone",e.target.value)} style={inp}>
          <option value="all">Todas las zonas</option>
          {ZONES.map(z => <option key={z}>{z}</option>)}
        </select>
      </div>
      <div>
        <span style={lbl}>Recámaras mín.</span>
        <div style={{ display:"flex", gap:5 }}>
          {[["0","Any"],["1","1+"],["2","2+"],["3","3+"]].map(([v,l]) => (
            <button key={v} style={chip(filters.minBeds===v)} onClick={() => set("minBeds",v)}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ position:"relative" }}>
        <span style={lbl}>Buscar</span>
        <input placeholder="Colonia, zona…" value={filters.search} onChange={e => set("search",e.target.value)} style={{...inp, paddingLeft:36}} />
        <span style={{ position:"absolute", left:12, bottom:13, color:"#9CA3AF" }}><I3Search s={14}/></span>
      </div>
      <button onClick={() => onChange({operation:"all",type:"all",maxPrice:"all",zone:"all",minBeds:"0",search:""})}
        style={{ padding:"10px 0", border:"1px solid #E5E5E4", borderRadius:10, background:"none", fontFamily:"var(--sans)", fontSize:12, color:"#6B7280", cursor:"pointer", fontWeight:500 }}>
        Limpiar filtros
      </button>
    </div>
  );
};

// ── Footer v3 ─────────────────────────────────────────────────────────────────
const Footer3 = ({ onNavigate }) => {
  const go = (target) => { if (onNavigate) onNavigate(target); };
  const links = {
    "Propiedades": () => go("listings"), "Departamentos": () => go("listings"), "Oficinas": () => go("listings"), "Locales": () => go("listings"), "Mapa": () => go("map"),
    "Nosotros": () => go("nosotros"), "Contacto": () => go("contact"), "Aviso de Privacidad": () => go("privacidad"),
  };
  return (
  <footer style={{ background:"#0F1B2D", color:"rgba(255,255,255,0.5)", padding:"60px 40px 30px" }}>
    <div style={{ maxWidth:1400, margin:"0 auto" }}>
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:48, marginBottom:48 }}>
        <div>
          <div style={{ marginBottom:18 }}>
            <img src="assets/tar-logo.svg" alt="TAR Internacional" style={{ height:54, width:"auto", display:"block", borderRadius:4 }} />
          </div>
          <p style={{ fontFamily:"var(--sans)", fontSize:14, lineHeight:1.8, maxWidth:280 }}>Grupo inmobiliario con más de 60 años de experiencia conectando personas con propiedades extraordinarias en México y Estados Unidos.</p>
        </div>
        {[
          { t:"Propiedades", ls:["Departamentos","Oficinas","Locales","Mapa"] },
          { t:"Empresa",     ls:["Nosotros","Aviso de Privacidad","Contacto"] },
          { t:"Contacto",    ls:["+52 55 1234 5678","info@tarint.mx","Reforma 123, CDMX"] },
        ].map(({ t, ls }) => (
          <div key={t}>
            <div style={{ fontFamily:"var(--sans)", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:2, color:"rgba(255,255,255,0.65)", marginBottom:16 }}>{t}</div>
            {ls.map(l => <div key={l} onClick={links[l]} style={{ fontFamily:"var(--sans)", fontSize:13, marginBottom:10, cursor: links[l] ? "pointer" : "default", transition:"color 0.15s" }}
              onMouseEnter={e => { if(links[l]) e.currentTarget.style.color="#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.color="rgba(255,255,255,0.5)"; }}>{l}</div>)}
          </div>
        ))}
      </div>
      <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:20, display:"flex", justifyContent:"space-between", fontFamily:"var(--sans)", fontSize:12 }}>
        <span onDoubleClick={() => go("admin")} title="" style={{ userSelect:"none" }}>© 2026 TAR Internacional · Grupo Inmobiliario</span>
        <span style={{ cursor:"pointer" }} onClick={() => go("privacidad")}>Aviso de Privacidad · Cédula AMPI</span>
      </div>
    </div>
  </footer>
  );
};

// ── CONTACT FORM (Inmuebles24 style) — solo Contactar (lead), sin info directa
const ContactForm3 = ({ property, compact = false, onClose }) => {
  const [sent, setSent] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "", email: "", phone: "",
    message: property ? `¡Hola! Quiero que se comuniquen conmigo por este inmueble en ${property.operation === "venta" ? "venta" : "renta"} que vi en TAR Internacional.` : "¡Hola! Estoy interesado en alguna de sus propiedades.",
  });
  const [country, setCountry] = React.useState("+52");
  const countries = [
    { code:"+52", flag:"🇲🇽", name:"México" },
    { code:"+1",  flag:"🇺🇸", name:"USA" },
    { code:"+57", flag:"🇨🇴", name:"Colombia" },
    { code:"+34", flag:"🇪🇸", name:"España" },
    { code:"+54", flag:"🇦🇷", name:"Argentina" },
    { code:"+56", flag:"🇨🇱", name:"Chile" },
  ];
  const sel = countries.find(c => c.code === country);
  const [open, setOpen] = React.useState(false);

  const inp = (placeholder, val, on, type="text") => (
    <div style={{ position:"relative", border:"1px solid #D1D5DB", borderRadius:10, padding:"10px 14px 6px", background:"#fff" }}>
      <label style={{ position:"absolute", top: val ? 4 : 14, left:14, fontFamily:"var(--sans)", fontSize: val ? 10 : 14, color:"#9CA3AF", pointerEvents:"none", transition:"all 0.15s", background:"#fff", padding: val ? "0 4px" : "0", marginLeft: val ? -4 : 0 }}>{placeholder}</label>
      <input type={type} value={val} onChange={e => on(e.target.value)}
        style={{ width:"100%", border:"none", outline:"none", fontFamily:"var(--sans)", fontSize:14, padding: val ? "10px 0 4px" : "8px 0 6px", color:"#0F1B2D", background:"transparent" }} />
    </div>
  );

  if (sent) {
    return (
      <div style={{ background:"#fff", borderRadius:14, padding:"32px 24px", textAlign:"center", border:"1px solid #E5E5E4" }}>
        <div style={{ width:64, height:64, background:"#DCFCE7", border:"1px solid #16A34A", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", color:"#16A34A" }}><I3Check s={28}/></div>
        <div style={{ fontFamily:"var(--display)", fontSize:22, fontWeight:700, color:"#0F1B2D", marginBottom:8 }}>¡Mensaje enviado!</div>
        <p style={{ fontFamily:"var(--sans)", fontSize:14, color:"#6B7280", lineHeight:1.7 }}>Un asesor de TAR Internacional se pondrá en contacto contigo en menos de 2 horas hábiles.</p>
        {onClose && <button onClick={onClose} style={{ marginTop:20, background:"#0F1B2D", color:"#fff", border:"none", padding:"11px 28px", fontFamily:"var(--sans)", fontSize:14, cursor:"pointer", fontWeight:600, borderRadius:24 }}>Cerrar</button>}
      </div>
    );
  }

  return (
    <div style={{ background:"#fff", borderRadius:14, padding:"24px", border:"1px solid #E5E5E4", boxShadow:"0 2px 8px rgba(0,0,0,0.03)" }}>
      <div style={{ fontFamily:"var(--display)", fontSize:22, fontWeight:700, color:"#0F1B2D", marginBottom:18, letterSpacing:-0.3 }}>Contacta al anunciante</div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <div style={{ display:"grid", gridTemplateColumns:compact?"1fr":"1fr 1fr", gap:10 }}>
          {inp("Nombre", form.name, v => setForm({...form, name:v}))}
          {inp("Email", form.email, v => setForm({...form, email:v}), "email")}
        </div>

        {/* Phone with country selector */}
        <div style={{ display:"grid", gridTemplateColumns:"110px 1fr", gap:10 }}>
          <div style={{ position:"relative" }}>
            <div onClick={() => setOpen(o => !o)}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between", border:"1px solid #D1D5DB", borderRadius:10, padding:"10px 12px", cursor:"pointer", background:"#fff", height:54 }}>
              <div>
                <div style={{ fontFamily:"var(--sans)", fontSize:10, color:"#9CA3AF" }}>País</div>
                <div style={{ fontFamily:"var(--sans)", fontSize:14, color:"#0F1B2D", fontWeight:500, display:"flex", alignItems:"center", gap:4 }}>
                  {sel.code}
                </div>
              </div>
              <I3ChevD s={14}/>
            </div>
            {open && (
              <div style={{ position:"absolute", top:60, left:0, right:0, background:"#fff", border:"1px solid #E5E5E4", borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,0.1)", zIndex:10, overflow:"hidden" }}>
                {countries.map(c => (
                  <div key={c.code} onClick={() => { setCountry(c.code); setOpen(false); }}
                    style={{ padding:"10px 14px", display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontFamily:"var(--sans)", fontSize:13, color:"#0F1B2D", background: country===c.code?"#FFF0F2":"#fff" }}>
                    <span>{c.name}</span> <span style={{ marginLeft:"auto", color:"#6B7280" }}>{c.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {inp("Teléfono", form.phone, v => setForm({...form, phone:v}), "tel")}
        </div>

        {/* Message textarea */}
        <div style={{ position:"relative", border:"1px solid #D1D5DB", borderRadius:10, padding:"10px 14px", background:"#fff" }}>
          <label style={{ position:"absolute", top:6, left:14, fontFamily:"var(--sans)", fontSize:10, color:"#9CA3AF", background:"#fff", padding:"0 4px", marginLeft:-4 }}>Mensaje</label>
          <textarea value={form.message} onChange={e => setForm({...form, message:e.target.value})} rows={3}
            style={{ width:"100%", border:"none", outline:"none", fontFamily:"var(--sans)", fontSize:14, padding:"16px 0 4px", color:"#0F1B2D", background:"transparent", resize:"vertical" }} />
        </div>

        {/* Buttons */}
        <button onClick={e => { e.preventDefault(); setSent(true); }}
          style={{ background:"var(--tar)", color:"#fff", border:"none", padding:"14px 0", fontFamily:"var(--sans)", fontSize:15, fontWeight:600, cursor:"pointer", borderRadius:10, marginTop:6, display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background="var(--tar-dark)"}
          onMouseLeave={e => e.currentTarget.style.background="var(--tar)"}>
          Enviar solicitud <I3Mail s={16}/>
        </button>

        <p style={{ fontFamily:"var(--sans)", fontSize:11, color:"#6B7280", marginTop:6, lineHeight:1.6 }}>
          Al enviar estás aceptando los <a href="#" style={{ color:"#0F1B2D", textDecoration:"underline" }}>Términos y condiciones de Uso</a> y la <a href="#" style={{ color:"#0F1B2D", textDecoration:"underline" }}>Política de Privacidad</a>.
        </p>
      </div>
    </div>
  );
};

// ── Contact Modal — wraps ContactForm3 ───────────────────────────────────────
const Modal3 = ({ property, onClose }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(15,27,45,0.65)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:24, backdropFilter:"blur(4px)" }} onClick={onClose}>
    <div style={{ maxWidth:480, width:"100%" }} onClick={e => e.stopPropagation()}>
      <div style={{ position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute", top:-44, right:0, background:"#fff", border:"none", cursor:"pointer", color:"#0F1B2D", width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.15)" }}><I3Close s={18}/></button>
        <ContactForm3 property={property} onClose={onClose} />
      </div>
    </div>
  </div>
);

Object.assign(window, {
  S, I3Search, I3Pin, I3Bed, I3Bath, I3Car, I3Ruler, I3Close, I3ChevL, I3ChevR, I3ChevD,
  I3Heart, I3Map, I3Mail, I3Wapp, I3User, I3Plus, I3Check, I3Grid, I3List, I3Edit, I3Share, I3Verif,
  PropImg3, PropCard3, Header3, Filter3, Footer3, ContactForm3, Modal3,
});
