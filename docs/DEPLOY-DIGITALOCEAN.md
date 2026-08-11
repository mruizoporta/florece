# Deploy Florece en DigitalOcean (droplet compartido)

## Servidor

| | |
|--|--|
| IP | `209.38.139.227` |
| SSH | `ssh -i ~/.ssh/id_ed25519 root@209.38.139.227` |
| Ya corre | **Cifra** (`usacifra.com`, API `:3010`) · **DealerFlow** (`getdealerflowai.com`) |
| Florece (este deploy) | https://floreceapp.com (respaldo http://209.38.139.227:8090) |
| Postgres DB | `salon_saas` (usuario `shearly`, ya existe) |
| Puertos internos | API Nest `3020` · Web Next `3021` · nginx público `8090` |

## Publicar desde tu Mac

```bash
chmod +x scripts/deploy-droplet.sh
./scripts/deploy-droplet.sh
```

El script:

1. `rsync` → `/opt/florece`
2. Crea `/opt/florece/.env` la primera vez (JWT + `DATABASE_URL` desde el `.env` local)
3. `npm install` + build shared/api/web + seed
4. Instala systemd (`florece-api`, `florece-web`) + nginx site `florece`
5. Abre UFW `8090/tcp` si aplica

Variables opcionales: `FLORECE_DEPLOY_HOST`, `FLORECE_REMOTE_DIR`, `FLORECE_PUBLIC_URL`, `FLORECE_DATABASE_URL`.

## Demo

- Panel: https://floreceapp.com/login  
  slug `demo` · `admin@demo.florece.app` · `demo1234`
- Sitio: https://floreceapp.com/s/demo
- Plataforma: slug `ops` · `owner@florece.app` · `florece-owner-2026`
- Respaldo IP: http://209.38.139.227:8090

## Dominio

DNS: `floreceapp.com` + `www` → `209.38.139.227`.

El deploy actualiza nginx, URLs en `.env` y pide cert Let's Encrypt con certbot si aún no existe.

## Logs

```bash
ssh root@209.38.139.227 'journalctl -u florece-api -u florece-web -f'
```
