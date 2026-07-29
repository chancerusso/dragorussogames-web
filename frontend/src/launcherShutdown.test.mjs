import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const launcherSource = fs.readFileSync(path.join(currentDir, "../../packaging/macos/DragoTableApp.m"), "utf8");

test("every normal Drago Table exit stops the tracked tunnel before the host", () => {
  const termination = launcherSource.match(/applicationWillTerminate:[\s\S]*?\n}/)?.[0] || "";
  assert.match(termination, /\[self stopTunnel\]/);
  assert.match(termination, /self\.hostTask\.running/);
  assert.ok(termination.indexOf("[self stopTunnel]") < termination.indexOf("self.hostTask.running"));
  assert.match(launcherSource, /windowShouldClose:[\s\S]*?\[NSApp terminate:nil\]/);
  assert.match(launcherSource, /stopApp:[\s\S]*?\[NSApp terminate:nil\]/);
});

test("tunnel cleanup is exact, verified, and escalates only the Drago connector", () => {
  assert.match(launcherSource, /\[c\]loudflared\.\*--config\.\*remote-tunnel\\\\\.yml/);
  assert.match(launcherSource, /self\.tunnelID/);
  assert.match(launcherSource, /hasMatchingDragoTunnelProcess/);
  assert.match(launcherSource, /@"-TERM", @"-f", pattern/);
  assert.match(launcherSource, /@"-KILL", @"-f", pattern/);
  assert.doesNotMatch(launcherSource, /pkill[^\\n]*cloudflared/);
});

test("stale Drago connector cleanup runs before Player Access starts", () => {
  const startTunnel = launcherSource.match(/- \(void\)startTunnel[\s\S]*?- \(void\)checkRemoteHealth/)?.[0] || "";
  assert.match(startTunnel, /\[self stopMatchingDragoTunnelProcesses\]/);
  assert.match(startTunnel, /A previous Drago Table connection could not be closed safely/);
});
