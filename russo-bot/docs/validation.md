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
- `/ledger show` returns a Discord embed with character fields
- `/show card` returns a compact read-only character card

Restart `russo-bot.service` and `russo-backend.service`, then run `/ledger show` again. The character should still load from PostgreSQL.

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
/character create character_name:Aric race:Human class_name:Fighter level:1
/character hp current_hp:7 max_hp:10
/character ac armor_class:5
/character xp current_xp:1250 xp_needed:2000
/character coins gp:42 sp:7
/character abilities str:16 int:10 wis:12 dex:14 con:13 cha:9
/character status status:Active
/ledger show
```

Confirm `/ledger show` shows:

- HP as `7/10`
- AC as `5`
- XP as `1250 / 2000`
- coins as `pp, gp, ep, sp, cp`
- abilities as `STR INT WIS DEX CON CHA`
- Status as `Active`

Restart the bot and backend services, then run `/ledger show` again. The same values should still render from PostgreSQL.

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
/character create character_name:Testus race:Human class_name:Fighter level:1 alignment:Neutral hp_max:10 hp_current:10 armor_class:5
/character create character_name:Aldric race:Elf class_name:Magic-User level:1 alignment:Chaotic Good hp_max:4 hp_current:4 armor_class:9
/character list
/ledger show
/character active character:Aldric
/ledger show
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
/ledger show
```

Confirm:

- `Testus` is created Active and `Aldric` is created Inactive.
- `/character list` shows both characters with status and active state.
- `/ledger show` initially shows `Testus`, then shows `Aldric` after activation.
- Updates affect only supplied fields.
- Coin `add` and `subtract` modes preserve omitted coin fields.
- Equipment list shows longsword and shield equipped, backpack carried, and five torches remaining.
- `/ledger show` shows updated HP, AC, XP, abilities, coins, movement, encumbrance, status, and active state.
- Restart backend and bot, then run `/ledger show`; the same values should persist from PostgreSQL.

## Phase 1.3 Player Self-Service Ledger

Recommended Discord channel:

```text
#pc-maintenance
```

Test characters:

```text
Testus
Aldric
```

Discord validation flow:

```text
/help
/character create character_name:Testus race:Human class_name:Fighter level:1 alignment:Neutral hp_max:10 hp_current:10 armor_class:5 strength:17 intelligence:12 wisdom:9 dexterity:15 constitution:13 charisma:8
/show card
/character create character_name:Aldric race:Elf class_name:Magic-User level:1 alignment:Chaotic Good hp_max:4 hp_current:4 armor_class:9
/character list
/character active character:Aldric
/character sheet
/ledger hp value:3 mode:set max_hp:4
/ledger xp value:250 mode:add
/ledger coins coin:gp value:15 mode:add
/ledger coins coin:sp value:3 mode:subtract
/ledger abilities str:12 int:17 wis:10 dex:15 con:9 cha:11
/ledger resources resource:torches value:6 mode:set
/ledger saves death:13 wands:14 paralysis_petrify:13 breath:16 spells:15
/ledger movement movement:90 ft encumbrance_category:Light
/equipment add item_name:Longsword quantity:1 weight:6 damage:1d8 location:carried
/equipment add item_name:Shortbow quantity:1 weight:5 damage:1d6 location:carried notes:range
/equipment equip item_name:Longsword
/equipment equip item_name:Shortbow
/equipment list
/show card
/show card character:Aldric
```

Checklist:

- [ ] Player creates first character
- [ ] Ledger auto-created
- [ ] First character is Active
- [ ] Player creates second character
- [ ] Second character is Inactive
- [ ] Player switches active character
- [ ] `/character sheet` shows active character
- [ ] Player updates HP
- [ ] Player updates XP
- [ ] Player updates coins
- [ ] Player adds equipment
- [ ] Player equips equipment
- [ ] Encumbrance recalculates
- [ ] Register/audit entry is created
- [ ] DM/admin can view player character
- [ ] DM/admin can edit player character
- [ ] Non-admin cannot edit another player character
- [ ] Service restart preserves state
- [ ] Ability score entered by player displays calculated modifier
- [ ] STR 17 displays +1
- [ ] `/show card` displays active character
- [ ] `/show card character:<name>` works for owned character
- [ ] DM/admin can show another player's card
- [ ] Non-admin cannot show another player's private character card
- [ ] Weapons display damage if damage field exists
- [ ] Card remains read-only

## Future: Pinned Character Cards

Future RUSSO may support a `#pc-roster` channel where each active character has a pinned or refreshable compact character card.

Possible future commands:

```text
/card publish
/card refresh
/card archive
```

Identity rule:

```text
discord_user_id + character_id
```

Do not use `character_name` as roster-card identity. Players may reuse names, characters may retire and return, and players may own multiple characters.

If implemented later, store this metadata with the character record:

```text
roster_message_id
roster_channel_id
published_at
last_refresh_at
```

Future validation should confirm:

- [ ] `/card publish` posts the active character card to `#pc-roster`
- [ ] `/card publish` creates a card if none exists
- [ ] `/card refresh` updates the existing roster card message when possible
- [ ] `/card archive` marks the roster card inactive
- [ ] Roster card lookup uses `discord_user_id + character_id`
- [ ] Roster card lookup does not use `character_name`
- [ ] Publishing or refreshing does not create duplicate cards for the same character
- [ ] Inactive characters are not accidentally published as active roster cards
- [ ] Non-admin players cannot publish or refresh another player's private character card
- [ ] Missing roster-channel permissions produce a helpful error
- [ ] Roster-card state survives service restart

Do not build pinned roster cards in Phase 1.3.
