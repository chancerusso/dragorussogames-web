import { EmbedBuilder } from "discord.js";

export function buildHelpEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("RUSSO™ Help")
    .setDescription("RUSSO™ is the Referee Utility System for Sessions & Operations.")
    .addFields(
      {
        name: "Where To Use It",
        value: "Use #pc-maintenance for character creation, equipment changes, treasure updates, and between-session maintenance."
      },
      {
        name: "Create And Review",
        value: "`/character create` creates your character and ledger. `/character sheet` or `/show card` shows your quick table card. `/character list` shows your characters. `/character active` switches your active character."
      },
      {
        name: "Maintain The Ledger",
        value: "`/rest` applies daily recovery. `/coin add` and `/coin status` manage carried coins and encumbrance. `/ledger hp`, `/ledger ac`, `/ledger xp`, `/ledger abilities`, `/ledger status`, `/ledger resources`, `/ledger saves`, and `/ledger movement` update your active character unless a DM/admin targets another character."
      },
      {
        name: "Equipment",
        value: "`/equipment add` opens a prompt, or use `/equipment add item:longsword`. RUSSO uses the OSRIC catalog for weight, value, and damage. Use `/equipment elim`, `/equipment equip`, `/equipment unequip`, `/equipment list`, or `/equipment custom`."
      },
      {
        name: "Expedition",
        value: "`/tracker status`, `/tracker next`, `/tracker rest`, `/tracker day`, and `/tracker xp` track channel-scoped expedition time and pending XP. `/order` shows the channel marching order. `/camp` runs the overnight/end-of-day procedure."
      },
      {
        name: "Group Storage",
        value: "`/mule add`, `/mule elim`, `/mule coins`, and `/mule status` maintain channel-scoped party storage. Mule gear does not affect your character encumbrance."
      },
      {
        name: "Referee Authority",
        value: "Your printed character sheet is welcome at the table. RUSSO is the persistent campaign ledger between sessions.\n\nThe Referee has final authority over all records, rulings, rewards, treasure, and character state."
      }
    );
}
