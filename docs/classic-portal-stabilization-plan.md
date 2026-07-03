# Classic Portal Stabilization Plan

## Purpose

We are simplifying the platform before adding more Dragonlance content.

## Final Architecture

- `dm.dragorussogames.com` = DM Portal only.
- `classic.dragorussogames.com` = Player Portal only.
- One backend only: `russo-backend.service` on port `8010`.
- One shared character builder.
- No `dragolance.dragorussogames.com` player flow.
- No `greyhawk.dragorussogames.com` player flow.
- Dragonlance, Greyhawk, OSRIC, and future settings are campaign/sourcebook content inside Classic, not hostnames.

## Rules

- All player-facing pages must require player login.
- All DM-facing pages must require DM login.
- `/1e` rules, character builder, character pages, rules pages, equipment pages, and spells pages must be accessible through Classic only after player login.
- Public marketing site remains separate and untouched.
- Frontend API calls must use relative `/api`.
- No hardcoded `dm.dragorussogames.com` in player code.
- No second backend.
- No second character builder.

## Phases

1. Infrastructure and routing stabilization.
2. Player portal login/homepage/campaign/character flow.
3. Protected 1e rules/library integration.
4. Shared character builder integration.
5. Dragonlance sourcebook data entry.
6. Visual polish.

## Phase 1: Infrastructure and Routing Stabilization

### Requirements

- Fix `classic.dragorussogames.com` SSL certificate.
- Ensure `classic.dragorussogames.com` serves the Classic Player Portal React build, not ZRO or Cloudflare Pages.
- Ensure `classic.dragorussogames.com/api/*` proxies to `127.0.0.1:8010/api/*`.
- Ensure `dm.dragorussogames.com` remains DM Portal and proxies to the same backend.
- Remove/disable Dragolance and Greyhawk player routing. They may redirect to Classic or be left unused, but no app logic should depend on them.
- Audit Nginx configs and document:
  - hostname
  - server block path
  - root
  - SSL cert path
  - API proxy target

### Expected Verification

- `https://classic.dragorussogames.com/`
- `https://classic.dragorussogames.com/api/health`
- `https://dm.dragorussogames.com/`
- `https://dm.dragorussogames.com/api/health`

Expected results:

- Classic `/api/health` returns `{"ok":true}`.
- DM `/api/health` returns `{"ok":true}`.
- Classic has valid SSL for `classic.dragorussogames.com`.
- DM has valid SSL for `dm.dragorussogames.com`.
- Classic shows the Classic player login, not ZRO.
- DM shows the DM Portal.

### Nginx Audit

| Hostname | Server block path | Root | SSL cert path | API proxy target | Status |
| --- | --- | --- | --- | --- | --- |
| `classic.dragorussogames.com` | TBD on server | Expected: `/var/www/classic.dragorussogames.com` | TBD on server | Expected: `http://127.0.0.1:8010/api/` | Pending server access |
| `dm.dragorussogames.com` | TBD on server | Expected: `/var/www/dm.dragorussogames.com` | TBD on server | Expected: `http://127.0.0.1:8010/api/` | Pending server access |
| `dragolance.dragorussogames.com` | TBD on server | None required | TBD on server | None required | Should redirect to Classic or remain unused |
| `greyhawk.dragorussogames.com` | TBD on server | None required | TBD on server | None required | Should redirect to Classic or remain unused |

### Phase 1 Stop Condition

Do not add Dragonlance data, redesign cards, or continue feature work until Phase 1 is confirmed working.

## Phase 1 Execution Log

### Date

2026-07-03

### Commands Run

```bash
rg -n "ssh|nginx|certbot|classic|dm.dragorussogames|/var/www|8010|Cloudflare|cloudflare" docs backend frontend .github scripts package.json -g '!frontend/node_modules/**'
find . -maxdepth 4 -type f \( -iname '*deploy*' -o -iname '*nginx*' -o -iname '*cert*' -o -iname '*server*' \)
git status --short
ssh dm.dragorussogames.com 'hostname; whoami; sudo nginx -T 2>/tmp/nginx-test.err | sed -n "1,240p"; printf "--- nginx stderr ---\n"; cat /tmp/nginx-test.err; printf "--- certbot ---\n"; sudo certbot certificates 2>/tmp/certbot.err; cat /tmp/certbot.err'
curl -sS -o /private/tmp/classic-root.phase1.html -w "%{http_code}\n" https://classic.dragorussogames.com/
curl -sS -o /private/tmp/classic-health.phase1.txt -w "%{http_code}\n" https://classic.dragorussogames.com/api/health
curl -sS -o /private/tmp/dm-root.phase1.html -w "%{http_code}\n" https://dm.dragorussogames.com/
curl -sS -o /private/tmp/dm-health.phase1.txt -w "%{http_code}\n" https://dm.dragorussogames.com/api/health
curl -k -sS -o /private/tmp/classic-root-insecure.phase1.html -w "%{http_code}\n" https://classic.dragorussogames.com/
curl -k -sS -o /private/tmp/classic-health-insecure.phase1.txt -w "%{http_code}\n" https://classic.dragorussogames.com/api/health
curl -sS https://dm.dragorussogames.com/api/health
ssh -o BatchMode=yes -o ConnectTimeout=8 dm.dragorussogames.com 'hostname'
head -30 /private/tmp/classic-root-insecure.phase1.html
cat /private/tmp/classic-health-insecure.phase1.txt
head -20 /private/tmp/dm-root.phase1.html
cat /private/tmp/dm-health.phase1.txt
```

### Nginx Files Changed

None.

The live Nginx configuration is not present in this repository, and this local workspace does not have `/etc/nginx`. SSH access to `dm.dragorussogames.com` timed out on port `22`, so the live Nginx server blocks and certificate paths could not be audited or changed from this workspace.

### Verification Results

| Check | Result | Notes |
| --- | --- | --- |
| `https://classic.dragorussogames.com/` | Fails verified TLS request | `curl` reports: `SSL: no alternative certificate subject name matches target host name 'classic.dragorussogames.com'`. |
| `https://classic.dragorussogames.com/` with `curl -k` | `200` | Serves `ZRO Partner Portal`, not the Classic Player Portal. |
| `https://classic.dragorussogames.com/api/health` | Fails verified TLS request | Same certificate hostname mismatch as Classic root. |
| `https://classic.dragorussogames.com/api/health` with `curl -k` | `404` | Response body: `{"detail":"Not Found"}`. `/api` is not correctly proxied to `127.0.0.1:8010/api`. |
| `https://dm.dragorussogames.com/` | `200` | Serves `DM Portal | Drago Russo Games`. |
| `https://dm.dragorussogames.com/api/health` | `200` | Response body: `{"ok":true}`. |
| SSH audit of `dm.dragorussogames.com` | Blocked | `ssh -o BatchMode=yes -o ConnectTimeout=8 dm.dragorussogames.com 'hostname'` timed out on port `22`. |

### Phase 1 Status

Blocked on live infrastructure access.

DM is healthy. Classic is not yet stabilized: the certificate is invalid for `classic.dragorussogames.com`, the host is serving the wrong React build, and `/api/*` is not proxying to the single backend on port `8010`.
