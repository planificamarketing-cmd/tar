// TAR Internacional v3 — Admin Dashboard (PropEasy-inspired + ZORG IT)

const {
  PROPERTIES, TYPE_LABELS, LEADS, ADMIN_STATS, BROKERS, formatPrice,
  PropImg3,
  I3Search, I3Pin, I3Bed, I3Bath, I3Car, I3Ruler, I3Close, I3ChevL, I3ChevR, I3ChevD,
  I3Heart, I3Map, I3Mail, I3Wapp, I3User, I3Plus, I3Check, I3Grid, I3List, I3Edit, I3Verif, I3Share,
} = window;

// ── Pipeline de leads (CRM) — estatus del negocio inmobiliario ─────────────────
// Configurable; cada cambio se sincroniza por webhook con el CRM (en ambos sentidos).
const LEAD_PIPELINE = [
  { key:"nuevo",           label:"Nuevo",             color:"#2563EB" },
  { key:"cita_agendada",   label:"Cita agendada",     color:"#CA8A04" },
  { key:"cita_concretada", label:"Cita concretada",   color:"#7C3AED" },
  { key:"apartado",        label:"Apartado",          color:"#EA580C" },
  { key:"firma_contrato",  label:"Firma de contrato", color:"#16A34A" },
  { key:"descartado",      label:"Descartado",        color:"#9CA3AF" },
];
const leadLabel = k => (LEAD_PIPELINE.find(p => p.key === k) || {}).label || k;
const leadColor = k => (LEAD_PIPELINE.find(p => p.key === k) || {}).color || "#6B7280";

// ── Sidebar Icons (rich nav set) ──────────────────────────────────────────────
const A = ({ d, s = 18, f = "none", sw = 1.7 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={f} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
    {(Array.isArray(d) ? d : [d]).map((pd, i) => <path key={i} d={pd} />)}
  </svg>
);
const NDash    = ({s}) => <A s={s} d={["M3 3h7v9H3z","M14 3h7v5h-7z","M14 12h7v9h-7z","M3 16h7v5H3z"]} />;
const NHome    = ({s}) => <A s={s} d={["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z","M9 22V12h6v10"]} />;
const NTenant  = ({s}) => <A s={s} d={["M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2","M8.5 11a4 4 0 100-8 4 4 0 000 8z","M23 21v-2a4 4 0 00-3-3.87","M16 3.13a4 4 0 010 7.75"]} />;
const NMoney   = ({s}) => <A s={s} d={["M12 2v20","M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"]} />;
const NDoc     = ({s}) => <A s={s} d={["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z","M14 2v6h6","M16 13H8","M16 17H8","M10 9H8"]} />;
const NPlus    = ({s}) => <A s={s} d={["M9 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2h-4","M12 4v12","M8 8l4-4 4 4"]} />;
const NMsg     = ({s}) => <A s={s} d={["M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z","M8 9h8","M8 13h5"]} />;
const NBell    = ({s}) => <A s={s} d={["M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 01-3.46 0"]} />;
const NCog     = ({s}) => <A s={s} d={["M12 15a3 3 0 100-6 3 3 0 000 6z","M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"]} />;
const NLogout  = ({s}) => <A s={s} d={["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4","M16 17l5-5-5-5","M21 12H9"]} />;
const NUpload  = ({s}) => <A s={s} d={["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4","M17 8l-5-5-5 5","M12 3v12"]} />;
const NTrend   = ({s}) => <A s={s} d={["M23 6l-9.5 9.5-5-5L1 18","M17 6h6v6"]} />;
const NRent    = ({s}) => <A s={s} d={["M12 1l3 5h-6z","M3 21h18","M5 21V8l7-5 7 5v13","M9 21v-6h6v6"]} />;
const NBuilding= ({s}) => <A s={s} d={["M3 21h18","M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16","M9 9h.01","M13 9h.01","M9 13h.01","M13 13h.01","M9 17h.01","M13 17h.01"]} />;
const NScript  = ({s}) => <A s={s} d={["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z","M14 2v6h6","M9 15h2","M9 11h6","M9 7h2"]} />;

// ── Admin Layout Shell ────────────────────────────────────────────────────────
const AdminShell = ({ tab, setTab, onNavigate, children }) => {
  const navGroups = [
    { label: "General", items: [
      ["dashboard", "Dashboard", NDash],
      ["propiedades", "Propiedades", NHome],
      ["nueva", "Nueva propiedad", NPlus],
    ]},
    { label: "CRM", items: [
      ["leads", "Leads", NTenant],
      ["usuarios", "Usuarios", NUser],
      ["scripts", "Scripts", NScript],
    ]},
    { label: "Configuración", items: [
      ["ajustes", "Ajustes", NCog],
    ]},
  ];

  return (
    <div style={{ paddingTop:84, minHeight:"100vh", background:"#FAFAF8", display:"flex" }}>
      {/* Sidebar */}
      <aside style={{ width:240, background:"#fff", borderRight:"1px solid #F1F1F0", flexShrink:0, display:"flex", flexDirection:"column", padding:"24px 14px", position:"sticky", top:64, alignSelf:"flex-start", height:"calc(100vh - 64px)" }}>
        <div style={{ padding:"4px 12px 22px", borderBottom:"1px solid #F1F1F0", marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, background:"var(--tar)", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:9 }}>
            <span style={{ fontFamily:"var(--display)", fontSize:13, fontWeight:800, color:"#fff" }}>TAR</span>
          </div>
          <div>
            <div style={{ fontFamily:"var(--display)", fontSize:15, fontWeight:700, color:"#0F1B2D", lineHeight:1.1 }}>Admin Panel</div>
            <div style={{ fontFamily:"var(--sans)", fontSize:10, color:"#9CA3AF", letterSpacing:1.5, textTransform:"uppercase", marginTop:2 }}>Internal · v3</div>
          </div>
        </div>

        <nav style={{ flex:1, overflowY:"auto" }}>
          {navGroups.map(g => (
            <div key={g.label} style={{ marginBottom:18 }}>
              <div style={{ fontFamily:"var(--sans)", fontSize:10, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:1.5, padding:"0 12px 6px" }}>{g.label}</div>
              {g.items.map(([k, l, Ic]) => (
                <button key={k} onClick={() => setTab(k)}
                  style={{ display:"flex", alignItems:"center", gap:11, width:"100%", textAlign:"left", padding:"10px 12px", background:tab===k?"#FFF0F2":"transparent", border:"none", cursor:"pointer", fontFamily:"var(--sans)", fontSize:13, color:tab===k?"var(--tar)":"#374151", fontWeight:tab===k?600:500, borderRadius:10, marginBottom:3, transition:"all 0.15s", borderLeft:`3px solid ${tab===k?"var(--tar)":"transparent"}` }}>
                  <Ic s={16}/>{l}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <button onClick={() => onNavigate("home")} style={{ display:"flex", alignItems:"center", gap:10, background:"none", border:"1px solid #F1F1F0", padding:"10px 14px", cursor:"pointer", fontFamily:"var(--sans)", fontSize:12, color:"#6B7280", borderRadius:10, fontWeight:500 }}>
          <NLogout s={14}/> Salir al portal
        </button>
      </aside>

      {/* Main content */}
      <div style={{ flex:1, padding:"32px 36px", overflow:"auto" }}>
        {children}
      </div>
    </div>
  );
};

// Helper user icon import alias
const NUser = NTenant;

// ── Dashboard tab ───────────────────────────────────────────────────────────
const DashboardTab = () => {
  const recentLeads = LEADS.slice(0, 5);

  const kpis = [
    { label: "Propiedades activas", value: "47", trend: "+3 este mes",   up: true,  color: "#FFF0F2", iconColor: "var(--tar)", icon: NBuilding },
    { label: "Leads del mes",       value: "132", trend: "+18% vs. abril",up: true,  color: "#EFF6FF", iconColor: "#2563EB",    icon: NTenant },
    { label: "En seguimiento",      value: "28", trend: "8 sin respuesta",up: false, color: "#FEF3C7", iconColor: "#CA8A04",    icon: NMsg },
    { label: "Cierres del mes",     value: "6",  trend: "$48.2 MDP total",up: true,  color: "#DCFCE7", iconColor: "#16A34A",    icon: NRent },
  ];

  // ─ Simple bar chart: 12 monthly leads, vertical divs
  const monthlyLeads = [12, 18, 24, 31, 28, 42, 38, 56, 48, 67, 89, 132];
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const maxLeads = Math.max(...monthlyLeads);

  // ─ Inventory mix — simple horizontal bars
  const mix = [
    { label: "Departamentos", value: 60, color: "#0F1B2D" },
    { label: "Oficinas",      value: 25, color: "var(--tar)" },
    { label: "Comerciales",   value: 15, color: "#CA8A04" },
  ];

  // ─ Property status — simple cards with progress bar
  const statuses = [
    { label: "Disponibles",    count: 32, total: 47, color: "#16A34A" },
    { label: "En negociación", count: 8,  total: 47, color: "#2563EB" },
    { label: "Reservadas",     count: 5,  total: 47, color: "#CA8A04" },
    { label: "Cerradas (mes)", count: 2,  total: 47, color: "var(--tar)" },
  ];

  return (
    <div>
      {/* Welcome header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
        <div>
          <h1 style={{ fontFamily:"var(--display)", fontSize:34, fontWeight:600, color:"#0F1B2D", letterSpacing:-0.5, lineHeight:1.2 }}>Bienvenido, <span style={{ color:"#9CA3AF", fontStyle:"italic" }}>Martín</span></h1>
          <p style={{ fontFamily:"var(--sans)", fontSize:14, color:"#6B7280", marginTop:6 }}>Resumen general de actividad — Mayo 2026</p>
        </div>
        <button title="Descarga un CSV con el resumen del periodo" style={{ background:"#fff", color:"#374151", border:"1px solid #E5E5E4", padding:"10px 18px", borderRadius:24, fontFamily:"var(--sans)", fontSize:13, fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
          <NUpload s={14}/> Exportar CSV
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background:"#fff", borderRadius:14, padding:"20px 22px", border:"1px solid #F1F1F0" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
              <div style={{ width:36, height:36, background:k.color, color:k.iconColor, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}><k.icon s={18}/></div>
              <span style={{ fontFamily:"var(--sans)", fontSize:11, color:k.up?"#16A34A":"#DC2626", fontWeight:600 }}>{k.up?"▲":"▼"}</span>
            </div>
            <div style={{ fontFamily:"var(--sans)", fontSize:12, color:"#6B7280", fontWeight:500, marginBottom:4 }}>{k.label}</div>
            <div style={{ fontFamily:"var(--display)", fontSize:32, fontWeight:700, color:"#0F1B2D", letterSpacing:-0.8, lineHeight:1, marginBottom:4 }}>{k.value}</div>
            <div style={{ fontFamily:"var(--sans)", fontSize:11, color:k.up?"#16A34A":"#9CA3AF", fontWeight:500 }}>{k.trend}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:16, marginBottom:24 }}>
        {/* Bar chart — Monthly leads */}
        <div style={{ background:"#fff", borderRadius:14, padding:"22px 24px", border:"1px solid #F1F1F0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <div>
              <div style={{ fontFamily:"var(--display)", fontSize:17, fontWeight:700, color:"#0F1B2D" }}>Leads por mes</div>
              <div style={{ fontFamily:"var(--sans)", fontSize:12, color:"#6B7280", marginTop:2 }}>Por fecha de registro · últimos 12 meses · Total: <strong style={{ color:"#0F1B2D" }}>{monthlyLeads.reduce((a,b)=>a+b,0)}</strong></div>
            </div>
            <select style={{ border:"1px solid #E5E5E4", padding:"7px 12px", borderRadius:18, fontFamily:"var(--sans)", fontSize:12, color:"#374151", background:"#fff", outline:"none", fontWeight:500 }}>
              <option>Mensual</option>
              <option>Trimestral</option>
            </select>
          </div>

          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", height:180, gap:8, padding:"0 4px" }}>
            {monthlyLeads.map((v, i) => {
              const barH = Math.max(4, Math.round((v / maxLeads) * 150));
              const isMax = v === maxLeads;
              return (
                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:8, justifyContent:"flex-end", height:"100%" }}>
                  <div style={{ fontFamily:"var(--mono)", fontSize:10, color: isMax ? "var(--tar)" : "#9CA3AF", fontWeight: isMax ? 700 : 500, opacity: isMax ? 1 : (barH > 60 ? 1 : 0) }}>{v}</div>
                  <div style={{ width:"100%", height:`${barH}px`, background: isMax ? "var(--tar)" : "#0F1B2D", borderRadius:"4px 4px 0 0", transition:"height 0.3s" }}/>
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, padding:"0 4px" }}>
            {months.map(m => <span key={m} style={{ flex:1, textAlign:"center", fontFamily:"var(--sans)", fontSize:10, color:"#9CA3AF" }}>{m}</span>)}
          </div>
        </div>

        {/* Inventory mix — horizontal bars */}
        <div style={{ background:"#fff", borderRadius:14, padding:"22px 24px", border:"1px solid #F1F1F0" }}>
          <div style={{ fontFamily:"var(--display)", fontSize:17, fontWeight:700, color:"#0F1B2D", marginBottom:4 }}>Mix de inventario</div>
          <div style={{ fontFamily:"var(--sans)", fontSize:12, color:"#6B7280", marginBottom:20 }}>Por tipo de propiedad</div>

          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            {mix.map(m => (
              <div key={m.label}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontFamily:"var(--sans)", fontSize:13, color:"#374151", fontWeight:500 }}>{m.label}</span>
                  <span style={{ fontFamily:"var(--display)", fontSize:15, fontWeight:700, color:"#0F1B2D" }}>{m.value}%</span>
                </div>
                <div style={{ width:"100%", height:8, background:"#F1F1F0", borderRadius:4, overflow:"hidden" }}>
                  <div style={{ width:`${m.value}%`, height:"100%", background:m.color, borderRadius:4, transition:"width 0.4s" }}/>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:24, paddingTop:18, borderTop:"1px solid #F1F1F0", display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontFamily:"var(--sans)", fontSize:12, color:"#6B7280" }}>Total inventario</span>
            <span style={{ fontFamily:"var(--display)", fontSize:18, fontWeight:700, color:"#0F1B2D" }}>47 propiedades</span>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1.6fr", gap:16 }}>
        {/* Status with progress bars */}
        <div style={{ background:"#fff", borderRadius:14, padding:"22px 24px", border:"1px solid #F1F1F0" }}>
          <div style={{ fontFamily:"var(--display)", fontSize:17, fontWeight:700, color:"#0F1B2D", marginBottom:4 }}>Estado de propiedades</div>
          <div style={{ fontFamily:"var(--sans)", fontSize:12, color:"#6B7280", marginBottom:20 }}>Distribución del inventario</div>

          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {statuses.map(s => (
              <div key={s.label}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ width:10, height:10, borderRadius:3, background:s.color }}/>
                    <span style={{ fontFamily:"var(--sans)", fontSize:13, color:"#374151", fontWeight:500 }}>{s.label}</span>
                  </div>
                  <span style={{ fontFamily:"var(--display)", fontSize:18, fontWeight:700, color:"#0F1B2D" }}>{s.count}</span>
                </div>
                <div style={{ width:"100%", height:6, background:"#F1F1F0", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${(s.count/s.total)*100}%`, height:"100%", background:s.color, borderRadius:3, transition:"width 0.4s" }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent leads table */}
        <div style={{ background:"#fff", borderRadius:14, padding:"22px 24px", border:"1px solid #F1F1F0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontFamily:"var(--display)", fontSize:17, fontWeight:700, color:"#0F1B2D" }}>Leads recientes</div>
            <a href="#" style={{ fontFamily:"var(--sans)", fontSize:12, color:"var(--tar)", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>Ver todos ↗</a>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"var(--sans)", fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:"1px solid #F1F1F0" }}>
                {["Cliente","Interés","Fecha","Estado"].map(h => (
                  <th key={h} style={{ padding:"10px 8px", textAlign:"left", fontSize:11, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentLeads.map(l => {
                return (
                  <tr key={l.id} style={{ borderBottom:"1px solid #F7F7F6" }}>
                    <td style={{ padding:"10px 8px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg, #FFF0F2, #E5E5E4)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--tar)", fontFamily:"var(--display)", fontSize:13, fontWeight:700 }}>{l.name.split(" ").map(n=>n[0]).join("")}</div>
                        <div>
                          <div style={{ color:"#0F1B2D", fontWeight:600 }}>{l.name}</div>
                          <div style={{ color:"#9CA3AF", fontSize:11 }}>{l.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:"10px 8px", color:"#374151", fontSize:12 }}>{l.property}</td>
                    <td style={{ padding:"10px 8px", color:"#9CA3AF", fontSize:12 }}>{l.date}</td>
                    <td style={{ padding:"10px 8px" }}>
                      <span style={{ fontSize:11, padding:"3px 10px", background:leadColor(l.status)+"22", color:leadColor(l.status), borderRadius:14, fontWeight:600 }}>{leadLabel(l.status)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── PROPIEDADES TAB (table) ───────────────────────────────────────────────────
const PropertiesTab = ({ onNavigate, setTab }) => {
  const [search, setSearch] = React.useState("");
  const [filterOp, setFilterOp] = React.useState("all");
  const [typeF, setTypeF] = React.useState("all");
  const [statusF, setStatusF] = React.useState("all");
  const [sort, setSort] = React.useState("recent");

  const statusC = { activa:"#16A34A", pausada:"#CA8A04", reservada:"#2563EB" };
  const st = p => p.isNew ? "activa" : p.id%4===0 ? "pausada" : p.id%5===0 ? "reservada" : "activa";

  let items = PROPERTIES.filter(p => {
    if (filterOp !== "all" && p.operation !== filterOp) return false;
    if (typeF !== "all" && p.type !== typeF) return false;
    if (statusF !== "all" && st(p) !== statusF) return false;
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q);
  });
  items = [...items].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "title") return a.title.localeCompare(b.title);
    return 0;
  });

  // Exportación real a CSV de lo que está filtrado (así se exportarían los datos).
  const exportCSV = () => {
    const headers = ["Título","Tipo","Operación","Precio","Moneda","Ubicación","Estatus","Responsable"];
    const rows = items.map(p => [p.title, TYPE_LABELS[p.type], p.operation, p.price, p.currency, p.location, st(p), p.broker?.name || ""]);
    const esc = v => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(r => r.map(esc).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type:"text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "propiedades-tar.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const selStyle = { padding:"8px 12px", borderRadius:18, border:"1px solid #E5E5E4", fontFamily:"var(--sans)", fontSize:12, color:"#374151", background:"#fff", outline:"none", fontWeight:500, cursor:"pointer" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:"var(--display)", fontSize:30, fontWeight:600, color:"#0F1B2D", letterSpacing:-0.5 }}>Propiedades</h1>
          <p style={{ fontFamily:"var(--sans)", fontSize:14, color:"#6B7280", marginTop:4 }}>{items.length} propiedades en el inventario</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={exportCSV} title="Descarga un CSV con las propiedades filtradas" style={{ background:"#fff", color:"#374151", border:"1px solid #E5E5E4", padding:"10px 18px", borderRadius:24, fontFamily:"var(--sans)", fontSize:13, fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            <NUpload s={14}/> Exportar CSV
          </button>
          <button onClick={() => setTab("nueva")}
            style={{ display:"flex", alignItems:"center", gap:6, background:"var(--tar)", color:"#fff", border:"none", padding:"10px 20px", borderRadius:24, fontFamily:"var(--sans)", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            <I3Plus s={14}/> Nueva propiedad
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div style={{ background:"#fff", borderRadius:14, padding:"14px 18px", border:"1px solid #F1F1F0", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:1, minWidth:240, maxWidth:340 }}>
          <input placeholder="Buscar por título o ubicación…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:"100%", padding:"9px 14px 9px 36px", border:"1px solid #E5E5E4", borderRadius:22, fontFamily:"var(--sans)", fontSize:13, outline:"none", background:"#FAFAF8", boxSizing:"border-box" }} />
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#9CA3AF" }}><I3Search s={14}/></span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          {/* Operación */}
          <div style={{ display:"flex", gap:6 }}>
            {[["all","Todas"],["venta","Venta"],["renta","Renta"]].map(([v,l]) => (
              <button key={v} onClick={() => setFilterOp(v)}
                style={{ padding:"7px 14px", borderRadius:18, border:"none", cursor:"pointer", fontFamily:"var(--sans)", fontSize:12, fontWeight:500,
                  background: filterOp===v ? "#0F1B2D" : "#F7F7F6", color: filterOp===v ? "#fff" : "#374151" }}>{l}</button>
            ))}
          </div>
          {/* Tipo */}
          <select value={typeF} onChange={e => setTypeF(e.target.value)} style={selStyle}>
            <option value="all">Todos los tipos</option>
            {Object.entries(TYPE_LABELS).map(([k,l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          {/* Estatus */}
          <select value={statusF} onChange={e => setStatusF(e.target.value)} style={selStyle}>
            <option value="all">Todos los estatus</option>
            <option value="activa">Activa</option>
            <option value="pausada">Pausada</option>
            <option value="reservada">Reservada</option>
          </select>
          {/* Orden */}
          <select value={sort} onChange={e => setSort(e.target.value)} style={selStyle}>
            <option value="recent">Recientes</option>
            <option value="price-asc">Precio ↑</option>
            <option value="price-desc">Precio ↓</option>
            <option value="title">Título A–Z</option>
          </select>
        </div>
      </div>

      <div style={{ background:"#fff", borderRadius:14, overflow:"hidden", border:"1px solid #F1F1F0" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"var(--sans)", fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #F1F1F0", background:"#FAFAF8" }}>
              {["Propiedad","Tipo","Operación","Precio","Responsable","Estado","Acciones"].map(h => (
                <th key={h} style={{ padding:"14px 18px", textAlign:"left", fontSize:11, color:"#6B7280", textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(p => (
              <tr key={p.id} style={{ borderBottom:"1px solid #F7F7F6" }}>
                <td style={{ padding:"12px 18px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:44, height:44, borderRadius:8, background:p.color, flexShrink:0, position:"relative", overflow:"hidden" }}>
                      {p.image
                        ? <img src={p.image} alt="" loading="lazy" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                        : <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 6px,rgba(255,255,255,0.05) 6px,rgba(255,255,255,0.05) 12px)" }}/>}
                    </div>
                    <div>
                      <div style={{ fontWeight:600, color:"#0F1B2D", display:"flex", alignItems:"center", gap:6 }}>
                        {p.premium && <span title="Destacado (premium)" style={{ color:"#BE8C3C", fontSize:13 }}>★</span>}
                        {p.title}
                      </div>
                      <div style={{ fontSize:11, color:"#9CA3AF" }}>{p.location}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding:"12px 18px", color:"#6B7280" }}>{TYPE_LABELS[p.type]}</td>
                <td style={{ padding:"12px 18px" }}>
                  <span style={{ fontSize:11, textTransform:"capitalize", padding:"3px 10px", background:p.operation==="venta"?"#FFF0F2":"#EFF6FF", color:p.operation==="venta"?"var(--tar)":"#2563EB", borderRadius:14, fontWeight:600 }}>{p.operation}</span>
                </td>
                <td style={{ padding:"12px 18px", fontFamily:"var(--display)", fontWeight:600, color:"#0F1B2D", fontSize:15 }}>{formatPrice(p.price,p.currency,p.operation,p.priceUnit)}</td>
                <td style={{ padding:"12px 18px", color:"#6B7280" }}>{p.broker.name.split(" ")[0]}</td>
                <td style={{ padding:"12px 18px" }}>
                  <span style={{ fontSize:11, padding:"3px 10px", background:statusC[st(p)]+"22", color:statusC[st(p)], borderRadius:14, fontWeight:600, textTransform:"capitalize" }}>{st(p)}</span>
                </td>
                <td style={{ padding:"12px 18px" }}>
                  <div style={{ display:"flex", gap:5 }}>
                    <button onClick={() => onNavigate("detail",p.id)} style={{ background:"none", border:"1px solid #E5E5E4", padding:"5px 12px", fontFamily:"var(--sans)", fontSize:12, cursor:"pointer", color:"#6B7280", borderRadius:14, fontWeight:500 }}>Ver</button>
                    <button style={{ background:"none", border:"1px solid #E5E5E4", padding:"5px 10px", cursor:"pointer", color:"#6B7280", borderRadius:14 }}><I3Edit s={12}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── NUEVA PROPIEDAD form ──────────────────────────────────────────────────────
const NewPropertyTab = ({ setTab }) => {
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState({
    title:"", type:"departamento", operation:"venta", currency:"MXN", price:"",
    zone:"Ciudad de México", colony:"", address:"", lat:"", lng:"", postalCode:"",
    area:"", bedrooms:"", bathrooms:"", parking:"", age:"",
    description:"", features:[],
    broker:"Ana Solís",
    images:[],
    featured:false, isNew:true, isPublished:true,
    seoTitle:"", seoDescription:"",
  });
  const [newFeature, setNewFeature] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [geocoded, setGeocoded] = React.useState(false);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inpStyle = { width:"100%", padding:"11px 14px", border:"1px solid #E5E5E4", borderRadius:10, fontFamily:"var(--sans)", fontSize:14, color:"#0F1B2D", background:"#fff", outline:"none", boxSizing:"border-box" };
  const lblStyle = { fontFamily:"var(--sans)", fontSize:12, fontWeight:600, color:"#374151", marginBottom:6, display:"block" };
  const helpStyle = { fontFamily:"var(--sans)", fontSize:11, color:"#9CA3AF", marginTop:4 };

  const steps = ["Información básica", "Ubicación", "Detalles", "Fotos y descripción", "SEO y publicación"];

  const Section = ({ title, subtitle, children }) => (
    <div style={{ background:"#fff", borderRadius:14, padding:"24px 28px", border:"1px solid #F1F1F0", marginBottom:16 }}>
      <div style={{ marginBottom:18 }}>
        <h3 style={{ fontFamily:"var(--display)", fontSize:18, fontWeight:700, color:"#0F1B2D" }}>{title}</h3>
        {subtitle && <p style={{ fontFamily:"var(--sans)", fontSize:13, color:"#6B7280", marginTop:4 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );

  if (submitted) {
    return (
      <div style={{ background:"#fff", borderRadius:14, padding:"60px 24px", border:"1px solid #F1F1F0", textAlign:"center", maxWidth:520, margin:"40px auto" }}>
        <div style={{ width:72, height:72, background:"#DCFCE7", border:"2px solid #16A34A", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", color:"#16A34A" }}><I3Check s={32}/></div>
        <h2 style={{ fontFamily:"var(--display)", fontSize:26, fontWeight:700, color:"#0F1B2D", marginBottom:8 }}>¡Propiedad publicada!</h2>
        <p style={{ fontFamily:"var(--sans)", fontSize:14, color:"#6B7280", lineHeight:1.7, marginBottom:24, maxWidth:380, margin:"0 auto 24px" }}>
          <strong style={{ color:"#0F1B2D" }}>{form.title || "Nueva propiedad"}</strong> ya está disponible en el catálogo y será visible para los compradores en pocos minutos.
        </p>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button onClick={() => { setSubmitted(false); setStep(1); setForm({ ...form, title:"", price:"", description:"", colony:"", address:"" }); }}
            style={{ background:"#fff", color:"#374151", border:"1px solid #E5E5E4", padding:"11px 22px", borderRadius:24, fontFamily:"var(--sans)", fontSize:13, fontWeight:500, cursor:"pointer" }}>Agregar otra</button>
          <button onClick={() => setTab("propiedades")}
            style={{ background:"var(--tar)", color:"#fff", border:"none", padding:"11px 22px", borderRadius:24, fontFamily:"var(--sans)", fontSize:13, fontWeight:600, cursor:"pointer" }}>Ver propiedades</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:"var(--display)", fontSize:30, fontWeight:600, color:"#0F1B2D", letterSpacing:-0.5 }}>Nueva propiedad</h1>
        <p style={{ fontFamily:"var(--sans)", fontSize:14, color:"#6B7280", marginTop:4 }}>Llena todos los campos para publicar el inmueble en la plataforma.</p>
      </div>

      {/* Stepper */}
      <div style={{ background:"#fff", borderRadius:14, padding:"14px 18px", border:"1px solid #F1F1F0", marginBottom:16, display:"flex", alignItems:"center", gap:6 }}>
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <button onClick={() => setStep(i+1)} style={{ display:"flex", alignItems:"center", gap:8, background:"none", border:"none", cursor:"pointer", padding:"4px 8px" }}>
              <span style={{ width:24, height:24, borderRadius:"50%", background:step>=i+1?"var(--tar)":"#E5E5E4", color:step>=i+1?"#fff":"#9CA3AF", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--sans)", fontSize:11, fontWeight:700 }}>{step>i+1 ? <I3Check s={12}/> : i+1}</span>
              <span style={{ fontFamily:"var(--sans)", fontSize:12, color:step>=i+1?"#0F1B2D":"#9CA3AF", fontWeight:step===i+1?600:500 }}>{s}</span>
            </button>
            {i < steps.length-1 && <span style={{ flex:1, height:1, background:step>i+1?"var(--tar)":"#E5E5E4" }}/>}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20, alignItems:"flex-start" }}>
        {/* Left — Form */}
        <div>
          {step === 1 && (
            <Section title="Información básica" subtitle="Datos principales que se mostrarán al cliente">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={lblStyle}>Título de la publicación *</label>
                  <input value={form.title} onChange={e => upd("title", e.target.value)} placeholder="Ej. Penthouse en Polanco con terraza privada" style={inpStyle} />
                  <div style={helpStyle}>Máximo 80 caracteres. Aparecerá en cards y en Google.</div>
                </div>
                <div>
                  <label style={lblStyle}>Tipo de propiedad *</label>
                  <select value={form.type} onChange={e => upd("type", e.target.value)} style={inpStyle}>
                    <option value="departamento">Departamento</option>
                    <option value="oficina">Oficinas</option>
                    <option value="comercial">Local Comercial</option>
                  </select>
                </div>
                <div>
                  <label style={lblStyle}>Operación *</label>
                  <div style={{ display:"flex", gap:6 }}>
                    {[["venta","Venta"],["renta","Renta"]].map(([v,l]) => (
                      <button key={v} onClick={() => upd("operation", v)} type="button"
                        style={{ flex:1, padding:"11px 0", borderRadius:10, border:`1px solid ${form.operation===v?"var(--tar)":"#E5E5E4"}`, background:form.operation===v?"#FFF0F2":"#fff", color:form.operation===v?"var(--tar)":"#374151", fontFamily:"var(--sans)", fontSize:13, fontWeight:form.operation===v?600:500, cursor:"pointer" }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lblStyle}>Precio * <span style={{ color:"#9CA3AF", fontWeight:400, fontSize:11 }}>({form.operation === "renta" ? "mensual" : "total"})</span></label>
                  <div style={{ display:"flex", gap:6 }}>
                    <select value={form.currency} onChange={e => upd("currency", e.target.value)} style={{ ...inpStyle, width:90, flexShrink:0 }}>
                      <option value="MXN">MXN</option>
                      <option value="USD">USD</option>
                    </select>
                    <input type="number" value={form.price} onChange={e => upd("price", e.target.value)} placeholder="14500000" style={inpStyle} />
                  </div>
                </div>
                <div>
                  <label style={lblStyle}>Responsable (usuario) *</label>
                  <select value={form.broker} onChange={e => upd("broker", e.target.value)} style={inpStyle}>
                    {BROKERS.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              </div>
            </Section>
          )}

          {step === 2 && (
            <Section title="Ubicación" subtitle="Mientras más exacta, mejor posicionamiento en mapas y SEO">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div>
                  <label style={lblStyle}>Estado / Región *</label>
                  <select value={form.zone} onChange={e => upd("zone", e.target.value)} style={inpStyle}>
                    <option>Ciudad de México</option><option>Estado de México</option><option>Nuevo León</option>
                    <option>Quintana Roo</option><option>Querétaro</option><option>Yucatán</option><option>Jalisco</option>
                  </select>
                </div>
                <div>
                  <label style={lblStyle}>Colonia / Zona *</label>
                  <input value={form.colony} onChange={e => upd("colony", e.target.value)} placeholder="Polanco" style={inpStyle} />
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={lblStyle}>Dirección completa</label>
                  <input value={form.address} onChange={e => upd("address", e.target.value)} placeholder="Av. Presidente Masaryk 123, Piso 14" style={inpStyle} />
                  <div style={helpStyle}>No se mostrará públicamente — sólo se compartirá tras solicitud del cliente.</div>
                </div>
                <div>
                  <label style={lblStyle}>Código postal</label>
                  <input value={form.postalCode} onChange={e => upd("postalCode", e.target.value)} placeholder="11550" style={inpStyle} />
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={lblStyle}>Ubicación en el mapa</label>
                  <button type="button" onClick={() => setGeocoded(true)}
                    style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#0F1B2D", color:"#fff", border:"none", padding:"11px 18px", borderRadius:10, fontFamily:"var(--sans)", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                    <I3Pin s={15}/> Ubicar desde la dirección
                  </button>
                  <div style={helpStyle}>Se geolocaliza automáticamente a partir de la dirección (Google Geocoding) — no necesitas capturar coordenadas. Si el pin no queda exacto, arrástralo en el mapa.</div>
                </div>
              </div>
              {/* Mapa: pin geolocalizado y ajustable (en la app es Google Maps / LocationPicker) */}
              <div style={{ marginTop:18, height:180, background:"#E8EDE5", borderRadius:10, position:"relative", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", color:"#9CA3AF", fontFamily:"var(--sans)", fontSize:12 }}>
                <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 24px,rgba(0,0,0,0.04) 24px,rgba(0,0,0,0.04) 25px),repeating-linear-gradient(90deg,transparent,transparent 24px,rgba(0,0,0,0.04) 24px,rgba(0,0,0,0.04) 25px)" }}/>
                {geocoded ? (
                  <div style={{ position:"relative", display:"flex", flexDirection:"column", alignItems:"center", color:"var(--tar)" }}>
                    <I3Pin s={30}/>
                    <span style={{ fontFamily:"var(--sans)", fontSize:11, color:"#374151", marginTop:6, background:"rgba(255,255,255,0.9)", padding:"3px 10px", borderRadius:12 }}>Arrastra el pin para ajustar</span>
                  </div>
                ) : (
                  <span style={{ position:"relative", display:"flex", alignItems:"center", gap:6 }}><I3Pin s={14}/> El pin se genera al ubicar desde la dirección</span>
                )}
              </div>
            </Section>
          )}

          {step === 3 && (
            <Section title="Detalles del inmueble" subtitle="Características físicas y amenidades">
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 }}>
                <div>
                  <label style={lblStyle}>Superficie (m²) *</label>
                  <input type="number" value={form.area} onChange={e => upd("area", e.target.value)} placeholder="220" style={inpStyle} />
                </div>
                <div>
                  <label style={lblStyle}>Recámaras</label>
                  <input type="number" value={form.bedrooms} onChange={e => upd("bedrooms", e.target.value)} placeholder="3" style={inpStyle} />
                </div>
                <div>
                  <label style={lblStyle}>Baños</label>
                  <input type="number" value={form.bathrooms} onChange={e => upd("bathrooms", e.target.value)} placeholder="3" style={inpStyle} />
                </div>
                <div>
                  <label style={lblStyle}>Estacionamientos</label>
                  <input type="number" value={form.parking} onChange={e => upd("parking", e.target.value)} placeholder="2" style={inpStyle} />
                </div>
                <div>
                  <label style={lblStyle}>Antigüedad (años)</label>
                  <input type="number" value={form.age} onChange={e => upd("age", e.target.value)} placeholder="3" style={inpStyle} />
                </div>
              </div>

              {/* Features tags */}
              <div>
                <label style={lblStyle}>Amenidades y características</label>
                <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                  <input value={newFeature} onChange={e => setNewFeature(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && newFeature.trim()) { e.preventDefault(); upd("features", [...form.features, newFeature.trim()]); setNewFeature(""); } }}
                    placeholder="Ej. Terraza, Alberca, Gym…" style={inpStyle} />
                  <button type="button" onClick={() => { if (newFeature.trim()) { upd("features", [...form.features, newFeature.trim()]); setNewFeature(""); } }}
                    style={{ background:"#0F1B2D", color:"#fff", border:"none", padding:"0 18px", borderRadius:10, fontFamily:"var(--sans)", fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>Agregar</button>
                </div>
                {form.features.length > 0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
                    {form.features.map((f, i) => (
                      <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#FFF0F2", color:"var(--tar)", padding:"5px 12px", borderRadius:20, fontFamily:"var(--sans)", fontSize:12, fontWeight:500 }}>
                        {f}
                        <button onClick={() => upd("features", form.features.filter((_, idx) => idx !== i))} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--tar)", display:"flex" }}><I3Close s={11}/></button>
                      </span>
                    ))}
                  </div>
                )}
                <div style={helpStyle}>Sugeridas: Alberca, Gym, Roof garden, Pet friendly, Seguridad 24/7, Concierge, Vista panorámica.</div>
              </div>
            </Section>
          )}

          {step === 4 && (
            <Section title="Fotos y descripción" subtitle="Imágenes de alta calidad y un texto descriptivo aumentan los leads x3">
              {/* Image dropzone */}
              <div>
                <label style={lblStyle}>Fotografías * <span style={{ color:"#9CA3AF", fontWeight:400 }}>(mín. 5 fotos · máx. 30)</span></label>
                <div style={{ border:"2px dashed #E5E5E4", borderRadius:12, padding:"40px 24px", textAlign:"center", background:"#FAFAF8", cursor:"pointer", transition:"border-color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="var(--tar)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor="#E5E5E4"}>
                  <div style={{ width:48, height:48, borderRadius:"50%", background:"#FFF0F2", color:"var(--tar)", margin:"0 auto 12px", display:"flex", alignItems:"center", justifyContent:"center" }}><NUpload s={22}/></div>
                  <div style={{ fontFamily:"var(--sans)", fontSize:14, color:"#0F1B2D", fontWeight:600, marginBottom:4 }}>Arrastra las imágenes o haz click para subir</div>
                  <div style={{ fontFamily:"var(--sans)", fontSize:12, color:"#9CA3AF" }}>JPG, PNG · máx. 10 MB por imagen</div>
                </div>
              </div>

              {/* Mock thumbnails */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginTop:14 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ height:90, borderRadius:8, background: i === 0 ? "linear-gradient(135deg, #8B1A28, #5A1018)" : "#E5E5E4", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 10px,rgba(255,255,255,0.04) 10px,rgba(255,255,255,0.04) 20px)" }}/>
                    {i === 0 && <div style={{ position:"absolute", top:6, left:6, background:"var(--tar)", color:"#fff", padding:"2px 6px", borderRadius:4, fontFamily:"var(--sans)", fontSize:9, fontWeight:700, textTransform:"uppercase" }}>Portada</div>}
                  </div>
                ))}
              </div>

              {/* Description */}
              <div style={{ marginTop:18 }}>
                <label style={lblStyle}>Descripción detallada *</label>
                <textarea value={form.description} onChange={e => upd("description", e.target.value)} rows={6}
                  placeholder="Describe la propiedad: ubicación, vista, acabados, distribución, qué la hace única. Mínimo 200 caracteres."
                  style={{ ...inpStyle, resize:"vertical", lineHeight:1.6 }} />
                <div style={helpStyle}>{form.description.length} caracteres · mínimo 200 recomendado</div>
              </div>
            </Section>
          )}

          {step === 5 && (
            <Section title="SEO y publicación" subtitle="Datos para optimizar la visibilidad en Google y campañas de marketing">
              <div>
                <label style={lblStyle}>Título SEO (meta title)</label>
                <input value={form.seoTitle} onChange={e => upd("seoTitle", e.target.value)} placeholder="Penthouse en venta Polanco — TAR Internacional" style={inpStyle} />
                <div style={helpStyle}>60 caracteres recomendado. Si se deja vacío, se usará el título de la publicación.</div>
              </div>
              <div style={{ marginTop:14 }}>
                <label style={lblStyle}>Meta descripción</label>
                <textarea value={form.seoDescription} onChange={e => upd("seoDescription", e.target.value)} rows={3}
                  placeholder="Resumen breve que aparecerá en Google bajo el título. 160 caracteres máximo."
                  style={{ ...inpStyle, resize:"vertical" }} />
              </div>

              <div style={{ marginTop:24, padding:"18px 20px", background:"#FAFAF8", borderRadius:12, border:"1px solid #F1F1F0" }}>
                <div style={{ fontFamily:"var(--sans)", fontSize:13, fontWeight:600, color:"#0F1B2D", marginBottom:12 }}>Opciones de publicación</div>
                {[
                  { k:"isPublished", l:"Publicar inmediatamente", d:"Si lo dejas apagado, queda como borrador." },
                  { k:"featured",    l:"Destacar (Premium ★)",   d:"Plan de pago: resaltado dorado y prioridad en home, listado y mapa." },
                  { k:"isNew",       l:"Mostrar badge \"Nuevo\"",  d:"Visible los primeros 30 días." },
                ].map(({ k, l, d }) => (
                  <label key={k} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"10px 0", cursor:"pointer", borderBottom:"1px solid #F1F1F0" }}>
                    <div onClick={() => upd(k, !form[k])}
                      style={{ width:36, height:20, borderRadius:10, background:form[k]?"var(--tar)":"#E5E5E4", position:"relative", flexShrink:0, marginTop:2, transition:"background 0.15s" }}>
                      <div style={{ position:"absolute", top:2, left:form[k]?18:2, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left 0.15s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                    </div>
                    <div>
                      <div style={{ fontFamily:"var(--sans)", fontSize:13, fontWeight:500, color:"#0F1B2D" }}>{l}</div>
                      <div style={{ fontFamily:"var(--sans)", fontSize:11, color:"#9CA3AF", marginTop:2 }}>{d}</div>
                    </div>
                  </label>
                ))}
              </div>
            </Section>
          )}

          {/* Step nav */}
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
            <button onClick={() => setStep(s => Math.max(1, s-1))} disabled={step===1}
              style={{ background:"#fff", color:"#374151", border:"1px solid #E5E5E4", padding:"11px 22px", borderRadius:24, fontFamily:"var(--sans)", fontSize:13, fontWeight:500, cursor:step===1?"not-allowed":"pointer", opacity:step===1?0.5:1, display:"flex", alignItems:"center", gap:6 }}>
              <I3ChevL s={14}/> Anterior
            </button>
            {step < 5 ? (
              <button onClick={() => setStep(s => Math.min(5, s+1))}
                style={{ background:"#0F1B2D", color:"#fff", border:"none", padding:"11px 22px", borderRadius:24, fontFamily:"var(--sans)", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                Continuar <I3ChevR s={14}/>
              </button>
            ) : (
              <button onClick={() => setSubmitted(true)}
                style={{ background:"var(--tar)", color:"#fff", border:"none", padding:"11px 28px", borderRadius:24, fontFamily:"var(--sans)", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                Publicar propiedad <I3Check s={14}/>
              </button>
            )}
          </div>
        </div>

        {/* Right — Live preview card */}
        <div>
          <div style={{ position:"sticky", top:84 }}>
            <div style={{ fontFamily:"var(--sans)", fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>Vista previa</div>
            <div style={{ background:"#fff", borderRadius:14, overflow:"hidden", border:"1px solid #F1F1F0" }}>
              <div style={{ height:160, position:"relative", background:"linear-gradient(135deg, #8B1A28, #5A1018)", overflow:"hidden" }}>
                <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 16px,rgba(255,255,255,0.03) 16px,rgba(255,255,255,0.03) 32px)" }}/>
                <div style={{ position:"absolute", top:10, left:10, background:"#fff", color:"#0F1B2D", padding:"3px 10px", borderRadius:14, fontFamily:"var(--sans)", fontSize:10, fontWeight:600 }}>
                  {form.operation === "venta" ? "En venta" : "En renta"}
                </div>
                {form.isNew && <div style={{ position:"absolute", top:10, right:10, background:"var(--tar)", color:"#fff", padding:"3px 10px", borderRadius:14, fontFamily:"var(--sans)", fontSize:10, fontWeight:700 }}>Nuevo</div>}
              </div>
              <div style={{ padding:"14px 16px 16px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:4, fontFamily:"var(--sans)", fontSize:11, color:"#6B7280", marginBottom:6 }}>
                  <I3Pin s={10}/>{form.colony || "Colonia"}, {form.zone}
                </div>
                <div style={{ fontFamily:"var(--display)", fontSize:15, fontWeight:600, color:"#0F1B2D", marginBottom:6, lineHeight:1.3 }}>
                  {form.title || "Título de la propiedad"}
                </div>
                <div style={{ display:"flex", gap:10, fontFamily:"var(--sans)", fontSize:11, color:"#6B7280", paddingTop:10, marginTop:8, borderTop:"1px solid #F1F1F0", alignItems:"center" }}>
                  {form.bedrooms && <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><I3Bed s={12}/> {form.bedrooms}</span>}
                  {form.bathrooms && <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><I3Bath s={12}/> {form.bathrooms}</span>}
                  <span style={{ marginLeft:"auto", display:"inline-flex", alignItems:"center", gap:4 }}><I3Ruler s={12}/> {form.area || "—"} m²</span>
                </div>
                <div style={{ fontFamily:"var(--display)", fontSize:18, fontWeight:700, color:"#0F1B2D", marginTop:10, letterSpacing:-0.3 }}>
                  {form.price ? formatPrice(parseInt(form.price), form.currency, form.operation) : "—"}
                </div>
              </div>
            </div>

            <div style={{ marginTop:14, padding:"12px 14px", background:"#FFF0F2", borderRadius:10, fontFamily:"var(--sans)", fontSize:11, color:"#0F1B2D", lineHeight:1.6, display:"flex", gap:8, alignItems:"flex-start" }}>
              <span style={{ color:"var(--tar)", flexShrink:0, marginTop:1 }}><I3Verif s={15}/></span>
              <span><strong>Tip:</strong> los datos completos hacen que la propiedad aparezca antes en los resultados de búsqueda.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── SCRIPTS TAB — GTM / Analytics / Pixels ────────────────────────────────────
const ScriptsTab = () => {
  const [scripts, setScripts] = React.useState([
    { id: 1, name: "Google Tag Manager", provider: "gtm", location: "head", enabled: true, code: `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->` },
    { id: 2, name: "Google Analytics 4", provider: "ga4", location: "head", enabled: true, code: `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>` },
    { id: 3, name: "Meta Pixel (Facebook)", provider: "meta", location: "head", enabled: false, code: `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '000000000000000');
fbq('track', 'PageView');
</script>` },
    { id: 4, name: "Hotjar", provider: "hotjar", location: "head", enabled: false, code: `<!-- Hotjar Tracking Code -->
<script>
    (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:0000000,hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
</script>` },
  ]);
  const [active, setActive] = React.useState(1);
  const [editing, setEditing] = React.useState(false);
  const [showAdd, setShowAdd] = React.useState(false);

  const current = scripts.find(s => s.id === active) || scripts[0];

  // Provider visual config
  const providers = {
    gtm:    { label: "GTM",       color: "#246FDB", icon: "GT" },
    ga4:    { label: "Analytics", color: "#F9AB00", icon: "GA" },
    meta:   { label: "Meta",      color: "#1877F2", icon: "f"  },
    hotjar: { label: "Hotjar",    color: "#FD3A5C", icon: "H"  },
    linkedin: { label: "LinkedIn", color: "#0A66C2", icon: "in" },
    custom: { label: "Custom",    color: "#6B7280", icon: "<>" },
  };

  const locationLabel = loc => ({ head: "<head>", "body-open": "<body> (inicio)", "body-close": "</body> (final)" }[loc] || loc);

  const updateField = (id, field, value) => {
    setScripts(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };
  const toggleEnabled = id => updateField(id, "enabled", !scripts.find(s => s.id === id).enabled);
  const deleteScript = id => {
    if (!confirm("¿Eliminar este script de rastreo?")) return;
    setScripts(prev => prev.filter(s => s.id !== id));
    setActive(scripts[0]?.id);
  };

  const enabledCount = scripts.filter(s => s.enabled).length;

  const inpStyle = { width:"100%", padding:"10px 12px", border:"1px solid #E5E5E4", borderRadius:8, fontFamily:"var(--sans)", fontSize:13, color:"#0F1B2D", background:"#fff", outline:"none", boxSizing:"border-box" };
  const lblStyle = { fontFamily:"var(--sans)", fontSize:11, fontWeight:600, color:"#374151", marginBottom:6, display:"block" };

  // Add-new modal templates
  const templates = [
    { provider:"gtm",    name:"Google Tag Manager",    desc:"Contenedor de tags para gestionar GA, Pixel, etc." },
    { provider:"ga4",    name:"Google Analytics 4",    desc:"Tracking de visitas y eventos en Google Analytics." },
    { provider:"meta",   name:"Meta Pixel (Facebook)", desc:"Conversiones y retargeting de Facebook/Instagram." },
    { provider:"hotjar", name:"Hotjar",                desc:"Mapas de calor y grabaciones de sesiones." },
    { provider:"linkedin", name:"LinkedIn Insight Tag", desc:"Conversiones de campañas en LinkedIn Ads." },
    { provider:"custom", name:"Script personalizado",   desc:"HTML/JavaScript libre para integraciones a la medida." },
  ];
  const addFromTemplate = t => {
    const newId = Math.max(...scripts.map(s => s.id), 0) + 1;
    setScripts(prev => [...prev, { id: newId, name: t.name, provider: t.provider, location: "head", enabled: false, code: `<!-- ${t.name} -->\n<script>\n  // Pega aquí tu código\n</script>` }]);
    setActive(newId);
    setShowAdd(false);
    setEditing(true);
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:"var(--display)", fontSize:30, fontWeight:600, color:"#0F1B2D", letterSpacing:-0.5 }}>Scripts de rastreo</h1>
          <p style={{ fontFamily:"var(--sans)", fontSize:14, color:"#6B7280", marginTop:4 }}>
            Inserta GTM, Analytics, Pixels y otros scripts de terceros en la plataforma.
            <strong style={{ color:"#16A34A", marginLeft:8 }}>{enabledCount} activos</strong> · {scripts.length} totales
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ display:"flex", alignItems:"center", gap:6, background:"var(--tar)", color:"#fff", border:"none", padding:"10px 20px", borderRadius:24, fontFamily:"var(--sans)", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          <I3Plus s={14}/> Agregar script
        </button>
      </div>

      {/* Warning bar */}
      <div style={{ background:"#FFF8E1", border:"1px solid #FCD34D", borderRadius:10, padding:"12px 16px", marginBottom:20, display:"flex", alignItems:"center", gap:10, fontFamily:"var(--sans)", fontSize:13, color:"#92400E" }}>
          <span style={{ color:"#CA8A04", flexShrink:0, display:"flex" }}><A s={18} d={["M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z","M12 9v4","M12 17h.01"]} /></span>
          <span>Los scripts se ejecutan en producción. Verifica tu código antes de activar — un script con errores puede afectar el portal completo.</span>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", gap:16 }}>
        {/* List */}
        <div style={{ background:"#fff", borderRadius:14, border:"1px solid #F1F1F0", overflow:"hidden", height:"fit-content" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F1F0", fontFamily:"var(--sans)", fontSize:12, fontWeight:600, color:"#6B7280", textTransform:"uppercase", letterSpacing:1 }}>
            Scripts instalados
          </div>
          {scripts.length === 0 && (
            <div style={{ padding:"32px 18px", textAlign:"center", color:"#9CA3AF", fontFamily:"var(--sans)", fontSize:13 }}>No hay scripts. Agrega uno para empezar.</div>
          )}
          {scripts.map(s => {
            const p = providers[s.provider] || providers.custom;
            return (
              <div key={s.id} onClick={() => { setActive(s.id); setEditing(false); }}
                style={{ padding:"14px 16px", borderBottom:"1px solid #F7F7F6", cursor:"pointer", background:active===s.id?"#FFF0F2":"#fff", borderLeft:`3px solid ${active===s.id?"var(--tar)":"transparent"}`, display:"flex", alignItems:"center", gap:12, transition:"background 0.15s" }}>
                <div style={{ width:36, height:36, borderRadius:8, background:p.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--sans)", fontSize:12, fontWeight:700, flexShrink:0 }}>{p.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"var(--sans)", fontSize:13, fontWeight:600, color:"#0F1B2D", marginBottom:3 }}>{s.name}</div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"#9CA3AF" }}>{locationLabel(s.location)}</div>
                </div>
                {/* Status pill */}
                <span style={{ fontSize:10, padding:"3px 8px", background:s.enabled?"#DCFCE7":"#F1F1F0", color:s.enabled?"#16A34A":"#9CA3AF", borderRadius:12, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, fontFamily:"var(--sans)" }}>
                  {s.enabled ? "ON" : "OFF"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Editor */}
        {current && (
          <div style={{ background:"#fff", borderRadius:14, border:"1px solid #F1F1F0", overflow:"hidden" }}>
            {/* Header */}
            <div style={{ padding:"20px 24px", borderBottom:"1px solid #F1F1F0", display:"flex", justifyContent:"space-between", alignItems:"center", gap:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:14, flex:1 }}>
                <div style={{ width:44, height:44, borderRadius:10, background:(providers[current.provider]||providers.custom).color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--sans)", fontSize:14, fontWeight:700, flexShrink:0 }}>
                  {(providers[current.provider]||providers.custom).icon}
                </div>
                <div style={{ flex:1 }}>
                  {editing ? (
                    <input value={current.name} onChange={e => updateField(current.id, "name", e.target.value)}
                      style={{ ...inpStyle, fontFamily:"var(--display)", fontSize:20, fontWeight:700, padding:"4px 8px", border:"1px dashed #E5E5E4" }} />
                  ) : (
                    <h2 style={{ fontFamily:"var(--display)", fontSize:22, fontWeight:700, color:"#0F1B2D" }}>{current.name}</h2>
                  )}
                  <div style={{ fontFamily:"var(--sans)", fontSize:12, color:"#6B7280", marginTop:2 }}>
                    {(providers[current.provider]||providers.custom).label} · Insertado en <code style={{ fontFamily:"var(--mono)", color:"#0F1B2D" }}>{locationLabel(current.location)}</code>
                  </div>
                </div>
              </div>
              {/* Toggle */}
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"var(--sans)", fontSize:12, color:current.enabled?"#16A34A":"#9CA3AF", fontWeight:600 }}>{current.enabled?"Activo":"Inactivo"}</span>
                <div onClick={() => toggleEnabled(current.id)}
                  style={{ width:44, height:24, borderRadius:12, background:current.enabled?"#16A34A":"#E5E5E4", position:"relative", cursor:"pointer", transition:"background 0.15s" }}>
                  <div style={{ position:"absolute", top:2, left:current.enabled?22:2, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left 0.15s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding:"24px" }}>
              {/* Location + provider row */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:18 }}>
                <div>
                  <label style={lblStyle}>Ubicación de inserción</label>
                  <select value={current.location} onChange={e => updateField(current.id, "location", e.target.value)} disabled={!editing} style={{ ...inpStyle, opacity:editing?1:0.7 }}>
                    <option value="head">Dentro de &lt;head&gt;</option>
                    <option value="body-open">Justo después de &lt;body&gt;</option>
                    <option value="body-close">Justo antes de &lt;/body&gt;</option>
                  </select>
                </div>
                <div>
                  <label style={lblStyle}>Nombre <span style={{ color:"#9CA3AF", fontWeight:400, fontSize:11 }}>(para identificarlo)</span></label>
                  <input value={current.name} onChange={e => updateField(current.id, "name", e.target.value)} disabled={!editing} placeholder="Ej. GTM principal, Pixel campaña verano…" style={{ ...inpStyle, opacity:editing?1:0.7 }} />
                </div>
              </div>

              {/* Code area */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <label style={lblStyle}>Código del script</label>
                  <button onClick={() => navigator.clipboard?.writeText(current.code)}
                    style={{ display:"inline-flex", alignItems:"center", gap:5, background:"none", border:"none", cursor:"pointer", fontFamily:"var(--sans)", fontSize:11, color:"var(--tar)", fontWeight:600 }}>
                    <I3Share s={13}/> Copiar
                  </button>
                </div>
                <textarea
                  value={current.code}
                  onChange={e => updateField(current.id, "code", e.target.value)}
                  readOnly={!editing}
                  rows={14}
                  spellCheck={false}
                  style={{ width:"100%", padding:"14px 16px", border:"1px solid #E5E5E4", borderRadius:10, fontFamily:"var(--mono)", fontSize:12, color:editing?"#0F1B2D":"#374151", background:editing?"#fff":"#FAFAF8", outline:"none", lineHeight:1.6, resize:"vertical", boxSizing:"border-box" }}
                />
                <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"#9CA3AF", marginTop:6 }}>{current.code.length} caracteres · {current.code.split("\n").length} líneas</div>
              </div>

              {/* Actions */}
              <div style={{ marginTop:20, display:"flex", gap:10, justifyContent:"space-between" }}>
                <button onClick={() => deleteScript(current.id)}
                  style={{ background:"#fff", color:"#DC2626", border:"1px solid #FECACA", padding:"10px 18px", borderRadius:22, fontFamily:"var(--sans)", fontSize:13, fontWeight:500, cursor:"pointer" }}>
                  Eliminar
                </button>
                <div style={{ display:"flex", gap:8 }}>
                  {editing ? (
                    <>
                      <button onClick={() => setEditing(false)} style={{ background:"#fff", color:"#374151", border:"1px solid #E5E5E4", padding:"10px 18px", borderRadius:22, fontFamily:"var(--sans)", fontSize:13, fontWeight:500, cursor:"pointer" }}>Cancelar</button>
                      <button onClick={() => setEditing(false)} style={{ background:"var(--tar)", color:"#fff", border:"none", padding:"10px 20px", borderRadius:22, fontFamily:"var(--sans)", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                        <I3Check s={14}/> Guardar cambios
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setEditing(true)} style={{ background:"#0F1B2D", color:"#fff", border:"none", padding:"10px 20px", borderRadius:22, fontFamily:"var(--sans)", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                      <I3Edit s={14}/> Editar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,27,45,0.65)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:24, backdropFilter:"blur(4px)" }} onClick={() => setShowAdd(false)}>
          <div style={{ background:"#fff", maxWidth:680, width:"100%", borderRadius:14, overflow:"hidden" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding:"20px 24px", borderBottom:"1px solid #F1F1F0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <h2 style={{ fontFamily:"var(--display)", fontSize:22, fontWeight:700, color:"#0F1B2D" }}>Agregar script de rastreo</h2>
                <p style={{ fontFamily:"var(--sans)", fontSize:13, color:"#6B7280", marginTop:2 }}>Elige una plantilla o crea uno personalizado.</p>
              </div>
              <button onClick={() => setShowAdd(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF" }}><I3Close s={20}/></button>
            </div>
            <div style={{ padding:"20px 24px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {templates.map(t => {
                const p = providers[t.provider] || providers.custom;
                return (
                  <button key={t.provider} onClick={() => addFromTemplate(t)}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:"#fff", border:"1px solid #E5E5E4", borderRadius:10, cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor="var(--tar)"; e.currentTarget.style.background="#FFF0F2"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor="#E5E5E4"; e.currentTarget.style.background="#fff"; }}>
                    <div style={{ width:36, height:36, borderRadius:8, background:p.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--sans)", fontSize:12, fontWeight:700, flexShrink:0 }}>{p.icon}</div>
                    <div>
                      <div style={{ fontFamily:"var(--sans)", fontSize:13, fontWeight:600, color:"#0F1B2D", marginBottom:2 }}>{t.name}</div>
                      <div style={{ fontFamily:"var(--sans)", fontSize:11, color:"#6B7280", lineHeight:1.4 }}>{t.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── LEADS TAB · CRM funcional ─────────────────────────────────────────────────
const LeadsTab = () => {
  // Remapea estatus de muestra al pipeline del negocio.
  const remap = { nuevo:"nuevo", cita_agendada:"cita_agendada", cita_concretada:"cita_concretada", apartado:"apartado", firma_contrato:"firma_contrato", descartado:"descartado", contactado:"cita_agendada", seguimiento:"cita_concretada", cerrado:"firma_contrato" };
  const [leads, setLeads] = React.useState(() => LEADS.map(l => ({ ...l, status: remap[l.status] || "nuevo" })));
  const [activity, setActivity] = React.useState([
    { id:1, dir:"out", text:"lead.created → HubSpot/CRM", meta:"Nuevo prospecto · 200 OK", when:"hace 12 min" },
  ]);
  const [flash, setFlash] = React.useState(null);

  const log = (entry) => setActivity(a => [{ id: a.length ? a[0].id + 1 : 1, when:"justo ahora", ...entry }, ...a].slice(0, 10));
  const order = LEAD_PIPELINE.filter(p => p.key !== "descartado").map(p => p.key);

  // Cambio desde la plataforma → webhook SALIENTE hacia el CRM.
  const changeStatus = (lead, newStatus) => {
    setLeads(ls => ls.map(l => l.id === lead.id ? { ...l, status:newStatus } : l));
    setFlash(lead.id);
    log({ dir:"out", text:"lead.status_changed → CRM", meta:`${lead.name} → “${leadLabel(newStatus)}” · 200 OK` });
  };

  // Actualización ENTRANTE simulada (el CRM mueve un lead vía POST /webhooks/inbound).
  const simulateInbound = () => {
    const target = leads.find(l => l.status !== "firma_contrato") || leads[0];
    const next = order[Math.min(order.indexOf(target.status) + 1, order.length - 1)];
    setLeads(ls => ls.map(l => l.id === target.id ? { ...l, status:next } : l));
    setFlash(target.id);
    log({ dir:"in", text:"POST /webhooks/inbound (X-API-Key)", meta:`${target.name} → “${leadLabel(next)}” · aplicado` });
  };

  const funnel = LEAD_PIPELINE.filter(p => p.key !== "descartado").map(p => ({ ...p, n: leads.filter(l => l.status === p.key).length }));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:18, gap:16, flexWrap:"wrap" }}>
        <div>
          <h1 style={{ fontFamily:"var(--display)", fontSize:30, fontWeight:600, color:"#0F1B2D", letterSpacing:-0.5 }}>Leads · CRM</h1>
          <p style={{ fontFamily:"var(--sans)", fontSize:14, color:"#6B7280", marginTop:4, maxWidth:600, lineHeight:1.6 }}>Cada cambio de estatus se sincroniza con tu CRM por <strong>webhook en ambos sentidos</strong>: lo que cambias aquí sale al CRM, y lo que cambia el CRM entra aquí.</p>
        </div>
        <button onClick={simulateInbound} style={{ display:"inline-flex", alignItems:"center", gap:7, background:"#0F1B2D", color:"#fff", border:"none", padding:"10px 18px", borderRadius:24, fontFamily:"var(--sans)", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          <A s={14} d={["M23 4v6h-6","M1 20v-6h6","M3.51 9a9 9 0 0114.85-3.36L23 10","M1 14l4.64 4.36A9 9 0 0020.49 15"]} /> Simular actualización del CRM
        </button>
      </div>

      {/* Embudo por etapa */}
      <div style={{ display:"grid", gridTemplateColumns:`repeat(${funnel.length},1fr)`, gap:10, marginBottom:18 }}>
        {funnel.map(s => (
          <div key={s.key} style={{ background:"#fff", border:"1px solid #F1F1F0", borderTop:`3px solid ${s.color}`, borderRadius:12, padding:"14px 16px" }}>
            <div style={{ fontFamily:"var(--display)", fontSize:26, fontWeight:700, color:"#0F1B2D", lineHeight:1 }}>{s.n}</div>
            <div style={{ fontFamily:"var(--sans)", fontSize:12, color:"#6B7280", marginTop:6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.7fr 1fr", gap:16, alignItems:"flex-start" }}>
        {/* Tabla de leads con estatus editable */}
        <div style={{ background:"#fff", borderRadius:14, overflow:"hidden", border:"1px solid #F1F1F0" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"var(--sans)", fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:"1px solid #F1F1F0", background:"#FAFAF8" }}>
                {["Cliente","Propiedad de interés","Fecha","Estatus (CRM)"].map(h => (
                  <th key={h} style={{ padding:"13px 16px", textAlign:"left", fontSize:11, color:"#6B7280", textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id} style={{ borderBottom:"1px solid #F7F7F6", background: flash===l.id ? "#FFFBEB" : "transparent", transition:"background 0.4s" }}>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg, #FFF0F2, #E5E5E4)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--tar)", fontFamily:"var(--display)", fontSize:12, fontWeight:700, flexShrink:0 }}>{l.name.split(" ").map(n=>n[0]).join("")}</div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontWeight:600, color:"#0F1B2D" }}>{l.name}</div>
                        <div style={{ color:"#9CA3AF", fontSize:11 }}>{l.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"12px 16px", color:"#374151", maxWidth:220 }}>{l.property}</td>
                  <td style={{ padding:"12px 16px", color:"#9CA3AF", fontSize:12, whiteSpace:"nowrap" }}>{l.date}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <select value={l.status} onChange={e => changeStatus(l, e.target.value)}
                      style={{ fontFamily:"var(--sans)", fontSize:12, fontWeight:600, color: leadColor(l.status), background: leadColor(l.status)+"18", border:`1px solid ${leadColor(l.status)}55`, borderRadius:14, padding:"6px 10px", cursor:"pointer", outline:"none" }}>
                      {LEAD_PIPELINE.map(p => <option key={p.key} value={p.key} style={{ color:"#0F1B2D" }}>{p.label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Feed de webhooks en vivo */}
        <div style={{ background:"#fff", borderRadius:14, border:"1px solid #F1F1F0", padding:"18px 20px", position:"sticky", top:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:"#16A34A", boxShadow:"0 0 0 3px rgba(22,163,74,0.18)" }} />
            <span style={{ fontFamily:"var(--display)", fontSize:16, fontWeight:700, color:"#0F1B2D" }}>Actividad de webhooks</span>
          </div>
          <p style={{ fontFamily:"var(--sans)", fontSize:12, color:"#6B7280", marginBottom:14, lineHeight:1.5 }}>Salientes (<span style={{ color:"#2563EB", fontWeight:700 }}>→</span> al CRM) y entrantes (<span style={{ color:"#16A34A", fontWeight:700 }}>←</span> del CRM) en tiempo real.</p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {activity.map(a => (
              <div key={a.id} style={{ display:"flex", gap:10, padding:"10px 12px", background:"#FAFAF8", borderRadius:10, border:"1px solid #F1F1F0" }}>
                <span style={{ fontFamily:"var(--mono)", fontSize:15, fontWeight:700, color: a.dir==="out" ? "#2563EB" : "#16A34A", lineHeight:1.2 }}>{a.dir==="out" ? "→" : "←"}</span>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"#0F1B2D" }}>{a.text}</div>
                  <div style={{ fontFamily:"var(--sans)", fontSize:11, color:"#6B7280", marginTop:2 }}>{a.meta}</div>
                  <div style={{ fontFamily:"var(--sans)", fontSize:10, color:"#9CA3AF", marginTop:3 }}>{a.when}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── USUARIOS TAB ──────────────────────────────────────────────────────────────
// (Antes "Brokers". Ahora son usuarios administrativos con acceso al panel.)
const UsuariosTab = () => {
  // El primero es Administrador; el resto, Editores (sample). En la app el rol sale de la BD.
  const roleOf = (i) => (i === 0 ? "Administrador" : "Editor");
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:"var(--display)", fontSize:30, fontWeight:600, color:"#0F1B2D", letterSpacing:-0.5 }}>Usuarios</h1>
          <p style={{ fontFamily:"var(--sans)", fontSize:14, color:"#6B7280", marginTop:4 }}>{BROKERS.length} usuarios con acceso al panel administrativo</p>
        </div>
        <button style={{ display:"flex", alignItems:"center", gap:6, background:"var(--tar)", color:"#fff", border:"none", padding:"10px 20px", borderRadius:24, fontFamily:"var(--sans)", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          <I3Plus s={14}/> Nuevo usuario
        </button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
        {BROKERS.map((b, i) => (
          <div key={b.name} style={{ background:"#fff", padding:"22px 24px", borderRadius:14, border:"1px solid #F1F1F0", display:"flex", gap:16, alignItems:"center" }}>
            <div style={{ width:54, height:54, background:"linear-gradient(135deg, #FFF0F2, #FFD3DA)", color:"var(--tar)", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:"50%", flexShrink:0, fontFamily:"var(--display)", fontSize:19, fontWeight:700 }}>
              {b.name.split(" ").map(n=>n[0]).join("")}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                <span style={{ fontFamily:"var(--display)", fontSize:17, fontWeight:700, color:"#0F1B2D" }}>{b.name}</span>
                <span style={{ fontFamily:"var(--sans)", fontSize:10, fontWeight:700, color: i===0 ? "var(--tar)" : "#2563EB", background: i===0 ? "#FFF0F2" : "#EFF6FF", padding:"2px 9px", borderRadius:12, textTransform:"uppercase", letterSpacing:0.5 }}>{roleOf(i)}</span>
              </div>
              <div style={{ fontFamily:"var(--sans)", fontSize:12, color:"#6B7280", marginBottom:14 }}>{b.email} · {b.phone}</div>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:6, fontFamily:"var(--sans)", fontSize:12, color:"#16A34A", fontWeight:600 }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background:"#16A34A" }} /> Activo
                </span>
                <button style={{ background:"none", border:"1px solid #E5E5E4", padding:"6px 14px", borderRadius:16, fontFamily:"var(--sans)", fontSize:12, color:"#6B7280", cursor:"pointer", fontWeight:500 }}>Editar acceso</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── AJUSTES TAB ───────────────────────────────────────────────────────────────
const AjustesTab = () => {
  // Webhooks salientes y llaves de API entrantes (PRD §5.5).
  const webhooksOut = [
    { name:"HubSpot — Leads",      url:"https://api.hubspot.com/webhooks/ingest",  events:["lead.created","lead.status_changed"], active:true,  desc:"Envía cada lead a HubSpot en tiempo real para darle seguimiento desde tu CRM.", delivery:{ ok:true, text:"Última entrega: hace 5 min · 200 OK" } },
    { name:"Zapier — Propiedades", url:"https://hooks.zapier.com/hooks/catch/123",  events:["property.published","property.status_changed"], active:true,  desc:"Dispara automatizaciones en Zapier al publicar o cambiar el estatus de una propiedad.", delivery:{ ok:true, text:"Última entrega: hace 1 h · 200 OK" } },
    { name:"CRM interno",          url:"https://crm.tarinternacional.mx/webhooks",  events:["lead.created"], active:false, desc:"Avisa a tu CRM cada vez que entra un lead nuevo.", delivery:{ ok:null, text:"Sin entregas — webhook inactivo" } },
  ];
  const apiKeys = [
    { name:"Zapier (entrante)",  scopes:["leads:write"], lastUsed:"hace 2 h" },
    { name:"Integración CRM",    scopes:["leads:write","properties:write"], lastUsed:"hace 3 d" },
  ];
  // Catálogo de eventos disponibles para los webhooks salientes (qué los dispara).
  const EVENTS = [
    ["lead.created",            "Entra un nuevo lead (contacto o cita)."],
    ["lead.status_changed",     "Cambia el estatus de un lead en el pipeline (Nuevo → Cita agendada → Cita concretada → Apartado → Firma de contrato)."],
    ["property.published",      "Se publica una propiedad (pasa a “disponible”)."],
    ["property.status_changed", "Cambia el estatus comercial (apartado, vendido, rentado…)."],
  ];
  // Qué permite hacer cada scope a un tercero (webhooks entrantes).
  const SCOPE_DESC = {
    "leads:write":      "Actualizar el estatus de leads",
    "properties:write": "Actualizar el estatus de propiedades",
  };
  const eventChip = (e) => (
    <span key={e} style={{ fontFamily:"var(--mono)", fontSize:10, color:"#374151", background:"#F1F1F0", padding:"2px 8px", borderRadius:10 }}>{e}</span>
  );
  const cards = [
    { title:"Notificaciones",     desc:"Emails automáticos a los usuarios del panel ante nuevos leads y cambios de estatus." },
    { title:"Usuarios y permisos",desc:"Altas, bajas y roles (Administrador / Editor) de los usuarios del panel." },
    { title:"SEO global",         desc:"Sitemap, robots.txt, schema.org y meta tags por defecto." },
  ];
  const card = { background:"#fff", borderRadius:14, border:"1px solid #F1F1F0", padding:"22px 24px" };

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:"var(--display)", fontSize:30, fontWeight:600, color:"#0F1B2D", letterSpacing:-0.5 }}>Ajustes</h1>
        <p style={{ fontFamily:"var(--sans)", fontSize:14, color:"#6B7280", marginTop:4 }}>Configuración general de la plataforma.</p>
      </div>

      {/* Integraciones (Webhooks) — apartado visible */}
      <div style={{ ...card, marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
          <div>
            <h2 style={{ fontFamily:"var(--display)", fontSize:19, fontWeight:700, color:"#0F1B2D" }}>Integraciones · Webhooks</h2>
            <p style={{ fontFamily:"var(--sans)", fontSize:13, color:"#6B7280", marginTop:3, maxWidth:620, lineHeight:1.6 }}>Conecta TAR con tus herramientas (CRM, Zapier, HubSpot…) sin intermediarios de pago. Hay dos direcciones:</p>
          </div>
        </div>

        {/* Explicación de qué pasa en cada dirección */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:14 }}>
          <div style={{ background:"#FAFAF8", border:"1px solid #F1F1F0", borderRadius:12, padding:"14px 16px" }}>
            <div style={{ fontFamily:"var(--sans)", fontSize:13, fontWeight:700, color:"#0F1B2D", marginBottom:4 }}>→ Salientes (TAR avisa a terceros)</div>
            <div style={{ fontFamily:"var(--sans)", fontSize:12, color:"#6B7280", lineHeight:1.6 }}>Cuando ocurre un evento en TAR (p. ej. entra un lead), la plataforma <strong>envía un aviso (POST)</strong> a la URL que configures, para que tu CRM o Zapier reaccionen automáticamente.</div>
          </div>
          <div style={{ background:"#FAFAF8", border:"1px solid #F1F1F0", borderRadius:12, padding:"14px 16px" }}>
            <div style={{ fontFamily:"var(--sans)", fontSize:13, fontWeight:700, color:"#0F1B2D", marginBottom:4 }}>← Entrantes (terceros actualizan TAR)</div>
            <div style={{ fontFamily:"var(--sans)", fontSize:12, color:"#6B7280", lineHeight:1.6 }}>Con una <strong>llave de API</strong>, un sistema externo puede actualizar datos en TAR (p. ej. marcar un lead como cerrado) llamando a la plataforma de forma segura.</div>
          </div>
        </div>

        {/* Salientes */}
        <div style={{ marginTop:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontFamily:"var(--sans)", fontSize:12, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:1 }}>Salientes (TAR → terceros)</span>
            <button style={{ display:"inline-flex", alignItems:"center", gap:6, background:"var(--tar)", color:"#fff", border:"none", padding:"8px 16px", borderRadius:20, fontFamily:"var(--sans)", fontSize:12, fontWeight:600, cursor:"pointer" }}><I3Plus s={13}/> Nuevo webhook</button>
          </div>
          <div style={{ border:"1px solid #F1F1F0", borderRadius:12, overflow:"hidden" }}>
            {webhooksOut.map((w, i) => (
              <div key={w.name} style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"16px", borderTop: i>0 ? "1px solid #F7F7F6" : "none" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"var(--sans)", fontSize:14, fontWeight:600, color:"#0F1B2D" }}>{w.name}</div>
                  <div style={{ fontFamily:"var(--sans)", fontSize:12, color:"#6B7280", lineHeight:1.5, marginTop:3 }}>{w.desc}</div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"#9CA3AF", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", marginTop:8 }}>{w.url}</div>
                  <div style={{ fontFamily:"var(--sans)", fontSize:11, color:"#9CA3AF", marginTop:8, marginBottom:5 }}>Se dispara con:</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>{w.events.map(eventChip)}</div>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:6, marginTop:10, fontFamily:"var(--sans)", fontSize:11, color: w.delivery.ok ? "#16A34A" : "#9CA3AF" }}>
                    <span style={{ width:7, height:7, borderRadius:"50%", background: w.delivery.ok ? "#16A34A" : "#D1D5DB" }} />{w.delivery.text}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
                  <span style={{ fontFamily:"var(--sans)", fontSize:11, fontWeight:600, color: w.active ? "#16A34A" : "#9CA3AF" }}>{w.active ? "Activo" : "Inactivo"}</span>
                  <button title="Editar" style={{ background:"none", border:"1px solid #E5E5E4", padding:"6px 10px", cursor:"pointer", color:"#6B7280", borderRadius:14 }}><I3Edit s={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cómo se entregan los webhooks salientes */}
        <div style={{ marginTop:14, background:"#FFF8E1", border:"1px solid #FCD34D", borderRadius:12, padding:"12px 16px", fontFamily:"var(--sans)", fontSize:12, color:"#92400E", lineHeight:1.7 }}>
          <strong>¿Qué pasa al dispararse?</strong> TAR envía un <strong>POST</strong> con los datos del evento, firmado con <strong>HMAC-SHA256</strong> (header <span style={{ fontFamily:"var(--mono)", background:"rgba(0,0,0,0.06)", padding:"1px 5px", borderRadius:4 }}>X-TAR-Signature</span>) para que el receptor verifique que viene de TAR. Si el destino no responde, se <strong>reintenta hasta 5 veces</strong> con espera creciente (30s, 2m, 10m, 1h, 6h) y queda registro de cada intento.
        </div>

        {/* Catálogo de eventos */}
        <div style={{ marginTop:16 }}>
          <div style={{ fontFamily:"var(--sans)", fontSize:12, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Eventos disponibles</div>
          <div style={{ border:"1px solid #F1F1F0", borderRadius:12, overflow:"hidden" }}>
            {EVENTS.map(([ev, d], i) => (
              <div key={ev} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 16px", borderTop: i>0 ? "1px solid #F7F7F6" : "none", flexWrap:"wrap" }}>
                <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"#0F1B2D", background:"#F1F1F0", padding:"3px 9px", borderRadius:10, flexShrink:0, minWidth:172 }}>{ev}</span>
                <span style={{ fontFamily:"var(--sans)", fontSize:12, color:"#6B7280" }}>{d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Entrantes (API keys) */}
        <div style={{ marginTop:22 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontFamily:"var(--sans)", fontSize:12, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:1 }}>Entrantes · Llaves de API (terceros → TAR)</span>
            <button style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#fff", color:"#374151", border:"1px solid #E5E5E4", padding:"8px 16px", borderRadius:20, fontFamily:"var(--sans)", fontSize:12, fontWeight:600, cursor:"pointer" }}><I3Plus s={13}/> Nueva llave</button>
          </div>
          <div style={{ border:"1px solid #F1F1F0", borderRadius:12, overflow:"hidden" }}>
            {apiKeys.map((k, i) => (
              <div key={k.name} style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"16px", borderTop: i>0 ? "1px solid #F7F7F6" : "none" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"var(--sans)", fontSize:14, fontWeight:600, color:"#0F1B2D" }}>{k.name}</div>
                  <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>{k.scopes.map(eventChip)}</div>
                  <div style={{ fontFamily:"var(--sans)", fontSize:12, color:"#6B7280", marginTop:8, lineHeight:1.5 }}>Puede: {k.scopes.map(sc => SCOPE_DESC[sc] || sc).join(" · ")}.</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
                  <span style={{ fontFamily:"var(--sans)", fontSize:11, color:"#9CA3AF" }}>Último uso: {k.lastUsed}</span>
                  <button style={{ background:"none", border:"1px solid #FECACA", padding:"6px 12px", cursor:"pointer", color:"#DC2626", borderRadius:14, fontFamily:"var(--sans)", fontSize:12, fontWeight:500 }}>Revocar</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:10, fontFamily:"var(--sans)", fontSize:12, color:"#6B7280", lineHeight:1.7 }}>
            El sistema externo llama a <span style={{ fontFamily:"var(--mono)", background:"#F1F1F0", padding:"1px 5px", borderRadius:4, color:"#0F1B2D" }}>POST /webhooks/inbound</span> con su llave en el header <span style={{ fontFamily:"var(--mono)", background:"#F1F1F0", padding:"1px 5px", borderRadius:4, color:"#0F1B2D" }}>X-API-Key</span>. La llave completa solo se muestra <strong>una vez</strong>, al crearla; después se guarda cifrada.
          </div>
        </div>
      </div>

      {/* Otros ajustes (sin Marca/Branding ni Facturación) */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        {cards.map(s => (
          <div key={s.title} style={{ ...card, cursor:"pointer", transition:"box-shadow 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow="0 6px 16px rgba(0,0,0,0.06)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow="none"}>
            <div style={{ fontFamily:"var(--display)", fontSize:16, fontWeight:700, color:"#0F1B2D", marginBottom:6 }}>{s.title}</div>
            <div style={{ fontFamily:"var(--sans)", fontSize:13, color:"#6B7280", lineHeight:1.6 }}>{s.desc}</div>
            <div style={{ marginTop:14, fontFamily:"var(--sans)", fontSize:12, fontWeight:600, color:"var(--tar)" }}>Configurar →</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── ROOT Admin component ──────────────────────────────────────────────────────
const Admin3 = ({ onNavigate }) => {
  const [tab, setTab] = React.useState("dashboard");
  return (
    <AdminShell tab={tab} setTab={setTab} onNavigate={onNavigate}>
      {tab === "dashboard"   && <DashboardTab />}
      {tab === "propiedades" && <PropertiesTab onNavigate={onNavigate} setTab={setTab} />}
      {tab === "nueva"       && <NewPropertyTab setTab={setTab} />}
      {tab === "leads"       && <LeadsTab />}
      {tab === "usuarios"    && <UsuariosTab />}
      {tab === "scripts"     && <ScriptsTab />}
      {tab === "ajustes"     && <AjustesTab />}
    </AdminShell>
  );
};

Object.assign(window, { Admin3 });
