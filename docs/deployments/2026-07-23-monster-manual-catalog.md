# 2026-07-23 Monster Manual Catalog Deployment

- Date/time (UTC): 2026-07-23 15:50-16:03
- Environment: Production VPS (`valves-nyc2`)
- Operator/approver: Chance Russo
- Repository: `chancerusso/dragorussogames-web`
- Branch: `codex/first-edition-mapping`
- Deployed commit SHA:
  `9c12ea3ca4ada443bceae921a5bd1d1cd7597d85`
- Previous commit SHA:
  `507b6eb7b81a79f9de0683be6f944c86a7afe64d`
- Server identity verified: `valves-nyc2`
- Source checkout verified: `/opt/russo-bot/source`, expected GitHub remote and
  branch
- Clean server worktree verified: Yes. Known tracked
  `frontend/package-lock.json` difference was preserved as a backup patch and
  restored before checkout. Runtime `.env`, `.venv`, and `russo-bot/` paths
  remain expected untracked files.
- Database backup:
  `/opt/russo-bot/backups/russo-before-mm-20260723-1555.dump` (410K)
- Web-root backups:
  - `/opt/russo-bot/backups/dm-before-mm-20260723-1555.tar.gz` (89M)
  - `/opt/russo-bot/backups/classic-before-mm-20260723-1555.tar.gz` (89M)
- Generated lockfile backup:
  `/opt/russo-bot/backups/frontend-package-lock-before-mm-20260723-1555.patch`
- Migration before: `0018_archive_legacy_spells`
- Migration after: `0020_monster_manual_catalog` (head)
- Frontend build result: 75 VPS tests passed; production build passed with
  `index-Bin_j7AI.js` and `index-6iuCmQ6K.css`.
- Private-reference exclusion result: Local build contains no private
  rulebook, Monster Manual catalog, legacy core monster JSON, adventure monster
  JSON, or development content tools. Both served roots were scanned and
  contain none of these artifacts.
- Services restarted/reloaded: `russo-backend.service`
- Internal health result: `{"ok":true}`
- Public health result: DM and Classic `/api/health` returned `{"ok":true}`;
  both portal roots returned HTTP 200 HTML.
- Smoke-test result:
  - production contains 422 unique monster slugs: 217 Monster Manual, 160
    retained legacy, and 45 N1 adventure records;
  - all 217 Monster Manual records have `printed_stats_verified`;
  - all 45 N1 records have `adventure_source`;
  - Basilisk is `Uncommon`, `6 + 1` HD, 1 attack, source `Monster Manual`;
  - unauthenticated and player-token monster API requests returned HTTP 401;
  - authenticated DM/admin request returned all 217 Monster Manual entries;
  - private PDF, legacy monster JSON, and adventure monster JSON probes returned
    the HTML application fallback rather than source content;
  - DM and Classic serve identical sanitized index files;
  - no backend error-level journal entries appeared after restart.
- Rollback required: No
- Rollback result: Not applicable
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
- Pre-migration VPS verification:
  - focused Monster Manual tests: 4 passed;
  - frontend tests: 75 passed;
  - production build and DM-only artifact exclusions passed;
  - full backend suite reported 150 passes plus two environment-only failures:
    a macOS `/private/tmp` test path and an intentionally absent private
    Dragonlance PDF.
- First migration attempt: `0019_phb_spell_mechanics` failed transactionally
  and remained at `0018`. PostgreSQL rejected an overlong `Identify`
  `area_of_effect` value containing the following Find Familiar table.
- Corrective action: changed Identify to the printed compact value `One item`,
  added an extraction override, and added database-field length regression
  tests. No database rollback was required because PostgreSQL rolled back the
  failed migration transaction.
- Final backend verification: all 154 local tests passed. VPS focused PHB and
  Monster Manual tests passed; the two environment-only full-suite failures
  remain documented above and did not require private sources on production.
