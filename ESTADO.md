# ESTADO — Plataforma TAR Internacional

> **Partida guardada del proyecto.** Este archivo (+ `git log`) es lo ÚNICO que se lee al iniciar sesión. NO releer el PRD, el plan ni el código completos: consultar solo la sección puntual que toque la tarea en curso. Se regenera (se sobrescribe) al final de cada sesión.

**Última actualización:** 2026-09-06 · sesión: **PUESTA EN PRODUCCIÓN**. El portal está desplegado y corriendo en el VPS con el inventario real cargado. Falta un registro DNS (del cliente) para que salga a internet con HTTPS.

**Fase actual:** **Lanzamiento** (semana 16 del cronograma; se llegó adelantado). Avance global ~99%. Lo que queda depende del cliente o solo se mide con el dominio en línea.

---

## Producción — datos de acceso
- **Servidor:** `194.238.29.19` (Hostinger, Ubuntu 24.04.4 LTS, 4 vCPU / 7.8 GB / 96 GB).
- **Acceso:** `ssh deploy@194.238.29.19` con llave ed25519 (`~/.ssh/id_ed25519` en el equipo de GBS). **Root por SSH está cerrado** y la autenticación por contraseña desactivada. `deploy` tiene `sudo` sin contraseña (`/etc/sudoers.d/90-deploy`).
- **Código:** `/opt/tar` · **Imágenes:** `/srv/tar/media` (100 MB) · **`.env`:** `/opt/tar/.env` (600).
- **Dominio previsto:** `propiedades.tarinternacional.com.mx` (**pendiente de DNS**).
- **Panel:** `/admin` — administrador `sistemas@gbs-digital.com` (contraseña provisional entregada aparte; cambiar al entrar).

## Lo hecho en esta sesión (2026-09-06)
1. **Aprovisionamiento completo del VPS** según `SETUP_SERVIDOR_UBUNTU.md`: usuario `deploy`, UFW (solo 22/80/443 — 5432 y 4000 cerrados), fail2ban, zona horaria CDMX, swap de 2 GB, `unattended-upgrades`, Docker 29.8.0 + Compose v5.5.1 con rotación de logs, y hardening de SSH.
2. **Stack desplegado** con `./infra/deploy.sh`: `tar-db` (PostGIS 16-3.4), `tar-api`, `tar-web` y `tar-caddy`, los cuatro sanos. La API ve la base y PostGIS.
3. **Inventario real importado:** 105 propiedades creadas (35 venta / 70 renta), **1173 imágenes descargadas y 18 caídas**. Todas quedan en `borrador`.
4. **Geocodificación con Nominatim** (`geocode:borrador`), que no requiere cuenta de Google: **87 exactas a nivel de calle, 18 aproximadas (centro de colonia o municipio), 0 sin resultado**. Las 105 tienen coordenadas.

### Tres fallos reales encontrados al desplegar (corregidos)
- **`4e43c13`** — El Caddyfile tenía fijo el bloque `www.{$SITE_DOMAIN}`. Con un subdominio, Caddy pedía certificado para un nombre inexistente y reintentaba contra Let's Encrypt gastando cupo. Ahora la redirección `www` es opcional (`infra/caddy-sites/www-redirect.caddy.example`), solo para dominios raíz.
- **`1774039`** — La API entraba en **bucle de reinicio** porque `LEADS_NOTIFY_TO=` vacío no pasa `.email()` aunque el campo sea opcional (igual pasaría con `PUBLIC_API_URL` y `.url()`). Las variables vacías ahora se descartan antes de validar.
- **`2c834d3`** — La imagen de producción no lleva `tsx` ni la carpeta `scripts/`, así que **el inventario no se podía importar en el servidor**. `import-inventario` y `geocode-borrador` se compilan al bundle, con entradas nombradas para que `dist/` siga plano (con lista, tsup replicaba carpetas y rompía el CMD del contenedor).
- **`38cb5ac`** — El manual de despliegue no documentaba la importación en producción: nueva §2.7.

## Siguiente (máx. 3)
1. **DNS:** falta el registro `propiedades A 194.238.29.19` (lo gestiona Byteware, `dns.byteware.com.mx`). En cuanto resuelva: `docker compose -f infra/docker-compose.prod.yml restart caddy` y el certificado se emite solo. Verificado ya que el enrutado funciona (HTTP→HTTPS devuelve 308); solo falta el certificado.
2. **Revisar y publicar** las 105 propiedades desde el panel: siguen en `borrador` a propósito. Muchas tienen el pin **aproximado** (centro de colonia o de municipio) y hay que ajustarlo con el pin arrastrable.
3. **Fase QA:** Lighthouse y métricas §9 contra el dominio real, que solo se pueden medir en línea.

## Pendiente del cliente
- **El registro DNS** (bloquea la salida a internet).
- **Datos oficiales:** `LEADS_NOTIFY_TO` (correo que recibe los prospectos) y `SENDGRID_API_KEY`; sin ellos el formulario de contacto guarda el lead pero no manda correo.
- **Respaldos:** credenciales de Cloudflare R2 (`R2_*`) para la copia off-site; el respaldo local aún no está en cron.
- **Confirmar el tipo de cambio** `USD_MXN_RATE` (hoy 18.50).
- Marcar en el panel qué propiedades son **exclusivas**.
- **No cancelar EasyBroker todavía** si se quiere reintentar las 18 imágenes caídas: al cancelar, esas fotos desaparecen.

## Recordatorio
Lee solo la sección del PRD/plan que toque la tarea actual. No releas todo.
