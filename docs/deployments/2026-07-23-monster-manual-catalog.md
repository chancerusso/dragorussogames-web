# 2026-07-23 Monster Manual Catalog Deployment

- Date/time (UTC): Started 2026-07-23 15:50
- Environment: Production VPS (`valves-nyc2`)
- Operator/approver: Chance Russo
- Repository: `chancerusso/dragorussogames-web`
- Branch: `codex/first-edition-mapping`
- Deployed commit SHA: Pending; candidate
  `5c9ee88d05f1b6229df08fe052789ae5a6457cd5`
- Previous commit SHA:
  `507b6eb7b81a79f9de0683be6f944c86a7afe64d`
- Server identity verified: `valves-nyc2`
- Source checkout verified: `/opt/russo-bot/source`, expected GitHub remote and
  branch
- Clean server worktree verified: Pending. Known tracked
  `frontend/package-lock.json` difference will be preserved as a backup patch
  and restored before checkout. Runtime `.env`, `.venv`, and `russo-bot/`
  paths are expected untracked files.
- Database backup: Pending
- Migration before: `0018_archive_legacy_spells`
- Migration after: Pending; expected `0020_monster_manual_catalog`
- Frontend build result: Local verification passed: 75 tests and production
  build. VPS verification pending.
- Private-reference exclusion result: Local build contains no private
  rulebook, Monster Manual catalog, legacy core monster JSON, adventure monster
  JSON, or development content tools. VPS served-root verification pending.
- Services restarted/reloaded: Pending; expected `russo-backend.service`
- Internal health result: Preflight returned `{"ok":true}`; post-deployment
  check pending.
- Public health result: Pending
- Smoke-test result: Pending
- Rollback required: Pending
- Rollback result: Pending
- User impact: Adds the DM-only Monster Manual catalog, retains adventure
  monsters under adventure sources, makes Monster Manual the default Drago
  Table source, restricts the monster API to DM/admin access, and removes
  static monster data from public frontend builds.
- Target boundary: Backend and DM frontend are required. Classic frontend is
  also refreshed specifically to remove pre-existing static monster JSON from
  its served root; this does not place DM controls or monster data on Classic.
- Notes: Deployment includes pending migration `0019_phb_spell_mechanics`
  followed by `0020_monster_manual_catalog`. Database backup and migration
  checks are mandatory before service restart.
