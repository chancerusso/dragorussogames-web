import { SlashCommandBuilder } from "discord.js";

function addOptionalCharacter(command: any): any {
  return command.addStringOption((option: any) =>
    option
      .setName("character")
      .setDescription("Character name. DM/admin may target any character.")
      .setRequired(false)
  );
}

function addMode(command: any): any {
  return command.addStringOption((option: any) =>
    option
      .setName("mode")
      .setDescription("How to apply supplied values.")
      .setRequired(false)
      .addChoices(
        { name: "set", value: "set" },
        { name: "add", value: "add" },
        { name: "subtract", value: "subtract" }
      )
  );
}

export const commandData = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check whether RUSSO is online."),
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show the RUSSO player command guide."),
  new SlashCommandBuilder()
    .setName("show")
    .setDescription("Show read-only RUSSO table references.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("card")
        .setDescription("Show a compact character card.")
        .addStringOption((option) =>
          option
            .setName("character")
            .setDescription("Character name. Omit for your active character.")
            .setRequired(false)
        )
    ),
  new SlashCommandBuilder()
    .setName("ledger")
    .setDescription("Maintain your active RUSSO character ledger.")
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        subcommand
          .setName("show")
          .setDescription("Show the full character ledger.")
      )
    )
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        addMode(
          subcommand
            .setName("hp")
            .setDescription("Set, add, or subtract hit points.")
            .addIntegerOption((option) =>
              option.setName("value").setDescription("HP value").setRequired(true)
            )
            .addIntegerOption((option) =>
              option.setName("max_hp").setDescription("Maximum hit points").setRequired(false).setMinValue(1)
            )
        )
      )
    )
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        subcommand
          .setName("ac")
          .setDescription("Set armor class.")
          .addIntegerOption((option) =>
            option.setName("value").setDescription("Armor Class").setRequired(true)
          )
      )
    )
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        addMode(
          subcommand
            .setName("xp")
            .setDescription("Set, add, or subtract experience points.")
            .addIntegerOption((option) =>
              option.setName("value").setDescription("XP value").setRequired(true).setMinValue(0)
            )
        )
      )
    )
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        addMode(
          subcommand
            .setName("coins")
            .setDescription("Set, add, or subtract coin totals.")
            .addStringOption((option) =>
              option
                .setName("coin")
                .setDescription("Coin type")
                .setRequired(true)
                .addChoices(
                  { name: "pp", value: "pp" },
                  { name: "gp", value: "gp" },
                  { name: "ep", value: "ep" },
                  { name: "sp", value: "sp" },
                  { name: "cp", value: "cp" }
                )
            )
            .addIntegerOption((option) =>
              option.setName("value").setDescription("Coin value").setRequired(true).setMinValue(0)
            )
        )
      )
    )
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        subcommand
          .setName("abilities")
          .setDescription("Update supplied raw ability scores.")
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
    )
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        subcommand
          .setName("status")
          .setDescription("Set character status.")
          .addStringOption((option) =>
            option
              .setName("value")
              .setDescription("Character status")
              .setRequired(true)
              .addChoices(
                { name: "Active", value: "Active" },
                { name: "Inactive", value: "Inactive" },
                { name: "Dead", value: "Dead" },
                { name: "Retired", value: "Retired" },
                { name: "Missing", value: "Missing" },
                { name: "Poisoned", value: "Poisoned" },
                { name: "Petrified", value: "Petrified" },
                { name: "Imprisoned", value: "Imprisoned" }
              )
          )
      )
    )
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        addMode(
          subcommand
            .setName("resources")
            .setDescription("Set, add, or subtract expendable resources.")
            .addStringOption((option) =>
              option
                .setName("resource")
                .setDescription("Resource")
                .setRequired(true)
                .addChoices(
                  { name: "torches", value: "torches" },
                  { name: "lantern_oil", value: "lantern_oil" },
                  { name: "rations", value: "rations" },
                  { name: "water", value: "water" },
                  { name: "arrows", value: "arrows" },
                  { name: "bolts", value: "bolts" },
                  { name: "sling_stones", value: "sling_stones" }
                )
            )
            .addIntegerOption((option) =>
              option.setName("value").setDescription("Resource value").setRequired(true).setMinValue(0)
            )
        )
      )
    )
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        subcommand
          .setName("saves")
          .setDescription("Update saving throws.")
          .addIntegerOption((option) => option.setName("death").setDescription("Death/poison save").setRequired(false))
          .addIntegerOption((option) => option.setName("wands").setDescription("Wands save").setRequired(false))
          .addIntegerOption((option) => option.setName("paralysis_petrify").setDescription("Paralysis/petrify save").setRequired(false))
          .addIntegerOption((option) => option.setName("breath").setDescription("Breath weapon save").setRequired(false))
          .addIntegerOption((option) => option.setName("spells").setDescription("Spell save").setRequired(false))
      )
    )
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        subcommand
          .setName("movement")
          .setDescription("Update movement and encumbrance category.")
          .addStringOption((option) =>
            option.setName("movement").setDescription("Movement rate").setRequired(true)
          )
          .addStringOption((option) =>
            option.setName("encumbrance_category").setDescription("Encumbrance category").setRequired(false)
          )
      )
    ),
  new SlashCommandBuilder()
    .setName("equipment")
    .setDescription("Maintain active-character equipment.")
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        subcommand
          .setName("add")
          .setDescription("Add equipment.")
          .addStringOption((option) => option.setName("item_name").setDescription("Item name").setRequired(true))
          .addIntegerOption((option) => option.setName("quantity").setDescription("Quantity").setRequired(false).setMinValue(1))
          .addNumberOption((option) => option.setName("weight").setDescription("Weight per item").setRequired(false).setMinValue(0))
          .addStringOption((option) => option.setName("damage").setDescription("Weapon damage, if applicable").setRequired(false))
          .addStringOption((option) =>
            option
              .setName("location")
              .setDescription("Where the item is kept.")
              .setRequired(false)
              .addChoices(
                { name: "carried", value: "carried" },
                { name: "equipped", value: "equipped" },
                { name: "stored", value: "stored" }
              )
          )
          .addStringOption((option) => option.setName("notes").setDescription("Notes").setRequired(false))
      )
    )
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        subcommand
          .setName("remove")
          .setDescription("Remove equipment.")
          .addStringOption((option) => option.setName("item_name").setDescription("Item name").setRequired(true))
          .addIntegerOption((option) => option.setName("quantity").setDescription("Quantity").setRequired(false).setMinValue(1))
      )
    )
    .addSubcommand((subcommand) => addOptionalCharacter(subcommand.setName("list").setDescription("List equipment.")))
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        subcommand
          .setName("equip")
          .setDescription("Equip an item.")
          .addStringOption((option) => option.setName("item_name").setDescription("Item name").setRequired(true))
      )
    )
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        subcommand
          .setName("unequip")
          .setDescription("Unequip an item.")
          .addStringOption((option) => option.setName("item_name").setDescription("Item name").setRequired(true))
      )
    ),
  new SlashCommandBuilder()
    .setName("character")
    .setDescription("Manage your RUSSO character ledger.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create your character ledger.")
        .addStringOption((option) =>
          option.setName("character_name").setDescription("Character name").setRequired(true)
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
        .addStringOption((option) =>
          option.setName("player_name").setDescription("Player name; defaults to your Discord display name").setRequired(false)
        )
        .addStringOption((option) =>
          option.setName("alignment").setDescription("Character alignment").setRequired(false)
        )
        .addIntegerOption((option) =>
          option.setName("hp_max").setDescription("Maximum hit points").setRequired(false)
        )
        .addIntegerOption((option) =>
          option.setName("hp_current").setDescription("Current hit points").setRequired(false)
        )
        .addIntegerOption((option) =>
          option.setName("armor_class").setDescription("Armor Class").setRequired(false)
        )
        .addIntegerOption((option) =>
          option.setName("strength").setDescription("Strength score").setRequired(false).setMinValue(1).setMaxValue(25)
        )
        .addIntegerOption((option) =>
          option.setName("intelligence").setDescription("Intelligence score").setRequired(false).setMinValue(1).setMaxValue(25)
        )
        .addIntegerOption((option) =>
          option.setName("wisdom").setDescription("Wisdom score").setRequired(false).setMinValue(1).setMaxValue(25)
        )
        .addIntegerOption((option) =>
          option.setName("dexterity").setDescription("Dexterity score").setRequired(false).setMinValue(1).setMaxValue(25)
        )
        .addIntegerOption((option) =>
          option.setName("constitution").setDescription("Constitution score").setRequired(false).setMinValue(1).setMaxValue(25)
        )
        .addIntegerOption((option) =>
          option.setName("charisma").setDescription("Charisma score").setRequired(false).setMinValue(1).setMaxValue(25)
        )
    )
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("List your characters."))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("active")
        .setDescription("Set one of your characters active.")
        .addStringOption((option) =>
          option.setName("character").setDescription("Character name").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        subcommand
          .setName("sheet")
          .setDescription("Show your active character summary.")
      )
    )
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        subcommand
          .setName("abilities")
          .setDescription("Update supplied ability scores.")
          .addIntegerOption((option) =>
            option.setName("str").setDescription("Strength").setRequired(false).setMinValue(1).setMaxValue(25)
          )
          .addIntegerOption((option) =>
            option
              .setName("exceptional_str")
              .setDescription("Exceptional Strength percentile")
              .setRequired(false)
              .setMinValue(1)
              .setMaxValue(100)
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
    )
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        subcommand
          .setName("hp")
          .setDescription("Update hit points.")
          .addIntegerOption((option) =>
            option.setName("current_hp").setDescription("Current hit points").setRequired(true)
          )
          .addIntegerOption((option) =>
            option.setName("max_hp").setDescription("Maximum hit points").setRequired(false).setMinValue(1)
          )
      )
    )
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        subcommand
          .setName("ac")
          .setDescription("Update armor class.")
          .addIntegerOption((option) =>
            option.setName("armor_class").setDescription("Armor Class").setRequired(true)
          )
      )
    )
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        subcommand
          .setName("xp")
          .setDescription("Update experience points.")
          .addIntegerOption((option) =>
            option.setName("current_xp").setDescription("Current XP").setRequired(true).setMinValue(0)
          )
          .addIntegerOption((option) =>
            option.setName("xp_needed").setDescription("XP needed for next level").setRequired(false).setMinValue(0)
          )
      )
    )
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        addMode(
          subcommand
            .setName("coins")
            .setDescription("Update supplied coin totals.")
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
      )
    )
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        subcommand
          .setName("status")
          .setDescription("Update character status.")
          .addStringOption((option) =>
            option
              .setName("status")
              .setDescription("Character status")
              .setRequired(true)
              .addChoices(
                { name: "Active", value: "Active" },
                { name: "Inactive", value: "Inactive" },
                { name: "Dead", value: "Dead" },
                { name: "Retired", value: "Retired" },
                { name: "Missing", value: "Missing" },
                { name: "Poisoned", value: "Poisoned" },
                { name: "Petrified", value: "Petrified" },
                { name: "Imprisoned", value: "Imprisoned" }
              )
          )
      )
    )
    .addSubcommandGroup((group) =>
      group
        .setName("equipment")
        .setDescription("Manage character equipment.")
        .addSubcommand((subcommand) =>
          addOptionalCharacter(
            subcommand
              .setName("add")
              .setDescription("Add equipment.")
              .addStringOption((option) =>
                option.setName("item_name").setDescription("Item name").setRequired(true)
              )
              .addIntegerOption((option) =>
                option.setName("quantity").setDescription("Quantity").setRequired(false).setMinValue(1)
              )
              .addNumberOption((option) =>
                option.setName("weight").setDescription("Weight per item").setRequired(false).setMinValue(0)
              )
              .addStringOption((option) =>
                option
                  .setName("location")
                  .setDescription("Where the item is kept.")
                  .setRequired(false)
                  .addChoices(
                    { name: "carried", value: "carried" },
                    { name: "equipped", value: "equipped" },
                    { name: "container", value: "container" },
                    { name: "stored", value: "stored" }
                  )
              )
              .addStringOption((option) =>
                option.setName("notes").setDescription("Notes").setRequired(false)
              )
              .addStringOption((option) =>
                option.setName("damage").setDescription("Weapon damage, if applicable").setRequired(false)
              )
          )
        )
        .addSubcommand((subcommand) =>
          addOptionalCharacter(
            subcommand
              .setName("remove")
              .setDescription("Remove equipment.")
              .addStringOption((option) =>
                option.setName("item_name").setDescription("Item name").setRequired(true)
              )
              .addIntegerOption((option) =>
                option.setName("quantity").setDescription("Quantity").setRequired(false).setMinValue(1)
              )
          )
        )
        .addSubcommand((subcommand) =>
          addOptionalCharacter(
            subcommand
              .setName("list")
              .setDescription("List equipment.")
          )
        )
        .addSubcommand((subcommand) =>
          addOptionalCharacter(
            subcommand
              .setName("equip")
              .setDescription("Equip an item.")
              .addStringOption((option) =>
                option.setName("item_name").setDescription("Item name").setRequired(true)
              )
          )
        )
        .addSubcommand((subcommand) =>
          addOptionalCharacter(
            subcommand
              .setName("unequip")
              .setDescription("Unequip an item.")
              .addStringOption((option) =>
                option.setName("item_name").setDescription("Item name").setRequired(true)
              )
          )
        )
    )
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        addMode(
          subcommand
            .setName("resources")
            .setDescription("Update supplied expendable resources.")
            .addIntegerOption((option) =>
              option.setName("torches").setDescription("Torches").setRequired(false).setMinValue(0)
            )
            .addIntegerOption((option) =>
              option.setName("lantern_oil").setDescription("Lantern oil").setRequired(false).setMinValue(0)
            )
            .addIntegerOption((option) =>
              option.setName("rations").setDescription("Rations").setRequired(false).setMinValue(0)
            )
            .addIntegerOption((option) =>
              option.setName("water").setDescription("Water").setRequired(false).setMinValue(0)
            )
            .addIntegerOption((option) =>
              option.setName("arrows").setDescription("Arrows").setRequired(false).setMinValue(0)
            )
            .addIntegerOption((option) =>
              option.setName("bolts").setDescription("Bolts").setRequired(false).setMinValue(0)
            )
            .addIntegerOption((option) =>
              option.setName("sling_stones").setDescription("Sling stones").setRequired(false).setMinValue(0)
            )
        )
      )
    )
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        subcommand
          .setName("saves")
          .setDescription("Update saving throws.")
          .addIntegerOption((option) =>
            option.setName("death").setDescription("Death/poison save").setRequired(false)
          )
          .addIntegerOption((option) =>
            option.setName("wands").setDescription("Wands save").setRequired(false)
          )
          .addIntegerOption((option) =>
            option
              .setName("paralysis_petrify")
              .setDescription("Paralysis/petrify save")
              .setRequired(false)
          )
          .addIntegerOption((option) =>
            option.setName("breath").setDescription("Breath weapon save").setRequired(false)
          )
          .addIntegerOption((option) =>
            option.setName("spells").setDescription("Spell save").setRequired(false)
          )
      )
    )
    .addSubcommand((subcommand) =>
      addOptionalCharacter(
        subcommand
          .setName("movement")
          .setDescription("Update movement and encumbrance category.")
          .addStringOption((option) =>
            option.setName("movement").setDescription("Movement rate").setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("encumbrance_category")
              .setDescription("Encumbrance category")
              .setRequired(false)
          )
      )
    )
].map((command) => command.toJSON());
