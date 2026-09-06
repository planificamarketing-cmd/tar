# Reporte semanal — Semana 16

**Fase del cronograma:** Lanzamiento · **Corte:** 6 de septiembre de 2026

## Objetivo de la semana
Poner la plataforma en el servidor definitivo del cliente, con el inventario real
cargado, y dejarla lista para salir a internet en cuanto el dominio apunte.

## Entregables / lo realizado

**1. El servidor quedó preparado desde cero.**
Se contrató un servidor Ubuntu 24.04 (4 procesadores, 8 GB de memoria, 96 GB de
disco) y se configuró completo: cortafuegos que solo deja pasar el tráfico web y
la administración, bloqueo automático de quien intente adivinar contraseñas,
hora de Ciudad de México, actualizaciones de seguridad automáticas y el motor de
contenedores donde vive la plataforma.

> Dato revelador: el servidor llevaba **128 intentos fallidos de acceso** de
> robots de internet antes siquiera de instalar nada. Ahora el acceso por
> contraseña está desactivado por completo; solo se entra con llave digital.

**2. La plataforma está desplegada y funcionando.**
Las cuatro piezas (base de datos, API, sitio y el repartidor de tráfico con
HTTPS) corren y se comunican entre sí. Verificado: la API responde y ve la base
de datos con sus funciones geográficas activas.

**3. El inventario real está cargado.**
Se migraron las **105 propiedades** desde EasyBroker: 35 en venta y 70 en renta,
con **1173 fotografías** descargadas y reconvertidas al formato optimizado del
portal (100 MB). Por tipo: 53 oficinas, 27 departamentos, 12 locales
comerciales, 8 bodegas industriales, 2 casas, 2 edificios y 1 terreno.

**4. Las propiedades quedaron ubicadas en el mapa sin costo.**
Como no se abrió cuenta de Google, se ubicaron con OpenStreetMap. La mayoría
quedó localizada a nivel de calle; algunas, al centro de su colonia o municipio.

## Evidencia de que funciona
- `./infra/deploy.sh` termina en verde y reporta: *"API sana"*, *"Conexión a
  PostgreSQL/PostGIS correcta"*, *"Sitio público respondiendo"*.
- Los cuatro contenedores en estado `healthy`.
- El repartidor de tráfico ya redirige correctamente de HTTP a HTTPS (código 308).
- 121 pruebas automatizadas en verde antes de cada publicación.

## Decisiones / desviaciones
- **El portal usará un subdominio**, `propiedades.tarinternacional.com.mx`, y no
  el dominio principal, que sigue ocupado por el sitio actual de TAR. No se toca
  nada de lo existente.
- **Las propiedades entran sin publicar, a propósito.** Están cargadas pero
  invisibles al público hasta que TAR las revise. Es deliberado: la ubicación
  automática puede ser aproximada y conviene comprobar el pin antes de publicar.

## Riesgos / bloqueos / pendientes del cliente
- 🔴 **Bloqueante — el registro DNS.** Hasta que
  `propiedades.tarinternacional.com.mx` apunte al servidor, el portal no puede
  emitir su certificado de seguridad ni verse desde internet. Lo gestiona un
  tercero (Byteware).
- 🟠 **No cancelar EasyBroker todavía.** 18 fotografías no se pudieron descargar
  (de 1191). Si se cancela la cuenta, esas imágenes desaparecen para siempre.
- 🟠 **Correo de prospectos.** Falta la credencial de envío y la dirección que
  debe recibirlos. Mientras tanto el formulario guarda al prospecto en el panel,
  pero no manda el aviso por correo.
- 🟠 **Respaldos fuera del servidor.** Faltan las credenciales de Cloudflare R2.
- 🟡 Confirmar el tipo de cambio del dólar que se usa para ordenar precios (18.50).

## Métricas
- 105 propiedades · 1173 imágenes · 100 MB de medios.
- 121 pruebas automatizadas en verde · 5 publicaciones de código esta semana.
- Servidor: 2.5 GB usados de 96 GB; memoria al 6%.

## Lo que sigue
1. En cuanto el dominio apunte: emitir el certificado y comprobar el portal en línea.
2. Revisar y publicar las propiedades desde el panel, ajustando los pines aproximados.
3. Medir el rendimiento (Lighthouse) contra el dominio real y activar los respaldos automáticos.

---

## Detalle técnico (referencia, opcional)

Tres defectos reales aparecieron al desplegar por primera vez, todos corregidos:

| Commit | Problema | Corrección |
|---|---|---|
| `4e43c13` | El Caddyfile pedía certificado para `www.<subdominio>`, inexistente: reintentos contra Let's Encrypt hasta agotar cupo. | La redirección `www` pasa a ser opcional, solo para dominios raíz. |
| `1774039` | La API entraba en bucle de reinicio: `LEADS_NOTIFY_TO=` vacío no pasa el validador `.email()` pese a ser opcional. | Las variables de entorno vacías se descartan antes de validar. |
| `2c834d3` | La imagen de producción no incluye `tsx` ni `scripts/`: el inventario no se podía importar en el servidor. | `import-inventario` y `geocode-borrador` se compilan al bundle con entradas nombradas (con lista, tsup replicaba carpetas y rompía el `CMD`). |

Más `38cb5ac`, que documenta el procedimiento de importación en producción
(`docs/README-DEPLOY.md` §2.7), ausente hasta ahora.

Aprovisionamiento: Docker 29.8.0 + Compose v5.5.1, PostGIS 16-3.4, UFW con solo
22/80/443 abiertos (5432 y 4000 nunca expuestos), fail2ban, swap de 2 GB,
`PermitRootLogin no` + `PasswordAuthentication no` mediante un drop-in con
prefijo `10-` (sshd toma el primer valor y `50-cloud-init.conf` lo habría ganado).
