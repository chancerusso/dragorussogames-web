# RUSSO™ Group Storage

`/mule` represents group storage for a channel: pack mule, cart, camp stash, party treasure chest, safe room, or similar shared storage.

Group storage is scoped by `guild_id + channel_id`. Channel names are displayed for readability only and are not the primary identity.

```text
/mule add item:torch qty:6
/mule elim item:torch qty:2
/mule coins action:add coin:gp amount:500
/mule coins action:subtract coin:gp amount:50
/mule coins action:elim coin:gp amount:50
/mule coins action:set coin:gp amount:1000
/mule status
```

Mule items use the OSRIC equipment catalog and show total group-store weight. Mule equipment and mule coins do not affect character encumbrance. Character-carried coins are managed with `/coin` and do affect character encumbrance.

The group XP bank is also channel-scoped:

```text
/tracker xp action:add amount:500
/tracker xp action:elim amount:100
/tracker xp action:set amount:1200
/tracker xp action:status
```

XP bank totals appear in `/tracker status` and `/mule status`. RUSSO does not automatically distribute XP to characters in this phase.

Marching order and expedition tracker state are also channel-scoped, so separate Discord game channels can run separate groups in the same server.
