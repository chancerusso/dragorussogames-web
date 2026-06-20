# RUSSO™ Expedition Tracker

The expedition tracker supports dungeon exploration pacing for DRG1e / OSRIC-style play.

This is not a combat tracker, initiative tracker, encounter generator, VTT map, or automation engine. It is a persistent table reminder for exploration turns, light, rest pressure, supplies, wandering monster cadence, movement, and marching order.

Referee rulings override all tracker reminders.

Trackers are scoped by `guild_id + channel_id`. Separate game channels keep separate tracker state, marching order, group storage, and XP bank records.

## Tracker Commands

Start the tracker:

```text
/tracker start move_rate:120 rations:12 oil_pints:2 notes:Entering the lower halls
```

Show current state:

```text
/tracker status
```

Advance one exploration turn:

```text
/tracker next
```

Rest for one exploration turn:

```text
/tracker rest
```

`/tracker rest` is one exploration turn of party rest and does not heal HP. Use `/rest` for daily natural recovery on a character; `/rest` adds +1 HP, not exceeding max HP.

Mark combat:

```text
/tracker combat
/tracker combat advance_turn:true
```

Set party movement:

```text
/tracker move rate:90
```

Manage torches:

```text
/tracker torch action:light holder:Aldric
/tracker torch action:status
/tracker torch action:extinguish
```

Manage lanterns:

```text
/tracker lantern action:light holder:Testus
/tracker lantern action:status
/tracker lantern action:extinguish
```

Manage oil:

```text
/tracker oil action:add amount:1
/tracker oil action:subtract amount:1
/tracker oil action:set amount:3
```

Manage rations:

```text
/tracker ration action:add amount:6
/tracker ration action:subtract amount:1
/tracker ration action:set amount:12
/tracker ration action:consume amount:1
```

Manage expedition days:

```text
/tracker day action:next
/tracker day action:set number:3
/tracker day action:status
```

The day number is stored separately. The turn counter tracks the current day's exploration turns and resets when the day advances or is set. Rations and oil are not automatically consumed by day changes.

Run overnight / end-of-day camp:

```text
/camp watches:"Aldric, Testus, Hireling" location:"Old watchtower" consume_rations:true advance_day:true
```

`/camp` is scoped by `guild_id + channel_id`. It displays the camp procedure, current `/order` roster, watches, ration check, light/fire reminder, night encounter reminder, spell preparation reminder, natural recovery prompt, XP bank, and mule summary.

If `advance_day:true`, `/camp` uses the tracker day advancement procedure: current day ends, next day begins, and the turn counter resets. This requires Referee/admin permission. `/camp` does not heal characters automatically. After camp is complete, each player may use `/rest` for +1 HP daily natural recovery.

If `consume_rations:true`, `/camp` prompts a ration check and shows mule/group ration inventory when available. It does not automatically consume rations while ration unit duration remains catalog-dependent.

Manage pending group XP:

```text
/tracker xp action:add amount:500
/tracker xp action:elim amount:100
/tracker xp action:set amount:1200
/tracker xp action:status
```

The XP bank is channel-scoped and appears in `/tracker status` and `/mule status`. RUSSO does not automatically distribute XP.

Stop the tracker:

```text
/tracker stop
```

## Marching Order

`/order` stores exploration posture, not tactical combat.

```text
/order pos1:Testus pos2:Aldric pos3:Porter pos7:Hireling pos8:Dwarf notes:Torch in pos1
```

Run `/order` with no options to display the current marching order.

Positions 1-2 are the front rank. Positions 7-8 are the rear rank.

## Mule / Group Storage

`/mule` stores channel-level party gear and treasure for the expedition group. Use it for a pack mule, cart, party chest, safe room, or camp stash.

```text
/mule add item:torch qty:6
/mule elim item:torch qty:2
/mule coins action:add coin:gp amount:500
/mule coins action:subtract coin:gp amount:50
/mule coins action:set coin:gp amount:1000
/mule status
```

Mule items use the same OSRIC equipment catalog as player equipment. Mule weight is shown in `/mule status`, but it does not affect any character's encumbrance.

## OSRIC Assumptions

- 1 turn = 10 minutes
- Wandering monster reminder every 3rd turn
- Rest reminder every 6th turn
- Rest 1 turn after combat
- Torch duration is 6 turns
- 1 pint of lantern oil burns for 24 turns
