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

## Production values

| Item | Documented value | Status |
|---|---|---|
| VPS management address | `valves-nyc2.stonecat-marlin.ts.net` | Verified |
| Deployment account | `root` (directly or via `sudo -i`) | Verified |
| Source checkout | `/opt/russo-bot/source` | Verified |
| Backend service | `russo-backend.service` | Verified |
| Discord service | `discord-bot.service` | Needs live verification |
| Backend listener | `127.0.0.1:8010` | Verified healthy |
| Backend environment | `/opt/russo-bot/source/backend/.env` | Verified |
| DM web root | `/var/www/dm.dragorussogames.com/` | Established deployment target |
| Classic web root | `/var/www/classic.dragorussogames.com/` | Established deployment target |
| DM portal | `https://dm.dragorussogames.com/` | Verified publicly |
| Player portal | `https://classic.dragorussogames.com/` | Verified publicly |
| Production branch before Mapping | `codex-osric-monster-catalog` | Verified |
| Production commit before Mapping | `1100e11e9bf1b3d02710f2a84f44d3264188aefe` | Verified |
| Production database | PostgreSQL at `0012_campaign_table_state` | Verified |

## Live verification result

The actual VPS management route was recovered from the previous deployment
workflow and verified as `valves-nyc2.stonecat-marlin.ts.net`. Repository and
frontend dependencies are root-owned, so deployments run as `root`, either by
direct login or `sudo -i` after connecting as `chancerusso`.

The backend service working directory is `/opt/russo-bot/source/backend`, its
environment file is `backend/.env`, and its listener is `127.0.0.1:8010`.
Service status and `/api/health` were verified after restoring production commit
`1100e11`.

A PostgreSQL backup was successfully created before the aborted Mapping attempt
at `/opt/russo-bot/backups/russo-before-mapping-20260723-005657.dump`. No
Mapping migration or frontend deployment occurred during that attempt.

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

Portal-target rule: player-facing Mapping Mode code goes to the Classic web
root only. DM mode/map/Mapper controls go to the DM web root only. Backend
persistence is a separate service deployment.

## Deployment gate

The host and production lineage blocker is resolved. Mapping Mode must be based
on production migration `0012_campaign_table_state`, with Mapping as `0013`,
and the exact pushed merge commit must be used for deployment.
