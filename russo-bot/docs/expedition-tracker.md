# RUSSO™ Expedition Tracker

The expedition tracker supports dungeon exploration pacing for DRG1e / OSRIC-style play.

This is not a combat tracker, initiative tracker, encounter generator, VTT map, or automation engine. It is a persistent table reminder for exploration turns, light, rest pressure, supplies, wandering monster cadence, movement, and marching order.

Referee rulings override all tracker reminders.

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

## OSRIC Assumptions

- 1 turn = 10 minutes
- Wandering monster reminder every 3rd turn
- Rest reminder every 6th turn
- Rest 1 turn after combat
- Torch duration is 6 turns
- 1 pint of lantern oil burns for 24 turns
