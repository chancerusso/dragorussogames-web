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
        value: "`/ledger hp`, `/ledger ac`, `/ledger xp`, `/ledger coins`, `/ledger abilities`, `/ledger status`, `/ledger resources`, `/ledger saves`, and `/ledger movement` update your active character unless a DM/admin targets another character."
      },
      {
        name: "Equipment",
        value: "`/equipment add`, `/equipment list`, `/equipment equip`, `/equipment unequip`, and `/equipment remove` maintain inventory and create Character Register entries."
      },
      {
        name: "Referee Authority",
        value: "Your printed character sheet is welcome at the table. RUSSO is the persistent campaign ledger between sessions.\n\nThe Referee has final authority over all records, rulings, rewards, treasure, and character state."
      }
    );
}
