import { Client, Events, GatewayIntentBits } from "discord.js";

import { createCharacter, getCharacterByDiscord, patchCharacterLedger } from "./api.js";
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

    if (interaction.commandName === "character") {
      const subcommand = interaction.options.getSubcommand();
      const character = await getCharacterByDiscord(interaction.user.id);

      if (subcommand === "hp") {
        const currentHp = interaction.options.getInteger("current_hp", true);
        const maxHp = interaction.options.getInteger("max_hp");
        const combat: Record<string, number> = { hp_current: currentHp };
        if (maxHp !== null) {
          combat.hp_max = maxHp;
        }
        await patchCharacterLedger(character.id, {
          actor_discord_user_id: interaction.user.id,
          audit_action: "ledger.hp",
          patch: { combat }
        });
        await interaction.reply({ content: "RUSSO ledger HP updated.", ephemeral: true });
        return;
      }

      if (subcommand === "ac") {
        const armorClass = interaction.options.getInteger("armor_class", true);
        await patchCharacterLedger(character.id, {
          actor_discord_user_id: interaction.user.id,
          audit_action: "ledger.ac",
          patch: { combat: { armor_class: armorClass } }
        });
        await interaction.reply({ content: "RUSSO ledger AC updated.", ephemeral: true });
        return;
      }

      if (subcommand === "xp") {
        const currentXp = interaction.options.getInteger("current_xp", true);
        const xpNeeded = interaction.options.getInteger("xp_needed");
        const basics: Record<string, number> = { xp_current: currentXp };
        if (xpNeeded !== null) {
          basics.xp_needed = xpNeeded;
        }
        await patchCharacterLedger(character.id, {
          actor_discord_user_id: interaction.user.id,
          audit_action: "ledger.xp",
          patch: { basics }
        });
        await interaction.reply({ content: "RUSSO ledger XP updated.", ephemeral: true });
        return;
      }

      if (subcommand === "coins") {
        const wealth: Record<string, number> = {};
        for (const coin of ["pp", "gp", "ep", "sp", "cp"]) {
          const value = interaction.options.getInteger(coin);
          if (value !== null) {
            wealth[coin] = value;
          }
        }
        if (Object.keys(wealth).length === 0) {
          await interaction.reply({ content: "No coin fields supplied.", ephemeral: true });
          return;
        }
        await patchCharacterLedger(character.id, {
          actor_discord_user_id: interaction.user.id,
          audit_action: "ledger.coins",
          patch: { wealth }
        });
        await interaction.reply({ content: "RUSSO ledger coins updated.", ephemeral: true });
        return;
      }

      if (subcommand === "abilities") {
        const abilities: Record<string, number> = {};
        for (const ability of ["str", "int", "wis", "dex", "con", "cha"]) {
          const value = interaction.options.getInteger(ability);
          if (value !== null) {
            abilities[ability] = value;
          }
        }
        if (Object.keys(abilities).length === 0) {
          await interaction.reply({ content: "No ability scores supplied.", ephemeral: true });
          return;
        }
        await patchCharacterLedger(character.id, {
          actor_discord_user_id: interaction.user.id,
          audit_action: "ledger.abilities",
          patch: { abilities }
        });
        await interaction.reply({ content: "RUSSO ledger ability scores updated.", ephemeral: true });
        return;
      }

      if (subcommand === "status") {
        const status = interaction.options.getString("status", true);
        await patchCharacterLedger(character.id, {
          actor_discord_user_id: interaction.user.id,
          audit_action: "ledger.status",
          patch: { identity: { status }, Identity: { status } }
        });
        await interaction.reply({ content: `RUSSO ledger status updated to ${status}.`, ephemeral: true });
        return;
      }
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
