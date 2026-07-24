# Local Drago Table Host

## Decision

Drago Table will remain a browser-based server application, but it may be
packaged and operated locally in the same session-based manner as Foundry VTT.
The campaign computer is the authoritative host. Remote access is optional and
exists only while the owner starts a Cloudflare Tunnel.

This is not a rewrite as a native desktop client. The existing React frontend,
FastAPI backend, database models, authentication, campaign tools, character
builder, rules references, Mapping Mode, Combat Mode, and future Hex Crawl Mode
remain the product.

The change is a new runtime and deployment topology:

```text
Campaign computer
├── Drago Table launcher
├── React frontend
├── FastAPI backend
├── Local campaign database
├── Local campaign assets
└── Optional Cloudflare Tunnel
        └── Approved remote players
```

## Product Role

Drago Table is both the virtual table and the campaign headquarters. It is not
an integration layer for the Foundry OSRIC implementation.

The application should support:

- First Edition character creation and character sheets
- campaign membership and player authentication
- player journals and campaign references
- table roles, including Caller, Mapper, Quartermaster, Time and Lightkeeper,
  Scout and Search Coordinator, and Chronicler
- Mapping Mode as player-authored digital graph paper
- persistent Combat Mode
- future Hex Crawl Mode
- expedition procedures, marching order, time, light, watches, treasure, and XP
- DM-controlled handouts and player-safe rules references
- optional Discord integration
- local, offline, in-person, and remote play from the same campaign state

Drago Table may later support additional rulesets, including Fifth Edition, but
First Edition remains its own implementation rather than depending on an
external OSRIC VTT system.

## Operating Modes

### Offline Preparation

Only the host computer uses the application. All essential scripts, fonts,
styles, rules, and interface assets must be locally available. Preparation must
not require Cloudflare, the VPS, or another internet service.

### Local Table

The application listens on an explicitly configured local-network interface.
Players on the same trusted network connect directly to the host computer.
Remote access remains disabled.

### Remote Session

The owner starts the application and then starts a named Cloudflare Tunnel,
similar to:

```text
cloudflared tunnel run drago-table
```

The tunnel connects outward from the campaign computer. The router does not
need a public inbound port. Stopping the tunnel ends remote access. Stopping the
application also makes the game unavailable.

Cloudflare access policy, Drago Table authentication, and in-application
DM/player authorization remain separate controls.

## What Does Not Need To Be Rewritten

The following existing foundations should be retained:

- React and Vite frontend
- FastAPI backend
- Alembic migration history
- SQLAlchemy models and services
- DM, player, Mapper, and campaign authorization rules
- character vault and character creation
- campaign table state and Mapping Mode persistence
- player journals
- equipment, spell, monster, and rules catalogs
- separation of DM-only and player-safe API responses
- frontend tests, backend tests, migrations, and content validation

## What Must Change

This is not only a path substitution. The following work is required.

### Local Runtime

- Provide a supported local production server for the built frontend and API.
- Bind safely for offline-only, LAN, or tunneled operation.
- Detect port conflicts and report actionable errors.
- Prevent the host computer from sleeping during a live session, or warn
  clearly before it disconnects players.
- Shut down all child services cleanly.

### Launcher

Provide a simple host control surface with:

- Prepare Offline
- Start Local Table
- Start Remote Session
- Stop Remote Session
- Stop Drago Table
- Open DM Screen
- Copy or display the player address
- show connection and health status
- back up the campaign
- restore a selected backup with explicit confirmation

The launcher may eventually be packaged as a small desktop shell, but the game
interface should continue to run in the browser.

### Database

Production currently uses PostgreSQL on the VPS. The local-host edition needs a
documented and tested database decision.

Initial preference: retain PostgreSQL for behavioral parity, concurrency, and
migration safety. SQLite should be adopted only after the complete migration
chain, concurrent Mapper/player writes, revision history, authentication, and
backup/restore behavior pass dedicated qualification tests.

The database must:

- start before the API
- migrate safely before use
- remain local to the host
- have automatic versioned backups
- recover cleanly after an interrupted session
- never be bundled into a frontend build

### Local Campaign Assets

Maps, handouts, portraits, audio, adventure preparation, and other campaign
files need a writable local storage directory outside the Vite build and source
tree.

The API must authorize every asset request. DM-only assets must never become
reachable through guessed static paths. Player access should expose only
deliberately shared material.

### Configuration

Current production assumptions include:

- separate `dm.dragorussogames.com` and `classic.dragorussogames.com` web roots
- API hosting at `russo.dragorussogames.com/api`
- production CORS origins
- a VPS PostgreSQL service
- production service and Nginx deployment

The local edition needs profiles for:

- loopback-only preparation
- trusted-LAN play
- remote tunneled play
- test environments

API location, allowed origins, cookie behavior, asset paths, database location,
and public player address must be configuration rather than hard-coded
production assumptions.

### One Origin Where Practical

The local host should preferably serve one application origin:

```text
/
├── dm
├── player
└── api
```

This reduces CORS and cookie complexity. DM and player permissions must remain
enforced by the API even if their interfaces share an origin.

### Offline Readiness

- Remove essential runtime dependencies on external CDNs.
- Store required fonts and interface assets locally.
- Provide useful offline errors for optional Discord or tunnel services.
- Allow campaign preparation and local-table play without internet access.

### Synchronization And Reconnection

The current Mapping Mode background refresh is a valid starting point. Before
the local-host edition is considered ready, verify:

- simultaneous Mapper and viewer use
- reconnect after brief network loss
- no lost updates during autosave
- clear stale-session and conflict messages
- recovery when the host sleeps or changes networks
- reasonable behavior for large maps and handouts

Future real-time transport may use WebSockets, but it is not required merely to
move hosting from the VPS to the campaign computer.

## Security Boundaries

The local model reduces exposure but does not replace application security.

- Do not open router ports.
- Bind to loopback unless LAN play is deliberately enabled.
- Keep DM and player authentication enabled.
- Enforce authorization in backend APIs, not only in the interface.
- Use individually identifiable player accounts.
- Revoke access when a player or device should no longer connect.
- Place identity-aware access in front of the remote hostname where practical.
- Validate uploads and restrict file types and sizes.
- Never serve private source PDFs as static files.
- Keep secrets out of logs, source control, frontend bundles, and backups
  shared with players.
- Display whether the host is offline-only, LAN-accessible, or remotely
  accessible.

When the tunnel is stopped, the remote hostname should not reach the
application. LAN access may still exist until the local server is stopped, so
the launcher must distinguish stopping the tunnel from stopping Drago Table.

## Performance Expectations

Local-table interaction should be fast because traffic remains on the local
network. Remote play still depends on the host's upload bandwidth, player
connections, Wi-Fi quality, host sleep behavior, and Cloudflare availability.

Optimize the largest payloads:

- compress map and handout images
- use thumbnails and progressive loading
- cache immutable interface assets
- send incremental state updates
- avoid repeatedly transferring unchanged maps
- keep audio optional and locally controlled

## Fifth Edition Direction

Drago Table can eventually host Fifth Edition campaigns as the VTT and campaign
headquarters. This may include maps, walls, lighting, token vision, combat,
character summaries, Discord-linked identities, journals, handouts, and
campaign records.

Dynamic lighting, wall geometry, token vision, and character automation are
separate feature projects, not consequences of local hosting. Moving the
existing application to a local host does not automatically provide those
features.

If Fifth Edition characters remain authoritative in D&D Beyond, any connection
must have an explicit synchronization model. Do not assume an unofficial,
permanent, or bidirectional D&D Beyond API. Start with identity links and
player-approved summaries before promising full character synchronization.

## Phased Implementation

### Phase 1: Local Production Runtime

- build and serve the existing frontend locally
- run the existing API locally
- connect to a qualified local database
- support loopback access
- migrate and open an existing test campaign
- preserve all current tests

### Phase 2: LAN Table

- add explicit LAN mode
- provide a player URL and QR code
- verify DM, Mapper, and multiple player devices
- verify session start/stop and reconnection

### Phase 3: Remote Tunnel

- define a `drago-table` Cloudflare Tunnel
- route one remote hostname to the local application
- add identity-aware access where practical
- verify Web requests, background refresh, uploads, and reconnect behavior
- confirm that stopping the tunnel removes remote access

### Phase 4: Host Launcher

- add one-button lifecycle controls
- show service and tunnel health
- add backup and restore
- add clean shutdown and sleep prevention
- package a repeatable host installation

### Phase 5: Campaign Asset Vault

- add authorized local map, handout, portrait, and audio storage
- prevent private or DM-only material from appearing in player responses
- add player-safe sharing controls

### Phase 6: VTT Expansion

- complete persistent Combat Mode
- complete Hex Crawl Mode
- add map image support
- evaluate walls, fog, vision, lighting, and automation independently
- evaluate Fifth Edition support as a separate ruleset profile

## Acceptance Criteria

The local-host edition is ready for group use when:

- the owner can prepare with no internet connection
- local players can connect without Cloudflare
- remote players can connect only while the tunnel and application are running
- DM, Mapper, and player permissions behave exactly as intended
- no private source PDF or DM-only catalog enters a player build or response
- database migrations, automatic backups, and tested restoration succeed
- a stopped tunnel is visibly different from a stopped application
- application state survives restart and an interrupted connection
- current backend and frontend tests remain green
- a complete authenticated DM/Mapper/player smoke test passes

## Summary

The local Drago Table Host is a packaging and deployment evolution of the
existing product, not a rewrite. Most domain and interface code remains useful.
The substantial work is local service orchestration, configuration, database
operation, asset security, offline readiness, tunnel lifecycle, backup, and
reconnection.

