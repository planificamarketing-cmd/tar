# SETUP_SERVIDOR_UBUNTU.md — Aprovisionamiento del servidor (TAR Internacional)

Guía paso a paso para configurar el VPS de producción/staging desde cero. **Ejecutar en orden.** Sistema objetivo: **Ubuntu 24.04 LTS**, 8GB RAM / 2 vCPU / 100GB NVMe (DigitalOcean, Hetzner, Vultr o Hostinger — cuenta del cliente).

> Decisión de arquitectura: **PostgreSQL 16 + PostGIS dedicado vía Docker, NO Supabase self-hosted** (ver ADR-001 en `PRD_Plataforma_TAR.md` §2.1). Supabase duplicaría auth/API/storage ya contratados y consumiría ~la mitad de la RAM del VPS en ~12 contenedores que no usamos.

---

## 0. Requisitos previos

- VPS creado con Ubuntu 24.04 LTS y acceso root inicial (contraseña o llave del proveedor).
- Dominio del cliente con acceso al DNS. Crear registros A → IP del VPS:
  - `www.tarinternacional.com` (sitio) · `tarinternacional.com` (redirige a www)
  - `api.tarinternacional.com` (API) · `staging.tarinternacional.com` (preview QA)
  - *(los dominios son placeholders: usar el dominio real del cliente)*
- Llave SSH generada en la máquina local: `ssh-keygen -t ed25519 -C "deploy-tar"`.

---

## 1. Acceso inicial y usuario de despliegue

```bash
ssh root@IP_DEL_VPS

# Crear usuario sin privilegios root directos
adduser deploy
usermod -aG sudo deploy

# Copiar la llave pública al nuevo usuario
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

Verifica en otra terminal **antes de continuar**: `ssh deploy@IP_DEL_VPS`.

## 2. Hardening de SSH

```bash
sudo nano /etc/ssh/sshd_config
```
Ajustar:
```
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
MaxAuthTries 3
```
```bash
sudo systemctl restart ssh
```
> En Ubuntu 24.04 revisa también `/etc/ssh/sshd_config.d/*.conf`: cualquier archivo ahí puede sobreescribir estas directivas (p. ej. `50-cloud-init.conf` con `PasswordAuthentication yes`).

## 3. Firewall (UFW) y fail2ban

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ufw fail2ban

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

fail2ban para SSH:
```bash
sudo tee /etc/fail2ban/jail.local > /dev/null <<'EOF'
[sshd]
enabled = true
maxretry = 4
bantime = 1h
findtime = 10m
EOF
sudo systemctl enable --now fail2ban
```

**Regla crítica:** los puertos 5432 (PostgreSQL) y 4000 (API) **nunca** se exponen en UFW. Solo Caddy (80/443) es público; el resto vive en la red interna de Docker.

## 4. Sistema base

```bash
# Zona horaria y locale
sudo timedatectl set-timezone America/Mexico_City

# Swap de 2GB (colchón para builds de Next.js)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.d/99-tar.conf

# Actualizaciones de seguridad automáticas
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 5. Docker y Docker Compose

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker deploy
# Cerrar sesión y volver a entrar para aplicar el grupo
docker --version && docker compose version
```

Configurar rotación de logs de Docker:
```bash
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "3" } }
EOF
sudo systemctl restart docker
```

## 6. Despliegue de la plataforma

```bash
# Como usuario deploy
sudo mkdir -p /opt/tar && sudo chown deploy:deploy /opt/tar
cd /opt/tar
git clone git@github.com:GBS-Digital/tar-internacional.git .   # repo privado (deploy key de solo lectura)

# Variables de entorno de producción (NUNCA commiteadas)
cp .env.example .env
nano .env        # llenar secretos: DATABASE_URL, JWT_*, MEDIA_DIR, SENDGRID, MAPS

# Levantar
./infra/deploy.sh   # git pull → build → migraciones → docker compose up -d → healthcheck
```

Servicios del `docker-compose.yml` (§11 del PRD): `db` (postgis/postgis:16-3.4, volumen `pgdata`, **sin puertos publicados al host**), `api` (corre migraciones al arrancar + worker pg-boss), `web` (Next standalone), `caddy` (80/443, TLS automático).

Verificación:
```bash
docker compose ps
curl -fsS https://api.tarinternacional.com/api/v1/health
```

## 7. Respaldos automatizados (PRD §14)

El almacenamiento de imágenes vive en el propio VPS: volumen `/srv/tar/media` (bind mount al contenedor `api`; Caddy lo sirve como estático con `Cache-Control` largo).

Esquema de 3 capas:

**Capa 1 — Local:** `infra/backup/backup.sh`: `pg_dump` + tar de `/srv/tar/media` → `/var/backups/tar`, retención 30 días con rotación automática.

**Capa 2 — Off-site en Cloudflare R2** (cuenta del cliente; S3-compatible, sin costos de egreso, 10GB gratuitos que sobran para este volumen):
```bash
sudo apt install -y rclone

# Crear en el dashboard de Cloudflare: bucket `tar-respaldos` + API token R2 (Object Read & Write)
rclone config create r2 s3 \
  provider=Cloudflare \
  access_key_id=$R2_ACCESS_KEY_ID \
  secret_access_key=$R2_SECRET_ACCESS_KEY \
  endpoint=https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com \
  acl=private

# Verificar
rclone lsd r2:tar-respaldos
```
El propio `backup.sh` termina con la sincronización: `rclone sync /var/backups/tar r2:tar-respaldos/$(hostname) --transfers 4`. La retención en R2 se gestiona con regla de ciclo de vida del bucket (30–60 días) desde el dashboard de Cloudflare.

**Capa 3 — Snapshots de Hostinger:** verificar en hPanel que los respaldos automatizados del VPS estén activos.

Monitorear espacio: el dimensionamiento es holgado (≈1 GB por cada ~100 propiedades con 15 fotos WebP), pero agregar `df -h` a la revisión mensual y una alerta si `/` supera 80%.

```bash
# Cron diario 03:00 (hora CDMX)
crontab -e
0 3 * * * /opt/tar/infra/backup/backup.sh >> /var/log/tar-backup.log 2>&1
```

**Prueba de restore obligatoria antes del go-live:** restaurar en contenedor limpio **desde R2** (escenario de pérdida total del VPS) siguiendo `docs/README-DEPLOY.md`; objetivo contractual <2h.

## 8. Monitoreo

- **UptimeRobot** (gratuito): monitores HTTP a `https://www.tarinternacional.com` y al endpoint `/health` de la API, alertas al correo del cliente. La configuración inicial está dentro del alcance.
- Logs: `docker compose logs -f api` (pino JSON). Rotación ya configurada en el daemon (§5).
- Espacio en disco: `df -h` mensual; los respaldos rotan solos.

## 9. Staging

Mismo VPS, compose override:
```bash
docker compose -f infra/docker-compose.yml -f infra/docker-compose.staging.yml up -d
```
Expuesto en `staging.tarinternacional.com` (Caddy lo enruta), con BD separada (`tar_portal_staging`) y `robots.txt` en `Disallow: /` + auth básica en Caddy para que Google no lo indexe. Aquí se corren las auditorías Lighthouse de la FASE QA con seed realista.

## 10. Checklist de cierre del aprovisionamiento

- [ ] Login root deshabilitado; solo `deploy` con llave SSH.
- [ ] UFW activo (22/80/443 únicamente); fail2ban corriendo.
- [ ] Zona horaria `America/Mexico_City`; swap activo; unattended-upgrades habilitado.
- [ ] Docker con rotación de logs; PostgreSQL sin puertos públicos.
- [ ] TLS válido en www/api/staging (Caddy/Let's Encrypt).
- [ ] `deploy.sh` funcional; healthcheck en verde.
- [ ] Cron de respaldo corriendo y **restore probado** (<2h).
- [ ] UptimeRobot configurado y alertando.
- [ ] Credenciales del servidor documentadas para la entrega formal (PRD §15).
