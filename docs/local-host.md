# Run Drago Table on This Mac

This is the first local-host runtime. It runs the Dungeon Master and player
interfaces from one address and binds only to this Mac.

## Start

The normal way to start Drago Table is to double-click:

```text
Desktop/Drago Table.app
```

The app opens a Terminal host window during Phase 1. Leave that window open
while Drago Table is running. The browser opens automatically when the local
application is ready.

The repository command remains available as a developer fallback:

```bash
./scripts/drago-table
```

On the first start, choose the Dungeon Master password. Drago Table then:

1. creates its private application directory under
   `~/Library/Application Support/Drago Table/`;
2. initializes and starts its own loopback-only PostgreSQL database;
3. builds the current interface;
4. applies database migrations;
5. starts the API and interface at `http://127.0.0.1:8010`;
6. prevents idle sleep while it is running;
7. opens the Dungeon Master screen.

The addresses are:

- Dungeon Master: `http://127.0.0.1:8010/`
- Player interface on the host Mac: `http://127.0.0.1:8010/portal`

This loopback profile is intentionally not reachable by other devices. LAN
addresses and the optional Cloudflare Tunnel belong to later phases.

## Stop

Return to the Terminal window running Drago Table and press **Control-C**.
The application and its private PostgreSQL process stop cleanly. Campaign data
remains in the application directory for the next start.

## Test a New Interface Build

Stop Drago Table, then double-click `Drago Table.app` again. The launcher
rebuilds the frontend before starting, so no VPS deployment or internet
connection is required when dependencies are already installed.

Use `./scripts/drago-table --skip-build` only when intentionally reusing the
most recent local frontend build.

## Local Data Boundary

The local PostgreSQL cluster, configuration, logs, and future campaign assets
live outside both the repository and frontend build:

```text
~/Library/Application Support/Drago Table/
├── config.json
├── logs/
├── postgres/
└── postgres-socket/
```

`config.json` contains a local authentication secret and is created with
owner-only permissions. Do not copy it into the repository.

Private rulebook source PDFs remain governed by the repository's existing
private-reference restrictions and are never copied into the frontend build.

## Reinstall the Desktop Application

The desktop bundle is generated from committed packaging files. If it must be
reinstalled, move the existing Desktop app to the Trash and run:

```bash
./scripts/install-drago-table-app
```

The application contains only the launcher and icon. Campaign data remains in
Application Support, so reinstalling the Desktop icon does not remove a
campaign database.
