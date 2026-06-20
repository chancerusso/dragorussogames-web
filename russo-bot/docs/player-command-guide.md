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
```

Every ledger change creates a Character Register entry in the Campaign Record.

### Step 4: Maintain Equipment

Equipment belongs to your active character by default.

```text
/equipment add item_name:Longsword quantity:1 weight:6 value:15 gp damage:1d8 equipped:true
/equipment list
/equipment equip item_name:Longsword
/equipment unequip item_name:Longsword
/equipment remove item_name:Longsword quantity:1
```

Equipment changes are logged in the Character Register. Encumbrance recalculates after add, remove, equip, and unequip.

Weapon damage appears on `/show card` when entered.

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
/order
```

Marching order is exploration posture, not tactical grid combat.

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
