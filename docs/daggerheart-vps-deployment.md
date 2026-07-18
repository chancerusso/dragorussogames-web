# Daggerheart VPS Deployment

This is the canonical deployment reference for:

```text
https://daggerheart.dragorussogames.com/
```

## Confirmed Paths

- Local source: `daggerheart/`
- Temporary VPS upload: `/tmp/daggerheart-site/`
- Live Nginx root: `/var/www/daggerheart.dragorussogames.com/`
- SSH host: `dm.dragorussogames.com`

The subdomain serves the contents of `daggerheart/` as its document root. Do not upload the parent repository or create an additional `daggerheart/` directory beneath the live root.

## Deploy

Run these two commands from the root of the local `dragorussogames-web` repository:

```bash
rsync -av --delete daggerheart/ dm.dragorussogames.com:/tmp/daggerheart-site/
```

```bash
ssh dm.dragorussogames.com 'sudo rsync -av --delete /tmp/daggerheart-site/ /var/www/daggerheart.dragorussogames.com/ && sudo nginx -t && sudo systemctl reload nginx'
```

## Verify

```bash
curl -I https://daggerheart.dragorussogames.com/ https://daggerheart.dragorussogames.com/daggerheart.css https://daggerheart.dragorussogames.com/assets/drago-russo-logo.png
```

All three requests should return `HTTP/1.1 200 OK`.

## Normal Release Sequence

1. Commit and push the intended Daggerheart branch.
2. Run the two deployment commands above from the repository root.
3. Run the verification command.

