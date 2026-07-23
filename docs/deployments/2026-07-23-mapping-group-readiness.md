# 2026-07-23 Mapping Group-Readiness Deployment

- Date/time (UTC): Started 2026-07-23 19:35
- Environment: Production VPS (`valves-nyc2`)
- Operator/approver: Chance Russo
- Repository: `chancerusso/dragorussogames-web`
- Branch: `codex/first-edition-mapping`
- Deployed commit SHA: Pending exact pushed implementation commit
- Previous commit SHA:
  `9c12ea3ca4ada443bceae921a5bd1d1cd7597d85`
- Server identity verified: Pending fresh preflight
- Source checkout verified: Pending fresh preflight
- Clean server worktree verified: Pending fresh preflight. Runtime `.env`,
  `.venv`, and `russo-bot/` paths are expected untracked files; any tracked
  difference must be preserved and resolved before checkout.
- Database backup: Pending
- Web-root backups: Pending
- Migration before: Expected `0020_monster_manual_catalog`; pending fresh
  verification
- Migration after: `0020_monster_manual_catalog` (no new migration)
- Frontend build result: Local frontend tests 77 passed; local production build
  passed with `index-ZxKDv_jM.js` and `index-CB3Av2ae.css`.
- Backend test result: Complete local suite 154 passed.
- Private-reference exclusion result: Local production build contains no
  private-reference path or private rulebook filename.
- Services restarted/reloaded: Pending; `russo-backend.service` required
- Internal health result: Pending
- Public health result: Pending
- Smoke-test result: Pending
- Rollback required: Pending
- Rollback result: Pending
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
