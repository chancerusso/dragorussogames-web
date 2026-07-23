# 2026-07-23 Player Table Corrections Deployment

- Date/time (UTC): 2026-07-23 04:02-04:09
- Environment: Production VPS (`valves-nyc2`)
- Operator/approver: Chance Russo
- Repository: `chancerusso/dragorussogames-web`
- Branch: `codex/first-edition-mapping`
- Candidate spell-list commit SHA: `74f333a11261a5237898fb54d3289d164841face`
- Deployed commit SHA: `0b6f26c24c071ed9d977ba259fcfcf0376f63c2c`
- Previous proven application SHA: `78da89e426d87e9d2d957734dde2b6f24b4b6781`
- Server identity verified: `valves-nyc2`, deployment through root-owned checkout
- Source checkout verified: `/opt/russo-bot/source`, expected GitHub remote and branch
- Clean server worktree verified: tracked files clean before and after deployment;
  known runtime `.env`, `.venv`, and `russo-bot/` paths remain untracked
- Database backup:
  - `/opt/russo-bot/backups/russo-before-phb-spells-20260723-040235.dump`
  - `/opt/russo-bot/backups/russo-before-spell-archive-20260723-040235.dump`
- Migration before: `0015_weapon_speed_factors`
- Migration after: `0018_archive_legacy_spells`
- Frontend build result: 73 tests passed on VPS; production Vite build passed
- Private-reference exclusion result: no purchased PHB, Monster Manual, or DMG
  source PDF exists in the Classic build or served root
- Services restarted/reloaded: `russo-backend.service`
- Internal health result: `http://127.0.0.1:8010/api/health` returned `{"ok":true}`
- Public health result: `https://classic.dragorussogames.com/api/health`
  returned `{"ok":true}`
- Smoke-test result:
  - Classic root and `/1e/spells/` returned HTTP 200
  - Classic serves `index-BlCX0SRO.js` and `index-6iuCmQ6K.css`
  - DM remained on its prior `index-CvVJ6D9m.js` and `index-BLYTiSrO.css`
  - production contains 350 active PHB spells and 38 safely archived legacy rows
  - private-source probe returned the HTML application fallback, not PDF data
  - no backend errors were logged during the deployment window
- Rollback required: No
- Rollback result: Not applicable
- User impact: Corrected Mapper interface, persistent token color, First Edition
  combat flow and weapon speed, green Live Session presentation, PHB equipment,
  and PHB-authoritative spell lists with class-specific levels.
- Target boundary: Copy this player frontend only to
  `/var/www/classic.dragorussogames.com/`. Do not copy it to
  `/var/www/dm.dragorussogames.com/`.
- Notes: The server's npm-generated package-lock difference was preserved at
  `/opt/russo-bot/backups/frontend-package-lock-before-phb-spells-20260723-040235.patch`
  before restoring the tracked checkout. The prior Classic served root was
  archived at
  `/opt/russo-bot/backups/classic-before-phb-spells-20260723-040235.tar.gz`.
  The initial post-migration check found 38 unmatched legacy spell rows;
  follow-up migration `0018` archived them non-destructively and the final
  production verification passed.
