# RUSSO Bot

RUSSO is the persistent character ledger backend and Discord bot for Drago Russo Games.

Phase 1 scope:
- FastAPI health endpoint
- PostgreSQL persistence
- Campaign, player, party, character, and audit log tables
- Character ledger stored as JSON
- Discord slash commands for ping, character creation, ledger display, and table-use ledger updates

Phase 1 intentionally does not include combat, exploration, XP awards, treasure, rules lookup, downtime, or a web UI.

## Project Layout

```text
russo-bot/
  backend/
  bot/
  docs/
```

See `docs/deployment.md` and `docs/validation.md` for server setup and checks.
