# 2026-07-23 Mapping Mode Deployment

## Release identity

- Deployed branch: `codex/first-edition-mapping`
- Deployed application commit: `78da89e426d87e9d2d957734dde2b6f24b4b6781`
- Previous production branch: `codex-osric-monster-catalog`
- Previous production commit: `1100e11e9bf1b3d02710f2a84f44d3264188aefe`
- VPS management route: `valves-nyc2.stonecat-marlin.ts.net`
- Checkout: `/opt/russo-bot/source`

## Backup and migration

- Confirmed predeployment PostgreSQL backup:
  `/opt/russo-bot/backups/russo-before-mapping-20260723-005657.dump`
- Expected migration: `0013_campaign_mapping`, following production
  migration `0012_campaign_table_state`.
- Migration command was included in the approved deployment procedure. Final
  migration output was not included in the deployment transcript and should be
  reconfirmed during the authenticated browser smoke check.

## Targets deployed

- Shared backend persistence and authorization through
  `russo-backend.service`.
- Classic player experience copied to
  `/var/www/classic.dragorussogames.com/`.
- DM-only Mapping controls copied to
  `/var/www/dm.dragorussogames.com/`.
- No Discord bot deployment was required.

## Evidence

- Frontend production build succeeded with Vite 6.4.3.
- Built JavaScript: `dist/assets/index-CvVJ6D9m.js`.
- Built CSS: `dist/assets/index-BLYTiSrO.css`.
- Backend public health returned `{"ok":true}`.
- DM portal returned HTTP 200.
- Classic portal returned HTTP 200.
- Both portal roots reported `Last-Modified: Thu, 23 Jul 2026 01:18:08 GMT`.

## Remaining completion check

- Log in and confirm DM mode/map/Mapper controls appear only on the DM portal.
- Confirm the Classic portal shows the map library and viewer.
- Confirm the assigned Mapper can save a mark and another campaign player can
  see it without gaining edit permission.
- Reconfirm `alembic current` reports `0013_campaign_mapping` if not already
  captured.

## Rollback

- Code rollback target: `1100e11e9bf1b3d02710f2a84f44d3264188aefe`.
- Do not downgrade the production database automatically.
- The PostgreSQL backup above is retained for disaster recovery.
