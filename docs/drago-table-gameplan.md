# Drago Table Gameplan

Drago Table is the Classic play table: a lightweight DM command screen plus a read-only player table view. It is not trying to become Roll20, Foundry, or an automation-heavy VTT. It should feel fast, readable, referee-first, and useful at the actual table.

The design goal is simple: the DM can run exploration, marching order, combat, monsters, treasure, XP, and time from one screen, while players can see only what they need and interact only when the DM has started the live session.

## Core Principle

The DM controls the table. Players observe the shared state until the DM starts the session.

When the session is stopped, players can view the saved table state and open their character sheet, but cannot change the table.

When the session is live, players may:

- add their own token to the grid after choosing an unclaimed player color
- move only their own token
- apply damage or healing to their own character snippet, which updates the character sheet

Players never edit trackers, reveal maps, manage monsters, change DM rewards, or control monster tokens.

## Views

### DM View

The DM View is the Drago Screen.

It includes:

- Current mode: Marching, Combat, Rest, or Travel
- Start Session / Stop Session live-table switch
- Active map/grid
- Player and monster tokens
- Encounter monster cards
- HP, status, and death controls
- Round/turn tracker
- Torch/light timers
- calendar and campaign day
- treasure and XP ledger
- buttons for common referee actions

### Player View

The Player View is saved-state read-only until the DM starts the session.

It includes:

- Current visible grid/map
- PC tokens and visible monster tokens
- public trackers
- marching order or combat layout
- compact character snippets
- button/link to open full character sheet
- live-session status

It does not include:

- monster HP unless deliberately shown
- hidden notes
- hidden treasure
- DM-only timers or checks
- DM editing controls

When the DM has started the session, the player snippet unlocks player-owned controls:

- Add To Grid
- move own token
- Damage / Heal own HP

## Modes

### Marching Mode

Used outside combat.

Default layout:

- 2 squares wide
- 6 squares long
- PC tokens arranged by marching order
- optional party token for abstract movement

The DM can drag tokens freely. No player editing.

### Combat Mode

Used only when tactical positioning matters.

Combat supports:

- custom width and length blank grid
- real map image later
- token movement
- player and monster circles
- linked monster cards
- round and initiative tracking

Current combat grid:

- DM types width and length
- default is 8 x 8
- Marching remains locked to 2 x 6

### Rest / Town Mode

Used when the party is safe enough to settle rewards and reset expedition state.

This mode supports:

- award pending XP
- split or record treasure
- reset encounter XP
- update calendar/time
- rest/training notes

### Travel Mode

Later mode for wilderness or overland procedure.

Possible features:

- day watch
- weather
- travel pace
- encounters
- rations
- camp state

## Maps And Grids

Version 1 should start with blank/template grids.

Real uploaded maps come later.

Map goals:

- keep a focused combat area visible
- avoid full-map bloat
- support 10 x 10 tactical focus
- allow the DM to use either blank grids or map images

Real map support later:

- upload image
- set as background
- optional grid overlay
- pan/focus view
- DM can reveal or shift visible area

## Tokens

Tokens are simple circles first.

Player tokens:

- PC name or short label
- distinct color
- linked to character sheet
- color chosen once when adding token to grid
- player colors: White, Gold, Pink, Blue, Silver, Purple, Gray, Turquoise

Monster tokens:

- monster name and number
- examples: Goblin 1, Goblin 2, Ogre 1
- linked to monster card
- token footprint can be Standard, 1 x 1, 2 x 1, 1 x 2, 2 x 2, 1 x 3, or 3 x 1
- token color tracks health: green above half HP, orange at half HP or less, red below one-quarter HP

No complex token art is required for version 1.

Possible later support:

- PNG token image
- monster portrait
- condition badges

## Monster Cards

Monster cards are DM-only unless deliberately exposed.

Monster sources:

- OSRIC Core Rules is the default monster catalog.
- Adventure packs can add module-specific monsters, named NPCs, and unique creatures.
- The first adventure pack is N1 Against the Cult of the Reptile God.
- Adventure records should be source-labelled so the DM can switch between OSRIC and a module pack without losing the standard catalog.

Each monster should support:

- name and ID
- AC
- HP
- attacks
- damage
- movement
- morale
- notes
- status
- grid position
- compact encounter entry
- expandable stat block and description
- THAC0 and hit bonus where available

Buttons:

- damage
- heal
- mark dead
- remove
- morale check
- save/check
- condition/status

When a monster is marked dead, its XP should move into the pending encounter XP ledger.

## Treasure And XP

Drago Table should track pending rewards during play.

Reward buckets:

- monster XP
- treasure XP
- bonus XP
- notes

Treasure tools:

- add coin treasure
- add item treasure
- mark treasure recovered
- mark treasure lost/left behind
- calculate treasure XP

XP tools:

- add monster XP automatically when monsters are defeated
- add treasure XP when treasure is recovered
- award pending XP when the party rests in town or reaches safety
- divide among eligible characters
- log award
- reset pending encounter reward pool

This should support 1e/OSRIC-style play where treasure matters.

## Trackers

Public or DM-only depending on context.

Core trackers:

- round
- turn
- initiative
- torch/light duration
- spell duration
- rest state
- campaign day
- calendar date
- current location
- marching order

Later trackers:

- weather
- rations
- watches
- wandering monster checks
- morale reminders

## Player Character Snippet

Player view shows a compact character combat card in the left column.

Each card includes:

- character name
- HP current/max
- AC
- THAC0
- movement
- attacks
- status
- equipped weapon rows with hit and damage
- Damage and Heal controls when the session is live
- Add To Grid when the session is live
- open sheet button

The full character sheet remains separate and can open in another tab.

HP changes from the snippet save to the character sheet in real time.

## Discord

Discord is not part of the tactical loop.

Drago Table is the active play surface.

Discord can remain useful for:

- chat
- scheduling
- campaign messages
- summaries
- optional session logs

But combat movement, map state, trackers, monsters, and XP should live in Classic.

## Version 1 Scope

The first usable version should include:

- DM Drago Screen route
- Player Table route with saved-state view and live-session interaction gate
- shared session state
- Marching Mode with 2 x 6 layout
- Combat Mode with custom blank grid size
- draggable DM-controlled tokens
- player-owned token movement during live session
- player and monster token types
- monster cards with HP and dead status
- pending monster XP
- treasure/XP ledger
- public tracker display
- OSRIC monster catalog in the DM table sidebar
- Dragonlance and Greyhawk tracker modes
- Dice roller
- XP distribution tools
- Start Session / Stop Session lock

Do not build first:

- line of sight
- fog of war
- full map drawing tools
- complex token art pipeline
- rules automation beyond simple tracking

## Build Order

1. Create Drago Table data model
2. Create DM Screen route
3. Create Player Table route
4. Add Marching Mode
5. Add Combat Mode grid templates
6. Add draggable tokens
7. Add monster cards
8. Add HP/dead/XP flow
9. Add treasure/XP ledger
10. Add public tracker panel
11. Add real map upload later

Current completed state as of 2026-07-15:

- DM table exists in the authenticated DM portal.
- OSRIC monster catalog is available from the table and monster glossary.
- Monsters can be added to encounters, placed on the combat grid, damaged, healed, marked dead, and grouped into compact stat cards.
- Monster XP, treasure XP, bonus XP, and distribution flow exist.
- Combat grid supports custom width and length.
- Marching grid is locked to 2 x 6.
- Player table exists and mirrors saved DM table state.
- Players can interact only when the DM starts the session.
- Player snippets show combat-ready character information and HP controls.
- Player HP edits update the character sheet.
- Player token colors are limited to the approved non-monster palette.
- Monster token colors reflect health.
- Backend persists campaign table state.

## Success Test

The first release succeeds if the DM can run one simple goblin fight without paper:

- arrange marching order
- switch to combat
- choose a room grid
- place PCs and goblins
- move tokens
- track HP
- mark goblins dead
- collect monster XP
- add treasure
- show players the current table state
- award XP later

If it does that quickly and clearly, Drago Table is working.

Next testing target:

- Deploy to VPS.
- DM opens Drago Table and clicks Start Session.
- Player opens Classic player table, chooses token color, adds token to grid, moves token, and applies HP damage/healing.
- DM adds a monster, places it, damages it, marks it dead, and confirms XP appears in rewards.
- DM clicks Stop Session and confirms player controls lock while saved state remains visible.
