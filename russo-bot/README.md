# RUSSO Bot

RUSSO is the persistent character ledger backend and Discord bot for Drago Russo Games.

Phase 1 scope:
- FastAPI health endpoint
- PostgreSQL persistence
- Campaign, player, party, character, and audit log tables
- Character ledger stored as JSON
- Discord slash commands for ping, character creation, ledger display, and table-use ledger updates
- Player self-service character ledgers through `/character`, `/ledger`, `/equipment`, `/show card`, and `/guide`
- Complete player-maintained character sheets with ability modifiers, saves, languages, notes, equipment, encumbrance, and compact table cards
- Referee-only quick references through `/ref screen`
- Expedition tracking through `/tracker` and exploration marching order through `/order`
- Channel camp procedure through `/camp`
- OSRIC catalog-backed equipment through `/equipment add`, `/equipment elim`, and `/equipment custom`
- Character carried coin UX through `/coin`
- Channel-scoped group storage, coins, and XP bank through `/mule` and `/tracker xp`
- Long rest / daily recovery through `/rest`

Phase 1 intentionally does not include combat automation, spell automation, initiative tracking, encounter systems, referee dashboards, economy automation, downtime automation, or a web UI.

Use `#pc-maintenance` for character creation, equipment changes, treasure updates, and between-session maintenance. Run `/character create`, then `/character sheet`, then `/show card`. Maintain HP, XP, coins, and equipment with `/ledger` and `/equipment` commands.

Referees can use `/ref screen` for a compact DRG1e / OSRIC-style rules reference. It is reference only, not automation. OSRIC is the initial structured ruleset; future DRG1e house rules should be added through the rules loader.

Referees can use `/tracker` and `/order` to track exploration turns, light, oil, rations, rest pressure, wandering monster reminders, movement, and marching order. This is exploration support, not tactical combat automation.

Use `/camp` for the channel group's overnight/end-of-day procedure. It can advance the tracker day, summarize watches, roster, rations, lights, night encounter reminder, caster preparation, mule/XP state, and remind players to use `/rest` for daily natural recovery. It does not heal automatically.

Standard equipment comes from the OSRIC catalog, so players can add items like `/equipment add item:longsword` without manually entering weight, value, or damage. Group storage is scoped by Discord channel ID; use `/mule status` for pack mule, cart, stash, or party treasure, and `/tracker xp` for pending group XP that is not automatically distributed.

Use `/coin` for character-carried coins. Character coins affect character encumbrance; mule coins do not.

Players can use `/rest` for daily recovery on their active character. It adds +1 HP up to max HP, logs the change, and reminds casters to prepare spells without automating spell preparation or spell slot reset.

Future scope may add a `#pc-roster` channel with `/card publish`, `/card refresh`, and `/card archive` for pinned or refreshable active-character cards. Each character should own exactly one roster card, identified by `discord_user_id + character_id`, not `character_name`. If implemented later, store `roster_message_id`, `roster_channel_id`, `published_at`, and `last_refresh_at` in character metadata. The feature should update an existing character card message when possible and should never create duplicate cards for the same character.

## Project Layout

```text
russo-bot/
  backend/
  bot/
  docs/
```

See `docs/deployment.md` and `docs/validation.md` for server setup and checks.
