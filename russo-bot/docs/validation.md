# Validation Steps

## Backend

```bash
cd russo-bot/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 8010
curl http://127.0.0.1:8010/api/health
```

Expected response:

```json
{"ok":true}
```

Create a character through the backend:

```bash
curl -X POST http://127.0.0.1:8010/api/characters \
  -H 'content-type: application/json' \
  -d '{
    "character_name":"Aric",
    "player_name":"Chance",
    "race":"Human",
    "class_name":"Fighter",
    "level":1,
    "discord_username":"chance",
    "discord_user_id":"123456789"
  }'
```

Load the active character:

```bash
curl http://127.0.0.1:8010/api/characters/by-discord/123456789
```

## Bot

```bash
cd russo-bot/bot
npm install
npm run build
npm run register
npm start
```

In Discord:

- `/ping` returns `RUSSO online`
- `/character create` saves a character ledger
- `/ledger` returns a Discord embed with character fields

Restart `russo-bot.service` and `russo-backend.service`, then run `/ledger` again. The character should still load from PostgreSQL.

## Phase 1.1 Ledger Updates

After deploying the backend and bot changes, re-register slash commands:

```bash
cd russo-bot/bot
npm run register
sudo systemctl restart russo-backend.service
sudo systemctl restart russo-bot.service
```

In Discord, create or use a test character:

```text
/character create character_name:Aric player_name:Chance race:Human class_name:Fighter level:1
/character hp current_hp:7 max_hp:10
/character ac armor_class:5
/character xp current_xp:1250 xp_needed:2000
/character coins gp:42 sp:7
/character abilities str:16 int:10 wis:12 dex:14 con:13 cha:9
/character status status:Active
/ledger
```

Confirm `/ledger` shows:

- HP as `7/10`
- AC as `5`
- XP as `1250 / 2000`
- coins as `pp, gp, ep, sp, cp`
- abilities as `STR INT WIS DEX CON CHA`
- Status as `Active`

Restart the bot and backend services, then run `/ledger` again. The same values should still render from PostgreSQL.
