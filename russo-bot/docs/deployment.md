# Deployment Instructions

These instructions describe the intended DigitalOcean VPS deployment. Do not run them from the static website repo.

## Server Paths

```text
/opt/russo-bot/source
```

## PostgreSQL

Create a database and service user:

```sql
CREATE DATABASE russo;
CREATE USER russo WITH PASSWORD 'replace-this';
GRANT ALL PRIVILEGES ON DATABASE russo TO russo;
```

## Backend

```bash
cd /opt/russo-bot/source/russo-bot/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set `DATABASE_URL` in `.env`, then run:

```bash
alembic upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 8010
```

## Bot

```bash
cd /opt/russo-bot/source/russo-bot/bot
npm install
cp .env.example .env
npm run build
npm run register
npm start
```

Set these values in `.env`:

```text
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=
RUSSO_API_BASE_URL=http://127.0.0.1:8010/api
```

## systemd

Example backend unit: `/etc/systemd/system/russo-backend.service`

```ini
[Unit]
Description=RUSSO FastAPI Backend
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/russo-bot/source/russo-bot/backend
EnvironmentFile=/opt/russo-bot/source/russo-bot/backend/.env
ExecStart=/opt/russo-bot/source/russo-bot/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8010
Restart=always
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

Example bot unit: `/etc/systemd/system/russo-bot.service`

```ini
[Unit]
Description=RUSSO Discord Bot
After=network.target russo-backend.service

[Service]
WorkingDirectory=/opt/russo-bot/source/russo-bot/bot
EnvironmentFile=/opt/russo-bot/source/russo-bot/bot/.env
ExecStart=/usr/bin/node dist/index.js
Restart=always
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

## nginx

Example site for `russo.dragorussogames.com`:

```nginx
server {
    server_name russo.dragorussogames.com;

    location /api/ {
        proxy_pass http://127.0.0.1:8010/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Add TLS with Certbot or the VPS standard certificate flow.
