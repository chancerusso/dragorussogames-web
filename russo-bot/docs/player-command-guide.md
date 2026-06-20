# RUSSO™ Player Command Guide
## Referee Utility System for Sessions & Operations

RUSSO™ is the Referee Utility System for Sessions & Operations. It keeps your persistent old-school character ledger between sessions.

### Where to Use RUSSO

Use #pc-maintenance for character creation, equipment changes, treasure updates, and between-session maintenance.

RUSSO may work in other channels when it has permission, but #pc-maintenance is the intended place for between-session upkeep.

### Step 1: Create Your Character

Use `/character create` to create your character and campaign ledger.

Required:

```text
/character create character_name:Testus race:Human class_name:Fighter level:1
```

Recommended optional fields:

```text
player_name
alignment
hp_max
hp_current
armor_class
movement
thac0
xp
coins
languages
saves
notes
strength
intelligence
wisdom
dexterity
constitution
charisma
```

Enter only raw ability scores. RUSSO calculates the modifier automatically, such as `STR 17 (+1)`.

Full starting example:

```text
/character create character_name:Testus race:Human class_name:Fighter level:1 alignment:Neutral hp_max:10 hp_current:10 armor_class:5 movement:90 ft thac0:20 xp:0 coins:15 gp, 8 sp languages:Common saves:death 13, wands 14, paralysis 13, breath 16, spells 15 strength:17 intelligence:12 wisdom:9 dexterity:15 constitution:13 charisma:8 notes:Retainer contact in town
```

Your first character is marked Active. Later characters are created Inactive until you switch active characters.

### Step 2: Review Your Character

Use the compact table card:

```text
/show card
/show card character:Aldric
/character sheet
```

The card is read-only and shows identity, combat, ability scores with modifiers, equipped weapons, encumbrance, spells if tracked, XP, and coins.

The sheet is the fuller view. It shows name, player, race, class, level, alignment, status, HP, AC, movement, THAC0, XP, coins, abilities with modifiers, saves, languages, equipment summary, encumbrance, and notes.

Use the fuller ledger view when you need more detail:

```text
/ledger show
```

### Step 3: Maintain Your Ledger

Ledger commands update your active character by default.

```text
/ledger hp value:8 mode:set
/ledger hp value:2 mode:add
/ledger hp value:3 mode:subtract
/ledger ac value:5
/ledger xp value:250 mode:add
/ledger coins coin:gp value:15 mode:add
/ledger coins coin:sp value:3 mode:subtract
/ledger status value:Poisoned
/ledger abilities str:17 int:12 wis:9 dex:15 con:13 cha:8
/ledger resources resource:torches value:1 mode:subtract
/ledger saves death:13 wands:14 paralysis_petrify:13 breath:16 spells:15
/ledger movement movement:90 ft encumbrance_category:Light
/rest
```

Every ledger change creates a Character Register entry in the Campaign Record.

`/rest` applies long rest / daily recovery to your active character: +1 HP, not exceeding max HP. If your character is a caster, RUSSO reminds you to prepare spells. RUSSO does not auto-prepare spells or reset spell slots yet.

Rule distinction: `/tracker rest` is one exploration turn of party rest and does not heal HP. `/rest` is daily natural recovery and adds +1 HP, not exceeding max HP.

DM/admin options:

```text
/rest character:Aldric
/rest all:true
```

`/rest all:true` uses the current channel's `/order` as the group roster when available.

### Step 4: Maintain Equipment

Equipment belongs to your active character by default.

```text
/equipment add
/equipment add item:longsword qty:1 equipped:true
/equipment list
/equipment equip item:longsword
/equipment unequip item:longsword
/equipment elim
/equipment elim item:longsword qty:1
/equipment remove item:longsword qty:1
/equipment custom name:"Silver Idol" weight:12 value:"250 gp"
```

Standard equipment comes from the OSRIC catalog. You can type common aliases such as `long sword`; RUSSO stores the canonical name and fills in weight, value, and weapon damage when present. If you run `/equipment add` or `/equipment elim` without an item, RUSSO opens a prompt for item name, quantity, and notes.

Equipment changes are logged in the Character Register. Encumbrance recalculates after add, elim/remove, equip, unequip, and custom item changes. RUSSO shows carried weight before/after and a movement warning when encumbrance needs Referee review. Weapon damage appears on `/show card` when the catalog or custom entry includes damage.

### Character Coins

Character-carried coins affect character encumbrance.

```text
/coin add
/coin add gp:10 sp:5 cp:20
/coin elim gp:5 sp:2
/coin set gp:100 sp:0 cp:0
/coin status
```

If you run `/coin add`, `/coin elim`, or `/coin set` without coin fields, RUSSO opens a prompt. Coin changes update the Character Register, coin totals, coin weight, and carried encumbrance.

### Group Storage And XP Bank

Group storage belongs to the Discord channel, not one character. Use it for a pack mule, cart, camp stash, party treasure chest, or safe room.

```text
/mule add item:torch qty:6
/mule elim item:torch qty:2
/mule coins action:add coin:gp amount:500
/mule coins action:subtract coin:gp amount:50
/mule coins action:set coin:gp amount:1000
/mule status
```

Mule equipment and mule coins do not affect character encumbrance. Character-carried coins use `/coin`; group coins use `/mule coins`. Group storage is scoped by `guild_id + channel_id`, so different game channels keep separate stores.

The XP bank is for treasure XP, monster XP, or session XP not yet awarded:

```text
/tracker xp action:add amount:500
/tracker xp action:elim amount:100
/tracker xp action:set amount:1200
/tracker xp action:status
```

XP bank totals appear in `/tracker status` and `/mule status`. XP is not automatically distributed.

### Active Characters

Use `/character list` to see all of your characters.

Use `/character active character:<name>` to switch active characters. Only one character can be Active at a time. Inactive characters remain preserved.

### Privacy And DM Access

Players can view and update only their own characters. A DM/admin may view or update any character when needed.

### Expedition Tracker

The Referee may use `/tracker` to track exploration turns, light, oil, rations, rest pressure, wandering monster cadence, movement, and marching order.

Players may view:

```text
/tracker status
/tracker day action:status
/order
/camp
```

The Referee may use `/tracker day action:next` or `/tracker day action:set number:3` to move between expedition days. The turn counter tracks the current day's exploration turns.

Marching order is exploration posture, not tactical grid combat.

Use `/camp` for the current channel group's overnight / end-of-day procedure:

```text
/camp watches:"Aldric, Testus, hirelings" location:"Ruined farmhouse" consume_rations:true advance_day:true
```

`/camp` shows the day ending, watch order, `/order` roster, ration reminder, light/fire reminder, night encounter reminder, spell preparation reminder, mule/XP summary, and recovery prompt. It does not heal automatically. After camp is complete, each player may use `/rest` for +1 HP daily natural recovery.

Rule distinction: `/tracker rest` is one exploration turn of party rest and does not heal HP. `/rest` is daily natural recovery and adds +1 HP, not exceeding max HP.

### Printed Sheets

Your printed character sheet is welcome at the table. RUSSO is the campaign register that keeps your character record persistent between sessions.

### Referee Authority

The Referee has final authority over all records, rulings, rewards, treasure, and character state.

### Future: Roster Cards

Future RUSSO may support a #pc-roster channel where active characters have pinned or refreshable compact character cards.

Possible future commands:

```text
/card publish
/card refresh
/card archive
```

Each character should own exactly one roster card. Roster card identity should be `discord_user_id + character_id`, not `character_name`, because players may reuse names, retire and return characters, or own multiple characters.

Future behavior:

- `/card publish` creates the card if none exists.
- `/card refresh` updates the existing card.
- `/card archive` marks the roster card inactive.

Roster cards should update an existing character card message when possible and should never create duplicate cards for the same character.
