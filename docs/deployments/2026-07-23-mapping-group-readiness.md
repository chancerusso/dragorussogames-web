# 2026-07-23 Mapping Group-Readiness Deployment

- Date/time (UTC): Started 2026-07-23 19:35
- Environment: Production VPS (`valves-nyc2`)
- Operator/approver: Chance Russo
- Repository: `chancerusso/dragorussogames-web`
- Branch: `codex/first-edition-mapping`
- Deployed commit SHA:
  `1761590b539caa758394ff77373b79d1ba0307a4`
- Previous commit SHA:
  `9c12ea3ca4ada443bceae921a5bd1d1cd7597d85`
- Server identity verified: `valves-nyc2`
- Source checkout verified: `/opt/russo-bot/source`, approved GitHub remote,
  branch `codex/first-edition-mapping`
- Clean server worktree verified: No tracked changes. Expected runtime
  `backend/.env`, `backend/.venv/`, and `russo-bot/` paths remain untracked.
- Database backup:
  `/opt/russo-bot/backups/russo-before-mapping-readiness-20260723-1938.dump`
  (361 KB)
- Web-root backups:
  - `/opt/russo-bot/backups/dm-before-mapping-readiness-20260723-1938.tar.gz`
    (88 MB)
  - `/opt/russo-bot/backups/classic-before-mapping-readiness-20260723-1938.tar.gz`
    (88 MB)
- Migration before: `0020_monster_manual_catalog`
- Migration after: `0020_monster_manual_catalog` (no new migration)
- Frontend build result: Local frontend tests 77 passed; local production build
  passed with `index-ZxKDv_jM.js` and `index-CB3Av2ae.css`.
- Backend test result: Complete local suite 154 passed.
- Private-reference exclusion result: Local production build and both deployed
  web roots contain no private-reference path or private 1e rulebook filename.
  A public private-reference probe returned only the 579-byte HTML application
  shell, not source content.
- Services restarted/reloaded: `russo-backend.service` restarted and active
- Internal health result: `{"ok":true}`
- Public health result: DM and Classic API health both returned `{"ok":true}`;
  both portal roots returned HTTP 200.
- Smoke-test result: Passed. DM and Classic share the intended application
  build; the Greyhawk JPEG is served from Classic only. The same URL on DM
  returns the HTML application shell rather than the image. An unauthenticated
  player-map API request returned 401.
- Rollback required: No
- Rollback result: Not applicable
- User impact: Makes square-grid Mapping Mode ready for a live group test with
  right-click/Escape wall-chain termination, independent named floors,
  synchronized centered zoom, recoverable map history, stale-window conflict
  protection, and read-only player following.
- Portal targets:
  - Classic receives Mapper/editor/viewer/library behavior and the supplied
    Greyhawk Darlene map asset for the later Hex Crawl phase. The image is
    copied from `frontend/player-assets/` after the shared build.
  - DM receives the coordinated frontend build only because its existing mode,
    active-map, and Mapper-assignment controls are part of the same Mapping
    Mode workflow.
  - Shared map history and conflict protection require a backend restart.
- Player-asset boundary: The initial shared build placed the Greyhawk image in
  both roots. The exact image was removed from the DM root, retained on
  Classic, and moved outside Vite's shared `public/` directory so future
  deployments cannot repeat the mistake.
- Notes:
  - No database schema migration is included.
  - Monster XP remains intentionally deferred.
  - Dragonlance has no Hex Crawl base-map asset until the user supplies it.
  - Combat synchronization means keeping DM and player grids, tokens, HP, and
    active mode aligned across connected browsers and reconnects; it is not
    part of this Mapping Mode readiness pass.
  - The focused backend test initially used the VPS system Python, which lacks
    FastAPI, then exposed a test-only hardcoded `/private/tmp` assumption in
    the virtual environment. Creating that temporary directory allowed the
    focused test to pass; the temporary database and directory were removed.
