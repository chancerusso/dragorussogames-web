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

## Phase 1.2 Character Ledger Management

Run migrations and re-register commands:

```bash
cd /opt/russo-bot/source/russo-bot/backend
alembic upgrade head
cd /opt/russo-bot/source/russo-bot/bot
npm run build
npm run register
sudo systemctl restart russo-backend.service
sudo systemctl restart russo-bot.service
```

Optional DM/admin targeting uses `RUSSO_ADMIN_USER_IDS` as a comma-separated list of Discord user IDs. Discord server Administrator permission is also treated as admin.

Discord validation flow:

```text
/character create character_name:Testus player_name:Chance race:Human class_name:Fighter level:1 alignment:Neutral hp_max:10 hp_current:10 armor_class:5
/character create character_name:Aldric player_name:Chance race:Elf class_name:Magic-User level:1 alignment:Chaotic Good hp_max:4 hp_current:4 armor_class:9
/character list
/ledger
/character active character:Aldric
/ledger
/character abilities str:12 int:17 wis:10 dex:15 con:9 cha:11
/character hp current_hp:3 max_hp:4
/character ac armor_class:8
/character xp current_xp:1250 xp_needed:2500
/character coins gp:25 sp:12
/character coins gp:5 mode:add
/character resources torches:6 rations:7 water:3 arrows:20
/character saves death:13 wands:14 paralysis_petrify:13 breath:16 spells:15
/character movement movement:90 encumbrance_category:Light
/character equipment add item_name:longsword quantity:1 weight:6 location:carried
/character equipment add item_name:shield quantity:1 weight:10 location:carried
/character equipment add item_name:backpack quantity:1 weight:2 location:carried
/character equipment add item_name:torches quantity:6 weight:1 location:carried
/character equipment equip item_name:longsword
/character equipment equip item_name:shield
/character equipment remove item_name:torches quantity:1
/character equipment list
/ledger
```

Confirm:

- `Testus` is created Active and `Aldric` is created Inactive.
- `/character list` shows both characters with status and active state.
- `/ledger` initially shows `Testus`, then shows `Aldric` after activation.
- Updates affect only supplied fields.
- Coin `add` and `subtract` modes preserve omitted coin fields.
- Equipment list shows longsword and shield equipped, backpack carried, and five torches remaining.
- `/ledger` shows updated HP, AC, XP, abilities, coins, movement, encumbrance, status, and active state.
- Restart backend and bot, then run `/ledger`; the same values should persist from PostgreSQL.
