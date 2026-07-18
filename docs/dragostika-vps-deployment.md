# Dragostika VPS Deployment

Dragostika is public Drago Russo Games website content. It is not part of the Classic player portal and not part of the DM portal.

## Recommended URL

Canonical URL for the current landing/game hub:

```text
https://www.dragorussogames.com/dragostika/
```

Optional later URL:

```text
https://dragostika.dragorussogames.com/
```

Use the subdomain later when Dragostika becomes a full standalone game app with its own routing, save-game entry point, or access rules. For now, the `/dragostika/` path is better because it belongs naturally to the public Drago Russo Games site and avoids another SSL/DNS/Nginx surface.

If the subdomain is added now, make it redirect to the canonical path:

```nginx
server {
    server_name dragostika.dragorussogames.com;
    return 301 https://www.dragorussogames.com/dragostika/;
}
```

## Files To Deploy

Deploy these from the local repo:

```text
index.html
style.css
dragostika/
assets/dragostika-dungeon.jpg
assets/audio/dragostika-title.mp3
docs/dragostika-design.md
docs/dragostika-vps-deployment.md
```

Do not deploy private source folders such as `private-reference/`.

## Public Site Root

The public site root is not documented in this repo. Confirm it on the VPS before syncing:

```bash
ssh dm.dragorussogames.com 'ls -la /var/www; find /var/www -maxdepth 2 -type f -name index.html | sort'
```

Likely targets are one of:

```text
/var/www/dragorussogames.com/
/var/www/www.dragorussogames.com/
```

Use the root that currently serves `https://www.dragorussogames.com/`.

## One-Time Sync Command

Replace `/var/www/www.dragorussogames.com/` with the confirmed public site root:

```bash
rsync -av \
  index.html \
  style.css \
  dragostika \
  assets/dragostika-dungeon.jpg \
  assets/audio \
  docs/dragostika-design.md \
  docs/dragostika-vps-deployment.md \
  dm.dragorussogames.com:/tmp/dragostika-public-update/

ssh dm.dragorussogames.com '
  sudo rsync -av /tmp/dragostika-public-update/ /var/www/www.dragorussogames.com/ &&
  sudo nginx -t &&
  sudo systemctl reload nginx
'
```

## If Using The Subdomain As A Real Site

Only use this if Dragostika should be independent immediately instead of redirecting to `/dragostika/`.

```nginx
server {
    server_name dragostika.dragorussogames.com;
    root /var/www/dragostika.dragorussogames.com;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
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

Then add TLS with the VPS standard Certbot flow.

## Verification

After deployment:

```bash
curl -I https://www.dragorussogames.com/dragostika/
curl -I https://www.dragorussogames.com/assets/dragostika-dungeon.jpg
curl -I https://www.dragorussogames.com/assets/audio/dragostika-title.mp3
curl -I https://www.dragorussogames.com/dragostika/dragostika.js
```

Expected result: all return `200`.
