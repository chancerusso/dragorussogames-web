# RUSSO™ Referee Screen

## Command

```text
/ref screen
```

`/ref screen` shows a referee-only quick-reference panel for running DRG1e / OSRIC-style sessions.

This is a quick reference, not automation. It does not roll attacks, resolve damage, track initiative, generate encounters, run spells, or act as a VTT.

## Contents

The referee screen is split into Discord embeds for fast reading:

- Combat tables and THAC0 quick references
- Saving throw matrices
- Cleric turning matrix
- Combat procedure, surprise, initiative, and morale reminders
- Exploration time, dungeon movement, wandering monsters, and rest

## Rules Data

OSRIC is the initial structured ruleset.

The referee screen consumes loaded rules data instead of hardcoded embed tables. Future DRG1e house rules should replace or extend the ruleset data through the rules loader, not by editing Discord embed text directly.

Current bot default:

```text
RUSSO_RULESET=osric
```

## Referee Authority

The screen is intentionally compact. Use the campaign text and OSRIC/DRG1e procedures when detail matters.

Referee rulings override quick references.
