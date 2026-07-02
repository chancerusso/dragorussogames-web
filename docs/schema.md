# Schema Summary

## campaigns

Stores campaign containers for RUSSO ledgers.

- `id`
- `name`
- `created_at`
- `updated_at`

## players

Stores Discord-linked players.

- `id`
- `player_name`
- `discord_username`
- `discord_user_id`
- `created_at`
- `updated_at`

## parties

Stores campaign parties for later grouping. Phase 1 creates the table but does not expose party commands.

- `id`
- `campaign_id`
- `name`
- `created_at`
- `updated_at`

## characters

Stores active and historical character ledgers.

- `id`
- `campaign_id`
- `party_id`
- `player_id`
- `character_name`
- `player_name`
- `discord_username`
- `discord_user_id`
- `ledger` JSONB
- `is_active`
- `status`
- `created_at`
- `updated_at`

The `ledger` JSON stores:
- Identity
- Character Basics
- Ability Scores
- Combat
- Equipment
- Wealth
- Resources
- Magic
- Conditions
- Recovery

Only one character per Discord user should have `is_active = true` and `status = Active`.

## audit_logs

Records state-changing actions.

- `id`
- `actor_discord_user_id`
- `action`
- `entity_type`
- `entity_id`
- `payload` JSONB
- `created_at`
