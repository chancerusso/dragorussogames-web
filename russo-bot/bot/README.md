# RUSSO Discord Bot

Discord.js bot for the Phase 1 RUSSO character ledger.

## Local Commands

```bash
npm install
cp .env.example .env
npm run build
npm run register
npm start
```

## Slash Commands

- `/ping`
- `/guide`
- `/help` deprecated alias for `/guide`
- `/show card`
- `/character create`
- `/character list`
- `/character active`
- `/character sheet`
- `/character abilities`
- `/character hp`
- `/character ac`
- `/character xp`
- `/character coins`
- `/character status`
- `/character equipment add`
- `/character equipment remove`
- `/character equipment list`
- `/character equipment equip`
- `/character equipment unequip`
- `/character resources`
- `/character saves`
- `/character movement`
- `/ledger show`
- `/ledger hp`
- `/ledger ac`
- `/ledger xp`
- `/ledger coins`
- `/ledger abilities`
- `/ledger status`
- `/ledger resources`
- `/ledger saves`
- `/ledger movement`
- `/equipment add`
- `/equipment list`
- `/equipment equip`
- `/equipment unequip`
- `/equipment remove`

Use `/show card` to display your compact table card for quick play reference.

Use `#pc-maintenance` for character creation, equipment changes, treasure updates, and between-session maintenance.

RUSSO™ is the Referee Utility System for Sessions & Operations. It keeps your persistent old-school character ledger between sessions.

Player onboarding:

1. Go to `#pc-maintenance`.
2. Run `/character create`.
3. Run `/character sheet`.
4. Run `/show card`.
5. Maintain HP, XP, coins, and equipment with `/ledger` and `/equipment`.

## Future Roster Cards

Future RUSSO may support a `#pc-roster` channel with `/card publish`, `/card refresh`, and `/card archive`.

Each character should own exactly one roster card, identified by `discord_user_id + character_id`, not `character_name`. If implemented later, store `roster_message_id`, `roster_channel_id`, `published_at`, and `last_refresh_at` in character metadata.

Pinned or refreshable roster cards should update the existing character card message when possible and should never create duplicate cards for the same character. This is not part of Phase 1.3.
