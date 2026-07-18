# Daggerheart VPS Deployment

This is the canonical deployment reference for:

```text
https://daggerheart.dragorussogames.com/
```

## Confirmed VPS Configuration

- VPS repository: `/opt/russo-bot/source`
- Git branch: `codex/daggerheart-player-portal`
- Nginx document root: `/opt/russo-bot/source/daggerheart`
- Nginx site: `/etc/nginx/sites-available/daggerheart.dragorussogames.com`

Nginx serves the `daggerheart/` directory directly from the checked-out repository. Do not copy Daggerheart into `/var/www` and do not use an `rsync` staging directory.

## Normal Deployment

After the local branch has been committed and pushed, run this on the VPS:

```bash
cd /opt/russo-bot/source
sudo git pull --ff-only origin codex/daggerheart-player-portal
```

Static file changes take effect immediately. Nginx does not need to be reloaded unless its configuration changed.

## First-Time Branch Setup Only

These commands were used on July 18, 2026 to establish the VPS checkout. They are not part of a normal update:

```bash
cd /opt/russo-bot/source
sudo git fetch origin codex/daggerheart-player-portal
sudo git switch codex/daggerheart-player-portal
```

## Verify

```bash
curl -I https://daggerheart.dragorussogames.com/daggerheart.css
```

Expected result: `HTTP/1.1 200 OK`.

