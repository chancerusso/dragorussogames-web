# Deployment Instructions

These instructions describe the intended DigitalOcean VPS deployment from a checked-out `dragorussogames-web` repo.

## Server Paths

```text
/opt/dragorussogames-web/source
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
cd /opt/dragorussogames-web/source/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set backend values in `.env`:

```text
DATABASE_URL=
ADMIN_PASSWORD=
SECRET_KEY=
CORS_ORIGINS=https://dm.dragorussogames.com,https://dragorussogames.com,https://www.dragorussogames.com,https://russo.dragorussogames.com
```

Then run:

```bash
alembic upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 8010
```

## Bot

```bash
cd /opt/dragorussogames-web/source/discord-bot
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

## DM Portal Frontend

```bash
cd /opt/dragorussogames-web/source/frontend
npm install
VITE_API_BASE_URL=https://dm.dragorussogames.com/api npm run build
sudo rsync -a --delete dist/ /var/www/dm.dragorussogames.com/
```

## systemd

Example backend unit: `/etc/systemd/system/russo-backend.service`

```ini
[Unit]
Description=RUSSO FastAPI Backend
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/dragorussogames-web/source/backend
EnvironmentFile=/opt/dragorussogames-web/source/backend/.env
ExecStart=/opt/dragorussogames-web/source/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8010
Restart=always
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

Example bot unit: `/etc/systemd/system/discord-bot.service`

```ini
[Unit]
Description=RUSSO Discord Bot
After=network.target russo-backend.service

[Service]
WorkingDirectory=/opt/dragorussogames-web/source/discord-bot
EnvironmentFile=/opt/dragorussogames-web/source/discord-bot/.env
ExecStart=/usr/bin/node dist/index.js
Restart=always
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

## nginx

Example API site for `russo.dragorussogames.com`:

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

Example frontend site for `dm.dragorussogames.com`:

```nginx
server {
    server_name dm.dragorussogames.com;
    root /var/www/dm.dragorussogames.com;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8010/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri /index.html;
    }
}
```

Example player portal site for `classic.dragorussogames.com`:

```nginx
server {
    server_name classic.dragorussogames.com;
    root /var/www/classic.dragorussogames.com;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8010/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri /index.html;
    }
}
```

`dragolance.dragorussogames.com` is no longer the player portal. It should either redirect to `https://classic.dragorussogames.com/` at Nginx level or serve the same React build long enough for the client-side redirect to run.
