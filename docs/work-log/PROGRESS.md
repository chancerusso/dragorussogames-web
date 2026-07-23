# Project Progress

Last updated: 2026-07-22

## Current focus

Mapping Mode first usable slice is implemented locally. Continue hardening
editor behavior and synchronization before deployment.

## Confirmed product direction

Drago Table will eventually have three DM-selected, separately persistent
modes:

1. Mapping Mode: a player-authored square-grid map with a dedicated Mapper
   editor and synchronized read-only player views. The editor and viewers live
   on the authenticated player portal at `classic.dragorussogames.com`, never
   on the DM portal.
2. Combat Mode: the existing tactical grid and tokens, evolved into persistent
   campaign state.
3. Hex Crawl Mode: a later wilderness map with hex-specific terrain, routes,
   notes, travel turns, and time.

Mapping Mode is intentionally shared digital graph paper, not a VTT or a reveal
system. It has no authoritative DM map, fog of war, lighting, or automatic
comparison.

## Portal ownership

- `dm.dragorussogames.com`: the DM selects the campaign's active table mode and
  active player map. DM controls belong here.
- `classic.dragorussogames.com`: the assigned Mapper opens the full mapping
  editor, and authenticated players see the synchronized standard-size map.
  All player-facing map-library review also belongs here.
- `russo.dragorussogames.com/api`: shared authenticated persistence and live
  synchronization may be provided by the backend, but API authorization must
  preserve the separation between DM controls, Mapper edits, and player reads.

The player interface must not be implemented as a route or embedded workspace
under the DM portal merely because both portals currently use related frontend
code.

## Mapping Mode agreed scope

- Campaign map library with editable names and durable save state
- Player-facing map library and saved-map review on the Classic portal
- Separate maps and floors/levels
- Large pop-out Mapper editor on the Classic portal
- Standard-size synchronized player viewer on the Classic portal
- DM-only mode and active-map selection on the DM portal
- Viewer follows the Mapper's center, zoom, and active floor
- Straight-line drawing with grid snapping and two-click placement
- Freehand drawing
- Object eraser and freehand stroke eraser
- Doors, secret-door suspicions, windows, traps, stairs, pits, labels, and color
- Circled numbered map notes connected to a notes ledger
- Compact map key
- Undo, redo, autosave, and recoverable revision history

## Table roles

1. Caller / Leader
2. Mapper / Navigator
3. Quartermaster
4. Time and Lightkeeper
5. Scout and Search Coordinator
6. Chronicler

These are table responsibilities, not exclusive character abilities.

## Existing technical foundation

- Drago Table is implemented in `frontend/src/App.jsx`.
- Campaign table mode now persists as `mapping`, `combat`, or `hex`, while the
  existing combat-grid interaction state remains local to the frontend.
- The current combat grid and token positions are not yet durable campaign
  state.
- The backend is FastAPI with Alembic migrations.
- The frontend is React/Vite and has Node tests plus a production build.

## Work order

1. Establish work logs, deployment records, and verified operating procedures.
   Completed.
2. Produce the Mapping Mode data and interaction design. Completed first pass.
3. Implement persistence and permissions. Completed first pass.
4. Implement the map library and DM mode selection. Completed first pass.
5. Implement the Mapper editor and synchronized viewers. Completed first pass
   using autosave and 2.5-second background refresh.
6. Add map renaming, levels/floors, restoration UI, zoom, improved pan, and
   conflict-safe synchronization.
7. Integrate persistent Combat Mode without losing either mode's state.
8. Build Hex Crawl Mode after square-grid Mapping Mode is accepted.
9. Verify, document, review, and deploy through the mandatory runbook only
   after the live deployment inventory is restored.

## Mapping Mode first slice completed

- Campaign table mode persists as Mapping, Combat, or Hex Crawl.
- Campaigns persist an active player map.
- DM portal creates maps, selects the active map, and assigns the Mapper.
- DM portal does not render the player drawing surface.
- Classic portal provides a saved campaign map library and active map viewer.
- Only the assigned Mapper can write; campaign members can read.
- Mapper desk provides graph paper, snapped straight walls, freehand pencil,
  doors, secret-door suspicions, windows, stairs, traps, pits, numbered notes,
  color, eraser, undo, and redo.
- Autosave creates durable revisions and saves the Mapper viewport.
- Player viewers follow saved Mapper viewport updates through background
  refresh without remounting the canvas.

## Open operational blocker

The live VPS inventory could not be reverified on 2026-07-22. The DM portal
hostname was incorrectly tried as an SSH management address and timed out; it
must not be treated as the destination for player-side deployment. No
deployment is authorized until the actual VPS access path, services, checkout,
database, separate DM and Classic web roots, and deployed commit are verified
and recorded in `docs/deployment-inventory.md`.
