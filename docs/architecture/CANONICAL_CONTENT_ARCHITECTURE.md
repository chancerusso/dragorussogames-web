# Canonical Content Architecture

Classic Drago uses one active rules engine: OSRIC.

Classic is the standard approved OSRIC availability profile. Dragolance uses
OSRIC plus approved Dragolance records, restrictions, relationships, and
extensions. Additional books, adventures, and homebrew collections may become
source libraries later, but they are content sources, not rules engines.

## Stable IDs

Canonical records use lowercase dot-separated stable IDs such as
`osric.class.fighter`, `osric.weapon.long_sword`, and
`dragolance.extension.magic_user.high_sorcery`. Display names may change
without changing IDs. Deprecated records remain addressable and may point to a
replacement ID.

## Source Libraries

Source-library records live under `content/sources/`. They track provenance,
license or usage status, private-reference status, review status, and whether a
source is available to players. Internal source references and page numbers may
be visible to authorized administrators, but must not be emitted in
player-facing APIs or player pages.

## Separate Schemas

Each major content type has its own schema under `content/schemas/`. Shared
metadata is defined once in `content/schemas/shared/metadata.schema.json`, but
races, classes, spells, weapons, armor, gear, magic items, monsters, deities,
organizations, calendars, moons, campaigns, availability rules, restrictions,
and extensions stay separate. There is no universal content-record schema.

## Canonical JSON and Runtime Data

Version-controlled JSON is the reviewed canonical source of truth. Runtime
database tables will later hold users, campaigns, characters, character-owned
item instances, import logs, draft admin edits, and indexed canonical records if
needed for API performance.

Future Admin Portal edits should create database draft records. Drafts must be
reviewed and promoted before canonical JSON changes. Admin edits must never
silently mutate canonical OSRIC records.

## Campaign Profiles

Campaign profiles live under `content/campaigns/templates/`. A campaign profile
selects availability, restriction, and extension records. Campaigns reference
canonical records by ID instead of copying them.

## Extensions

Dragolance extensions are overlay records. For example,
`dragolance.extension.magic_user.high_sorcery` targets
`osric.class.magic_user` and adds setting relationships. It does not duplicate
the OSRIC magic-user class record.

## Item Definitions and Instances

Canonical item definitions describe what an item is: weapon, armor, shield,
gear, magic item, or unique adventure item. Character-owned item instances are
runtime records that describe who owns a copy, quantity, charges,
identification, custom names, condition, and player or DM notes.

## Validation Workflow

Run:

```bash
python3 content/tools/validate_content.py
```

The validator checks schemas, stable IDs, duplicate IDs, source libraries,
references, campaign profile links, directory placement, and unsafe
player-visible internal material.

Run:

```bash
python3 content/tools/report_content_status.py
```

The status report summarizes record counts, review status, draft and
needs-review records, deprecated records, missing descriptions, missing source
references, and Dragolance TODO/VERIFY markers.

## Future Import Process

The future importer should validate all JSON first, import idempotently by
stable ID, log import batches, preserve existing character data, and report
legacy string mappings before character migration. Database imports are not part
of Phase 2 Unit 1.

## Private References

Private PDFs belong under `private-reference/sources/`. They must be excluded
from production deployment, static serving, Vite builds, FastAPI mounts, Nginx
serving, and public APIs.
