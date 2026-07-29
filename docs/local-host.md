# Run Drago Table on This Mac

Drago Table runs the Dungeon Master and player interfaces from one local
application. It remains private to this Mac until the owner deliberately starts
a remote session.

## Start

The normal way to start Drago Table is to double-click:

```text
Desktop/Drago Table.app
```

Drago Table starts its local services quietly and opens the browser when it is
ready. No Terminal window is required. Its small control window provides
**Open Dungeon Master**, **Open Player View**, and **Stop Drago Table**. The
first launch asks for the Dungeon Master password in a normal application
dialog.

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

The local application is intentionally bound only to loopback. It does not
open a router port and is not directly reachable by another device.

## Enable Player Access

Open `Drago Table.app`, wait for **Ready — available on this Mac**, and click
**Enable Player Access**. The application starts the dedicated Drago Table
Cloudflare Tunnel and verifies the public health endpoint before it reports:

```text
Live at table.dragorussogames.com
```

Click **Copy Player Invite** and send the copied player address:

```text
https://table.dragorussogames.com/portal
```

Players use an ordinary browser and their Drago Table player username and
password. They do not install Cloudflare, Tailscale, WARP, a VPN, or another
networking client.

Player Access is only the secure internet doorway to the app. It does not start
a campaign table session. Players may accept invitations, sign in, use their
characters, read rules, and write notes while Player Access is enabled. The
table remains locked until the DM starts the campaign session from inside
Drago Table.

The Drago Table tunnel is separate from the existing Foundry tunnel. Starting
or stopping one does not interrupt the other.

Click **Disable Player Access** to remove public access while leaving the local
application and database running. The public hostname is available only while
the launcher reports that player access is live.

## Stop

Click **Disable Player Access** when remote access is no longer needed. Click
**Stop Drago Table** in the control window, or quit it from its Dock icon, when
the local application should also stop. Quitting Drago Table always stops both
the tunnel and its private PostgreSQL process. Campaign data remains in the
application directory for the next start.

## Test a New Interface Build

Code changes are built locally before testing. Stop Drago Table, then
double-click `Drago Table.app` again to open the newest local build. No VPS
deployment or internet connection is required.

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
├── postgres-socket/
└── remote-tunnel.yml
```

`config.json` contains a local authentication secret and is created with
owner-only permissions. `remote-tunnel.yml` references the private Cloudflare
tunnel credential stored in the Mac user's `.cloudflared` directory. Both stay
outside the repository and must not be shared.

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
