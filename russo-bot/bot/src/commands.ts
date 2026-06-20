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

function addTrackerScope(command: any): any {
  return command;
}

function addMoveRate(option: any): any {
  return option
    .setName("move_rate")
    .setDescription("Party movement rate")
    .setRequired(false)
    .addChoices(
      { name: "120", value: 120 },
      { name: "90", value: 90 },
      { name: "60", value: 60 },
      { name: "30", value: 30 }
    );
}

export const commandData = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check whether RUSSO is online."),
  new SlashCommandBuilder()
    .setName("guide")
    .setDescription("Show the RUSSO player command guide."),
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Deprecated alias. Use /guide."),
  new SlashCommandBuilder()
    .setName("ref")
    .setDescription("Referee-only DRG1e quick references.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("screen")
        .setDescription("Show the referee quick-reference screen.")
    ),
  new SlashCommandBuilder()
    .setName("tracker")
    .setDescription("Manage the dungeon expedition tracker.")
    .addSubcommand((subcommand) =>
      addTrackerScope(
        subcommand
          .setName("start")
          .setDescription("Start an expedition tracker.")
          .addIntegerOption(addMoveRate)
          .addIntegerOption((option) => option.setName("rations").setDescription("Starting rations").setRequired(false).setMinValue(0))
          .addIntegerOption((option) => option.setName("oil_pints").setDescription("Starting oil pints").setRequired(false).setMinValue(0))
          .addStringOption((option) => option.setName("notes").setDescription("Tracker notes").setRequired(false))
      )
    )
    .addSubcommand((subcommand) => subcommand.setName("status").setDescription("Show expedition tracker status."))
    .addSubcommand((subcommand) => subcommand.setName("next").setDescription("Advance exploration by 1 turn."))
    .addSubcommand((subcommand) => subcommand.setName("rest").setDescription("Rest for 1 exploration turn."))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("combat")
        .setDescription("Mark that combat occurred.")
        .addBooleanOption((option) => option.setName("advance_turn").setDescription("Also advance one turn").setRequired(false))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("move")
        .setDescription("Set party movement rate.")
        .addIntegerOption((option) =>
          option
            .setName("rate")
            .setDescription("Movement rate")
            .setRequired(true)
            .addChoices(
              { name: "120", value: 120 },
              { name: "90", value: 90 },
              { name: "60", value: 60 },
              { name: "30", value: 30 }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("torch")
        .setDescription("Manage torches.")
        .addStringOption((option) =>
          option.setName("action").setDescription("Torch action").setRequired(true).addChoices(
            { name: "light", value: "light" },
            { name: "extinguish", value: "extinguish" },
            { name: "status", value: "status" }
          )
        )
        .addStringOption((option) => option.setName("holder").setDescription("Torch holder").setRequired(false))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("lantern")
        .setDescription("Manage lanterns.")
        .addStringOption((option) =>
          option.setName("action").setDescription("Lantern action").setRequired(true).addChoices(
            { name: "light", value: "light" },
            { name: "extinguish", value: "extinguish" },
            { name: "status", value: "status" }
          )
        )
        .addStringOption((option) => option.setName("holder").setDescription("Lantern holder").setRequired(false))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("oil")
        .setDescription("Manage oil pints.")
        .addStringOption((option) => option.setName("action").setDescription("Oil action").setRequired(true).addChoices(
          { name: "add", value: "add" },
          { name: "subtract", value: "subtract" },
          { name: "set", value: "set" }
        ))
        .addIntegerOption((option) => option.setName("amount").setDescription("Amount").setRequired(true).setMinValue(0))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ration")
        .setDescription("Manage rations.")
        .addStringOption((option) => option.setName("action").setDescription("Ration action").setRequired(true).addChoices(
          { name: "add", value: "add" },
          { name: "subtract", value: "subtract" },
          { name: "set", value: "set" },
          { name: "consume", value: "consume" }
        ))
        .addIntegerOption((option) => option.setName("amount").setDescription("Amount").setRequired(true).setMinValue(0))
    )
    .addSubcommand((subcommand) => subcommand.setName("stop").setDescription("Stop the expedition tracker.")),
  new SlashCommandBuilder()
    .setName("order")
    .setDescription("Show or update exploration marching order.")
    .addStringOption((option) => option.setName("pos1").setDescription("Position 1 front left").setRequired(false))
    .addStringOption((option) => option.setName("pos2").setDescription("Position 2 front right").setRequired(false))
    .addStringOption((option) => option.setName("pos3").setDescription("Position 3").setRequired(false))
    .addStringOption((option) => option.setName("pos4").setDescription("Position 4").setRequired(false))
    .addStringOption((option) => option.setName("pos5").setDescription("Position 5").setRequired(false))
    .addStringOption((option) => option.setName("pos6").setDescription("Position 6").setRequired(false))
    .addStringOption((option) => option.setName("pos7").setDescription("Position 7 rear left").setRequired(false))
    .addStringOption((option) => option.setName("pos8").setDescription("Position 8 rear right").setRequired(false))
    .addStringOption((option) => option.setName("notes").setDescription("Marching order notes").setRequired(false)),
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
          .addStringOption((option) => option.setName("value").setDescription("Item value, if known").setRequired(false))
          .addBooleanOption((option) => option.setName("equipped").setDescription("Add directly as equipped").setRequired(false))
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
        .addStringOption((option) =>
          option.setName("movement").setDescription("Movement rate, such as 90 ft").setRequired(false)
        )
        .addIntegerOption((option) =>
          option.setName("thac0").setDescription("THAC0").setRequired(false)
        )
        .addIntegerOption((option) =>
          option.setName("xp").setDescription("Starting XP").setRequired(false).setMinValue(0)
        )
        .addStringOption((option) =>
          option.setName("coins").setDescription("Coins, such as '15 gp, 3 sp'").setRequired(false)
        )
        .addStringOption((option) =>
          option.setName("languages").setDescription("Comma-separated languages").setRequired(false)
        )
        .addStringOption((option) =>
          option.setName("saves").setDescription("Saves, such as 'death 13, wands 14, spells 15'").setRequired(false)
        )
        .addStringOption((option) =>
          option.setName("notes").setDescription("Character notes").setRequired(false)
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
              .addStringOption((option) =>
                option.setName("value").setDescription("Item value, if known").setRequired(false)
              )
              .addBooleanOption((option) =>
                option.setName("equipped").setDescription("Add directly as equipped").setRequired(false)
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
