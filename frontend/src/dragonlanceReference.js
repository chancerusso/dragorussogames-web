import kender from "../../content/options/dragolance/races/kender.json";
import tinkerGnome from "../../content/options/dragolance/races/tinker_gnome.json";
import silvanestiElf from "../../content/options/dragolance/races/silvanesti_elf.json";
import qualinestiElf from "../../content/options/dragolance/races/qualinesti_elf.json";
import kagonestiElf from "../../content/options/dragolance/races/kagonesti_elf.json";
import dargonestiElf from "../../content/options/dragolance/races/dargonesti_elf.json";
import dimernestiElf from "../../content/options/dragolance/races/dimernesti_elf.json";
import halfElf from "../../content/options/dragolance/races/half_elf.json";
import hillDwarf from "../../content/options/dragolance/races/hill_dwarf.json";
import mountainDwarf from "../../content/options/dragolance/races/mountain_dwarf.json";
import gullyDwarf from "../../content/options/dragolance/races/gully_dwarf.json";
import irda from "../../content/options/dragolance/races/irda.json";
import minotaur from "../../content/options/dragolance/races/minotaur.json";

import crownProgression from "../../content/options/dragolance/progressions/crown.json";
import swordProgression from "../../content/options/dragolance/progressions/sword.json";
import roseProgression from "../../content/options/dragolance/progressions/rose.json";
import whiteRobesProgression from "../../content/options/dragolance/progressions/white_robes.json";
import redRobesProgression from "../../content/options/dragolance/progressions/red_robes.json";
import blackRobesProgression from "../../content/options/dragolance/progressions/black_robes.json";
import studentProgression from "../../content/options/dragolance/progressions/student.json";
import goodClericProgression from "../../content/options/dragolance/progressions/good.json";
import neutralClericProgression from "../../content/options/dragolance/progressions/neutral.json";
import evilClericProgression from "../../content/options/dragolance/progressions/evil.json";
import swordKnightSpellSlots from "../../content/options/dragolance/spell_slots/sword_knight.json";
import whiteRobesSpellSlots from "../../content/options/dragolance/spell_slots/white_robes.json";
import redRobesSpellSlots from "../../content/options/dragolance/spell_slots/red_robes.json";
import blackRobesSpellSlots from "../../content/options/dragolance/spell_slots/black_robes.json";
import goodClericSpellSlots from "../../content/options/dragolance/spell_slots/good.json";
import neutralClericSpellSlots from "../../content/options/dragolance/spell_slots/neutral.json";
import evilClericSpellSlots from "../../content/options/dragolance/spell_slots/evil.json";
import solinariMoon from "../../content/options/dragolance/moons/solinari.json";
import lunitariMoon from "../../content/options/dragolance/moons/lunitari.json";
import nuitariMoon from "../../content/options/dragolance/moons/nuitari.json";
import holyOrders from "../../content/options/dragolance/organizations/holy_orders.json";

import paladine from "../../content/options/dragolance/deities/paladine.json";
import majere from "../../content/options/dragolance/deities/majere.json";
import mishakal from "../../content/options/dragolance/deities/mishakal.json";
import kiriJolith from "../../content/options/dragolance/deities/kiri_jolith.json";
import habbakuk from "../../content/options/dragolance/deities/habbakuk.json";
import branchala from "../../content/options/dragolance/deities/branchala.json";
import solinari from "../../content/options/dragolance/deities/solinari.json";
import gilean from "../../content/options/dragolance/deities/gilean.json";
import sirrion from "../../content/options/dragolance/deities/sirrion.json";
import reorx from "../../content/options/dragolance/deities/reorx.json";
import chislev from "../../content/options/dragolance/deities/chislev.json";
import zivilyn from "../../content/options/dragolance/deities/zivilyn.json";
import shinare from "../../content/options/dragolance/deities/shinare.json";
import lunitari from "../../content/options/dragolance/deities/lunitari.json";
import takhisis from "../../content/options/dragolance/deities/takhisis.json";
import sargonnas from "../../content/options/dragolance/deities/sargonnas.json";
import morgion from "../../content/options/dragolance/deities/morgion.json";
import chemosh from "../../content/options/dragolance/deities/chemosh.json";
import zeboim from "../../content/options/dragolance/deities/zeboim.json";
import hiddukel from "../../content/options/dragolance/deities/hiddukel.json";
import nuitari from "../../content/options/dragolance/deities/nuitari.json";

export const dragonlanceIa = [
  { label: "What is Dragolance?", path: "what-is-dragonlance" },
  { label: "The World of Krynn", path: "world-of-krynn" },
  {
    label: "Races of Krynn",
    path: "races",
    children: [
      { label: "Overview", path: "races/overview" },
      { label: "Kender", path: "races/kender" },
      { label: "Gnomes", path: "races/gnomes" },
      {
        label: "Elves",
        path: "races/elves",
        children: [
          { label: "Overview", path: "races/elves/overview" },
          { label: "Silvanesti", path: "races/elves/silvanesti" },
          { label: "Qualinesti", path: "races/elves/qualinesti" },
          { label: "Kagonesti", path: "races/elves/kagonesti" },
          { label: "Dargonesti", path: "races/elves/dargonesti" },
          { label: "Dimernesti", path: "races/elves/dimernesti" },
          { label: "Dark Elves", path: "races/elves/dark-elves" },
          { label: "Half-Elves", path: "races/elves/half-elves" },
        ],
      },
      {
        label: "Dwarves",
        path: "races/dwarves",
        children: [
          { label: "Overview", path: "races/dwarves/overview" },
          { label: "Hill Dwarves", path: "races/dwarves/hill" },
          { label: "Mountain Dwarves", path: "races/dwarves/mountain" },
          { label: "Gully Dwarves", path: "races/dwarves/gully" },
        ],
      },
      { label: "Irda", path: "races/irda" },
      { label: "Minotaurs", path: "races/minotaurs" },
    ],
  },
  {
    label: "Classes",
    path: "classes",
    children: [
      { label: "Overview", path: "classes/overview" },
      {
        label: "Knights of Solamnia",
        path: "classes/knights-of-solamnia",
        children: [
          { label: "Overview", path: "classes/knights-of-solamnia/overview" },
          { label: "Organization", path: "classes/knights-of-solamnia/organization" },
          { label: "Oath and Measure", path: "classes/knights-of-solamnia/oath-and-measure" },
          { label: "Knights of the Crown", path: "classes/knights-of-solamnia/crown" },
          { label: "Knights of the Sword", path: "classes/knights-of-solamnia/sword" },
          { label: "Knights of the Rose", path: "classes/knights-of-solamnia/rose" },
          { label: "Knights in Battle", path: "classes/knights-of-solamnia/battle" },
          { label: "Knightly Council", path: "classes/knights-of-solamnia/council" },
        ],
      },
      {
        label: "Wizards of High Sorcery",
        path: "classes/wizards-of-high-sorcery",
        children: [
          { label: "Overview", path: "classes/wizards-of-high-sorcery/overview" },
          { label: "Moons of Magic", path: "classes/wizards-of-high-sorcery/moons" },
          { label: "Conclave", path: "classes/wizards-of-high-sorcery/conclave" },
          { label: "Towers of High Sorcery", path: "classes/wizards-of-high-sorcery/towers" },
          { label: "Early Life of a Wizard", path: "classes/wizards-of-high-sorcery/early-life" },
          { label: "Test of High Sorcery", path: "classes/wizards-of-high-sorcery/test" },
          { label: "White Robes", path: "classes/wizards-of-high-sorcery/white-robes" },
          { label: "Red Robes", path: "classes/wizards-of-high-sorcery/red-robes" },
          { label: "Black Robes", path: "classes/wizards-of-high-sorcery/black-robes" },
          { label: "Renegade Wizards", path: "classes/wizards-of-high-sorcery/renegades" },
          { label: "Magic on Krynn", path: "classes/wizards-of-high-sorcery/magic-on-krynn" },
        ],
      },
      {
        label: "Tinkers",
        path: "classes/tinkers",
        children: [
          { label: "Overview", path: "classes/tinkers/overview" },
          { label: "Tinker Class", path: "classes/tinkers/class" },
          { label: "Device Creation", path: "classes/tinkers/device-creation" },
          { label: "Device Operation", path: "classes/tinkers/device-operation" },
        ],
      },
    ],
  },
  {
    label: "Gods",
    path: "gods",
    children: [
      { label: "Overview", path: "gods/overview" },
      { label: "Holy Orders of the Stars", path: "gods/holy-orders" },
      { label: "Clerics of Good", path: "gods/clerics-good" },
      { label: "Clerics of Neutrality", path: "gods/clerics-neutrality" },
      { label: "Clerics of Evil", path: "gods/clerics-evil" },
      {
        label: "Gods of Good",
        path: "gods/good",
        children: [
          { label: "Paladine", path: "gods/good/paladine" },
          { label: "Majere", path: "gods/good/majere" },
          { label: "Kiri-Jolith", path: "gods/good/kiri-jolith" },
          { label: "Mishakal", path: "gods/good/mishakal" },
          { label: "Habbakuk", path: "gods/good/habbakuk" },
          { label: "Branchala", path: "gods/good/branchala" },
          { label: "Solinari", path: "gods/good/solinari" },
        ],
      },
      {
        label: "Gods of Neutrality",
        path: "gods/neutrality",
        children: [
          { label: "Gilean", path: "gods/neutrality/gilean" },
          { label: "Sirrion", path: "gods/neutrality/sirrion" },
          { label: "Reorx", path: "gods/neutrality/reorx" },
          { label: "Chislev", path: "gods/neutrality/chislev" },
          { label: "Zivilyn", path: "gods/neutrality/zivilyn" },
          { label: "Shinare", path: "gods/neutrality/shinare" },
          { label: "Lunitari", path: "gods/neutrality/lunitari" },
        ],
      },
      {
        label: "Gods of Evil",
        path: "gods/evil",
        children: [
          { label: "Takhisis", path: "gods/evil/takhisis" },
          { label: "Sargonnas", path: "gods/evil/sargonnas" },
          { label: "Morgion", path: "gods/evil/morgion" },
          { label: "Chemosh", path: "gods/evil/chemosh" },
          { label: "Zeboim", path: "gods/evil/zeboim" },
          { label: "Hiddukel", path: "gods/evil/hiddukel" },
          { label: "Nuitari", path: "gods/evil/nuitari" },
        ],
      },
    ],
  },
];

export const dragolanceIntroContent = {
  eyebrow: "Campaign Introduction",
  title: "What is Dragolance?",
  body: [
    { type: "paragraph", text: "That is a great question, isn’t it?" },
    { type: "paragraph", text: "Because you are reading this, it means you probably have your own reasons for being here. Maybe you’re familiar with the novels, the original adventures, or the world of Krynn itself. Or perhaps you’re simply curious… or nostalgic." },
    { type: "paragraph", text: "This is what I like to call Dragolance." },
    { type: "paragraph", text: "It is my own interpretation of the world of Krynn and the stories held within it." },
    { type: "paragraph", text: "The word Drago, which I use extensively, means dragon in Italian. While it may represent me and what I am building, it is much more than that. It represents everyone who becomes part of our server, our games, and our story." },
    { type: "credo", text: "We are all Drago Russo." },
    { type: "paragraph", text: "Dragolance is our story, set within this wonderful world where magic feels truly special, the Gods are present (or are they? 😄), and dragons are feared—truly feared—not creatures to be defeated by a handful of low-level adventurers." },
    { type: "paragraph", text: "That is why I have chosen to recreate stories with our family of friends from around the world, sharing this vision of what Dungeons & Dragons is truly about." },
    { type: "paragraph", text: "In my opinion, that vision can only be faithfully represented through the AD&D 1st Edition rules, using First Edition as the foundation. It captures this setting far better than modern editions ever could. Krynn is, at its heart, a low-magic world where every journey is dangerous, every victory is earned, and true heroes are forged through hardship." },
    { type: "paragraph", text: "It is through stories like these that lasting memories are created—memories that live far beyond the campaign itself." },
    { type: "paragraph", text: "This website, along with the tools we are building, exists to bring the feeling of old-school AD&D back to life. We embrace modern conveniences where they help, but always with the nostalgic spirit of the 1980s." },
    { type: "paragraph", text: "For just two or three hours each week, I want us to feel transported back to that era—to rediscover the mystery, the wonder, and the excitement that came from gathering around a table with friends. Every player brings their own experiences, personality, and imagination, yet together we become something greater than ourselves: a fellowship striving to make good triumph over evil." },
    { type: "paragraph", text: "To me, that is the true story of Dragonlance." },
    { type: "paragraph", text: "Good versus Evil." },
    { type: "paragraph", text: "If there is one message I hope this project shares, it is that we should all strive to help Good triumph over Evil." },
    { type: "paragraph", text: "Yes, this is a game. It takes place in a world of imagination, dragons, magic, and heroes. But I like to believe that a little of that struggle follows us back into the real world—that perhaps the stories we tell around the table encourage us, even in the smallest ways, to choose kindness over cruelty, courage over fear, hope over despair, and good over evil in our own lives and in the lives of those around us." },
    { type: "paragraph", text: "I hope you make lifelong friends, become part of our family, and create memories that you’ll carry with you long after the dice have stopped rolling." },
    { type: "paragraph", text: "Together we’ll explore Krynn, face impossible odds, and fight the good fight." },
    { type: "paragraph", text: "Here’s to Good over Evil." },
    { type: "paragraph", text: "May we continue to fight the good fight, both around the table and beyond it." },
    { type: "signature", text: "— Chance Russo" },
  ],
};

export const raceRecords = {
  "races/kender": kender,
  "races/gnomes": tinkerGnome,
  "races/elves/silvanesti": silvanestiElf,
  "races/elves/qualinesti": qualinestiElf,
  "races/elves/kagonesti": kagonestiElf,
  "races/elves/dargonesti": dargonestiElf,
  "races/elves/dimernesti": dimernestiElf,
  "races/elves/half-elves": halfElf,
  "races/dwarves/hill": hillDwarf,
  "races/dwarves/mountain": mountainDwarf,
  "races/dwarves/gully": gullyDwarf,
  "races/irda": irda,
  "races/minotaurs": minotaur,
};

export const racePresentation = {
  "races/kender": {
    parent: "Dragolance Race",
    sourcePages: "51-54; summary tables 114, 117",
    summary: "Kender are small, fearless wanderers whose curiosity and open-handed sense of property make them unlike First Edition halflings in play. A kender character tends to pull stories toward roads, ruins, strangers, locked things, and trouble that looks interesting rather than profitable.",
    playing: "Kender fit scouting, social disruption, and bold adventuring roles. Their handling and pockets are part of kender culture rather than ordinary criminal theft, but the mechanical complications remain real and should be played openly with the table.",
    relationships: [{ label: "First Edition Thief", href: "/1e/classes/thief/" }, { label: "First Edition Ranger", href: "/1e/classes/ranger/" }],
  },
  "races/gnomes": {
    parent: "Dragolance Race Extension",
    osricBase: "Gnome",
    sourcePages: "54-56; summary tables 114, 117",
    summary: "Krynn gnomes are organized around guilds, committees, technical language, and Lifequests. Most player-facing gnome culture points toward invention and obsessive specialization, but the race record remains separate from the future Tinker class rules.",
    playing: "A gnome character often enters the campaign with a project, an institutional home, and a vocabulary that can overwhelm everyone nearby. Use this page for race mechanics; the Tinker class page will carry class progression and device rules.",
    notice: "Mad Gnomes are treated as player-relevant cultural/source context here, not as a separate selectable race record.",
    relationships: [{ label: "First Edition Gnome", href: "/1e/races/gnome/" }, { label: "Tinker Class", href: "/portal/dragonlance/classes/tinkers" }],
  },
  "races/elves/silvanesti": {
    parent: "Elf",
    osricBase: "Elf",
    sourcePages: "57-63; summary tables 114, 117",
    summary: "Silvanesti are the oldest and most tradition-bound of the listed Krynn elf peoples, shaped by hierarchy, lineage, and a high regard for refinement and separation.",
    playing: "Silvanesti characters often carry status, distance, and obligation into adventuring life. Their paths naturally lean toward disciplined martial or magical traditions where the campaign permits them.",
  },
  "races/elves/qualinesti": {
    parent: "Elf",
    osricBase: "Elf",
    sourcePages: "57-63; summary tables 114, 117",
    summary: "Qualinesti are a distinct elven people with their own homeland and social order, generally less rigid than Silvanesti while still deeply tied to elven identity and memory.",
    playing: "Qualinesti characters work well as diplomats, scouts, warriors, and arcane aspirants. Their social position can bridge elven isolation and wider Krynn adventuring parties.",
  },
  "races/elves/kagonesti": {
    parent: "Elf",
    osricBase: "Elf",
    sourcePages: "57-63; summary tables 114, 117",
    summary: "Kagonesti are wild elves whose culture emphasizes independence, physical life, and distance from the settled assumptions of other elven societies.",
    playing: "Kagonesti characters suit wilderness-forward campaigns and parties that can handle cultural friction between settled and wild peoples without turning it into extra mechanics.",
  },
  "races/elves/dargonesti": {
    parent: "Sea Elf",
    sourcePages: "57-63; summary tables 114, 117",
    summary: "Dargonesti are a sea-dwelling elven people. Their player-facing identity is tied to underwater life and transformation rules that must be handled exactly from the source.",
    playing: "Dargonesti require campaign attention because their environment and transformation abilities can change the shape of an adventure. Remaining review flags are shown rather than guessed.",
  },
  "races/elves/dimernesti": {
    parent: "Sea Elf",
    sourcePages: "57-63; summary tables 114, 117",
    summary: "Dimernesti are sea elves with player-facing mechanics for life in and out of water, including transformation-related rules represented in the canonical record.",
    playing: "Dimernesti work best when the campaign can support aquatic travel, shore cultures, and the limits of operating away from their natural environment.",
  },
  "races/elves/half-elves": {
    parent: "Dragolance Half-Elf",
    osricBase: "Half-Elf",
    sourcePages: "57-63; summary tables 114, 117",
    summary: "Dragonlance half-elves carry the familiar mixed-heritage role into Krynn's specific elven societies and human cultures, with class and limit details supplied by the source record.",
    playing: "Half-elves are strong bridge characters for parties moving between human and elven communities. Use the Krynn record here where it modifies or extends the First Edition half-elf.",
  },
  "races/dwarves/hill": {
    parent: "Dwarf",
    osricBase: "Dwarf",
    sourcePages: "65-67; summary tables 114, 117",
    summary: "Hill dwarves are the surface-associated dwarf people represented as a Krynn extension of the First Edition dwarf. The Neidar name belongs to this setting context rather than a separate mechanical race here.",
    playing: "Hill dwarf characters keep the familiar sturdy dwarf baseline while carrying Krynn's clan history, grudges, and social divisions into play.",
  },
  "races/dwarves/mountain": {
    parent: "Dwarf",
    osricBase: "Dwarf",
    sourcePages: "65-67; summary tables 114, 117",
    summary: "Mountain dwarves represent the underground dwarf tradition in this source, with Krynn-specific ability bounds and class access layered on the First Edition dwarf base.",
    playing: "Mountain dwarf characters bring clan duty, subterranean politics, and hard boundaries around outsiders into the party story.",
  },
  "races/dwarves/gully": {
    parent: "Dwarf; Aghar",
    osricBase: "Dwarf",
    sourcePages: "65-67; summary tables 114, 117",
    summary: "Gully dwarves, also called Aghar, are presented with unusual and restrictive mechanics. This reference preserves those rules rather than improving or normalizing them.",
    playing: "A gully dwarf character needs table buy-in because the source drawbacks are central to the race's play experience. The page keeps the mechanical limits visible.",
  },
  "races/irda": {
    parent: "Dragolance Race",
    sourcePages: "68; summary tables 114, 117",
    summary: "The Irda are rare, secretive descendants of ancient ogrekind, presented as a powerful and unusual player option with transformation-related concerns.",
    playing: "Irda should be treated as a campaign-approval race. Their social secrecy and unresolved source fields are significant enough that a DM should confirm fit before play.",
    notice: "DM Approval Recommended",
  },
  "races/minotaurs": {
    parent: "Dragolance Race",
    sourcePages: "69; summary tables 114, 117",
    summary: "Krynn minotaurs are a seafaring, honor-driven people with strong physical adjustments and narrow class access. This page uses the Krynn race record, not monster statistics.",
    playing: "Minotaur characters are bold martial presences whose culture can create strong social obligations. Remaining review fields stay visible for source confirmation.",
  },
};

export const raceOverviewPages = {
  races: {
    title: "Races of Krynn",
    status: "Presentation Only",
    summary: "Krynn keeps the shared First Edition rules engine, but several peoples have Dragonlance-specific ability ranges, class access, movement, languages, and special rules. Those setting records override First Edition only where Dragonlance Adventures explicitly says so.",
    notice: "Humans use the standard First Edition Human rules and are linked here rather than duplicated as a Dragolance race.",
    links: [
      { label: "First Edition Human", href: "/1e/races/human/" },
      { label: "First Edition Races", href: "/1e/races/" },
      { label: "First Edition Ability Scores", href: "/1e/character-creation/001-ability-scores/" },
      { label: "First Edition Class Rules", href: "/1e/classes/" },
    ],
    cards: [
      { label: "Kender", path: "races/kender", copy: "Fearless wanderers with handling, pockets, taunting, and distinct limits." },
      { label: "Gnomes", path: "races/gnomes", copy: "Guild-bound inventors and Lifequest-driven Krynn gnomes." },
      { label: "Elves", path: "races/elves", copy: "Silvanesti, Qualinesti, Kagonesti, sea elves, dark elf status, and half-elves." },
      { label: "Dwarves", path: "races/dwarves", copy: "Hill, mountain, and gully dwarf records from the 1987 source." },
      { label: "Irda", path: "races/irda", copy: "Rare, secretive, powerful, and campaign-sensitive." },
      { label: "Minotaurs", path: "races/minotaurs", copy: "Krynn minotaurs as a player race, not monster statistics." },
    ],
  },
  "races/overview": null,
  "races/elves": {
    title: "Elves",
    status: "Presentation Only",
    summary: "Dragonlance Adventures presents multiple elven peoples rather than a single generic elf record. Some are mechanical subraces, while Dark Elf is represented as a source-defined social and legal status, not a drow-style race.",
    notice: "Use each subpage's canonical record for mechanics. Do not combine elf cultures unless the source does so.",
    cards: [
      { label: "Silvanesti", path: "races/elves/silvanesti", copy: "Ancient, hierarchical, tradition-bound elves." },
      { label: "Qualinesti", path: "races/elves/qualinesti", copy: "A distinct elven people with its own homeland and social order." },
      { label: "Kagonesti", path: "races/elves/kagonesti", copy: "Wild elves with separate ability and class details." },
      { label: "Dargonesti", path: "races/elves/dargonesti", copy: "Sea elves with aquatic and transformation concerns." },
      { label: "Dimernesti", path: "races/elves/dimernesti", copy: "Sea elves with verified canonical race data and review-marked extensions." },
      { label: "Dark Elves", path: "races/elves/dark-elves", copy: "A Dragonlance exile/status page, not a separate selectable race." },
      { label: "Half-Elves", path: "races/elves/half-elves", copy: "Krynn-specific half-elf record extending First Edition half-elf." },
    ],
  },
  "races/elves/overview": null,
  "races/dwarves": {
    title: "Dwarves",
    status: "Presentation Only",
    summary: "This source presents hill dwarves, mountain dwarves, and gully dwarves as the player-facing dwarf records for this unit. Other clan names matter to Krynn culture, but they are not separate mechanical race pages here.",
    notice: "Hill and mountain dwarves extend the First Edition dwarf. Gully dwarves are Aghar and retain their unusual source restrictions.",
    cards: [
      { label: "Hill Dwarves", path: "races/dwarves/hill", copy: "Surface-associated Krynn dwarf extension." },
      { label: "Mountain Dwarves", path: "races/dwarves/mountain", copy: "Underground Krynn dwarf extension." },
      { label: "Gully Dwarves", path: "races/dwarves/gully", copy: "Aghar mechanics preserved as printed." },
    ],
  },
  "races/dwarves/overview": null,
};

raceOverviewPages["races/overview"] = raceOverviewPages.races;
raceOverviewPages["races/elves/overview"] = raceOverviewPages["races/elves"];
raceOverviewPages["races/dwarves/overview"] = raceOverviewPages["races/dwarves"];

export const presentationOnlyRacePages = {
  "races/elves/dark-elves": {
    title: "Dark Elves",
    status: "Presentation Only; Not Player Selectable",
    sourcePages: "57-63",
    summary: "In this source, Dark Elf is a Dragonlance social and legal designation for elves cast out from their people. It is not presented here as an unrelated subterranean drow race and does not create a separate player-selectable mechanical race record.",
    notice: "Choose the underlying elven race record first. Dark Elf status is campaign and story context unless the source or DM applies a specific rule.",
    links: [
      { label: "Silvanesti", path: "races/elves/silvanesti" },
      { label: "Qualinesti", path: "races/elves/qualinesti" },
      { label: "Kagonesti", path: "races/elves/kagonesti" },
    ],
  },
};

export const raceAuditDecisions = {
  "Elves Overview": "Presentation-only page; no canonical race record added.",
  "Dwarves Overview": "Presentation-only page; no canonical race record added.",
  "Dark Elves": "Presentation-only social/exile status page; no selectable drow-style race record added.",
  "Mad Gnomes": "Player-relevant gnome context on the Gnomes page; no separate canonical race record added.",
};

export const sourceBadges = {
  campaign: { type: "Campaign Commentary", label: "Drago Russo Games" },
  setting: { type: "Canonical Setting Source", label: "Dragonlance Adventures · 1987" },
  core: { type: "Canonical Core Rules", label: "First Edition" },
  mixed: { type: "Mixed Source", label: "First Edition + Dragonlance Adventures + Dragolance commentary" },
};

export const relatedTopics = {
  "what-is-dragonlance": [{ label: "The World of Krynn", path: "world-of-krynn" }, { label: "Races of Krynn", path: "races" }],
  "world-of-krynn": [{ label: "What is Dragolance?", path: "what-is-dragonlance" }, { label: "Gods", path: "gods" }],
  "races/kender": [{ label: "First Edition Thief", href: "/1e/classes/thief/" }, { label: "Fearlessness" }, { label: "Taunt" }],
  "races/gnomes": [{ label: "Tinkers", path: "classes/tinkers" }, { label: "First Edition Gnome", href: "/1e/races/gnome/" }],
  "classes/knights-of-solamnia": [{ label: "First Edition Fighter", href: "/1e/classes/fighter/" }, { label: "Knight of the Crown", path: "classes/knights-of-solamnia/crown" }, { label: "Knight of the Sword", path: "classes/knights-of-solamnia/sword" }, { label: "Knight of the Rose", path: "classes/knights-of-solamnia/rose" }],
  "classes/wizards-of-high-sorcery": [{ label: "First Edition Magic-User", href: "/1e/classes/magic-user/" }, { label: "First Edition Illusionist", href: "/1e/classes/illusionist/" }, { label: "Solinari", path: "gods/good/solinari" }, { label: "Lunitari", path: "gods/neutrality/lunitari" }, { label: "Nuitari", path: "gods/evil/nuitari" }],
  "classes/tinkers": [{ label: "Gnomes", path: "races/gnomes" }, { label: "Device Creation", path: "classes/tinkers/device-creation" }],
  gods: [{ label: "Holy Orders", path: "gods/holy-orders" }, { label: "First Edition Cleric", href: "/1e/classes/cleric/" }],
  "gods/holy-orders": [{ label: "First Edition Cleric", href: "/1e/classes/cleric/" }, { label: "Clerics of Good", path: "gods/clerics-good" }, { label: "Clerics of Neutrality", path: "gods/clerics-neutrality" }, { label: "Clerics of Evil", path: "gods/clerics-evil" }],
};

export const classReference = {
  classes: {
    title: "Classes",
    badge: sourceBadges.mixed,
    sourceStatus: "Dragolance uses First Edition as the foundation. This reference only presents the campaign-setting class structures that Dragonlance Adventures adds or substantially changes.",
    sections: [
      "Most standard classes remain in the First Edition Reference.",
      "Knights of Solamnia extend martial First Edition foundations, especially Fighter, Paladin, and Ranger context.",
      "Wizards of High Sorcery extend First Edition Magic-User and Illusionist foundations.",
      "Holy Orders extend First Edition Cleric foundations and are referenced under Gods.",
      "Tinkers are a unique gnome class and require DM approval.",
    ],
    links: [
      { label: "First Edition Fighter", href: "/1e/classes/fighter/" },
      { label: "First Edition Magic-User", href: "/1e/classes/magic-user/" },
      { label: "First Edition Illusionist", href: "/1e/classes/illusionist/" },
      { label: "First Edition Cleric", href: "/1e/classes/cleric/" },
      { label: "First Edition Ranger", href: "/1e/classes/ranger/" },
      { label: "First Edition Paladin", href: "/1e/classes/paladin/" },
      { label: "First Edition Thief", href: "/1e/classes/thief/" },
      { label: "First Edition Druid", href: "/1e/classes/druid/" },
    ],
  },
  "classes/knights-of-solamnia": {
    title: "Knights of Solamnia",
    badge: sourceBadges.mixed,
    sourceStatus: "Player-facing Solamnic rules use Dragonlance Adventures as the setting authority and First Edition Fighter as the martial rules foundation.",
    sections: [
      "The Knights began as an honor-bound martial order and remain organized around three Orders: Crown, Sword, and Rose.",
      "The Oath is the heart of the Knighthood; the Measure is the legal and cultural body that defines knightly conduct.",
      "Advancement is not merely XP. Sponsorship, conduct, councils, quests, and order requirements matter.",
      "Crown Knights emphasize loyalty and obedience. Sword Knights unite knightly service with limited divine spellcasting. Rose Knights represent the highest ideals and responsibilities of the order.",
    ],
    links: [{ label: "First Edition Fighter", href: "/1e/classes/fighter/" }, { label: "Paladine", path: "gods/good/paladine" }, { label: "Kiri-Jolith", path: "gods/good/kiri-jolith" }, { label: "Habbakuk", path: "gods/good/habbakuk" }],
    progressions: [crownProgression, swordProgression, roseProgression],
    spellTables: [swordKnightSpellSlots],
  },
  "classes/knights-of-solamnia/overview": null,
  "classes/knights-of-solamnia/organization": {
    title: "Organization",
    badge: sourceBadges.setting,
    sourceStatus: "The Knighthood is organized into the Orders of the Crown, Sword, and Rose, each with distinct responsibilities and standards of advancement.",
    sections: ["Candidates enter through sponsorship and scrutiny.", "Each higher order requires standing in the prior order.", "High Councils and commanders uphold the Oath, the Measure, and service to realms on the List of Loyalty."],
  },
  "classes/knights-of-solamnia/oath-and-measure": {
    title: "Oath and Measure",
    badge: sourceBadges.setting,
    sourceStatus: "The Oath and Measure are source-defined roleplaying and advancement obligations.",
    sections: ["The Oath binds honor to life itself.", "The Measure is a vast body of law and custom.", "Campaign play should treat the spirit of honor as more important than merely reciting rules."],
  },
  "classes/knights-of-solamnia/crown": {
    title: "Knights of the Crown",
    badge: sourceBadges.mixed,
    sourceStatus: "Crown progression is rendered from the canonical Crown Knight progression record.",
    sections: ["Entry requires sponsorship, scrutiny, and acceptance into knightly service.", "Crown Knights are sworn to protect, serve, and aid loyal realms without abandoning the Oath or Measure.", "Weapon specialization, proficiency growth, wealth obligations, and service obligations remain tied to the source and table adjudication."],
    links: [{ label: "First Edition Fighter", href: "/1e/classes/fighter/" }],
    progressions: [crownProgression],
  },
  "classes/knights-of-solamnia/sword": {
    title: "Knights of the Sword",
    badge: sourceBadges.mixed,
    sourceStatus: "Sword progression and spell slots are rendered from canonical records; the spell-slot table retains its precise OCR review flag.",
    sections: ["A Sword Knight must first be proven as a Crown Knight and petition for entry.", "The order adds divine responsibilities, weekly fasting and meditation, and spell access associated with Kiri-Jolith.", "Sword Knights retain spells until expended after the appointed meditation day."],
    links: [{ label: "Kiri-Jolith", path: "gods/good/kiri-jolith" }, { label: "First Edition Cleric", href: "/1e/classes/cleric/" }],
    progressions: [swordProgression],
    spellTables: [swordKnightSpellSlots],
  },
  "classes/knights-of-solamnia/rose": {
    title: "Knights of the Rose",
    badge: sourceBadges.mixed,
    sourceStatus: "Rose progression is rendered from the canonical Rose Knight progression record.",
    sections: ["A Rose Knight must have standing in the lower orders and satisfy petition, council, and quest requirements.", "The historical royal-blood rule is source-era context and should be handled as campaign interpretation.", "Rose Knights carry the highest responsibilities of justice, wisdom, and leadership within the Knighthood."],
    progressions: [roseProgression],
  },
  "classes/knights-of-solamnia/battle": {
    title: "Knights in Battle",
    badge: sourceBadges.setting,
    sourceStatus: "Battle organization is presented as player-facing context for how knightly armies and brigades are arranged.",
    sections: ["Knightly armies are organized through the three orders.", "Command and battlefield conduct remain governed by the Measure.", "This page avoids DM-only encounter or campaign-war material."],
  },
  "classes/knights-of-solamnia/council": {
    title: "Knightly Council",
    badge: sourceBadges.setting,
    sourceStatus: "Council procedures are presented as player-facing advancement and governance context.",
    sections: ["Councils judge petitions, honor questions, and transitions between orders.", "Council decisions are part of advancement, not merely story decoration.", "Exact adjudication remains with the DM when the source requires a quest or character judgment."],
  },
  "classes/wizards-of-high-sorcery": {
    title: "Wizards of High Sorcery",
    badge: sourceBadges.mixed,
    sourceStatus: "High Sorcery uses canonical student and robe progression records. High-level spell slot rows retain source-verification flags where table extraction is uncertain.",
    sections: ["The Orders are united by loyalty to magic, even when their ethics diverge.", "Solinari, Lunitari, and Nuitari govern the three robes and the rhythm of magical power.", "The Test is the gate between student wizardry and full membership.", "Renegades are hunted, pressured to join, or destroyed."],
    links: [{ label: "First Edition Magic-User", href: "/1e/classes/magic-user/" }, { label: "First Edition Illusionist", href: "/1e/classes/illusionist/" }],
    progressions: [studentProgression, whiteRobesProgression, redRobesProgression, blackRobesProgression],
    spellTables: [whiteRobesSpellSlots, redRobesSpellSlots, blackRobesSpellSlots],
    moons: [solinariMoon, lunitariMoon, nuitariMoon],
    moonNote: "Our campaign calendar automatically tracks Solinari, Lunitari, and Nuitari. The static moon tracking chart is intentionally replaced by automated campaign moon phase state.",
  },
  "classes/wizards-of-high-sorcery/overview": null,
  "classes/wizards-of-high-sorcery/moons": {
    title: "Moons of Magic",
    badge: sourceBadges.mixed,
    sourceStatus: "Moon relationships are canonical. Cycle and phase mechanics remain review-flagged in the moon records until rendered table verification is available.",
    sections: ["Solinari governs the White Robes.", "Lunitari governs the Red Robes.", "Nuitari governs the Black Robes.", "Moon phases and alignments are automatically tracked by the Dragolance campaign system."],
    moons: [solinariMoon, lunitariMoon, nuitariMoon],
  },
  "classes/wizards-of-high-sorcery/conclave": { title: "Conclave", badge: sourceBadges.setting, sourceStatus: "The Conclave represents all three Orders and governs matters that affect wizardry as a whole.", sections: ["The Conclave meets according to the moons.", "Each order is represented and led through its own internal process.", "The Night of the Eye is a special convergence of all three Orders."] },
  "classes/wizards-of-high-sorcery/towers": { title: "Towers of High Sorcery", badge: sourceBadges.setting, sourceStatus: "This page presents player-facing tower context only; maps and DM-only tower material are excluded.", sections: ["The Towers are neutral ground for wizards.", "Wayreth is the active center most relevant to player wizards.", "Palanthus and the lost towers remain historical context, not reproduced encounter material."] },
  "classes/wizards-of-high-sorcery/early-life": { title: "Early Life of a Wizard", badge: sourceBadges.setting, sourceStatus: "Student wizard life is tied to approved instruction and the Test gate.", sections: ["Young magic-users train under approved masters.", "Before the Test, the Orders do not sharply divide magic-users and illusionists in the same way many AD&D campaigns do.", "At 3rd level, the Test and renegade status become urgent."] },
  "classes/wizards-of-high-sorcery/test": { title: "Test of High Sorcery", badge: sourceBadges.setting, sourceStatus: "The Test is represented by canonical ability and progression references; exact test scenarios are not reproduced.", sections: ["A wizard who advances without joining risks becoming a renegade.", "The Test is dangerous and transformative.", "Passing the Test opens the path to one of the robe orders."] },
  "classes/wizards-of-high-sorcery/white-robes": { title: "White Robes", badge: sourceBadges.mixed, sourceStatus: "White Robe progression is canonical; spell slots retain table-review flags where present.", sections: ["White Robes follow the ways of Good.", "A White Robe wizard must keep the goals of Good in mind or risk losing order benefits."], progressions: [whiteRobesProgression], spellTables: [whiteRobesSpellSlots], links: [{ label: "Solinari", path: "gods/good/solinari" }] },
  "classes/wizards-of-high-sorcery/red-robes": { title: "Red Robes", badge: sourceBadges.mixed, sourceStatus: "Red Robe progression is canonical; spell slots retain table-review flags where present.", sections: ["Red Robes serve Neutrality and the Balance.", "Their moon is Lunitari."], progressions: [redRobesProgression], spellTables: [redRobesSpellSlots], links: [{ label: "Lunitari", path: "gods/neutrality/lunitari" }] },
  "classes/wizards-of-high-sorcery/black-robes": { title: "Black Robes", badge: sourceBadges.mixed, sourceStatus: "Black Robe progression is canonical; spell slots retain table-review flags where present.", sections: ["Black Robes follow the ways of Evil.", "Their moon is Nuitari.", "Only one Black Robe wizard can hold the Master role at a time according to the source progression note."], progressions: [blackRobesProgression], spellTables: [blackRobesSpellSlots], links: [{ label: "Nuitari", path: "gods/evil/nuitari" }] },
  "classes/wizards-of-high-sorcery/renegades": { title: "Renegade Wizards", badge: sourceBadges.setting, sourceStatus: "Renegade status is represented by canonical ability records and player-facing consequences.", sections: ["A renegade uses arcane power outside the Orders' authority.", "The Orders seek to bring renegades into the Orders or end the threat they represent.", "Renegade play requires DM attention."] },
  "classes/wizards-of-high-sorcery/magic-on-krynn": { title: "Magic on Krynn", badge: sourceBadges.setting, sourceStatus: "This page summarizes player-facing magic assumptions and excludes spell catalog reproduction.", sections: ["Magic is rare, feared, and bound to the gods of magic.", "Illusion interacts with disbelief and concentration in Krynn-specific ways.", "Detailed spell lists remain in First Edition and canonical spell-slot records."] },
  "classes/tinkers": {
    title: "Tinkers",
    badge: sourceBadges.setting,
    notice: "DM Approval Required",
    sourceStatus: "Reference Rules Complete; Runtime Automation Not Yet Implemented. Device subsystem details are presented as source reference, not automated builder logic.",
    sections: ["Tinkers are gnomes whose culture and profession center on invention, guilds, committees, and Lifequests.", "Gnomes receive many nonweapon proficiencies but suffer a penalty when using them.", "Device creation uses complexity, size, materials, construction time, and operation checks.", "The Hall of Gnome Inventions is not reproduced as a catalog."],
    links: [{ label: "Gnome Race Reference", href: "/portal/dragonlance/races/gnomes" }],
  },
  "classes/tinkers/overview": null,
  "classes/tinkers/class": { title: "Tinker Class", badge: sourceBadges.setting, notice: "DM Approval Required", sourceStatus: "Tinker class runtime automation is not implemented.", sections: ["The Tinker is a gnome profession/class path distinct from the gnome race page.", "Guild membership and Lifequest identity shape play.", "Proficiency and progression details require rendered table verification before builder automation."] },
  "classes/tinkers/device-creation": { title: "Device Creation", badge: sourceBadges.setting, notice: "DM Approval Required", sourceStatus: "Reference Rules Complete; Runtime Automation Not Yet Implemented.", sections: ["Device design begins from intended effect.", "Complexity, size, components, and final modifiers determine construction burden.", "Construction time depends on size multiplied by complexity.", "Gnomish devices are unique rather than mass-produced."] },
  "classes/tinkers/device-operation": { title: "Device Operation", badge: sourceBadges.setting, notice: "DM Approval Required", sourceStatus: "Reference Rules Complete; Runtime Automation Not Yet Implemented.", sections: ["Operation checks determine whether a device works as intended.", "Unpredictable results and failure are core to the class experience.", "Repair and adjustment are table-facing procedures, not automated in this unit."] },
};

classReference["classes/knights-of-solamnia/overview"] = classReference["classes/knights-of-solamnia"];
classReference["classes/wizards-of-high-sorcery/overview"] = classReference["classes/wizards-of-high-sorcery"];
classReference["classes/tinkers/overview"] = classReference["classes/tinkers"];

const verifiedDeities = {
  Paladine: paladine,
  Majere: majere,
  Mishakal: mishakal,
  "Kiri-Jolith": kiriJolith,
  Habbakuk: habbakuk,
  Branchala: branchala,
  Solinari: solinari,
  Gilean: gilean,
  Sirrion: sirrion,
  Reorx: reorx,
  Chislev: chislev,
  Zivilyn: zivilyn,
  Shinare: shinare,
  Lunitari: lunitari,
  Takhisis: takhisis,
  Sargonnas: sargonnas,
  Morgion: morgion,
  Chemosh: chemosh,
  Zeboim: zeboim,
  Hiddukel: hiddukel,
  Nuitari: nuitari,
};

export const deityGroups = {
  good: ["Paladine", "Majere", "Kiri-Jolith", "Mishakal", "Habbakuk", "Branchala", "Solinari"],
  neutrality: ["Gilean", "Sirrion", "Reorx", "Chislev", "Zivilyn", "Shinare", "Lunitari"],
  evil: ["Takhisis", "Sargonnas", "Morgion", "Chemosh", "Zeboim", "Hiddukel", "Nuitari"],
};

export const godsReference = {
  gods: {
    title: "Gods",
    badge: sourceBadges.mixed,
    sourceStatus: "The Gods section presents player-facing faith, Holy Orders, and deity reference material. Full sphere/special/additional spell data remains review-flagged until rendered source tables are verified.",
    sections: ["Krynn's gods are organized around Good, Neutrality, and Evil.", "The Holy Orders extend First Edition cleric rules through deity selection, spheres, obligations, and alignment relationships.", "The gods of magic also govern the Orders of High Sorcery."],
    links: [{ label: "First Edition Cleric", href: "/1e/classes/cleric/" }, { label: "Holy Orders of the Stars", path: "gods/holy-orders" }],
  },
  "gods/overview": null,
  "gods/holy-orders": {
    title: "Holy Orders of the Stars",
    badge: sourceBadges.mixed,
    sourceStatus: "Holy Orders records resolve canonically. Deity-specific spheres and granted powers remain flagged until Dragonlance Adventures pages 120-125 are table-verified.",
    sections: ["A Krynn cleric serves one deity and receives divine power through that relationship.", "Alignment, spheres, obligations, fall, atonement, and conversion from heathen cleric are part of the source framework.", "This reference exposes accurate canonical records but does not implement new cleric runtime behavior."],
    progressions: [goodClericProgression, neutralClericProgression, evilClericProgression],
    spellTables: [goodClericSpellSlots, neutralClericSpellSlots, evilClericSpellSlots],
    records: [holyOrders],
    links: [{ label: "First Edition Cleric", href: "/1e/classes/cleric/" }],
  },
  "gods/clerics-good": { title: "Clerics of Good", badge: sourceBadges.mixed, sourceStatus: "Good cleric progression and base spell slots render from canonical records.", sections: ["Clerics of Good serve deities such as Paladine, Majere, Kiri-Jolith, Mishakal, Habbakuk, Branchala, and Solinari.", "Their service emphasizes justice, healing, courage, hope, and protection."], progressions: [goodClericProgression], spellTables: [goodClericSpellSlots] },
  "gods/clerics-neutrality": { title: "Clerics of Neutrality", badge: sourceBadges.mixed, sourceStatus: "Neutral cleric progression and base spell slots render from canonical records.", sections: ["Clerics of Neutrality preserve balance, knowledge, nature, craft, time, and mortal freedom.", "Neutrality is an active divine philosophy rather than indifference."], progressions: [neutralClericProgression], spellTables: [neutralClericSpellSlots] },
  "gods/clerics-evil": { title: "Clerics of Evil", badge: sourceBadges.mixed, sourceStatus: "Evil cleric progression and base spell slots render from canonical records.", sections: ["Clerics of Evil serve gods of domination, vengeance, disease, undeath, storm, corruption, and hidden dealings.", "Player access remains subject to campaign approval and table expectations."], progressions: [evilClericProgression], spellTables: [evilClericSpellSlots] },
};

godsReference["gods/overview"] = godsReference.gods;

export function deityRecord(name) {
  return verifiedDeities[name] || {
    name,
    alignment: "Source verification required",
    domains_or_spheres: [],
    allowed_cleric_alignments: [],
    holy_symbol: "Source verification required",
    description: "This deity page is reserved for the Dragonlance Adventures deity content pass. Mechanics will not be guessed.",
    review: { status: "source_pending" },
  };
}

export function flattenDragonlanceIa(items = dragonlanceIa) {
  return items.flatMap((item) => [item, ...flattenDragonlanceIa(item.children || [])]);
}

export const dragonlanceFlatPages = flattenDragonlanceIa();

export function dragonlancePageFor(path = "") {
  const normalized = path.replace(/^\/+|\/+$/g, "") || "";
  if (!normalized) return { label: "Dragolance Reference", path: "" };
  return dragonlanceFlatPages.find((page) => page.path === normalized) || null;
}
