# Informe ejecutivo de avance — Plataforma TAR Internacional

**Preparado por:** GBS Digital · **Para:** TAR Internacional · **Corte:** 2026-06-11

---

## Resumen en una línea
La plataforma ya tiene **el motor (backend) y el panel de administración terminados y
probados**; el equipo de TAR ya podría **operar todo el catálogo y el CRM**. Solo falta
el sitio público, que **espera la firma del diseño**. Vamos **muy adelantados**.

## Tablero de avance

```
Avance global  ████████████████░░░░  ~82%
```

| # | Fase | Qué incluye | Estado |
|---|---|---|:---:|
| 0 | Cimientos | Entorno, base de datos, CI | ✅ Completa |
| 1 | Datos + Prototipo | Modelo de datos · prototipo de diseño revisado | ✅ Completa (técnica) |
| A | **Backend (motor)** | Login, propiedades, imágenes, leads/CRM, webhooks, importador, documentación | ✅ **Completa** |
| C | **Panel de administración** | Donde el equipo publica y gestiona todo | ✅ **Completa** |
| B | Sitio público | El portal que ven los clientes finales | ⛔ Espera **firma del diseño** |
| QA | Pruebas y rendimiento | Auditorías, optimización | ⏳ Pendiente |
| — | Lanzamiento | Servidor, respaldos, capacitación | ⏳ Pendiente |

> **Estado vs cronograma:** según el contrato, a estas alturas íbamos por la semana 8;
> el trabajo de las semanas 1–8 (Fases 0, 1, A y **C**) ya está **completo y probado**.
> Adelanto sin costo (§13).

## Hitos logrados
- **Base sólida y segura:** base de datos geográfica profesional, login cifrado de
  operadores con roles, y todas las medidas de seguridad estándar.
- **Catálogo completo:** alta/edición/publicación de propiedades, **buscador con
  filtros**, **mapa por zona**, fichas, e **imágenes que se optimizan solas**.
- **Captación de clientes (leads) + CRM:** formulario con anti-spam y aviso de
  privacidad, y un **CRM con el pipeline del negocio** (Nuevo → Cita → Apartado →
  Firma).
- **Integraciones (webhooks):** la plataforma avisa a sistemas externos (CRM/Zapier) y
  también puede recibir actualizaciones de ellos, de forma **segura y confiable**.
- **Migración del inventario:** herramienta lista y probada con el **archivo real de
  105 propiedades** del cliente.
- **Panel de administración COMPLETO (Fase C):** el equipo de TAR ya puede, desde una
  sola interfaz no técnica, **publicar y gestionar propiedades** (con asistente,
  imágenes y ubicación), **atender prospectos** en el CRM, **administrar usuarios**,
  **conectar integraciones** y **colocar scripts de marketing**. Incluye **manual de
  administración**.
- **Diseño:** prototipo revisado contigo y ajustado (panel, CRM, mapa, etc.), listo
  para publicar y firmar.

## Lo que el cliente ya puede ver / probar
- **Panel de administración en vivo** — recorrido completo: dashboard, alta y
  publicación de propiedades, CRM de leads, usuarios, integraciones y scripts.
- **Prototipo de diseño** navegable (para revisión y firma).
- **Documentación interactiva de la plataforma** (se puede “probar” cada función) y el
  **manual de administración** (`docs/MANUAL-ADMIN.md`).
- **Base de datos** y un recorrido automático que demuestra que todo funciona.
> *(Instrucciones técnicas para mostrarlo: `docs/PUESTA-EN-MARCHA.md`.)*

## Pendientes y lo que necesitamos del cliente
| Pendiente | ¿Para qué? | ¿Bloquea? |
|---|---|---|
| **Firmar el prototipo de diseño** | Construir el sitio público | Sí (Fase B) |
| API key de **Google Maps** | Mapa real + ubicar propiedades al importar | Parcial |
| Cuenta de **SendGrid** | Enviar emails de nuevos prospectos | No (mientras tanto, no envía) |
| **Dominio**, **servidor** y respaldos (R2) | Salir a producción | En Lanzamiento |

## Próximos pasos
1. **Publicar el prototipo** para que TAR lo revise y firme → desbloquea el sitio público.
2. Tras la firma: construir el **sitio público (Fase B)**.
3. En paralelo, al recibir accesos: **aprovisionar el servidor** (Fase QA/Lanzamiento).

---

### Detalle por semana
Reportes semanales y quincenales con el detalle completo en esta misma carpeta
(`docs/reportes/`). El backlog completo y su estado están en `PLAN_EJECUCION_FASES.md`.

### Cómo exportar este informe a PDF (para presentarlo)
- En **VS Code**: instala la extensión *“Markdown PDF”* (yzane) → clic derecho sobre
  este archivo → *“Markdown PDF: Export (pdf)”*.
- O abre el archivo en GitHub/visor Markdown y usa **Imprimir → Guardar como PDF**.
