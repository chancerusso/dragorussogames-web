# Drago Russo Games Deployment Inventory

Last reviewed: 2026-07-22

## Repository facts verified on 2026-07-22

| Item | Verified value |
|---|---|
| Repository | `https://github.com/chancerusso/dragorussogames-web.git` |
| Current local branch | `codex/first-edition-mapping` |
| Branch baseline commit | `8f4f4d440da70f153acb6c4f5021ed5eddc44fc7` |
| Mapping feature commit | `af4d2d5` |
| Backend | FastAPI, SQLAlchemy, Alembic |
| Backend documented port | `8010` |
| Frontend | React and Vite |
| Frontend build command | `npm run build` from `frontend/` |
| Frontend test command | `npm test` from `frontend/` |
| Private source library | `private-reference/sources/` |

The fetched remote copy of `docs/deployment.md` matched the local copy at the
time of review.

## Historically documented production values

These values come from repository documentation but were not live-verified on
2026-07-22:

| Item | Documented value | Status |
|---|---|---|
| Source checkout | `/opt/russo-bot/source` | Needs live verification |
| Backend service | `russo-backend.service` | Needs live verification |
| Discord service | `discord-bot.service` | Needs live verification |
| Backend listener | `127.0.0.1:8010` | Needs live verification |
| DM web root | `/var/www/dm.dragorussogames.com/` | Needs live verification |
| Classic web root | `/var/www/classic.dragorussogames.com/` | Needs live verification |
| API host | `https://russo.dragorussogames.com/api/` | Needs live verification |
| DM portal | `https://dm.dragorussogames.com/` | Needs live verification |
| Player portal | `https://classic.dragorussogames.com/` | Needs live verification |

## Live verification result

On 2026-07-22, a read-only SSH connection to
`dm.dragorussogames.com:22` timed out. No server command executed and no live
identity was verified.

Public checks on the same date confirmed successful responses from the API
health endpoint and both portal roots. Probes of representative private source
paths returned the frontend HTML fallback, not PDF content. These public checks
do not establish the server-side identities required for deployment.

Before any deployment, confirm and record without exposing secret values:

- SSH host or approved access path and host-key identity
- Source repository remote, branch, commit, and clean worktree
- Backend and bot service unit names, working directories, and environment-file
  paths
- Database engine, database identity, current migration, backup location, and
  verified backup procedure
- Active Nginx site files, API proxy, public web roots, and TLS hosts
- Current production commit
- Health endpoints and critical smoke-test routes
- Which portal(s) receive the frontend build

## Deployment gate

Production deployment is blocked while any live identity above is unknown.
Update this inventory immediately after access is restored and before approving
the first Mapping Mode deployment.
