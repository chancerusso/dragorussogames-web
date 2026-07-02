# RUSSO™ Equipment Catalog

RUSSO uses a structured OSRIC equipment catalog for standard items.

Players should not enter weight, value, or weapon damage for common equipment. Use:

```text
/equipment add
/equipment add item:longsword
/equipment add item:shield qty:1 equipped:true
/equipment elim
/equipment elim item:longsword qty:1
```

RUSSO resolves aliases such as `long sword`, stores the canonical item name, and applies catalog weight, value, and damage when present. `/equipment add` and `/equipment elim` open a prompt when no item is provided. Encumbrance recalculates after add, elim/remove, equip, unequip, and custom item changes.

Equipment output shows carried weight before/after and movement before/after. Movement threshold automation is not finalized yet; RUSSO marks this as an encumbrance warning for Referee review rather than inventing hidden rules.

If an item is not in the catalog, use:

```text
/equipment custom name:"Silver Idol" weight:12 value:"250 gp"
```

Custom items should represent referee-approved gear, treasure, or campaign-specific objects. Standard catalog values are kept in `discord-bot/src/rules/equipment/` so DRG1e house rules can replace or override OSRIC later.

Catalog notes may include TODO markers where a value still needs verification against the OSRIC PDF.
