import { Client, Events, GatewayIntentBits } from "discord.js";

import { createCharacter, getCharacterByDiscord } from "./api.js";
import { config } from "./config.js";
import { buildLedgerEmbed } from "./ledger-embed.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`RUSSO online as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  try {
    if (interaction.commandName === "ping") {
      await interaction.reply({ content: "RUSSO online", ephemeral: true });
      return;
    }

    if (interaction.commandName === "character" && interaction.options.getSubcommand() === "create") {
      const character = await createCharacter({
        character_name: interaction.options.getString("character_name", true),
        player_name: interaction.options.getString("player_name", true),
        race: interaction.options.getString("race", true),
        class_name: interaction.options.getString("class_name", true),
        level: interaction.options.getInteger("level", true),
        discord_username: interaction.user.username,
        discord_user_id: interaction.user.id
      });

      await interaction.reply({
        content: `Created RUSSO ledger for ${character.character_name}.`,
        ephemeral: true
      });
      return;
    }

    if (interaction.commandName === "ledger") {
      const character = await getCharacterByDiscord(interaction.user.id);
      await interaction.reply({ embeds: [buildLedgerEmbed(character)], ephemeral: true });
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown RUSSO error.";
    const reply = { content: `RUSSO error: ${message}`, ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

await client.login(config.discordToken);
