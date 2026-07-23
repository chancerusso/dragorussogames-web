# Dragostika Design Plan

## Product

Dragostika is an original OSRIC-compatible solo campaign engine for Drago Russo Games. It should live as its own site feature while reusing the existing DRG 1e rules, character vault, equipment catalog, monster catalog, combat math, account system, and future Patreon/access layer.

The public route is `/dragostika/`.

## Legal And Content Rules

- Use OSRIC-compatible rules procedures and original Drago Russo Games adventure content.
- Do not use real TSR/WotC module text, maps, named NPCs, unique locations, distinctive room sequences, distinctive encounter layouts, boxed text, treasure placement, or art.
- Do not create a close reskin of an existing module.
- Treat Patreon-gated access as paid access. Fan-policy-restricted material should not be placed behind it.
- Keep every adventure, NPC, faction, settlement, map, and scene node original to Dragostika unless it comes from clearly licensed/open content we have reviewed and recorded.

## Recommended First Hero

Default hero lane: half-elf Fighter/Thief.

Reason:

- Human Fighter/Thief multi-class is not OSRIC-legal.
- Half-elf Fighter/Thief supports combat, stealth, scouting, locks, negotiation, and solo dungeon survival.
- The class combination lets the first campaign avoid a full party simulator while still presenting varied old-school choices.

Alternative lanes for later:

- Halfling Fighter/Thief for an underdog stealth campaign.
- Half-orc Fighter/Thief for a grittier survival campaign.
- Human Fighter dual-classing into Thief only if the story specifically needs that arc.

## First Campaign Scope

Levels: 1-3.

Tone: dangerous old-school fantasy with strong campaign memory, not a puzzle-book gimmick.

Core arc:

- Level 1: town trouble, first original ruin, first named rival, first permanent consequence.
- Level 2: wilderness travel, faction pressure, deeper dungeon choices, NPC loyalty shifts.
- Level 3: major enemy, meaningful treasure, unlocked long-term campaign mode.

## Engine Objects

### Character State

- `character_id`
- active Dragostika campaign
- HP, XP, level, class/race, abilities, saves, AC, movement
- coins, inventory, equipped gear, safe storage
- spells and magic items when supported
- conditions, wounds, diseases, curses, scars, and death/recovery state

### Adventure State

- adventure slug and version
- current scene/node
- visited nodes
- discovered exits
- resolved encounters
- room inventory changes
- clues found
- traps triggered or disabled
- clocks, alerts, wandering monster pressure, light, rations, and time

### Relationship State

- NPC id
- first met scene
- attitude
- loyalty
- fear/respect
- debts and favors
- secrets known
- betrayal or rescue flags
- enemy awareness and pursuit state

### Campaign Journal

- chronological log entries
- combat summaries
- treasure awards
- XP awards
- important choices
- failed saves
- NPC relationship changes
- unlocked leads

## Adventure Format

Start with JSON/YAML-authored adventure modules that can later be edited through a DM/admin UI.

Each module should include:

- metadata: slug, title, level range, status, content license notes
- start node
- scene nodes with prose, choices, checks, exits, and consequences
- encounter definitions referencing monster catalog records where possible
- treasure parcels referencing equipment/magic item records where possible
- flags and state mutations
- fail-forward branches
- journal templates

## Website Integration Plan

1. Public `/dragostika/` route explains the product and points to DRG 1e tools.
2. Protected Classic route later becomes the playable solo experience.
3. Use the existing player login and character vault.
4. Add Dragostika-specific save tables only when gameplay begins.
5. Reuse combat services instead of duplicating attack, save, XP, and encumbrance math.
6. Keep VTT integration optional: later, a solo adventure could be opened in VTT mode, but Dragostika should not be built inside the VTT UI first.

## Landing And Player Entry

The public landing screen should stay simple:

- `Log In`
- `Learn More`
- title music control with volume

Browsers generally block audible autoplay until the visitor interacts with the page. Dragostika should attempt to start the title music on page load, then start it after the first click/tap when autoplay is blocked.

After login, the Dragostika screen becomes the player-facing entry panel:

- small `Logged in as <name>` text
- `New Game`
- `Load Game`
- `Save`
- `Exit`

Use `Load Game`, not only `Continue`, because Dragostika is intended to support multiple adventures and multiple saved characters. The load screen shows each character, their level/race/class, assigned adventure, and that character's distinct play time.

Play time starts only after the player enters an actual game/adventure screen. Menu time and character-building time do not count.

`New Game` should stay inside the Dragostika console and open a constrained solo-character builder. The builder should reuse DRG 1e/OSRIC-derived calculations where possible, but not expose the full 1e character editor.

Dragostika character creation rules:

- Race choices: Half-Elf, Elf, Half-Orc, Human, Halfling, Dwarf, Gnome.
- Class is fixed to Fighter/Thief for now.
- Alignment may be anything except Chaotic Evil.
- Ability generation is 4d6, drop the lowest, six times, one roll only.
- Scores are assigned by the player to STR, INT, WIS, DEX, CON, CHA.
- Level 1 HP starts at 12 plus the relevant CON adjustment.
- Starting gold is 15 gp.
- Starting equipment is equipped automatically.
- No spellcasting in the first Dragostika implementation.
- All weapon proficiency penalties are ignored; Dragostika assumes proficiency with all weapons for the solo hero.

The character viewer should open in a separate window and be read-only except for in-game inventory loss/drop actions. Players should not directly add items, edit ability scores, edit combat values, or edit advancement. Dropping an item must require confirmation.

After character creation, the main screen should show available adventures. Choosing an adventure assigns it to that character, saves it, and then moves to the shared intro screen for all new characters. The first adventure is `The Village of Rio Frio`.

## Likely Backend Tables

Proposed names:

- `dragostika_campaigns`
- `dragostika_saves`
- `dragostika_adventures`
- `dragostika_scene_states`
- `dragostika_relationships`
- `dragostika_journal_entries`
- `dragostika_combat_logs`

Keep adventure content versioned so active saves can continue safely after module edits.

## First Build Milestone

Milestone 1 should deliver:

- a protected player route for starting Dragostika
- character selection restricted to legal solo-ready builds
- one original tutorial adventure
- persistent save state
- basic scene choices
- one combat encounter using existing combat math
- one NPC relationship variable
- journal entries and XP/treasure awards

## Open Decisions

- Final name of the starting town.
- First adventure title.
- Whether the default hero is prebuilt or selected from the player's vault.
- How Patreon access will be represented in the app before full billing integration.
- Whether early combat is turn-by-turn interactive or summarized through selectable tactics.
