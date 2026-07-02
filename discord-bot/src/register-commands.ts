import { REST, Routes } from "discord.js";

import { commandData } from "./commands.js";
import { config } from "./config.js";

const rest = new REST({ version: "10" }).setToken(config.discordToken);

if (config.discordGuildId) {
  await rest.put(
    Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId),
    { body: commandData }
  );
  console.log("Registered RUSSO guild slash commands.");
} else {
  await rest.put(Routes.applicationCommands(config.discordClientId), { body: commandData });
  console.log("Registered RUSSO global slash commands.");
}
