# 2026-07-23 Player Table Corrections Deployment

- Date/time (UTC): Pending operator deployment
- Environment: Production VPS (`valves-nyc2`)
- Operator/approver: Chance Russo
- Repository: `chancerusso/dragorussogames-web`
- Branch: `codex/first-edition-mapping`
- Deployed commit SHA: Pending exact pushed commit
- Previous proven application SHA: `78da89e426d87e9d2d957734dde2b6f24b4b6781`
- Server identity verified: Pending
- Source checkout verified: Pending
- Clean server worktree verified: Pending
- Database backup: Required before migration
- Migration before: Pending
- Migration after: Must be `0015_weapon_speed_factors (head)`
- Frontend build result: Local candidate passed; VPS pending
- Private-reference exclusion result: Local candidate passed; VPS pending
- Services restarted/reloaded: `russo-backend.service` pending
- Internal health result: Pending
- Public health result: Pending
- Smoke-test result: Pending
- Rollback required: No
- Rollback result: Not applicable
- User impact: Corrected Mapper interface, persistent token color, First Edition
  combat flow and weapon speed, and green Live Session presentation.
- Target boundary: Copy this player frontend only to
  `/var/www/classic.dragorussogames.com/`. Do not copy it to
  `/var/www/dm.dragorussogames.com/`.
- Notes: This record is intentionally marked pending until the operator returns
  the VPS output and public asset evidence.
