# Project Progress

Last updated: 2026-07-22

## Current focus

Mapping Mode first usable slice was deployed on 2026-07-23 UTC. Complete the
authenticated DM/Mapper/player smoke test, then continue hardening editor
behavior and synchronization.

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
- Square-contained symbols snap to square centers; wall fixtures snap to edge
  midpoints; right-click ends a connected wall chain; and Move repositions
  placed objects.
- Previously saved symbols normalize to the new snap rules when opened by the
  Mapper, and the assigned Mapper can rename the map.
- Autosave creates durable revisions and saves the Mapper viewport.
- Player viewers follow saved Mapper viewport updates through background
  refresh without remounting the canvas.

## Deployment readiness

The VPS management route, root-owned checkout, backend service, PostgreSQL
migration level, production branch, and production commit have been verified.
Mapping Mode is reconciled with that production lineage as
`0013_campaign_mapping`, following `0012_campaign_table_state`. Deploy only the
exact pushed merge commit and keep the Classic player target separate from the
DM control target.

## Player journal completed

- Each campaign member has a private campaign journal on the player portal.
- Journal text autosaves and is returned only to the logged-in campaign member.
- Character sheets, First Edition rules, and campaign references opened from
  the player campaign area use a separate browser tab so the table stays open.
- Database migration `0014_player_campaign_journal` follows Mapping Mode's
  `0013_campaign_mapping` migration.
- Frontend tests (69), focused backend tests, production build, and a fresh
  migration chain all pass.

## Player table correction release ready for commit

- The Mapper source includes the accepted square-center snapping, smaller note
  typography, vertical color controls below Undo/Redo, movable placed objects,
  right-click wall reset, and editable map names. These fixes were not included
  in the last proven production deployment.
- Player combat flow now begins with Surprise and includes a concise First
  Edition weapon Speed Factor explanation.
- Weapon Speed Factor is stored in the equipment catalog, migrated onto
  existing weapon records, passed through combat runtime, and shown anywhere
  players or the DM inspect a weapon.
- Live Session uses a filled green status treatment.
- Player token-color changes no longer lose to an older background refresh;
  both saves already in flight and refreshes started before a save are guarded.
- This correction release deploys its frontend only to the Classic player root.
  It also requires backend migration `0015_weapon_speed_factors` and a backend
  restart. It does not authorize copying the player build to the DM web root.

## PHB source replacement in progress

- Deployment of the player-table correction commit is paused while its
  equipment work is replaced with a complete PHB-authoritative catalog.
- Weapon data now distinguishes Speed Factor, S/M damage, L damage, length,
  space required, and printed gold-piece weight.
- Missile weapons store exact Short, Medium, and Long PHB ranges in inches.
  "Range Increment" and preconverted feet are not part of the canonical model.
- Migration `0016_phb_equipment_catalog` synchronizes verified PHB catalog rows
  and archives superseded OSRIC-only choices without deleting inventory data.
- The same audit standard will next cover PHB spells and player rules, followed
  by Monster Manual mechanics and DMG procedures.
- PHB general equipment costs are now reconciled across clothing, herbs,
  livestock, miscellaneous gear, provisions, religious items, tack, transport,
  armour, helmets, and shields.
- Every reconciled row carries book, printed page, category, and verification
  status. Non-weapon weights and armour movement caps are clearly marked as
  pending official verification rather than attributed to the PHB.
- The PHB main-table plate-barding `15 sp` anomaly is documented; the catalog
  uses the condensed PHB reference value of `500 gp`.
- Next source-replacement checkpoint: PHB spell lists and spell mechanics.
- PHB spell lists are now reconciled: 416 class/level entries across 350
  distinct cleric, druid, magic-user, and illusionist spells match the printed
  tables on Player's Handbook pages 40-42.
- Spell records now retain a level for each class list. Shared spells therefore
  use the correct class-specific slot level rather than the lowest level from
  any class.
- Migration `0017_phb_spell_lists` upgrades existing spell rows in place,
  retains character-spell relationships, inserts missing PHB entries, and adds
  Player's Handbook source/page/verification metadata.
- Migration `0018_archive_legacy_spells` hides unmatched legacy spell records
  from new selection without deleting records that an existing character may
  reference.
- The player-table, PHB equipment, and PHB spell-list release is deployed at
  application SHA `0b6f26c24c071ed9d977ba259fcfcf0376f63c2c`.
  Production is at migration `0018_archive_legacy_spells`; Classic has the new
  player build and the DM frontend was not overwritten.
- Player spell indexes and class-list pages now use the PHB spell names and no
  longer present OSRIC as the authority. Individual spell mechanics remain the
  next audit checkpoint and are not yet labelled PHB-verified.
