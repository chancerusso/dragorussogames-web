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
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("hp")
        .setDescription("Update your character hit points.")
        .addIntegerOption((option) =>
          option.setName("current_hp").setDescription("Current hit points").setRequired(true)
        )
        .addIntegerOption((option) =>
          option.setName("max_hp").setDescription("Maximum hit points").setRequired(false).setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ac")
        .setDescription("Update your character armor class.")
        .addIntegerOption((option) =>
          option.setName("armor_class").setDescription("Armor Class").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("xp")
        .setDescription("Update your character experience points.")
        .addIntegerOption((option) =>
          option.setName("current_xp").setDescription("Current XP").setRequired(true).setMinValue(0)
        )
        .addIntegerOption((option) =>
          option.setName("xp_needed").setDescription("XP needed for next level").setRequired(false).setMinValue(0)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("coins")
        .setDescription("Update supplied coin totals without changing omitted coins.")
        .addIntegerOption((option) =>
          option.setName("pp").setDescription("Platinum pieces").setRequired(false).setMinValue(0)
        )
        .addIntegerOption((option) =>
          option.setName("gp").setDescription("Gold pieces").setRequired(false).setMinValue(0)
        )
        .addIntegerOption((option) =>
          option.setName("ep").setDescription("Electrum pieces").setRequired(false).setMinValue(0)
        )
        .addIntegerOption((option) =>
          option.setName("sp").setDescription("Silver pieces").setRequired(false).setMinValue(0)
        )
        .addIntegerOption((option) =>
          option.setName("cp").setDescription("Copper pieces").setRequired(false).setMinValue(0)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("abilities")
        .setDescription("Update supplied ability scores without changing omitted scores.")
        .addIntegerOption((option) =>
          option.setName("str").setDescription("Strength").setRequired(false).setMinValue(1).setMaxValue(25)
        )
        .addIntegerOption((option) =>
          option.setName("int").setDescription("Intelligence").setRequired(false).setMinValue(1).setMaxValue(25)
        )
        .addIntegerOption((option) =>
          option.setName("wis").setDescription("Wisdom").setRequired(false).setMinValue(1).setMaxValue(25)
        )
        .addIntegerOption((option) =>
          option.setName("dex").setDescription("Dexterity").setRequired(false).setMinValue(1).setMaxValue(25)
        )
        .addIntegerOption((option) =>
          option.setName("con").setDescription("Constitution").setRequired(false).setMinValue(1).setMaxValue(25)
        )
        .addIntegerOption((option) =>
          option.setName("cha").setDescription("Charisma").setRequired(false).setMinValue(1).setMaxValue(25)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("status")
        .setDescription("Update your character ledger status.")
        .addStringOption((option) =>
          option
            .setName("status")
            .setDescription("Character status")
            .setRequired(true)
            .addChoices(
              { name: "Active", value: "Active" },
              { name: "Missing", value: "Missing" },
              { name: "Retired", value: "Retired" },
              { name: "Dead", value: "Dead" },
              { name: "Petrified", value: "Petrified" },
              { name: "Imprisoned", value: "Imprisoned" }
            )
        )
    ),
  new SlashCommandBuilder()
    .setName("ledger")
    .setDescription("Show your active RUSSO character ledger.")
].map((command) => command.toJSON());
