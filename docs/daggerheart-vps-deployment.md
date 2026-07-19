# Daggerheart VPS Deployment

This is the canonical deployment reference for:

```text
https://daggerheart.dragorussogames.com/
```

## Confirmed VPS Configuration

- OSRIC repository (do not use for Daggerheart): `/opt/russo-bot/source`
- Daggerheart repository: `/opt/russo-bot/daggerheart-source`
- Git branch: `codex/daggerheart-player-portal`
- Nginx document root: `/opt/russo-bot/daggerheart-source/daggerheart`
- Nginx site: `/etc/nginx/sites-available/daggerheart.dragorussogames.com`

Nginx serves the `daggerheart/` directory directly from its dedicated checkout. Never switch `/opt/russo-bot/source` to the Daggerheart branch; that checkout runs the OSRIC backend and DM portal.

## Normal Deployment

After the local branch has been committed and pushed, run this on the VPS:

```bash
cd /opt/russo-bot/daggerheart-source
git pull --ff-only origin codex/daggerheart-player-portal
```

Static file changes take effect immediately. Nginx does not need to be reloaded unless its configuration changed.

## Backend or Database Changes

When a release changes `daggerheart-backend/` or adds an Alembic migration, use this complete deployment instead of the static-only command:

```bash
cd /opt/russo-bot/daggerheart-source
git pull --ff-only origin codex/daggerheart-player-portal

cd /opt/russo-bot/daggerheart-source/daggerheart-backend
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m alembic upgrade head
systemctl restart daggerheart-backend
systemctl status daggerheart-backend --no-pager
curl https://daggerheart.dragorussogames.com/api/health
```

The expected health response is:

```json
{"ok":true,"service":"daggerheart"}
```

## First-Time Branch Setup Only

Run these commands once to separate Daggerheart from the OSRIC checkout:

```bash
cd /opt/russo-bot
git clone --branch codex/daggerheart-player-portal --single-branch https://github.com/chancerusso/dragorussogames-web.git daggerheart-source

cp /etc/nginx/sites-available/daggerheart.dragorussogames.com /etc/nginx/sites-available/daggerheart.dragorussogames.com.bak-20260718
sed -i 's#root /opt/russo-bot/source/daggerheart;#root /opt/russo-bot/daggerheart-source/daggerheart;#' /etc/nginx/sites-available/daggerheart.dragorussogames.com

nginx -t
systemctl reload nginx
```

## Verify

```bash
curl -I https://daggerheart.dragorussogames.com/daggerheart.css
```

Expected result: `HTTP/1.1 200 OK`.
