import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

function removePrivateDmArtifacts() {
  return {
    name: "remove-private-dm-artifacts",
    closeBundle() {
      const outputRoot = join(process.cwd(), "dist", "content");
      rmSync(join(outputRoot, "osric", "core", "monsters"), { recursive: true, force: true });
      rmSync(join(outputRoot, "tools"), { recursive: true, force: true });

      const adventureRoot = join(outputRoot, "adventures");
      if (!existsSync(adventureRoot)) return;
      for (const adventure of readdirSync(adventureRoot)) {
        rmSync(join(adventureRoot, adventure, "monsters.json"), { force: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), removePrivateDmArtifacts()],
  server: {
    port: 5173,
  },
});
