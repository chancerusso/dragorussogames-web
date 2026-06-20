import { ChatInputCommandInteraction, Client, EmbedBuilder, Events, GatewayIntentBits, PermissionsBitField } from "discord.js";

import {
  activateCharacter,
  addEquipment,
  createCharacter,
  equipEquipment,
  listCharacters,
  lookupCharacter,
  patchCharacterLedger,
  removeEquipment,
  unequipEquipment,
  type CharacterResponse
} from "./api.js";
import { config } from "./config.js";
import { buildCharacterCardEmbed } from "./card-embed.js";
import { buildHelpEmbed } from "./help-embed.js";
import { buildCharacterSheetEmbed } from "./sheet-embed.js";
import { buildLedgerEmbed } from "./ledger-embed.js";
import { buildRefereeScreenEmbeds } from "./ref-screen.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

function section(ledger: Record<string, unknown>, name: string): Record<string, unknown> {
  const value = ledger[name];
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function isAdmin(interaction: ChatInputCommandInteraction): boolean {
  return (
    config.adminUserIds.has(interaction.user.id) ||
    Boolean(interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator))
  );
}

async function targetCharacter(interaction: ChatInputCommandInteraction): Promise<CharacterResponse> {
  return lookupCharacter(
    interaction.user.id,
    isAdmin(interaction),
    interaction.options.getString("character")
  );
}

function actor(interaction: ChatInputCommandInteraction) {
  return {
    actor_discord_user_id: interaction.user.id,
    actor_is_admin: isAdmin(interaction)
  };
}

function discordDisplayName(interaction: ChatInputCommandInteraction): string {
  const member = interaction.member;
  if (member && "displayName" in member && typeof member.displayName === "string") {
    return member.displayName;
  }
  return interaction.user.globalName ?? interaction.user.username;
}

function numberPatch(
  interaction: ChatInputCommandInteraction,
  names: string[],
  mode = "set",
  current: Record<string, unknown> = {}
): Record<string, number> {
  const patch: Record<string, number> = {};
  for (const name of names) {
    const value = interaction.options.getInteger(name);
    if (value === null) {
      continue;
    }
    if (mode === "add" || mode === "subtract") {
      const existing = Number(current[name] ?? 0);
      patch[name] = mode === "add" ? existing + value : Math.max(0, existing - value);
    } else {
      patch[name] = value;
    }
  }
  return patch;
}

function applyMode(current: unknown, value: number, mode = "set"): number {
  const existing = Number(current ?? 0);
  if (mode === "add") {
    return existing + value;
  }
  if (mode === "subtract") {
    return Math.max(0, existing - value);
  }
  return value;
}

function parseCoins(input: string | null): Record<string, number> {
  const coins: Record<string, number> = {};
  if (!input) {
    return coins;
  }
  const matches = input.matchAll(/(\d+)\s*(pp|gp|ep|sp|cp)\b/gi);
  for (const match of matches) {
    const coin = match[2].toLowerCase();
    coins[coin] = (coins[coin] ?? 0) + Number(match[1]);
  }
  return coins;
}

function parseLanguages(input: string | null): string[] {
  if (!input) {
    return [];
  }
  return input.split(",").map((language) => language.trim()).filter(Boolean);
}

function parseSaves(input: string | null): Record<string, number> {
  const saves: Record<string, number> = {};
  if (!input) {
    return saves;
  }
  const aliases: Record<string, string> = {
    death: "death",
    poison: "death",
    wands: "wands",
    wand: "wands",
    paralysis: "paralysis_petrify",
    petrify: "paralysis_petrify",
    petrification: "paralysis_petrify",
    breath: "breath",
    spells: "spells",
    spell: "spells"
  };
  const matches = input.matchAll(/([a-z_/ -]+?)\s*[:=]?\s*(\d+)/gi);
  for (const match of matches) {
    const normalized = match[1].toLowerCase().replace(/[^a-z]/g, " ").trim().split(/\s+/)[0];
    const key = aliases[normalized];
    if (key) {
      saves[key] = Number(match[2]);
    }
  }
  return saves;
}

async function replyEquipment(interaction: ChatInputCommandInteraction, character: CharacterResponse, subcommand: string): Promise<boolean> {
  if (subcommand === "add") {
    const updated = await addEquipment(character.id, {
      ...actor(interaction),
      item_name: interaction.options.getString("item_name", true),
      quantity: interaction.options.getInteger("quantity") ?? 1,
      weight: interaction.options.getNumber("weight") ?? 0,
      damage: interaction.options.getString("damage"),
      value: interaction.options.getString("value"),
      equipped: interaction.options.getBoolean("equipped") ?? false,
      location: interaction.options.getString("location") ?? "carried",
      notes: interaction.options.getString("notes")
    });
    await interaction.reply({ content: `Added equipment to ${updated.character_name}.`, ephemeral: true });
    return true;
  }

  if (subcommand === "remove") {
    const updated = await removeEquipment(character.id, {
      ...actor(interaction),
      item_name: interaction.options.getString("item_name", true),
      quantity: interaction.options.getInteger("quantity") ?? 1
    });
    await interaction.reply({ content: `Removed equipment from ${updated.character_name}.`, ephemeral: true });
    return true;
  }

  if (subcommand === "equip") {
    const updated = await equipEquipment(character.id, {
      ...actor(interaction),
      item_name: interaction.options.getString("item_name", true)
    });
    await interaction.reply({ content: `Equipped item for ${updated.character_name}.`, ephemeral: true });
    return true;
  }

  if (subcommand === "unequip") {
    const updated = await unequipEquipment(character.id, {
      ...actor(interaction),
      item_name: interaction.options.getString("item_name", true)
    });
    await interaction.reply({ content: `Unequipped item for ${updated.character_name}.`, ephemeral: true });
    return true;
  }

  if (subcommand === "list") {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${character.character_name} Equipment`)
          .setDescription(equipmentLines(character))
      ],
      ephemeral: true
    });
    return true;
  }

  return false;
}

async function replyLedgerMutation(interaction: ChatInputCommandInteraction, character: CharacterResponse, subcommand: string): Promise<boolean> {
  const mode = interaction.options.getString("mode") ?? "set";

  if (subcommand === "show") {
    await interaction.reply({ embeds: [buildLedgerEmbed(character)], ephemeral: true });
    return true;
  }

  if (subcommand === "hp") {
    const combat = section(character.ledger, "combat");
    const value = interaction.options.getInteger("value", true);
    const patch: Record<string, number> = { hp_current: applyMode(combat.hp_current, value, mode) };
    const maxHp = interaction.options.getInteger("max_hp");
    if (maxHp !== null) {
      patch.hp_max = maxHp;
    }
    await patchCharacterLedger(character.id, {
      ...actor(interaction),
      audit_action: "ledger.hp",
      patch: { combat: patch }
    });
    await interaction.reply({ content: `Updated HP for ${character.character_name}.`, ephemeral: true });
    return true;
  }

  if (subcommand === "ac") {
    await patchCharacterLedger(character.id, {
      ...actor(interaction),
      audit_action: "ledger.ac",
      patch: { combat: { armor_class: interaction.options.getInteger("value", true) } }
    });
    await interaction.reply({ content: `Updated AC for ${character.character_name}.`, ephemeral: true });
    return true;
  }

  if (subcommand === "xp") {
    const basics = section(character.ledger, "basics");
    const value = interaction.options.getInteger("value", true);
    await patchCharacterLedger(character.id, {
      ...actor(interaction),
      audit_action: "ledger.xp",
      patch: { basics: { xp_current: applyMode(basics.xp_current, value, mode) } }
    });
    await interaction.reply({ content: `Updated XP for ${character.character_name}.`, ephemeral: true });
    return true;
  }

  if (subcommand === "coins") {
    const wealth = section(character.ledger, "wealth");
    const coin = interaction.options.getString("coin", true);
    const value = interaction.options.getInteger("value", true);
    await patchCharacterLedger(character.id, {
      ...actor(interaction),
      audit_action: "ledger.coins",
      patch: { wealth: { [coin]: applyMode(wealth[coin], value, mode) } }
    });
    await interaction.reply({ content: `Updated coins for ${character.character_name}.`, ephemeral: true });
    return true;
  }

  if (subcommand === "abilities") {
    const abilities = numberPatch(interaction, ["str", "int", "wis", "dex", "con", "cha"]);
    if (Object.keys(abilities).length === 0) {
      await interaction.reply({ content: "No ability scores supplied.", ephemeral: true });
      return true;
    }
    await patchCharacterLedger(character.id, {
      ...actor(interaction),
      audit_action: "ledger.abilities",
      patch: { abilities }
    });
    await interaction.reply({ content: `Updated abilities for ${character.character_name}.`, ephemeral: true });
    return true;
  }

  if (subcommand === "status") {
    const status = interaction.options.getString("value", true);
    await patchCharacterLedger(character.id, {
      ...actor(interaction),
      audit_action: "ledger.status",
      patch: { identity: { status }, Identity: { status } }
    });
    await interaction.reply({ content: `Updated ${character.character_name} status to ${status}.`, ephemeral: true });
    return true;
  }

  if (subcommand === "resources") {
    const resources = { ...section(character.ledger, "Resources"), ...section(character.ledger, "resources") };
    const resource = interaction.options.getString("resource", true);
    const value = interaction.options.getInteger("value", true);
    const next = applyMode(resources[resource], value, mode);
    await patchCharacterLedger(character.id, {
      ...actor(interaction),
      audit_action: "ledger.resources",
      patch: { resources: { [resource]: next }, Resources: { [resource]: next } }
    });
    await interaction.reply({ content: `Updated resources for ${character.character_name}.`, ephemeral: true });
    return true;
  }

  if (subcommand === "saves") {
    const savingThrows = numberPatch(interaction, ["death", "wands", "paralysis_petrify", "breath", "spells"]);
    if (Object.keys(savingThrows).length === 0) {
      await interaction.reply({ content: "No saving throws supplied.", ephemeral: true });
      return true;
    }
    await patchCharacterLedger(character.id, {
      ...actor(interaction),
      audit_action: "ledger.saves",
      patch: { combat: { saving_throws: savingThrows } }
    });
    await interaction.reply({ content: `Updated saves for ${character.character_name}.`, ephemeral: true });
    return true;
  }

  if (subcommand === "movement") {
    const movement = interaction.options.getString("movement", true);
    const encumbranceCategory = interaction.options.getString("encumbrance_category");
    await patchCharacterLedger(character.id, {
      ...actor(interaction),
      audit_action: "ledger.movement",
      patch: {
        combat: { movement },
        equipment: encumbranceCategory ? { encumbrance_category: encumbranceCategory } : {}
      }
    });
    await interaction.reply({ content: `Updated movement for ${character.character_name}.`, ephemeral: true });
    return true;
  }

  return false;
}

function equipmentLines(character: CharacterResponse): string {
  const equipment = section(character.ledger, "equipment");
  const formatBucket = (label: string, key: string) => {
    const items = Array.isArray(equipment[key]) ? (equipment[key] as Record<string, unknown>[]) : [];
    if (items.length === 0) {
      return `${label}: None`;
    }
    const rendered = items
      .map((item) => {
        const quantity = item.quantity ?? 1;
        const notes = item.notes ? ` (${item.notes})` : "";
        return `${quantity}x ${item.item_name}${notes}`;
      })
      .join(", ");
    return `${label}: ${rendered}`;
  };
  return [
    formatBucket("Carried", "inventory"),
    formatBucket("Equipped", "equipped"),
    formatBucket("Stored", "stored"),
    `Encumbrance total: ${equipment.encumbrance_total ?? 0}`
  ].join("\n");
}

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

    if (interaction.commandName === "guide") {
      await interaction.reply({ embeds: [buildHelpEmbed()], ephemeral: true });
      return;
    }

    if (interaction.commandName === "help") {
      await interaction.reply({
        content: "`/help` is deprecated. Use `/guide` for the RUSSO player command guide.",
        embeds: [buildHelpEmbed()],
        ephemeral: true
      });
      return;
    }

    if (interaction.commandName === "ref") {
      if (!isAdmin(interaction)) {
        await interaction.reply({ content: "RUSSO referee references are limited to the Referee/admin.", ephemeral: true });
        return;
      }

      const subcommand = interaction.options.getSubcommand();
      if (subcommand === "screen") {
        await interaction.reply({ embeds: buildRefereeScreenEmbeds(config.rulesetId), ephemeral: true });
      }
      return;
    }

    if (interaction.commandName === "show") {
      const subcommand = interaction.options.getSubcommand();
      if (subcommand === "card") {
        const character = await targetCharacter(interaction);
        await interaction.reply({ embeds: [buildCharacterCardEmbed(character)], ephemeral: true });
      }
      return;
    }

    if (interaction.commandName === "ledger") {
      const subcommand = interaction.options.getSubcommand(false) ?? "show";
      const character = await targetCharacter(interaction);
      await replyLedgerMutation(interaction, character, subcommand);
      return;
    }

    if (interaction.commandName === "equipment") {
      const character = await targetCharacter(interaction);
      await replyEquipment(interaction, character, interaction.options.getSubcommand());
      return;
    }

    if (interaction.commandName !== "character") {
      return;
    }

    const group = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "create") {
      const character = await createCharacter({
        character_name: interaction.options.getString("character_name", true),
        player_name: interaction.options.getString("player_name") ?? discordDisplayName(interaction),
        race: interaction.options.getString("race", true),
        class_name: interaction.options.getString("class_name", true),
        level: interaction.options.getInteger("level", true),
        alignment: interaction.options.getString("alignment"),
        hp_max: interaction.options.getInteger("hp_max"),
        hp_current: interaction.options.getInteger("hp_current"),
        armor_class: interaction.options.getInteger("armor_class"),
        movement: interaction.options.getString("movement"),
        thac0: interaction.options.getInteger("thac0"),
        xp: interaction.options.getInteger("xp") ?? 0,
        coins: parseCoins(interaction.options.getString("coins")),
        languages: parseLanguages(interaction.options.getString("languages")),
        saves: parseSaves(interaction.options.getString("saves")),
        notes: interaction.options.getString("notes"),
        strength: interaction.options.getInteger("strength"),
        intelligence: interaction.options.getInteger("intelligence"),
        wisdom: interaction.options.getInteger("wisdom"),
        dexterity: interaction.options.getInteger("dexterity"),
        constitution: interaction.options.getInteger("constitution"),
        charisma: interaction.options.getInteger("charisma"),
        discord_username: interaction.user.username,
        discord_user_id: interaction.user.id
      });

      await interaction.reply({
        content: `Created RUSSO ledger for ${character.character_name} as ${character.status}.`,
        ephemeral: true
      });
      return;
    }

    if (subcommand === "list") {
      const characters = await listCharacters(interaction.user.id);
      const lines = characters.map((character) => {
        const basics = section(character.ledger, "basics");
        const active = character.is_active ? "Active" : "Inactive";
        return `${character.character_name} - ${basics.race ?? "Race?"} ${basics.class_name ?? "Class?"} ${basics.level ?? "?"} - ${character.status} / ${active}`;
      });
      await interaction.reply({
        content: lines.length > 0 ? lines.join("\n") : "No RUSSO characters found.",
        ephemeral: true
      });
      return;
    }

    if (subcommand === "active") {
      const character = await lookupCharacter(interaction.user.id, isAdmin(interaction), interaction.options.getString("character", true));
      const updated = await activateCharacter(character.id, actor(interaction));
      await interaction.reply({ content: `${updated.character_name} is now Active.`, ephemeral: true });
      return;
    }

    if (subcommand === "sheet") {
      const character = await targetCharacter(interaction);
      await interaction.reply({ embeds: [buildCharacterSheetEmbed(character)], ephemeral: true });
      return;
    }

    if (group === "equipment") {
      const character = await targetCharacter(interaction);
      if (await replyEquipment(interaction, character, subcommand)) {
        return;
      }
    }

    const character = await targetCharacter(interaction);

    if (subcommand === "hp") {
      const combat: Record<string, number> = { hp_current: interaction.options.getInteger("current_hp", true) };
      const maxHp = interaction.options.getInteger("max_hp");
      if (maxHp !== null) {
        combat.hp_max = maxHp;
      }
      await patchCharacterLedger(character.id, {
        ...actor(interaction),
        audit_action: "ledger.hp",
        patch: { combat }
      });
      await interaction.reply({ content: `Updated HP for ${character.character_name}.`, ephemeral: true });
      return;
    }

    if (subcommand === "ac") {
      await patchCharacterLedger(character.id, {
        ...actor(interaction),
        audit_action: "ledger.ac",
        patch: { combat: { armor_class: interaction.options.getInteger("armor_class", true) } }
      });
      await interaction.reply({ content: `Updated AC for ${character.character_name}.`, ephemeral: true });
      return;
    }

    if (subcommand === "xp") {
      const basics: Record<string, number> = { xp_current: interaction.options.getInteger("current_xp", true) };
      const xpNeeded = interaction.options.getInteger("xp_needed");
      if (xpNeeded !== null) {
        basics.xp_needed = xpNeeded;
      }
      await patchCharacterLedger(character.id, {
        ...actor(interaction),
        audit_action: "ledger.xp",
        patch: { basics }
      });
      await interaction.reply({ content: `Updated XP for ${character.character_name}.`, ephemeral: true });
      return;
    }

    if (subcommand === "coins") {
      const wealth = section(character.ledger, "wealth");
      const patch = numberPatch(interaction, ["pp", "gp", "ep", "sp", "cp"], interaction.options.getString("mode") ?? "set", wealth);
      if (Object.keys(patch).length === 0) {
        await interaction.reply({ content: "No coin fields supplied.", ephemeral: true });
        return;
      }
      await patchCharacterLedger(character.id, {
        ...actor(interaction),
        audit_action: "ledger.coins",
        patch: { wealth: patch }
      });
      await interaction.reply({ content: `Updated coins for ${character.character_name}.`, ephemeral: true });
      return;
    }

    if (subcommand === "abilities") {
      const abilities = numberPatch(interaction, ["str", "exceptional_str", "int", "wis", "dex", "con", "cha"]);
      if (Object.keys(abilities).length === 0) {
        await interaction.reply({ content: "No ability scores supplied.", ephemeral: true });
        return;
      }
      await patchCharacterLedger(character.id, {
        ...actor(interaction),
        audit_action: "ledger.abilities",
        patch: { abilities }
      });
      await interaction.reply({ content: `Updated abilities for ${character.character_name}.`, ephemeral: true });
      return;
    }

    if (subcommand === "status") {
      const status = interaction.options.getString("status", true);
      await patchCharacterLedger(character.id, {
        ...actor(interaction),
        audit_action: "ledger.status",
        patch: { identity: { status }, Identity: { status } }
      });
      await interaction.reply({ content: `Updated ${character.character_name} status to ${status}.`, ephemeral: true });
      return;
    }

    if (subcommand === "resources") {
      const resources = { ...section(character.ledger, "Resources"), ...section(character.ledger, "resources") };
      const patch = numberPatch(
        interaction,
        ["torches", "lantern_oil", "rations", "water", "arrows", "bolts", "sling_stones"],
        interaction.options.getString("mode") ?? "set",
        resources
      );
      if (Object.keys(patch).length === 0) {
        await interaction.reply({ content: "No resource fields supplied.", ephemeral: true });
        return;
      }
      await patchCharacterLedger(character.id, {
        ...actor(interaction),
        audit_action: "ledger.resources",
        patch: { resources: patch, Resources: patch }
      });
      await interaction.reply({ content: `Updated resources for ${character.character_name}.`, ephemeral: true });
      return;
    }

    if (subcommand === "saves") {
      const savingThrows = numberPatch(interaction, ["death", "wands", "paralysis_petrify", "breath", "spells"]);
      if (Object.keys(savingThrows).length === 0) {
        await interaction.reply({ content: "No saving throws supplied.", ephemeral: true });
        return;
      }
      await patchCharacterLedger(character.id, {
        ...actor(interaction),
        audit_action: "ledger.saves",
        patch: { combat: { saving_throws: savingThrows } }
      });
      await interaction.reply({ content: `Updated saves for ${character.character_name}.`, ephemeral: true });
      return;
    }

    if (subcommand === "movement") {
      const movement = interaction.options.getString("movement", true);
      const encumbranceCategory = interaction.options.getString("encumbrance_category");
      await patchCharacterLedger(character.id, {
        ...actor(interaction),
        audit_action: "ledger.movement",
        patch: {
          combat: { movement },
          equipment: encumbranceCategory ? { encumbrance_category: encumbranceCategory } : {}
        }
      });
      await interaction.reply({ content: `Updated movement for ${character.character_name}.`, ephemeral: true });
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
