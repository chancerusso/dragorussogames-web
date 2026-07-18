# Daggerheart Backend VPS Deployment

This service is independent from the OSRIC backend. It has its own application directory, PostgreSQL database, environment file, migrations, systemd unit, and port.

## Paths and port

- Source: `/opt/russo-bot/daggerheart-source/daggerheart-backend`
- Environment: `/opt/russo-bot/daggerheart-source/daggerheart-backend/.env`
- Service: `daggerheart-backend.service`
- Local port: `8020`
- Database: `daggerheart`

## Database

Create a dedicated PostgreSQL database and user. Do not grant access to the OSRIC database.

```sql
CREATE USER daggerheart WITH PASSWORD 'replace-with-a-private-password';
CREATE DATABASE daggerheart OWNER daggerheart;
```

## Application

```bash
cd /opt/russo-bot/daggerheart-source/daggerheart-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set the real database password, secret key, and GM bootstrap password in `.env`, then run:

```bash
source .venv/bin/activate
alembic upgrade head
```

## systemd

Create `/etc/systemd/system/daggerheart-backend.service`:

```ini
[Unit]
Description=Drago Russo Daggerheart Backend
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/russo-bot/daggerheart-source/daggerheart-backend
EnvironmentFile=/opt/russo-bot/daggerheart-source/daggerheart-backend/.env
ExecStart=/opt/russo-bot/daggerheart-source/daggerheart-backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8020
Restart=always
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

Enable it:

```bash
systemctl daemon-reload
systemctl enable --now daggerheart-backend
```

## Nginx

Add this location to the existing `daggerheart.dragorussogames.com` TLS server block:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8020/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Then validate and reload:

```bash
nginx -t
systemctl reload nginx
curl http://127.0.0.1:8020/api/health
curl https://daggerheart.dragorussogames.com/api/health
```

Both health checks should return `{"ok":true,"service":"daggerheart"}`.

## Normal backend deployment

```bash
cd /opt/russo-bot/daggerheart-source
git pull --ff-only origin codex/daggerheart-player-portal
cd daggerheart-backend
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
systemctl restart daggerheart-backend
```
