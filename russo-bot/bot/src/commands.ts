import { SlashCommandBuilder } from "discord.js";

export const commandData = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check whether RUSSO is online."),
  new SlashCommandBuilder()
    .setName("character")
    .setDescription("Manage your RUSSO character ledger.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create your active character ledger.")
        .addStringOption((option) =>
          option.setName("character_name").setDescription("Character name").setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("player_name").setDescription("Player name").setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("race").setDescription("Character race").setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("class_name").setDescription("Character class").setRequired(true)
        )
        .addIntegerOption((option) =>
          option.setName("level").setDescription("Character level").setRequired(true).setMinValue(1)
        )
    ),
  new SlashCommandBuilder()
    .setName("ledger")
    .setDescription("Show your active RUSSO character ledger.")
].map((command) => command.toJSON());
