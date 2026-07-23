# Drago Russo Games Deployment Standard

This is the mandatory procedure for every Drago Russo Games deployment. Read it
from the beginning each time. Do not deploy from memory.

The commands later in this document describe the historically intended
DigitalOcean VPS layout. Before using them, verify every live value against
`docs/deployment-inventory.md`. If the server identity, source checkout, active
branch, service, database, web root, or prior deployed commit is unknown, stop.

## Deployment policy

- A push is not a deployment.
- Deploy only a reviewed full commit SHA that has been pushed to the approved
  remote branch.
- Record every deployment using `docs/deployments/TEMPLATE.md`.
- Confirm the server checkout is the expected repository and is clean before
  switching revisions.
- Verify a database backup before applying migrations.
- Review migration impact before running `alembic upgrade head`.
- Build and test before mutating production.
- Record the prior commit and a viable code rollback target.
- Never automatically downgrade the production database during a code rollback.
- Never expose or copy `private-reference/sources/` into a build, web root,
  static mount, API response, log, commit, or deployment artifact.
- Do not record secrets in work logs or deployment records.

## Required preflight

- [ ] Read `docs/work-log/PROGRESS.md` and the latest daily work log.
- [ ] Read `docs/deployment-inventory.md` and the latest deployment record.
- [ ] Fetch the remote repository and verify the exact intended full commit SHA.
- [ ] Confirm required tests and the frontend production build pass.
- [ ] Inspect the built artifact for private PDFs and source-library paths.
- [ ] Confirm the live host identity, source checkout, branch, prior commit, and
      clean server worktree.
- [ ] Confirm active services, web roots, database identity, migration state,
      backup destination, and health endpoints.
- [ ] Create the deployment record before the first production mutation.

## Required completion checks

- [ ] Expected database migration is active.
- [ ] Required services are active and not repeatedly logging new errors.
- [ ] Internal API health check passes.
- [ ] Public API and both affected portals pass focused smoke tests.
- [ ] DM-only mode/map controls appear only on `dm.dragorussogames.com`, and
      Mapper/editor/viewer/library experiences appear only on
      `classic.dragorussogames.com` with the correct authorization.
- [ ] Private source routes return no content and no source PDFs exist in served
      roots.
- [ ] Deployment record contains previous/deployed SHAs, backup, health,
      verification, and rollback outcome.
- [ ] Daily work log and `PROGRESS.md` are updated.

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
cd /opt/russo-bot/source/backend
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
CORS_ORIGINS=https://dm.dragorussogames.com,https://classic.dragorussogames.com,https://dragorussogames.com,https://www.dragorussogames.com,https://russo.dragorussogames.com
```

Then run:

```bash
alembic upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 8010
```

## Bot

```bash
cd /opt/russo-bot/source/discord-bot
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
cd /opt/russo-bot/source/frontend
npm install
VITE_API_BASE_URL=https://dm.dragorussogames.com/api npm run build
sudo rsync -a --delete dist/ /var/www/dm.dragorussogames.com/
sudo rsync -a --delete dist/ /var/www/classic.dragorussogames.com/
```

Private reference PDFs must never be copied into a served web root. Keep
`private-reference/sources/*.pdf`, `docs/sources/*.pdf`, and legacy
`content/1e/source/*.pdf` out of frontend builds, static roots, Nginx roots,
and public API/static mounts.

## systemd

Example backend unit: `/etc/systemd/system/russo-backend.service`

```ini
[Unit]
Description=RUSSO FastAPI Backend
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/russo-bot/source/backend
EnvironmentFile=/opt/russo-bot/source/backend/.env
ExecStart=/opt/russo-bot/source/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8010
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
WorkingDirectory=/opt/russo-bot/source/discord-bot
EnvironmentFile=/opt/russo-bot/source/discord-bot/.env
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

    location ^~ /private-reference/ {
        deny all;
        return 404;
    }

    location ^~ /docs/sources/ {
        deny all;
        return 404;
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

    location ^~ /private-reference/ {
        deny all;
        return 404;
    }

    location ^~ /docs/sources/ {
        deny all;
        return 404;
    }
}
```

`dragolance.dragorussogames.com` is no longer the player portal. It should either redirect to `https://classic.dragorussogames.com/` at Nginx level or serve the same React build long enough for the client-side redirect to run.
