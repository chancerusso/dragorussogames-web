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

Phase 1 intentionally does not include combat automation, spell automation, initiative tracking, encounter systems, referee dashboards, economy automation, downtime automation, or a web UI.

Use `#pc-maintenance` for character creation, equipment changes, treasure updates, and between-session maintenance. Run `/character create`, then `/character sheet`, then `/show card`. Maintain HP, XP, coins, and equipment with `/ledger` and `/equipment` commands.

Future scope may add a `#pc-roster` channel with `/card publish`, `/card refresh`, and `/card archive` for pinned or refreshable active-character cards. Each character should own exactly one roster card, identified by `discord_user_id + character_id`, not `character_name`. If implemented later, store `roster_message_id`, `roster_channel_id`, `published_at`, and `last_refresh_at` in character metadata. The feature should update an existing character card message when possible and should never create duplicate cards for the same character.

## Project Layout

```text
russo-bot/
  backend/
  bot/
  docs/
```

See `docs/deployment.md` and `docs/validation.md` for server setup and checks.
