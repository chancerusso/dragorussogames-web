import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  discordToken: required("DISCORD_TOKEN"),
  discordClientId: required("DISCORD_CLIENT_ID"),
  discordGuildId: process.env.DISCORD_GUILD_ID,
  apiBaseUrl: process.env.RUSSO_API_BASE_URL ?? "http://127.0.0.1:8010/api",
  rulesetId: process.env.RUSSO_RULESET ?? "osric",
  adminUserIds: new Set(
    (process.env.RUSSO_ADMIN_USER_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  )
};
