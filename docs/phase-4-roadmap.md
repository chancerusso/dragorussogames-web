# Phase 4 Roadmap

## Current Direction

The character builder is the active player character lifecycle for DRG 1e. The
Saturday character-sheet work is accepted after table testing. The remaining
builder work should finish level advancement, strict class-state handling, and
live readiness rather than redesigning the sheet.

## Unit 2: Finish Level-Up Workflow

- Show a canonical advancement preview from the existing rules service.
- Apply a single-class level-up only after review.
- Require HP gain input when the preview calls for a hit-point roll.
- Update level, XP, max HP, current HP, saving throws, attack runtime, spell
  slots, and ability modifiers through backend recalculation.
- Do not duplicate progression logic in the frontend.
- Do not automatically add known spells or prepare spells.
- Record a readable level-up note until a formal advancement history table is
  added.

## Combat Sheet Finish

- Display normal AC.
- Display Flank AC as AC without shield bonus.
- Display Rear AC as AC without shield bonus or Dexterity adjustment.
- Keep AC, saves, movement, encumbrance, attacks, and spell slots derived from
  backend runtime data.

## Multiclass And Dual-Class

Multiclass and dual-class must be strict AD&D 1e-style systems, not modern
free-form class picking.

Before writable support, add persistent class-track state for:

- class tracks
- XP per track
- level per track
- active and inactive class state
- original class for dual-classing
- dual-class recovery status
- HP roll history
- advancement approvals
- selected deity or order state where needed

Until that state exists, the builder may preview requirements but must reject
multiclass and dual-class advancement writes.

## Go-Live Checklist

- Frontend tests pass.
- Python tests pass.
- Content validation passes.
- Production frontend build passes.
- Manual player character flow works on Classic.
- DM character flow works on DM Portal.
- Character creation, edit, inventory, spells, proficiency, and level-up work.
- No private source files or generated reports are deployed.

## Next Week Slice

- Expand mundane equipment catalog.
- Add magic item catalog support.
- Add character-owned magic item state such as charges, attunement-equivalent
  notes if needed, identification, curses, and DM-only notes.
- Review DM Screen direction:
  - simple in-app screen,
  - battle map view,
  - Discord-connected table tools,
  - or a hybrid.
