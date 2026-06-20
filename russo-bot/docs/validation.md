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
/equipment add item:longsword qty:1
/equipment add item:shield qty:1
/equipment add item:backpack qty:1
/equipment add item:torch qty:6
/equipment equip item:longsword
/equipment equip item:shield
/equipment elim item:torch qty:1
/equipment list
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
/guide
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
/equipment add item:longsword qty:1
/equipment add item:shortbow qty:1 notes:range
/equipment equip item:longsword
/equipment equip item:shortbow
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

## Phase 1.3A Complete Character Sheet

Discord validation flow:

```text
/guide
/character create character_name:Testus race:Human class_name:Fighter level:1 alignment:Neutral hp_max:10 hp_current:10 armor_class:5 movement:90 ft thac0:20 xp:0 coins:15 gp, 8 sp languages:Common saves:death 13, wands 14, paralysis 13, breath 16, spells 15 strength:17 intelligence:12 wisdom:9 dexterity:15 constitution:13 charisma:8 notes:Retainer contact in town
/character sheet
/show card
/equipment add item:longsword qty:1 equipped:true
/equipment add item:dagger qty:1
/equipment list
/show card
/ledger hp value:2 mode:subtract
/ledger xp value:250 mode:add
/ledger coins coin:gp value:5 mode:add
/character sheet
```

Checklist:

- [ ] Player creates full character
- [ ] Ledger auto-created
- [ ] First full character is Active
- [ ] Ability modifiers display correctly
- [ ] STR 17 shows +1
- [ ] `/character sheet` works
- [ ] `/character sheet character:<name>` works for an owned character
- [ ] Admin can view another player's sheet
- [ ] `/show card` works
- [ ] `/show card character:<name>` works
- [ ] Equipment weapon damage appears on card
- [ ] Equipment value is stored when entered
- [ ] Equipped state is preserved
- [ ] Encumbrance recalculates
- [ ] `/guide` works
- [ ] `/help` replies as a deprecated alias for `/guide`
- [ ] Admin can view/edit other characters
- [ ] Non-admin cannot edit another player
- [ ] Restart preserves data
- [ ] No VTT, attack rolling, damage rolling, initiative, spell automation, rest automation, encounter system, or referee dashboard behavior appears

## Phase 1.4 Referee Screen

Discord validation flow:

```text
/ref screen
```

Checklist:

- [ ] `/ref screen` loads
- [ ] Non-admin user cannot load `/ref screen`
- [ ] combat table visible
- [ ] save table visible
- [ ] turning visible
- [ ] morale visible
- [ ] movement visible
- [ ] referee screen consumes structured rules data
- [ ] OSRIC ruleset loads by default
- [ ] readable on desktop
- [ ] readable on mobile
- [ ] no wrapped tables
- [ ] no giant code blocks
- [ ] No encounter generator appears
- [ ] No combat roller appears
- [ ] No initiative tracker appears
- [ ] No spell engine appears
- [ ] No monster database appears
- [ ] No VTT behavior appears

## Phase 1.5 Expedition Tracker

Discord validation flow:

```text
/tracker start move_rate:120 rations:12 oil_pints:2 notes:Entering level one
/order pos1:Testus pos2:Aldric pos7:Hireling pos8:Dwarf notes:Torch in front rank
/tracker status
/tracker torch action:light holder:Testus
/tracker lantern action:light holder:Aldric
/tracker next
/tracker next
/tracker next
/tracker rest
/tracker combat
/tracker move rate:90
/tracker oil action:add amount:1
/tracker ration action:consume amount:1
/tracker stop
```

Checklist:

- [ ] Slash command registration list includes `tracker`
- [ ] Slash command registration list includes `order`
- [ ] `/tracker start` creates persistent tracker state
- [ ] `/tracker status` displays Day, Turn, elapsed time, movement, light, rest, wandering monsters, supplies, and marching order
- [ ] `/tracker next` advances one turn
- [ ] `/tracker next` reminds wandering monster check every 3rd turn
- [ ] `/tracker next` reminds rest every 6th turn
- [ ] Torch duration decreases and expires
- [ ] Lantern requires oil and burns oil by turns
- [ ] `/tracker rest` advances time and clears combat rest
- [ ] `/tracker combat` marks combat rest required
- [ ] `/tracker move` updates movement distance
- [ ] `/tracker oil` updates oil pints
- [ ] `/tracker ration` updates rations
- [ ] `/tracker stop` shows final summary
- [ ] `/order` saves marching order
- [ ] `/order` displays empty positions as `-`
- [ ] `/tracker status` shows marching order summary
- [ ] Players can view `/tracker status` and `/order`
- [ ] Non-admin update attempts are rejected
- [ ] Service restart preserves tracker and order state
- [ ] No combat tracker, initiative tracker, monster roller, encounter generator, automatic wandering monster roll, VTT map, grid combat, or spell duration engine appears

## Rest / Daily Recovery

Discord validation flow:

```text
/rest
/rest character:Aldric
/order pos1:Testus pos2:Aldric
/rest all:true
```

Checklist:

- [ ] `/rest` targets the player's active character
- [ ] `/rest` adds +1 HP
- [ ] `/rest` does not exceed max HP
- [ ] `/rest` shows current HP after rest
- [ ] Caster receives: "Prepare spells: minimum 4 hours quiet rest, then 15 minutes per spell level memorized."
- [ ] `/rest` creates a Character Register / audit entry
- [ ] Temporary daily notes/resources clear if tracked
- [ ] `/rest character:<name>` works for DM/admin
- [ ] `/rest all:true` is admin-only
- [ ] `/rest all:true` applies to active characters in the current channel's `/order`
- [ ] `/rest` does not auto-prepare spells
- [ ] `/rest` does not auto-reset spell slots

## Camp / End-Of-Day Procedure

Discord validation flow:

```text
/tracker status
/order pos1:Testus pos2:Aldric
/mule status
/camp watches:"Testus, Aldric" location:"Old watchtower" consume_rations:true advance_day:true
/tracker status
/rest
/tracker rest
```

Checklist:

- [ ] `/camp` displays
- [ ] `/camp` is scoped to current Discord channel/group
- [ ] `/camp advance_day:true` increments day for Referee/admin
- [ ] `/camp advance_day:true` resets turn counter
- [ ] `/camp` shows "Camp Set"
- [ ] `/camp` shows "Day X ends / Day Y begins" when day advances
- [ ] `/camp` shows watches
- [ ] `/camp` shows `/order` roster if available
- [ ] `/camp` shows ration check/consume reminder
- [ ] `/camp` shows light/fire reminder
- [ ] `/camp` shows night encounter reminder
- [ ] `/camp` shows caster spell preparation reminder
- [ ] `/camp` shows recovery prompt to use `/rest`
- [ ] `/camp` includes XP bank/mule summary
- [ ] `/camp` does not heal automatically
- [ ] `/rest` still handles +1 HP daily natural recovery
- [ ] `/tracker rest` still means 1 exploration turn only and no HP healing

## Phase 1.6 Equipment Catalog, Mule Store, XP Bank, Channel Groups

Discord validation flow:

```text
/equipment add
/equipment add item:longsword
/equipment add item:"long sword" qty:1
/equipment list
/equipment equip item:longsword
/equipment elim
/equipment elim item:longsword qty:1
/equipment custom name:"Silver Idol" weight:12 value:"250 gp"
/coin add
/coin add gp:10 sp:5 cp:20
/coin elim gp:5 sp:2 cp:0
/coin set gp:100 sp:0 cp:0
/coin status
/mule add item:torch qty:6
/mule elim item:torch qty:2
/mule coins action:add coin:gp amount:500
/mule coins action:subtract coin:gp amount:50
/mule coins action:elim coin:gp amount:50
/mule coins action:set coin:gp amount:1000
/mule status
/tracker xp action:add amount:500
/tracker xp action:status
/tracker day action:next
/tracker day action:set number:3
/tracker status
```

Equipment UX:

- [ ] `/equipment add` with no item opens modal/prompt
- [ ] `/equipment add item:longsword` adds Longsword
- [ ] `/equipment add item:longsword qty:1` works directly
- [ ] Longsword auto-fills damage
- [ ] Longsword auto-fills weight
- [ ] Longsword auto-fills value/cost
- [ ] `/equipment elim` with no item opens modal/prompt
- [ ] `/equipment elim item:longsword` removes it
- [ ] `/equipment elim item:longsword qty:1` removes it
- [ ] `/equipment remove item:longsword` still works as an alias
- [ ] Encumbrance recalculates after add
- [ ] Encumbrance recalculates after elim
- [ ] Movement warning appears when movement changes or when Referee encumbrance review is needed
- [ ] Alias lookup works
- [ ] Typo suggestion works
- [ ] `/equipment custom` still works for custom/referee-approved items

Coin UX:

- [ ] `/coin add` opens modal/prompt
- [ ] `/coin add gp:10 sp:5 cp:20` works if options implemented
- [ ] Character coins update
- [ ] Coin weight affects encumbrance
- [ ] Movement warning appears when coin weight changes movement or when Referee encumbrance review is needed
- [ ] `/coin status` displays coin totals and coin weight
- [ ] Character coins affect character encumbrance
- [ ] Mule coins do not affect character encumbrance

Mule / Group Store:

- [ ] `/mule add item:torch qty:6` adds torches to channel store
- [ ] `/mule elim item:torch qty:2` removes 2
- [ ] `/mule status` shows items
- [ ] `/mule status` shows total group-store weight
- [ ] Mule storage does not affect character encumbrance
- [ ] Mule coins can add/subtract/set gp
- [ ] Separate channels have separate mule stores

XP Bank:

- [ ] `/tracker xp action:add amount:500`
- [ ] `/tracker xp action:status`
- [ ] XP bank appears in tracker status
- [ ] XP bank appears in mule status
- [ ] XP bank is channel-scoped
- [ ] XP is not auto-distributed

Days:

- [ ] `/tracker day action:next`
- [ ] `/tracker day action:set number:3`
- [ ] Day increments or sets
- [ ] Turn counter behavior is clear
- [ ] Tracker status shows day

Channel Scope:

- [ ] Tracker in channel A does not affect channel B
- [ ] Mule in channel A does not affect channel B
- [ ] Order in channel A does not affect channel B

Command registration:

- [ ] Slash command registration includes `equipment`
- [ ] Slash command registration includes `coin`
- [ ] Slash command registration includes `mule`
- [ ] Slash command registration includes `tracker`
- [ ] Slash command registration includes `order`
- [ ] Slash command registration includes `camp`
- [ ] Slash command registration includes `rest`
- [ ] Slash command registration includes `guide`

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
