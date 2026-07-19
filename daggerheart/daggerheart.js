(() => {
  const keys = {
    token: "dh.authToken",
    user: "dh.authUser",
    characters: "dh.characters",
    activeId: "dh.activeId",
  };

  const classes = {
    Bard: { domains: ["Grace", "Codex"], subclasses: ["Troubadour", "Wordsmith"], feature: "Rally", evasion: 10, hp: 5, source: "SRD classes" },
    Druid: { domains: ["Sage", "Arcana"], subclasses: ["Warden of the Elements", "Warden of Renewal"], feature: "Beastform", evasion: 10, hp: 6, source: "SRD classes" },
    Guardian: { domains: ["Valor", "Blade"], subclasses: ["Stalwart", "Vengeance"], feature: "Unstoppable", evasion: 9, hp: 7 },
    Ranger: { domains: ["Bone", "Sage"], subclasses: ["Beastbound", "Wayfinder"], feature: "Ranger's Focus", evasion: 11, hp: 6 },
    Rogue: { domains: ["Midnight", "Grace"], subclasses: ["Nightwalker", "Syndicate"], feature: "Cloaked", evasion: 12, hp: 5 },
    Seraph: { domains: ["Splendor", "Valor"], subclasses: ["Divine Wielder", "Winged Sentinel"], feature: "Prayer Dice", evasion: 9, hp: 6 },
    Sorcerer: { domains: ["Arcana", "Midnight"], subclasses: ["Elemental Origin", "Primal Origin"], feature: "Arcane Sense", evasion: 10, hp: 5 },
    Warrior: { domains: ["Blade", "Bone"], subclasses: ["Call of the Brave", "Call of the Slayer"], feature: "Attack of Opportunity", evasion: 11, hp: 6 },
    Wizard: { domains: ["Codex", "Splendor"], subclasses: ["School of Knowledge", "School of War"], feature: "Prestidigitation", evasion: 10, hp: 5 },
  };

  const ancestries = ["Clank", "Drakona", "Dwarf", "Elf", "Faerie", "Faun", "Firbolg", "Fungril", "Galapa", "Giant", "Goblin", "Halfling", "Human", "Katari", "Orc", "Ribbet", "Simiah"];
  const communities = ["Highborne", "Loreborne", "Orderborne", "Ridgeborne", "Seaborne", "Slyborne", "Underborne", "Wanderborne", "Wildborne"];
  const traits = ["Agility", "Strength", "Finesse", "Instinct", "Presence", "Knowledge"];
  const traitValues = ["+2", "+1", "+1", "0", "0", "-1"];
  const steps = ["Identity", "Class", "Heritage", "Traits", "Experiences", "Cards", "Equipment", "Review"];

  let weapons = [
    { name: "Broadsword", category: "primary", tier: 1, trait: "Agility", range: "Melee", damage: "d8 phy", burden: "One-Handed", feature: "Reliable: +1 to attack rolls." },
    { name: "Longsword", category: "primary", tier: 1, trait: "Agility", range: "Melee", damage: "d10+3 phy", burden: "Two-Handed", feature: "" },
    { name: "Battleaxe", category: "primary", tier: 1, trait: "Strength", range: "Melee", damage: "d10+3 phy", burden: "Two-Handed", feature: "" },
    { name: "Greatsword", category: "primary", tier: 1, trait: "Strength", range: "Melee", damage: "d10+3 phy", burden: "Two-Handed", feature: "Massive: -1 to Evasion; on a successful attack, roll an additional damage die and discard the lowest result." },
    { name: "Mace", category: "primary", tier: 1, trait: "Strength", range: "Melee", damage: "d8+1 phy", burden: "One-Handed", feature: "" },
    { name: "Warhammer", category: "primary", tier: 1, trait: "Strength", range: "Melee", damage: "d12+3 phy", burden: "Two-Handed", feature: "Heavy: -1 to Evasion." },
    { name: "Dagger", category: "primary", tier: 1, trait: "Finesse", range: "Melee", damage: "d8+1 phy", burden: "One-Handed", feature: "" },
    { name: "Quarterstaff", category: "primary", tier: 1, trait: "Instinct", range: "Melee", damage: "d10+3 phy", burden: "Two-Handed", feature: "" },
    { name: "Cutlass", category: "primary", tier: 1, trait: "Presence", range: "Melee", damage: "d8+1 phy", burden: "One-Handed", feature: "" },
    { name: "Rapier", category: "primary", tier: 1, trait: "Presence", range: "Melee", damage: "d8 phy", burden: "One-Handed", feature: "Quick: When you make an attack, you can mark a Stress to target another creature within range." },
    { name: "Halberd", category: "primary", tier: 1, trait: "Strength", range: "Very Close", damage: "d10+2 phy", burden: "Two-Handed", feature: "Cumbersome: -1 to Finesse." },
    { name: "Spear", category: "primary", tier: 1, trait: "Finesse", range: "Very Close", damage: "d8+3 phy", burden: "Two-Handed", feature: "" },
    { name: "Shortbow", category: "primary", tier: 1, trait: "Agility", range: "Far", damage: "d6+3 phy", burden: "Two-Handed", feature: "" },
    { name: "Crossbow", category: "primary", tier: 1, trait: "Finesse", range: "Far", damage: "d6+1 phy", burden: "One-Handed", feature: "" },
    { name: "Longbow", category: "primary", tier: 1, trait: "Agility", range: "Very Far", damage: "d8+3 phy", burden: "Two-Handed", feature: "Cumbersome: -1 to Finesse." },
    { name: "Arcane Gauntlets", category: "primary", tier: 1, trait: "Strength", range: "Melee", damage: "d10+3 mag", burden: "Two-Handed", feature: "Requires a Spellcast trait." },
    { name: "Hallowed Axe", category: "primary", tier: 1, trait: "Strength", range: "Melee", damage: "d8+1 mag", burden: "One-Handed", feature: "Requires a Spellcast trait." },
    { name: "Returning Blade", category: "primary", tier: 1, trait: "Finesse", range: "Close", damage: "d8 mag", burden: "One-Handed", feature: "Returning: When thrown within range, it appears in your hand immediately after the attack. Requires a Spellcast trait." },
    { name: "Shortstaff", category: "primary", tier: 1, trait: "Instinct", range: "Close", damage: "d8+1 mag", burden: "One-Handed", feature: "Requires a Spellcast trait." },
    { name: "Wand", category: "primary", tier: 1, trait: "Knowledge", range: "Far", damage: "d6+1 mag", burden: "One-Handed", feature: "Requires a Spellcast trait." },
    { name: "Shortsword", category: "secondary", tier: 1, trait: "Agility", range: "Melee", damage: "d8 phy", burden: "One-Handed", feature: "Paired: +2 to primary weapon damage to targets within Melee range." },
    { name: "Round Shield", category: "secondary", tier: 1, trait: "Strength", range: "Melee", damage: "d4 phy", burden: "One-Handed", feature: "Protective: +1 to Armor Score." },
    { name: "Tower Shield", category: "secondary", tier: 1, trait: "Strength", range: "Melee", damage: "d6 phy", burden: "One-Handed", feature: "Barrier: +2 to Armor Score; -1 to Evasion." },
    { name: "Small Dagger", category: "secondary", tier: 1, trait: "Finesse", range: "Melee", damage: "d8 phy", burden: "One-Handed", feature: "Paired: +2 to primary weapon damage to targets within Melee range." },
    { name: "Whip", category: "secondary", tier: 1, trait: "Presence", range: "Very Close", damage: "d6 phy", burden: "One-Handed", feature: "Startling: Mark a Stress to crack the whip and force all adversaries within Melee range back to Close range." },
    { name: "Grappler", category: "secondary", tier: 1, trait: "Finesse", range: "Close", damage: "d6 phy", burden: "One-Handed", feature: "Hooked: On a successful attack, you can pull the target into Melee range." },
    { name: "Hand Crossbow", category: "secondary", tier: 1, trait: "Finesse", range: "Far", damage: "d6+1 phy", burden: "One-Handed", feature: "" },
  ];
  let armors = [
    { name: "Gambeson Armor", tier: 1, thresholds: "5 / 11", score: 3, feature: "Flexible: +1 to Evasion.", repair: "Ready" },
    { name: "Leather Armor", tier: 1, thresholds: "6 / 13", score: 3, feature: "", repair: "Ready" },
    { name: "Chainmail Armor", tier: 1, thresholds: "7 / 15", score: 4, feature: "Heavy: -1 to Evasion.", repair: "Ready" },
    { name: "Full Plate Armor", tier: 1, thresholds: "8 / 17", score: 4, feature: "Very Heavy: -2 to Evasion; -1 to Agility.", repair: "Ready" },
  ];
  const defaultEquipment = {
    primary: weapons.find((weapon) => weapon.name === "Rapier"),
    secondary: weapons.find((weapon) => weapon.name === "Small Dagger"),
    armor: armors[0],
  };

  let domainCards = {
    Arcana: ["Rune Ward", "Unleash Chaos", "Mystic Armor", "Premonition", "Rift Walker", "Telekinesis", "Arcana-Touched", "Cloaking Blast", "Arcane Reflection", "Confusing Aura", "Earthquake", "Sensory Projection", "Adjust Reality", "Falling Sky"],
    Blade: ["A Soldier's Bond", "Not Good Enough", "Whirlwind", "Frenzy", "Gore and Glory", "Reaper's Strike", "Battle Monster", "Onslaught"],
    Bone: ["Deft Maneuvers", "I See It Coming", "Untouchable", "Ferocity", "Strategic Approach", "Brace", "Tactician", "Boost", "Redirect", "Know Thy Enemy"],
    Codex: ["Book of Ava", "Book of Illiat", "Book of Tyfar", "Book of Sitil", "Book of Vagras", "Book of Korvax", "Book of Norai", "Book of Ronin", "Disintegration Wave", "Book of Yarrow", "Transcendent Union"],
    Grace: ["Deft Deceiver", "Enrapture", "Inspirational Words", "Tell No Lies", "Troublemaker", "Hypnotic Shimmer", "Invisibility"],
    Midnight: ["Pick and Pull", "Rain of Blades", "Uncanny Disguise", "Midnight Spirit", "Shadowbind", "Chokehold", "Veil of Night", "Stealth Expertise", "Glyph of Nightfall", "Hush", "Phantom Retreat", "Dark Whispers"],
    Sage: ["Gifted Tracker", "Nature's Tongue", "Vicious Entangle", "Conjure Swarm", "Natural Familiar", "Corrosive Projectile", "Towering Stalk", "Death Grip", "Healing Field", "Thorn Skin", "Tempest"],
    Splendor: ["Bolt Beacon", "Mending Touch", "Reassurance", "Final Words", "Healing Hands", "Second Wind", "Voice of Reason", "Divination", "Life Ward", "Shape Material"],
    Valor: ["Bare Bones", "Forceful Push", "I Am Your Shield", "Body Basher", "Bold Presence", "Critical Inspiration", "Lean on Me", "Goad Them On", "Support Tank", "Armorer", "Rousing Strike", "Inevitable", "Rise Up", "Shrug It Off", "Valor-Touched", "Full Surge", "Ground Pound"],
  };

  let cardNotes = {
    "Book of Ava": "Power Push knocks a Melee target back to Far range and deals d10+2 magic damage using Proficiency. Tava's Armor can add +1 Armor Score. Ice Spike creates a Far-range spike and can deal d6 physical damage using Proficiency.",
    "Book of Illiat": "Slumber can put a Very Close target Asleep. Arcane Barrage spends Hope for d6 magic projectiles. Telepathy opens mental communication with one visible target.",
    "Book of Tyfar": "Wild Flame targets up to three Melee adversaries for 2d6 magic damage and Stress. Magic Hand creates a hand within Far range. Mysterious Mist creates obscuring fog.",
    "Deft Deceiver": "Spend a Hope to gain advantage on a roll to deceive or trick someone into believing a lie.",
    "Enrapture": "Make a Spellcast Roll against a Close target. On success, they are temporarily Enraptured and focused on you.",
    "Inspirational Words": "After a long rest, place tokens equal to Presence. Spend a token when speaking with an ally to clear Stress, clear a Hit Point, or grant Hope.",
    "Pick and Pull": "Gain advantage on action rolls to pick nonmagical locks, disarm nonmagical traps, or steal items from a target.",
    "Rain of Blades": "Spend a Hope to make a Spellcast Roll against all targets within Very Close range, dealing d8+2 magic damage using Proficiency. Vulnerable targets take +1d8.",
    "Uncanny Disguise": "Mark a Stress after a few minutes of preparation to disguise yourself as a humanoid you can picture clearly.",
    "Gifted Tracker": "Spend Hope while tracking to ask GM questions about direction, timing, activity, or numbers. Gain +1 Evasion against creatures tracked this way.",
    "Nature's Tongue": "Speak with plants and animals. Make an Instinct Roll (12) to get what they know; before a Spellcast Roll in nature, spend Hope for +2.",
    "Vicious Entangle": "Make a Spellcast Roll against a Far target. On success, deal 1d8+1 physical damage and temporarily Restrain them.",
    "Bolt Beacon": "Make a Spellcast Roll against a Far target. On success, spend Hope to deal d8+2 magic damage using Proficiency; target becomes temporarily Vulnerable and glows.",
    "Mending Touch": "Spend 2 Hope after a few minutes of focus to clear a Hit Point or Stress on a creature. Once per long rest, deeper connection can clear 2.",
    "Reassurance": "Once per rest, after an ally rolls but before consequences, offer support and let them reroll their dice.",
    "Bare Bones": "When not wearing armor, base Armor Score is 3 + Strength and use the listed Valor thresholds by tier.",
    "Forceful Push": "Make a primary weapon attack in Melee. On success, deal damage and knock the target back to Close range; with Hope, add d6 damage.",
    "I Am Your Shield": "When an ally within Very Close range would take damage, mark Stress to become the target instead and mark Armor Slots as needed.",
    "Deft Maneuvers": "Once per rest, mark Stress to sprint anywhere within Far range without an Agility Roll. If you end in Melee and attack immediately, gain +1 to the attack roll.",
    "I See It Coming": "When targeted by an attack from beyond Melee, mark Stress to roll d4 and add the result to Evasion against that attack.",
    "Untouchable": "Gain a bonus to Evasion equal to half your Agility.",
  };

  let cardLevels = {
    "Rune Ward": 1, "Unleash Chaos": 1, "Mystic Armor": 1, "Premonition": 5, "Rift Walker": 6, "Telekinesis": 6, "Arcana-Touched": 7, "Cloaking Blast": 7, "Arcane Reflection": 8, "Confusing Aura": 8, "Earthquake": 9, "Sensory Projection": 9, "Adjust Reality": 10, "Falling Sky": 10,
    "A Soldier's Bond": 1, "Not Good Enough": 1, "Whirlwind": 1, "Frenzy": 8, "Gore and Glory": 9, "Reaper's Strike": 9, "Battle Monster": 10, "Onslaught": 10,
    "Deft Maneuvers": 1, "I See It Coming": 1, "Untouchable": 1, "Ferocity": 2, "Strategic Approach": 2, "Brace": 3, "Tactician": 3, "Boost": 4, "Redirect": 4, "Know Thy Enemy": 5,
    "Book of Ava": 1, "Book of Illiat": 1, "Book of Tyfar": 1, "Book of Sitil": 2, "Book of Vagras": 2, "Book of Korvax": 3, "Book of Norai": 3, "Book of Ronin": 9, "Disintegration Wave": 9, "Book of Yarrow": 10, "Transcendent Union": 10,
    "Deft Deceiver": 1, "Enrapture": 1, "Inspirational Words": 1, "Tell No Lies": 2, "Troublemaker": 2, "Hypnotic Shimmer": 3, "Invisibility": 3,
    "Pick and Pull": 1, "Rain of Blades": 1, "Uncanny Disguise": 1, "Midnight Spirit": 2, "Shadowbind": 2, "Chokehold": 3, "Veil of Night": 3, "Stealth Expertise": 4, "Glyph of Nightfall": 4, "Hush": 5, "Phantom Retreat": 5, "Dark Whispers": 6,
    "Gifted Tracker": 1, "Nature's Tongue": 1, "Vicious Entangle": 1, "Conjure Swarm": 2, "Natural Familiar": 2, "Corrosive Projectile": 3, "Towering Stalk": 3, "Death Grip": 4, "Healing Field": 4, "Thorn Skin": 5, "Tempest": 10,
    "Bolt Beacon": 1, "Mending Touch": 1, "Reassurance": 1, "Final Words": 2, "Healing Hands": 2, "Second Wind": 3, "Voice of Reason": 3, "Divination": 4, "Life Ward": 4, "Shape Material": 5,
    "Bare Bones": 1, "Forceful Push": 1, "I Am Your Shield": 1, "Body Basher": 2, "Bold Presence": 2, "Critical Inspiration": 3, "Lean on Me": 3, "Goad Them On": 4, "Support Tank": 4, "Armorer": 5, "Rousing Strike": 5, "Inevitable": 6, "Rise Up": 6, "Shrug It Off": 7, "Valor-Touched": 7, "Full Surge": 8, "Ground Pound": 8,
  };

  let cardMeta = {};
  let classesFull = [];
  let ancestriesFull = [];
  let communitiesFull = [];
  let lootItems = [];
  let consumables = [];
  let adversaries = [];
  let environments = [];

  let rules = [
    ["Character Creation", "SRD pages 3-6", "A guided process for class, subclass, heritage, traits, resources, equipment, experiences, and domain cards."],
    ["Domains", "SRD pages 7 and 119-135", "Domains are card families. Each class begins with access to two domains, and those cards become the tactile bottom-of-sheet snippets."],
    ["Domain Cards", "SRD pages 119-135 plus card PDF", "Cards should be shown as compact table snippets, with title, domain, level, cost, and short function."],
    ["Classes", "SRD pages 8-26", "The nine player classes define role, class feature, starting resources, domain access, and available subclasses."],
    ["Subclasses", "SRD pages 8-26", "Subclasses sit under each class and add Foundation, Specialization, and Mastery features over time."],
    ["Ancestries", "SRD pages 27-31", "Ancestry is one half of Heritage and expresses lineage, body, and inherited traits."],
    ["Communities", "SRD pages 32-34", "Community is the other half of Heritage and represents the culture, environment, or way of life that shaped the character."],
    ["Core Mechanics", "SRD pages 35-43", "Hope and Fear dice, moves, difficulty, advantage/disadvantage, combat flow, stress, damage, conditions, rests, and death."],
    ["Equipment", "SRD pages 44-62", "Player-facing equipment includes weapons, armor, loot, consumables, and gold."],
    ["Weapons", "SRD pages 44-57", "Weapons record trait, range, burden, damage dice, damage type, and features."],
    ["Armor", "SRD pages 58-59", "Armor records base thresholds, score, and features."],
    ["Loot", "SRD pages 60-62", "Loot is player-facing treasure and useful gear, separate from GM-only prep."],
    ["Consumables", "SRD pages 60-62", "Consumables are single-use or limited-use items tracked directly on the sheet."],
    ["Gold", "SRD pages 4-6 and 60-62", "Gold can be handled as a simple compact tracker: handfuls, bags, and chests."],
  ];

  const srdData = window.DAGGERHEART_DATA || {};
  if (Array.isArray(srdData.cards) && srdData.cards.length) {
    domainCards = srdData.domainCards || domainCards;
    cardNotes = Object.fromEntries(srdData.cards.map((card) => [card.name, card.text]));
    cardLevels = Object.fromEntries(srdData.cards.map((card) => [card.name, card.level]));
    cardMeta = Object.fromEntries(srdData.cards.map((card) => [card.name, card]));
  }
  if (Array.isArray(srdData.classesFull)) classesFull = srdData.classesFull;
  if (Array.isArray(srdData.ancestriesFull)) ancestriesFull = srdData.ancestriesFull;
  if (Array.isArray(srdData.communitiesFull)) communitiesFull = srdData.communitiesFull;
  if (Array.isArray(srdData.lootItems)) lootItems = srdData.lootItems;
  if (Array.isArray(srdData.consumables)) consumables = srdData.consumables;
  if (Array.isArray(srdData.adversaries)) adversaries = srdData.adversaries;
  if (Array.isArray(srdData.environments)) environments = srdData.environments;
  if (Array.isArray(srdData.rules) && srdData.rules.length) {
    rules = srdData.rules.map((rule) => [rule.title, rule.source, rule.text]);
  }

  const sidecars = {
    identity: { tab: "Guide", title: "Identity", text: "The character-sheet guide uses this area for name, pronouns, heritage, class, subclass, and level so the table can read the hero at a glance." },
    traits: { tab: "Traits", title: "Traits", text: "Traits are the six modifiers used for action and reaction rolls. During creation, assign +2, +1, +1, 0, 0, and -1 once each." },
    tracks: { tab: "Marks", title: "Marks", text: "Hope, HP, Stress, and Armor are table tracks. Click a box to mark or clear it. A claw slash means the box is spent, marked, or used." },
    equipment: { tab: "Gear", title: "Equipment", text: "Weapons show the roll trait, range, and damage dice. Armor shows thresholds, armor score, and repair state for quick table updates." },
    snippets: { tab: "Features", title: "Features", text: "Class, subclass, ancestry, and community reminders stay collapsed until needed. They are quick sheet references, not full rulebook pages." },
    codex: { tab: "Cards", title: "Cards", text: "Domain cards sit along the bottom like cards at the table. Expand one when it matters, then collapse it back into the row." },
  };

  let sheetMarks = { hp: 0, stress: 0, hope: 2, armor: 0 };
  let builderStep = 0;
  let builderDraft = null;
  let builderMode = "build";
  let activeCampaign = null;
  let availableCharacters = [];
  let availablePlayers = [];
  let tableRecord = null;
  let libraryKind = "";
  let libraryRecords = [];
  let customLibraryRecords = [];
  let currentLibraryView = [];
  let editorKind = "";
  let pickerKind = "adversary";
  let pickerRecords = [];
  let selectedMapTokenId = "";
  let playerCampaign = null;
  let playerTableRecord = null;
  let playerPlacementMode = false;
  let playerTableTimer = null;

  const els = {
    tabs: document.querySelector("[data-dh-tabs]"),
    loginView: document.querySelector('[data-dh-view="login"]'),
    portalView: document.querySelector('[data-dh-view="portal"]'),
    username: document.querySelector("[data-dh-username]"),
    password: document.querySelector("[data-dh-password]"),
    loginButtons: Array.from(document.querySelectorAll("[data-dh-login]")),
    loginError: document.querySelector("[data-dh-login-error]"),
    logout: document.querySelector("[data-dh-logout]"),
    playerName: document.querySelector("[data-dh-player-name]"),
    portalTitle: document.querySelector("[data-dh-portal-title]"),
    brandTitle: document.querySelector("[data-dh-brand-title]"),
    gmDashboard: document.querySelector("[data-dh-gm-dashboard]"),
    campaignCreate: document.querySelector("[data-dh-campaign-create]"),
    campaignList: document.querySelector("[data-dh-campaign-list]"),
    library: document.querySelector("[data-dh-library]"),
    libraryTitle: document.querySelector("[data-dh-library-title]"),
    librarySearch: document.querySelector("[data-dh-library-search]"),
    libraryType: document.querySelector("[data-dh-library-type]"),
    libraryTier: document.querySelector("[data-dh-library-tier]"),
    libraryCount: document.querySelector("[data-dh-library-count]"),
    libraryGrid: document.querySelector("[data-dh-library-grid]"),
    equipmentTabs: document.querySelector("[data-dh-equipment-tabs]"),
    equipmentTabButtons: Array.from(document.querySelectorAll("[data-equipment-type]")),
    createLibrary: document.querySelector("[data-dh-create-library]"),
    libraryDialog: document.querySelector("[data-dh-library-dialog]"),
    libraryForm: document.querySelector("[data-dh-library-form]"),
    editorTitle: document.querySelector("[data-dh-editor-title]"),
    editorFields: document.querySelector("[data-dh-editor-fields]"),
    editorClose: document.querySelector("[data-dh-editor-close]"),
    gmHome: document.querySelector("[data-dh-gm-home]"),
    campaignWorkspace: document.querySelector("[data-dh-campaign-workspace]"),
    campaignTitle: document.querySelector("[data-dh-campaign-title]"),
    campaignPlanner: document.querySelector("[data-dh-campaign-planner]"),
    memberList: document.querySelector("[data-dh-member-list]"),
    assignedList: document.querySelector("[data-dh-assigned-list]"),
    addExistingPlayer: document.querySelector("[data-dh-add-existing-player]"),
    openInvitePlayer: document.querySelector("[data-dh-open-invite-player]"),
    playerDialog: document.querySelector("[data-dh-player-dialog]"),
    createPlayer: document.querySelector("[data-dh-create-player]"),
    playerDialogClose: document.querySelector("[data-dh-player-dialog-close]"),
    campaignNotesForm: document.querySelector("[data-dh-campaign-notes-form]"),
    sessionNoteList: document.querySelector("[data-dh-session-note-list]"),
    characterPopout: document.querySelector("[data-dh-character-popout]"),
    characterPopoutBody: document.querySelector("[data-dh-character-popout-body]"),
    characterPopoutClose: document.querySelector("[data-dh-character-popout-close]"),
    addCharacter: document.querySelector("[data-dh-add-character]"),
    backCampaigns: document.querySelector("[data-dh-back-campaigns]"),
    launchGame: document.querySelector("[data-dh-launch-game]"),
    vtt: document.querySelector("[data-dh-vtt]"),
    vttTitle: document.querySelector("[data-dh-vtt-title]"),
    vttSave: document.querySelector("[data-dh-vtt-save]"),
    backCampaign: document.querySelector("[data-dh-back-campaign]"),
    endSession: document.querySelector("[data-dh-end-session]"),
    sessionNotes: document.querySelector("[data-dh-session-notes]"),
    fearBeads: document.querySelector("[data-dh-fear-beads]"),
    fearMinus: document.querySelector("[data-dh-fear-minus]"),
    fearPlus: document.querySelector("[data-dh-fear-plus]"),
    countdownList: document.querySelector("[data-dh-countdown-list]"),
    addCountdown: document.querySelector("[data-dh-add-countdown]"),
    gridBuilder: document.querySelector("[data-dh-grid-builder]"),
    battleGrid: document.querySelector("[data-dh-battle-grid]"),
    vttAdversaries: document.querySelector("[data-dh-vtt-adversaries]"),
    addAdversary: document.querySelector("[data-dh-add-adversary]"),
    environmentList: document.querySelector("[data-dh-vtt-environment-list]"),
    addEnvironment: document.querySelector("[data-dh-add-environment]"),
    countdownDialog: document.querySelector("[data-dh-countdown-dialog]"),
    countdownForm: document.querySelector("[data-dh-countdown-form]"),
    countdownClose: document.querySelector("[data-dh-countdown-close]"),
    pickerDialog: document.querySelector("[data-dh-picker-dialog]"),
    pickerTitle: document.querySelector("[data-dh-picker-title]"),
    pickerClose: document.querySelector("[data-dh-picker-close]"),
    pickerSearch: document.querySelector("[data-dh-picker-search]"),
    pickerType: document.querySelector("[data-dh-picker-type]"),
    pickerTier: document.querySelector("[data-dh-picker-tier]"),
    pickerResults: document.querySelector("[data-dh-picker-results]"),
    playerTableTitle: document.querySelector("[data-dh-player-table-title]"),
    playerCampaign: document.querySelector("[data-dh-player-campaign]"),
    playerFear: document.querySelector("[data-dh-player-fear]"),
    playerCountdowns: document.querySelector("[data-dh-player-countdowns]"),
    playerGrid: document.querySelector("[data-dh-player-grid]"),
    playerTokenCharacter: document.querySelector("[data-dh-player-token-character]"),
    placePlayerToken: document.querySelector("[data-dh-place-player-token]"),
    playerMapHelp: document.querySelector("[data-dh-player-map-help]"),
    playerSheet: document.querySelector("[data-dh-player-sheet]"),
    panels: Array.from(document.querySelectorAll("[data-dh-panel]")),
    tabButtons: Array.from(document.querySelectorAll("[data-dh-tab]")),
    characterList: document.querySelector("[data-dh-character-list]"),
    builder: document.querySelector("[data-dh-builder]"),
    sheet: document.querySelector("[data-dh-sheet]"),
    saveCharacter: document.querySelector("[data-dh-save-character]"),
    builderKicker: document.querySelector("[data-dh-builder-kicker]"),
    builderTitle: document.querySelector("[data-dh-builder-title]"),
    startBuilder: document.querySelector("[data-dh-start-builder]"),
    ruleButtons: document.querySelector("[data-dh-rule-buttons]"),
    ruleReader: document.querySelector("[data-dh-rule-reader]"),
    toast: document.querySelector("[data-dh-toast]"),
    tooltip: document.querySelector("[data-dh-tooltip]"),
  };

  const readJson = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const authUser = () => readJson(keys.user, null);
  const api = async (path, options = {}) => {
    const token = localStorage.getItem(keys.token);
    const response = await fetch(`/api${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof payload.detail === "string" ? payload.detail : "Request failed.");
    return payload;
  };
  const characters = () => readJson(keys.characters, []);
  const saveCharacters = (records) => writeJson(keys.characters, records);
  const optionList = (items, selected) => items.map((item) => `<option ${item === selected ? "selected" : ""}>${item}</option>`).join("");

  const showToast = (text) => {
    els.toast.textContent = text;
    els.toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => { els.toast.hidden = true; }, 2400);
  };

  const rollDie = (sides) => Math.floor(Math.random() * sides) + 1;
  const recordRoll = (roller, html, historyText) => {
    roller.querySelector("[data-dh-roll-result]").innerHTML = html;
    const history = roller.querySelector("[data-dh-roll-history]");
    const entries = [historyText, ...Array.from(history.querySelectorAll("span")).map((entry) => entry.textContent)].slice(0, 5);
    history.innerHTML = entries.map((entry) => `<span>${escapeHtml(entry)}</span>`).join("");
  };
  const bindDiceRollers = () => document.querySelectorAll("[data-dh-dice-roller]").forEach((roller) => roller.addEventListener("click", (event) => {
    const dieButton = event.target.closest("[data-dh-die]");
    const dualityButton = event.target.closest("[data-dh-duality]");
    const gmRollButton = event.target.closest("[data-dh-gm-roll]");
    const modStep = event.target.closest("[data-dh-mod-step]");
    if (modStep) { const input = roller.querySelector("[data-dh-dice-mod]"); input.value = Math.max(-99, Math.min(99, (Number(input.value) || 0) + Number(modStep.dataset.dhModStep))); return; }
    if (!dieButton && !dualityButton && !gmRollButton) return;
    const modifier = Math.max(-99, Math.min(99, Number(roller.querySelector("[data-dh-dice-mod]").value) || 0));
    const mode = roller.querySelector("[data-dh-roll-mode]").value;
    if (dualityButton) {
      const hope = rollDie(12); const fear = rollDie(12); const extra = mode === "normal" ? 0 : rollDie(6); const adjustedExtra = mode === "disadvantage" ? -extra : extra; const total = hope + fear + modifier + adjustedExtra;
      const outcome = hope === fear ? "Critical Success" : hope > fear ? "with Hope" : "with Fear";
      const extraText = extra ? `${mode === "advantage" ? "+" : "−"}${extra} ${mode} d6` : "";
      const extraBreakdown = extra ? `${mode === "advantage" ? "+" : "−"} ${extra} ${mode} d6` : "";
      const modifierBreakdown = modifier ? `${modifier > 0 ? "+" : "−"} ${Math.abs(modifier)} mod` : "";
      recordRoll(roller, `<div class="dh-duality-result"><span class="dh-hope-die">Hope <strong>${hope}</strong></span><span class="dh-fear-die">Fear <strong>${fear}</strong></span>${extra ? `<i>${escapeHtml(extraText)}</i>` : ""}<b>${total} ${outcome}</b></div>`, `Duality: ${hope} Hope + ${fear} Fear ${extraBreakdown} ${modifierBreakdown} = ${total} ${outcome}`);
      return;
    }
    if (gmRollButton) {
      const rolls = mode === "normal" ? [rollDie(20)] : [rollDie(20), rollDie(20)]; const kept = mode === "advantage" ? Math.max(...rolls) : mode === "disadvantage" ? Math.min(...rolls) : rolls[0]; const total = kept + modifier;
      recordRoll(roller, `<div class="dh-gm-d20-result"><span>${kept}</span><strong>${total}</strong><small>${mode}${rolls.length > 1 ? ` [${rolls.join(", ")}]` : ""}${modifier ? ` ${modifier > 0 ? "+" : ""}${modifier}` : ""}</small></div>`, `GM d20 ${mode}: [${rolls.join(", ")}] ${modifier ? `${modifier > 0 ? "+" : ""}${modifier}` : ""} = ${total}`);
      return;
    }
    const sides = Number(dieButton.dataset.dhDie); const count = Math.max(1, Math.min(20, Number(roller.querySelector("[data-dh-dice-count]").value) || 1));
    const rolls = Array.from({ length: count }, () => rollDie(sides)); const total = rolls.reduce((sum, value) => sum + value, 0) + modifier;
    recordRoll(roller, `<div><strong>${total}</strong><span>${count}d${sides}${modifier ? ` ${modifier > 0 ? "+" : ""}${modifier}` : ""}</span><small>[${rolls.join(", ")}]</small></div>`, `${count}d${sides}${modifier ? `${modifier > 0 ? "+" : ""}${modifier}` : ""}: [${rolls.join(", ")}] = ${total}`);
  }));

  const newDraft = () => ({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: "Maris",
    pronouns: "",
    className: "Bard",
    displayClassName: "",
    subclass: "Troubadour",
    displaySubclass: "",
    ancestry: "Clank",
    displayAncestry: "",
    community: "Highborne",
    displayCommunity: "",
    traits: Object.fromEntries(traits.map((trait, index) => [trait, traitValues[index]])),
    experiences: ["Silver-Tongued Performer", "Read the Room"],
    level: 1,
    selectedCards: ["Inspirational Words", "Book of Ava"],
    equipment: { ...defaultEquipment, primary: { ...defaultEquipment.primary }, secondary: { ...defaultEquipment.secondary }, armor: { ...defaultEquipment.armor } },
    gold: { handfuls: 1, bags: 0, chests: 0 },
    inventory: [
      { id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-supplies`, kind: "Loot", name: "Adventuring Supplies", quantity: 1, description: "General travel gear and table-facing supplies.", source: "Starter" },
    ],
    marks: { hp: 0, stress: 0, hope: 2, armor: 0 },
  });

  const hydrateDraft = (character = {}) => {
    const base = newDraft();
    const className = classes[character.className] ? character.className : base.className;
    const info = classes[className];
    const equipment = character.equipment || {};
    const catalogWeapon = (item, fallback) => weapons.find((weapon) => weapon.name === item?.name) || fallback;
    const catalogArmor = (item, fallback) => armors.find((armor) => armor.name === item?.name) || fallback;
    const legalCards = Object.values(domainCards).flat().filter((name) => (cardLevels[name] || 1) <= (character.level || base.level));
    const selectedCards = (character.selectedCards || []).filter((name) => legalCards.includes(name));
    return {
      ...base,
      ...character,
      className,
      subclass: info.subclasses.includes(character.subclass) ? character.subclass : info.subclasses[0],
      ancestry: ancestries.includes(character.ancestry) ? character.ancestry : base.ancestry,
      community: communities.includes(character.community) ? character.community : base.community,
      traits: { ...base.traits, ...(character.traits || {}) },
      experiences: character.experiences?.length ? character.experiences : base.experiences,
      selectedCards: selectedCards.length ? selectedCards : legalCards.slice(0, 2),
      equipment: {
        primary: catalogWeapon(equipment.primary, base.equipment.primary),
        secondary: catalogWeapon(equipment.secondary, base.equipment.secondary),
        armor: catalogArmor(equipment.armor, base.equipment.armor),
      },
      gold: { ...base.gold, ...(character.gold || {}) },
      inventory: (character.inventory?.length ? character.inventory : base.inventory).map(normalizeInventoryItem),
      marks: { ...base.marks, ...(character.marks || {}) },
    };
  };

  const normalizeCharacter = (draft) => {
    const info = classes[draft.className];
    return {
      ...draft,
      subclass: info.subclasses.includes(draft.subclass) ? draft.subclass : info.subclasses[0],
      domains: info.domains,
      feature: info.feature,
      evasion: info.evasion,
      hp: info.hp,
      stress: 6,
      hope: 6,
      armorScore: draft.equipment.armor.score,
      primaryWeapon: draft.equipment.primary.name,
      armor: draft.equipment.armor.name,
      updatedAt: Date.now(),
    };
  };

  const renderCampaigns = async () => {
    try {
      const campaigns = await api("/campaigns");
      els.campaignList.innerHTML = campaigns.length ? campaigns.map((campaign) => `
        <article class="dh-character-card">
          <div><h3>${escapeHtml(campaign.name)}</h3><p>${campaign.status} · Table state saves automatically.</p></div>
          <div class="dh-card-actions"><button type="button" data-dh-open-campaign="${campaign.id}">Open Campaign</button></div>
        </article>
      `).join("") : `<article class="dh-empty"><h3>No campaigns yet.</h3><p>Create the first campaign to prepare a persistent table.</p></article>`;
      els.campaignList.querySelectorAll("[data-dh-open-campaign]").forEach((button) => button.addEventListener("click", () => openCampaign(Number(button.dataset.dhOpenCampaign))));
    } catch (error) {
      els.campaignList.innerHTML = `<article class="dh-empty"><h3>Campaigns unavailable.</h3><p>${escapeHtml(error.message)}</p></article>`;
    }
  };

  const libraryLabels = { adversary: "Adversaries", environment: "Environments", equipment: "Equipment", consumable: "Consumables" };
  const editorFieldMap = {
    adversary: [["tier", "Tier", "number"], ["type", "Type", "text"], ["difficulty", "Difficulty", "number"], ["thresholds", "Thresholds", "text"], ["hp", "Hit Points", "number"], ["stress", "Stress", "number"], ["attackModifier", "Attack Modifier", "text"], ["attackName", "Attack Name", "text"], ["range", "Range", "text"], ["damage", "Damage", "text"], ["motives", "Motives & Tactics", "text"]],
    environment: [["tier", "Tier", "number"], ["type", "Type", "text"], ["difficulty", "Difficulty", "number"], ["impulses", "Impulses", "text"], ["potentialAdversaries", "Potential Adversaries", "text"]],
    equipment: [["category", "Category", "text"], ["tier", "Tier", "number"], ["trait", "Trait", "text"], ["range", "Range", "text"], ["damage", "Damage / Thresholds", "text"], ["burden", "Burden / Armor Score", "text"]],
    consumable: [["rarity", "Rarity", "text"], ["roll", "Roll", "text"]],
  };
  const bundledLibrary = (kind) => {
    if (kind === "adversary") return adversaries;
    if (kind === "environment") return environments;
    if (kind === "consumable") return consumables.map((item) => ({ ...item, type: item.rarity || "Consumable" }));
    return [...weapons.map((item) => ({ ...item, type: "Weapon", category: item.category || "Weapon" })), ...armors.map((item) => ({ ...item, type: "Armor", category: "Armor", damage: item.thresholds, burden: `Armor Score ${item.score}` })), ...lootItems.map((item) => ({ ...item, type: "Loot", category: "Loot" })), ...consumables.map((item) => ({ ...item, type: "Consumable", category: "Consumable" }))];
  };
  const libraryData = (record) => record.custom ? { ...record.data, name: record.name, source: record.source, id: record.id, kind: record.kind, custom: true } : record;
  const libraryCard = (raw, index) => {
    const item = libraryData(raw);
    const features = item.features || [];
    const description = item.description || item.feature || item.featuresText || "";
    const attack = [item.attackModifier, item.attackName, item.range, item.damage].filter(Boolean).join(" · ");
    const stats = libraryKind === "adversary" ? [["Difficulty", item.difficulty], ["Thresholds", item.thresholds], ["HP", item.hp], ["Stress", item.stress]] : libraryKind === "environment" ? [["Difficulty", item.difficulty]] : libraryKind === "equipment" ? [["Category", item.category || item.type], ["Tier", item.tier], ["Trait", item.trait], ["Range", item.range], ["Damage", item.damage], ["Burden", item.burden]] : [["Rarity", item.rarity], ["Roll", item.roll]];
    return `<article class="dh-library-card"><header><div><p class="dh-kicker">${item.custom ? "My Library" : escapeHtml(item.source || "Daggerheart SRD")}</p><h3>${escapeHtml(item.name)}</h3></div>${item.tier ? `<span class="dh-tier-badge">Tier ${item.tier}</span>` : ""}</header><p class="dh-library-type">${escapeHtml(item.type || item.category || "")}</p>${description ? `<p>${escapeHtml(description)}</p>` : ""}<dl>${stats.filter(([, value]) => value !== undefined && value !== null && value !== "").map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>${item.impulses ? `<div class="dh-impulses"><strong>Impulses</strong><span>${escapeHtml(item.impulses)}</span></div>` : ""}${attack ? `<div class="dh-attack-line"><strong>Attack</strong><span>${escapeHtml(attack)}</span></div>` : ""}${item.potentialAdversaries ? `<div class="dh-potential-adversaries"><strong>Potential Adversaries</strong><span>${escapeHtml(item.potentialAdversaries)}</span></div>` : ""}${features.length ? `<details><summary>${features.length} Features</summary>${features.map((feature) => `<section><strong>${escapeHtml(feature.name)} · ${escapeHtml(feature.type)}</strong><p>${escapeHtml(feature.text)}</p></section>`).join("")}</details>` : ""}<footer><button type="button" data-library-template="${index}">${item.custom ? "Edit" : "Use as Template"}</button>${item.custom ? `<button type="button" data-library-archive="${item.id}">Archive</button>` : ""}</footer></article>`;
  };
  const renderLibrary = () => {
    const search = els.librarySearch.value.trim().toLowerCase();
    const type = els.libraryType.value;
    const tier = els.libraryTier.value;
    const all = [...libraryRecords, ...customLibraryRecords.map((item) => ({ ...item, custom: true }))];
    const filtered = all.filter((raw) => { const item = libraryData(raw); return (!search || item.name.toLowerCase().includes(search)) && (!type || (item.type || item.category || item.rarity) === type) && (!tier || String(item.tier || "") === tier); });
    currentLibraryView = filtered;
    els.libraryCount.textContent = `${filtered.length} of ${all.length}`;
    els.libraryGrid.innerHTML = filtered.length ? filtered.map(libraryCard).join("") : `<article class="dh-empty"><h3>No matches.</h3><p>Try clearing one of the filters.</p></article>`;
  };
  const openLibrary = async (kind) => {
    libraryKind = kind; libraryRecords = bundledLibrary(kind);
    els.libraryTitle.textContent = libraryLabels[kind]; els.portalTitle.textContent = libraryLabels[kind];
    els.librarySearch.value = ""; els.libraryTier.value = ""; els.libraryTier.closest("label").hidden = kind === "consumable";
    els.equipmentTabs.hidden = kind !== "equipment";
    try { customLibraryRecords = kind === "equipment" ? [...await api("/content?kind=equipment"), ...await api("/content?kind=consumable")] : await api(`/content?kind=${kind}`); } catch { customLibraryRecords = []; }
    const types = [...new Set([...libraryRecords.map((item) => item.type || item.category || item.rarity), ...customLibraryRecords.map((item) => item.data?.type || item.data?.category || item.data?.rarity)].filter(Boolean))].sort();
    els.libraryType.innerHTML = `<option value="">All Types</option>${types.map((item) => `<option>${escapeHtml(item)}</option>`).join("")}`;
    renderLibrary();
  };
  const openLibraryEditor = (record = {}) => {
    const item = libraryData(record); const isEdit = !!item.custom;
    editorKind = isEdit ? item.kind : (libraryKind === "equipment" && els.libraryType.value === "Consumable" ? "consumable" : libraryKind);
    els.libraryForm.reset(); els.libraryForm.elements.id.value = isEdit ? item.id : ""; els.libraryForm.elements.kind.value = editorKind;
    els.libraryForm.elements.name.value = item.name || ""; els.libraryForm.elements.source.value = isEdit ? item.source : item.name ? `Custom based on ${item.name}` : "Custom";
    els.libraryForm.elements.description.value = item.featuresText || item.description || item.feature || "";
    els.editorTitle.textContent = isEdit ? `Edit ${item.name}` : item.name ? `Create from ${item.name}` : `Create ${libraryLabels[libraryKind].replace(/s$/, "")}`;
    els.editorFields.innerHTML = editorFieldMap[editorKind].map(([name, label, type]) => `<label>${label}<input name="${name}" type="${type}" ${type === "number" ? 'min="0"' : ""} value="${escapeHtml(item[name] ?? "")}" /></label>`).join("");
    els.libraryDialog.showModal();
  };

  const toLocalDateTime = (value) => value ? new Date(value).toISOString().slice(0, 16) : "";
  const renderCampaignRoster = () => {
    els.memberList.innerHTML = activeCampaign.members?.length ? activeCampaign.members.map((member) => { const playerCharacters = (activeCampaign.characters || []).filter((character) => character.owner_id === member.user.id); return `<article class="dh-player-roster-card"><header><div><strong>${escapeHtml(member.user.display_name)}</strong><small>@${escapeHtml(member.user.username)} · ${escapeHtml(member.status)}</small></div><button type="button" data-remove-member="${member.user.id}">Remove</button></header><div>${playerCharacters.length ? playerCharacters.map((character) => `<span class="dh-roster-character"><button type="button" data-view-campaign-character="${character.id}"><strong>${escapeHtml(character.name)}</strong><small>Level ${character.level} · ${escapeHtml(character.display_names?.class || character.mechanics?.class || "Character")}</small></button><button type="button" data-remove-character="${character.id}" aria-label="Remove ${escapeHtml(character.name)} from campaign">×</button></span>`).join("") : `<span class="dh-helper">No character assigned.</span>`}</div></article>`; }).join("") : `<p class="dh-helper">No players added yet.</p>`;
    els.assignedList.innerHTML = "";
    const assigned = new Set((activeCampaign.characters || []).map((character) => character.id));
    const choices = availableCharacters.filter((character) => !assigned.has(character.id));
    els.addCharacter.elements.character_id.innerHTML = choices.length ? choices.map((character) => `<option value="${character.id}">${escapeHtml(character.name)}</option>`).join("") : `<option value="">No available characters</option>`;
    els.addCharacter.querySelector("button").disabled = !choices.length;
    const memberIds = new Set((activeCampaign.members || []).map((member) => member.user.id)); const playerChoices = availablePlayers.filter((player) => !memberIds.has(player.id));
    els.addExistingPlayer.elements.username.innerHTML = playerChoices.length ? playerChoices.map((player) => `<option value="${escapeHtml(player.username)}">${escapeHtml(player.display_name)} (@${escapeHtml(player.username)})</option>`).join("") : `<option value="">No available player accounts</option>`;
    els.addExistingPlayer.querySelector("button").disabled = !playerChoices.length;
    els.campaignNotesForm.elements.notes.value = activeCampaign.notes || "";
    els.sessionNoteList.innerHTML = activeCampaign.session_notes?.length ? [...activeCampaign.session_notes].reverse().map((note) => `<details><summary>Session ${note.session_number} · ${escapeHtml(note.played_on || "Date not recorded")}</summary><p>${escapeHtml(note.notes || "No notes recorded.").replace(/\n/g, "<br>")}</p></details>`).join("") : `<p class="dh-helper">No completed session notes yet.</p>`;
  };

  const openCampaign = async (campaignId) => {
    try {
      [activeCampaign, availableCharacters, availablePlayers] = await Promise.all([api(`/campaigns/${campaignId}`), api("/characters"), api("/players")]);
      els.gmHome.hidden = true; els.vtt.hidden = true; els.campaignWorkspace.hidden = false;
      els.campaignTitle.textContent = activeCampaign.name;
      els.campaignPlanner.elements.name.value = activeCampaign.name;
      els.campaignPlanner.elements.session_number.value = activeCampaign.session_number || 1;
      els.campaignPlanner.elements.next_session_at.value = toLocalDateTime(activeCampaign.next_session_at);
      renderCampaignRoster();
    } catch (error) { showToast(error.message); }
  };

  const renumberAdversaries = () => {
    const adversariesAtTable = tableRecord?.gm_state?.adversaries || [];
    const groups = new Map();
    adversariesAtTable.forEach((item) => { const base = item.baseName || item.name.replace(/ \d+$/, ""); item.baseName = base; groups.set(base, [...(groups.get(base) || []), item]); });
    groups.forEach((items, base) => items.forEach((item, index) => { item.name = items.length > 1 ? `${base} ${index + 1}` : base; }));
    (tableRecord?.public_state?.tokens || []).forEach((token) => { const adversary = adversariesAtTable.find((item) => item.instanceId === token.adversaryId); if (adversary) token.name = adversary.name; });
  };

  const sizeBattleGrid = (grid) => {
    const availableWidth = Math.max(240, (els.battleGrid.parentElement?.clientWidth || 900) - 32);
    const cellSize = Math.max(12, Math.min(52, availableWidth / grid.columns, 900 / grid.rows));
    els.battleGrid.style.width = `${Math.floor(cellSize * grid.columns)}px`;
    els.battleGrid.style.height = `${Math.floor(cellSize * grid.rows)}px`;
  };

  const mapTokenLabel = (name) => { const match = name.match(/^(.*?)(?: (\d+))?$/); const words = (match?.[1] || name).split(/\s+/).filter(Boolean); const initials = words.map((word) => word[0]).slice(0, 2).join(""); return `<span>${escapeHtml(initials)}</span>${match?.[2] ? `<small>${escapeHtml(match[2])}</small>` : ""}`; };

  const playerCharacterPayload = (record, sheet = record.sheet || {}) => ({
    name: record.name,
    pronouns: record.pronouns || sheet.pronouns || "",
    level: record.level || sheet.level || 1,
    mechanics: record.mechanics || {},
    display_names: record.display_names || {},
    sheet,
  });

  const renderPlayerSheet = () => {
    const characterId = Number(els.playerTokenCharacter.value);
    const record = playerCampaign?.characters?.find((item) => item.id === characterId) || playerCampaign?.characters?.[0];
    if (!record) { els.playerSheet.innerHTML = `<p class="dh-helper">The GM has not assigned one of your characters to this campaign.</p>`; return; }
    const sheet = record.sheet || {}; const marks = { hp: 0, stress: 0, armor: 0, hope: 2, ...(sheet.marks || {}) };
    const totals = { hp: Number(sheet.hp || record.mechanics?.hp || 6), stress: Number(sheet.stress || record.mechanics?.stress || 6), armor: Number(sheet.armorScore || record.mechanics?.armorScore || 0), hope: Number(sheet.hope || 6) };
    const tracker = (key, label) => `<div class="dh-player-track"><span>${label}</span><button type="button" data-player-mark="${key}:-1">−</button><strong>${marks[key]}/${totals[key]}</strong><button type="button" data-player-mark="${key}:1">+</button></div>`;
    els.playerSheet.innerHTML = `<details open><summary>${escapeHtml(record.name)} · Character Sheet</summary><div class="dh-player-sheet-head"><div><h3>${escapeHtml(record.name)}</h3><p>Level ${record.level || 1} · ${escapeHtml(record.display_names?.class || record.mechanics?.class || sheet.displayClassName || sheet.className || "Character")}</p></div><strong>Evasion ${sheet.evasion || record.mechanics?.evasion || "—"}</strong></div><div class="dh-player-tracks">${tracker("hp", "HP")}${tracker("stress", "Stress")}${tracker("armor", "Armor")}${tracker("hope", "Hope")}</div><div class="dh-player-sheet-summary"><p><strong>Heritage:</strong> ${escapeHtml(record.display_names?.ancestry || sheet.displayAncestry || sheet.ancestry || "—")} · ${escapeHtml(record.display_names?.community || sheet.displayCommunity || sheet.community || "—")}</p><p><strong>Domains:</strong> ${escapeHtml((sheet.domains || record.mechanics?.domains || []).join(" & ") || "—")}</p><p><strong>Experiences:</strong> ${escapeHtml((sheet.experiences || []).join(", ") || "—")}</p><p><strong>Thresholds:</strong> ${escapeHtml(sheet.thresholds || record.mechanics?.thresholds || "—")}</p></div></details>`;
  };

  const renderPlayerTable = () => {
    if (!playerCampaign || !playerTableRecord) return;
    const state = playerTableRecord.public_state || {}; const grid = state.grid || { columns: 16, rows: 12 }; const tokens = state.tokens || [];
    els.playerTableTitle.textContent = playerCampaign.name;
    els.playerFear.innerHTML = Array.from({ length: state.fear || 0 }, () => `<span><img src="./assets/drago-russo-logo.png" alt="Fear" /></span>`).join("") || `<span class="dh-helper">No Fear</span>`;
    els.playerCountdowns.innerHTML = (state.countdowns || []).map((item) => `<div class="dh-countdown-item"><strong>${escapeHtml(item.name)}</strong><span class="dh-countdown-die"><span>${item.current ?? item.maximum}</span></span></div>`).join("") || `<span class="dh-helper">No active countdowns</span>`;
    const selectedCharacterId = Number(els.playerTokenCharacter.value || playerCampaign.characters?.[0]?.id);
    els.playerTokenCharacter.innerHTML = (playerCampaign.characters || []).map((character) => `<option value="${character.id}" ${character.id === selectedCharacterId ? "selected" : ""}>${escapeHtml(character.name)}</option>`).join("") || `<option value="">No assigned character</option>`;
    els.placePlayerToken.disabled = !(playerCampaign.characters || []).length;
    els.playerGrid.style.setProperty("--grid-columns", grid.columns);
    const availableWidth = Math.max(240, (els.playerGrid.parentElement?.clientWidth || 900) - 32); const cellSize = Math.max(12, Math.min(52, availableWidth / grid.columns, 900 / grid.rows));
    els.playerGrid.style.width = `${Math.floor(cellSize * grid.columns)}px`; els.playerGrid.style.height = `${Math.floor(cellSize * grid.rows)}px`;
    els.playerGrid.innerHTML = Array.from({ length: grid.columns * grid.rows }, (_, index) => { const x = index % grid.columns + 1; const y = Math.floor(index / grid.columns) + 1; const cellTokens = tokens.filter((token) => token.x === x && token.y === y); return `<span class="dh-grid-cell" data-player-grid-x="${x}" data-player-grid-y="${y}">${cellTokens.map((token) => `<span class="dh-map-token ${token.kind === "character" ? "dh-token-character" : `dh-token-${token.health || "healthy"}`}" title="${escapeHtml(token.name)}">${mapTokenLabel(token.name)}</span>`).join("")}</span>`; }).join("");
    renderPlayerSheet();
  };

  const loadPlayerTable = async (campaignId = null) => {
    try {
      const campaigns = await api("/campaigns");
      if (!campaigns.length) { els.playerCampaign.innerHTML = `<option>No active campaigns</option>`; els.playerTableTitle.textContent = "Waiting for a Campaign"; els.playerGrid.innerHTML = ""; return; }
      const selectedId = Number(campaignId || els.playerCampaign.value || campaigns[0].id);
      els.playerCampaign.innerHTML = campaigns.map((campaign) => `<option value="${campaign.id}" ${campaign.id === selectedId ? "selected" : ""}>${escapeHtml(campaign.name)}</option>`).join("");
      [playerCampaign, playerTableRecord] = await Promise.all([api(`/campaigns/${selectedId}`), api(`/campaigns/${selectedId}/table-state`)]);
      renderPlayerTable();
      window.clearTimeout(playerTableTimer); playerTableTimer = window.setTimeout(() => loadPlayerTable(selectedId), 3000);
    } catch (error) { els.playerTableTitle.textContent = "Table unavailable"; showToast(error.message); }
  };

  const renderVtt = () => {
    const publicState = tableRecord.public_state;
    const gmState = tableRecord.gm_state;
    els.vttTitle.textContent = activeCampaign.name;
    els.sessionNotes.value = gmState.notes || "";
    els.fearBeads.innerHTML = Array.from({ length: publicState.fear || 0 }, (_, index) => `<button type="button" data-spend-fear="${index}" aria-label="Spend one Fear"><img src="./assets/drago-russo-logo.png" alt="" /></button>`).join("") || `<span class="dh-helper">No Fear</span>`;
    els.countdownList.innerHTML = (publicState.countdowns || []).map((item, index) => `<div class="dh-countdown-item"><strong>${escapeHtml(item.name)}</strong><button class="dh-countdown-die" type="button" data-countdown="${index}" aria-label="Lower ${escapeHtml(item.name)} d${item.maximum} countdown"><span>${item.current ?? item.maximum}</span></button></div>`).join("") || `<span class="dh-helper">No active countdown dice</span>`;
    const grid = publicState.grid || { columns: 16, rows: 12, cell_feet: 5 };
    const tokens = publicState.tokens || [];
    els.gridBuilder.elements.columns.value = grid.columns;
    els.gridBuilder.elements.rows.value = grid.rows;
    els.battleGrid.style.setProperty("--grid-columns", grid.columns);
    els.battleGrid.style.aspectRatio = `${grid.columns} / ${grid.rows}`;
    sizeBattleGrid(grid);
    const tokenHealth = (token) => { if (token.kind !== "adversary") return "dh-token-character"; const adversary = (gmState.adversaries || []).find((item) => item.instanceId === token.adversaryId); if (!adversary?.hp) { token.health = "healthy"; return "dh-token-healthy"; } const remaining = Math.max(0, adversary.hp - (adversary.hpMarked || 0)); const ratio = remaining / adversary.hp; token.health = ratio > .5 ? "healthy" : ratio > .25 ? "hurt" : "critical"; return `dh-token-${token.health}`; };
    els.battleGrid.innerHTML = Array.from({ length: grid.columns * grid.rows }, (_, index) => { const x = index % grid.columns + 1; const y = Math.floor(index / grid.columns) + 1; const cellTokens = tokens.filter((token) => token.x === x && token.y === y); return `<span class="dh-grid-cell" data-grid-x="${x}" data-grid-y="${y}">${cellTokens.map((token) => `<button class="dh-map-token ${tokenHealth(token)}" type="button" draggable="true" data-map-token="${escapeHtml(token.id)}" data-selected="${token.id === selectedMapTokenId}" title="${escapeHtml(token.name)}">${mapTokenLabel(token.name)}</button>`).join("")}</span>`; }).join("");
    els.vttAdversaries.innerHTML = (gmState.adversaries || []).map((item, index) => { if (!item.instanceId) item.instanceId = crypto.randomUUID ? crypto.randomUUID() : `adv-${Date.now()}-${index}`; const onMap = tokens.some((token) => token.adversaryId === item.instanceId); return `<article class="dh-vtt-card"><div class="dh-vtt-card-head"><div><strong>${escapeHtml(item.name)}</strong><small>Tier ${item.tier || 1} ${escapeHtml(item.type || "Adversary")}</small></div><div class="dh-vtt-card-actions"><button type="button" data-toggle-adversary-map="${index}">${onMap ? "Off Map" : "Add"}</button><button type="button" data-remove-adversary="${index}">×</button></div></div><p>Difficulty ${item.difficulty || "—"} · Thresholds ${escapeHtml(item.thresholds || "—")}</p><div class="dh-vtt-marks"><span>HP <button data-adversary-mark="hp:-1" data-index="${index}">−</button> <strong>${item.hpMarked || 0}/${item.hp || 0}</strong> <button data-adversary-mark="hp:1" data-index="${index}">+</button></span><span>Stress <button data-adversary-mark="stress:-1" data-index="${index}">−</button> <strong>${item.stressMarked || 0}/${item.stress || 0}</strong> <button data-adversary-mark="stress:1" data-index="${index}">+</button></span></div><details><summary>Stat Block</summary><p><strong>Attack:</strong> ${escapeHtml([item.attackModifier, item.attackName, item.range, item.damage].filter(Boolean).join(" · "))}</p><p>${escapeHtml(item.motives || "")}</p>${(item.features || []).map((feature) => `<p><strong>${escapeHtml(feature.name)}:</strong> ${escapeHtml(feature.text)}</p>`).join("")}</details></article>`; }).join("") || `<p class="dh-helper">No adversaries in this encounter.</p>`;
    els.environmentList.innerHTML = (publicState.environments || []).map((item, index) => `<article class="dh-vtt-card dh-environment-card"><div class="dh-vtt-card-head"><div><strong>${escapeHtml(item.name)}</strong><small>Tier ${item.tier || 1} ${escapeHtml(item.type || "Environment")}</small></div><button type="button" data-remove-environment="${index}">×</button></div><p>${escapeHtml(item.description || "")}</p><details><summary>Environment Features</summary><p><strong>Difficulty:</strong> ${item.difficulty || "—"}</p><p><strong>Impulses:</strong> ${escapeHtml(item.impulses || "")}</p>${(item.features || []).map((feature) => `<p><strong>${escapeHtml(feature.name)}:</strong> ${escapeHtml(feature.text)}</p>`).join("")}</details></article>`).join("") || `<p class="dh-helper">No environment loaded.</p>`;
  };

  const renderPicker = () => {
    const search = els.pickerSearch.value.trim().toLowerCase(); const type = els.pickerType.value; const tier = els.pickerTier.value;
    const filtered = pickerRecords.filter((item) => (!search || item.name.toLowerCase().includes(search)) && (!type || item.type === type) && (!tier || String(item.tier) === tier));
    els.pickerResults.innerHTML = filtered.map((item) => `<button type="button" data-picker-id="${escapeHtml(item._pickerId)}"><span><strong>${escapeHtml(item.name)}</strong><small>Tier ${item.tier || 1} · ${escapeHtml(item.type || pickerKind)}</small></span><em>Add</em></button>`).join("") || `<p class="dh-helper">No matches.</p>`;
  };
  const openPicker = async (kind) => {
    pickerKind = kind; const bundled = kind === "adversary" ? adversaries : environments;
    let custom = []; try { custom = await api(`/content?kind=${kind}`); } catch { custom = []; }
    pickerRecords = [...bundled.map((item, index) => ({ ...item, _pickerId: `srd-${index}` })), ...custom.map((item) => ({ ...item.data, name: item.name, source: item.source, _pickerId: `custom-${item.id}` }))];
    els.pickerTitle.textContent = kind === "adversary" ? "Add Adversary" : "Load Environment"; els.pickerSearch.value = ""; els.pickerTier.value = "";
    const types = [...new Set(pickerRecords.map((item) => item.type).filter(Boolean))].sort(); els.pickerType.innerHTML = `<option value="">All Types</option>${types.map((type) => `<option>${escapeHtml(type)}</option>`).join("")}`;
    renderPicker(); els.pickerDialog.showModal();
  };

  const saveTable = async () => {
    els.vttSave.textContent = "Saving…";
    try {
      tableRecord = await api(`/campaigns/${activeCampaign.id}/table-state`, { method: "PUT", body: JSON.stringify({ expected_revision: tableRecord.revision, public_state: tableRecord.public_state, gm_state: tableRecord.gm_state }) });
      els.vttSave.textContent = "Saved";
    } catch (error) { els.vttSave.textContent = "Save failed"; showToast(error.message); }
  };

  const launchVtt = async () => {
    try {
      tableRecord = await api(`/campaigns/${activeCampaign.id}/table-state`);
      els.campaignWorkspace.hidden = true; els.vtt.hidden = false;
      els.brandTitle.textContent = "GM Table"; els.portalTitle.textContent = "GM Table";
      renderVtt();
    } catch (error) { showToast(error.message); }
  };

  const showPortal = () => {
    const user = authUser();
    const signedIn = !!user && !!localStorage.getItem(keys.token);
    const isGm = user?.role === "gm";
    const params = new URLSearchParams(window.location.search);
    const referenceMode = params.get("reference") === "rules";
    const requestedLibrary = params.get("library");
    const libraryMode = isGm && Object.keys(libraryLabels).includes(requestedLibrary);
    els.playerName.textContent = user?.display_name || user?.username || "Player";
    els.brandTitle.textContent = isGm ? "GM Toolbox" : "Player Portal";
    els.portalTitle.textContent = referenceMode ? "Daggerheart Reference" : libraryMode ? libraryLabels[requestedLibrary] : isGm ? "GM Toolbox" : "Player Portal";
    els.loginView.hidden = signedIn;
    els.portalView.hidden = !signedIn;
    els.tabs.hidden = !signedIn || isGm || referenceMode || libraryMode;
    els.gmDashboard.hidden = !signedIn || !isGm || referenceMode || libraryMode;
    els.library.hidden = !signedIn || !libraryMode;
    els.panels.forEach((panel) => { panel.hidden = !signedIn || (!referenceMode && isGm) || panel.dataset.dhPanel !== (referenceMode ? "rules" : "characters"); });
    els.logout.textContent = referenceMode || libraryMode ? "Return to GM Portal" : "Log Out";
    if (signedIn && libraryMode) openLibrary(requestedLibrary);
    else if (signedIn && referenceMode) showPanel("rules");
    else if (signedIn && isGm) renderCampaigns();
    else if (signedIn) showPanel("characters");
  };

  const showPanel = (name) => {
    if (name !== "table") { window.clearTimeout(playerTableTimer); playerTableTimer = null; }
    els.panels.forEach((panel) => { panel.hidden = panel.dataset.dhPanel !== name; });
    els.tabButtons.forEach((button) => { button.dataset.active = String(button.dataset.dhTab === name); });
    if (name === "characters") renderCharacters();
    if (name === "builder") renderBuilder();
    if (name === "rules") renderRules();
    if (name === "table") loadPlayerTable();
  };

  const wizardFrame = (body) => `
    <div class="dh-stepper" aria-label="Character creation steps">
      ${steps.map((step, index) => `<button type="button" data-builder-step="${index}" data-current="${index === builderStep}" data-done="${index < builderStep}" ${index === builderStep ? 'aria-current="step"' : ""}>${index + 1}. ${step}</button>`).join("")}
    </div>
    <section class="dh-wizard-card">
      <p class="dh-kicker">Step ${builderStep + 1} Of ${steps.length}</p>
      ${body}
      <div class="dh-wizard-actions">
        <button type="button" data-builder-back ${builderStep === 0 ? "disabled" : ""}>Back</button>
        <button type="button" data-builder-next>${builderStep === steps.length - 1 ? "Done" : "Next"}</button>
      </div>
    </section>
  `;

  const renderBuilder = () => {
    if (!builderDraft) builderDraft = newDraft();
    if (builderMode === "sheet") {
      els.builderKicker.textContent = "Character Record";
      els.builderTitle.textContent = builderDraft.name || "Character Sheet";
      els.tabButtons.forEach((button) => { button.dataset.active = String(button.dataset.dhTab === "characters"); });
      els.builder.hidden = true;
      els.saveCharacter.hidden = true;
      els.sheet.hidden = false;
      renderSheet(normalizeCharacter(builderDraft));
      return;
    }
    els.builderKicker.textContent = "Guided Builder";
    els.builderTitle.textContent = "Build a Character";
    els.builder.hidden = false;
    els.saveCharacter.hidden = builderStep !== steps.length - 1;
    els.sheet.hidden = builderStep !== steps.length - 1;
    const renderers = [identityStep, classStep, heritageStep, traitsStep, experiencesStep, cardsStep, equipmentStep, reviewStep];
    els.builder.innerHTML = wizardFrame(renderers[builderStep]());
    if (builderStep === steps.length - 1) renderSheet(normalizeCharacter(builderDraft));
  };

  const identityStep = () => `
    <h3>Who is sitting down?</h3>
    <div class="dh-builder-fields">
      <label>Name <input name="name" value="${builderDraft.name}" data-draft="name" /></label>
      <label>Pronouns <input name="pronouns" value="${builderDraft.pronouns}" data-draft="pronouns" /></label>
    </div>
  `;

  const classStep = () => {
    const info = classes[builderDraft.className];
    return `
      <h3>Choose a class.</h3>
      <div class="dh-choice-grid">
        ${Object.keys(classes).map((name) => `<button type="button" data-class-choice="${name}" data-selected="${name === builderDraft.className}">${name}<small>${classes[name].domains.join(" & ")}</small></button>`).join("")}
      </div>
      <label class="dh-wide-label">Subclass
        <select data-draft="subclass">${optionList(info.subclasses, builderDraft.subclass)}</select>
      </label>
      <div class="dh-builder-fields dh-alias-fields">
        <label>Displayed Class Name <input data-draft="displayClassName" value="${escapeHtml(builderDraft.displayClassName || "")}" placeholder="Optional, e.g. Knight of Solamnia" /></label>
        <label>Displayed Subclass Name <input data-draft="displaySubclass" value="${escapeHtml(builderDraft.displaySubclass || "")}" placeholder="Optional setting name" /></label>
      </div>
      <p class="dh-helper">Display names change what appears on the sheet. ${builderDraft.className} and ${builderDraft.subclass} remain the underlying SRD mechanics.</p>
    `;
  };

  const heritageStep = () => `
    <h3>Choose heritage.</h3>
    <div class="dh-builder-fields">
      <label>Ancestry <select data-draft="ancestry">${optionList(ancestries, builderDraft.ancestry)}</select></label>
      <label>Community <select data-draft="community">${optionList(communities, builderDraft.community)}</select></label>
      <label>Displayed Ancestry Name <input data-draft="displayAncestry" value="${escapeHtml(builderDraft.displayAncestry || "")}" placeholder="Optional, e.g. Kender" /></label>
      <label>Displayed Community Name <input data-draft="displayCommunity" value="${escapeHtml(builderDraft.displayCommunity || "")}" placeholder="Optional setting name" /></label>
    </div>
    <p class="dh-helper">The displayed names can match the campaign setting while the selected ancestry and community retain their SRD features.</p>
  `;

  const traitsStep = () => {
    const usedCounts = Object.values(builderDraft.traits).reduce((memo, value) => {
      memo[value] = (memo[value] || 0) + 1;
      return memo;
    }, {});
    const valid = traitValues.every((value) => usedCounts[value] === traitValues.filter((entry) => entry === value).length);
    return `
      <h3>Assign traits.</h3>
      <p class="dh-helper ${valid ? "" : "is-alert"}">Use each value exactly once: +2, +1, +1, 0, 0, -1.</p>
      <div class="dh-trait-grid">
        ${traits.map((trait) => `
          <label><span>${trait}</span>
            <select data-trait="${trait}">
              ${traitValues.map((value) => `<option value="${value}" ${builderDraft.traits[trait] === value ? "selected" : ""}>${value}</option>`).join("")}
            </select>
          </label>
        `).join("")}
      </div>
    `;
  };

  const experiencesStep = () => `
    <h3>Name two experiences.</h3>
    <div class="dh-builder-fields">
      <label>Experience 1 <input value="${builderDraft.experiences[0] || ""}" data-experience="0" /></label>
      <label>Experience 2 <input value="${builderDraft.experiences[1] || ""}" data-experience="1" /></label>
    </div>
  `;

  const cardsStep = () => {
    const options = Object.entries(domainCards).flatMap(([domain, cards]) => cards.map((name) => ({
      domain,
      name,
      level: cardLevels[name] || 1,
      type: cardMeta[name]?.type || "Card",
      recall: cardMeta[name]?.recall ?? 0,
    }))).filter((card) => card.level <= builderDraft.level);
    return `
      <h3>Set cards on the table.</h3>
      <p class="dh-helper">Open domain selection is enabled. Choose any two level-eligible cards that fit the character and confirm off-domain choices with the GM.</p>
      <div class="dh-card-slots">
        ${[0, 1].map((index) => {
          const card = builderDraft.selectedCards[index];
          return `<button type="button" class="dh-card-slot" data-remove-card="${index}">
            <small>Slot ${index + 1}</small><strong>${card || "Blank Card"}</strong><span>${card ? "Click to clear" : "Choose below"}</span>
          </button>`;
        }).join("")}
      </div>
      <div class="dh-domain-picker">
        ${options.map((card) => `<button type="button" data-card-choice="${card.name}" data-selected="${builderDraft.selectedCards.includes(card.name)}"><small>${card.domain} · Level ${card.level} · ${card.type} · Recall ${card.recall}</small>${card.name}</button>`).join("")}
      </div>
    `;
  };

  const equipmentStep = () => `
    <h3>Choose equipment.</h3>
    <div class="dh-builder-fields">
      <label>Primary Weapon <select data-equipment="primary">${optionList(weapons.filter((weapon) => weapon.category === "primary").map((weapon) => weapon.name), builderDraft.equipment.primary.name)}</select></label>
      <label>Secondary Weapon <select data-equipment="secondary">${optionList(weapons.filter((weapon) => weapon.category === "secondary").map((weapon) => weapon.name), builderDraft.equipment.secondary.name)}</select></label>
      <label>Armor <select data-equipment="armor">${optionList(armors.map((armor) => armor.name), builderDraft.equipment.armor.name)}</select></label>
    </div>
  `;

  const reviewStep = () => `
    <h3>Review the sheet.</h3>
    <p class="dh-helper">Save when this looks right. The sheet below is the player-facing view.</p>
  `;

  const compactCard = (title, meta, body) => `
    <details class="dh-codex-card">
      <summary><p>${meta}</p><h4>${title}</h4></summary>
      <span>${body}</span>
    </details>
  `;

  const metaButton = (label, value, action, target = "") => `
    <button class="dh-meta-chip" type="button" data-sheet-action="${action}" ${target ? `data-sheet-target="${target}"` : ""}>
      <small>${label}</small><strong>${value}</strong>
    </button>
  `;

  const allAvailableCards = (character) => Object.entries(domainCards)
    .flatMap(([domain, cards]) => cards.map((name) => ({
      domain,
      name,
      level: cardLevels[name] || 1,
      type: cardMeta[name]?.type || "Card",
      recall: cardMeta[name]?.recall ?? 0,
    })))
    .filter((card) => card.level <= character.level);

  const gearCard = (title, item, details) => `
    <article class="dh-gear-card">
      <p>${title}</p>
      <h4>${item.name}</h4>
      <div>${details.map(([label, value]) => `<span><small>${label}</small><strong>${value}</strong></span>`).join("")}</div>
      ${item.feature ? `<em>${item.feature}</em>` : ""}
    </article>
  `;

  const inventoryId = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const normalizeInventoryItem = (item = {}) => ({
    id: item.id || inventoryId(),
    kind: item.kind || "Custom",
    name: item.name || "Unnamed Item",
    quantity: Math.max(1, Number(item.quantity || 1)),
    description: item.description || "",
    source: item.source || "Custom",
  });

  const signed = (value) => value > 0 ? `+${value}` : String(value);
  const numericTrait = (character, trait) => Number(String(character.traits?.[trait] || "0").replace("+", ""));
  const attackBonus = (character, weapon) => {
    if (!weapon?.trait) return "0";
    const reliable = /Reliable:\s*\+1/.test(weapon.feature || "") ? 1 : 0;
    return signed(numericTrait(character, weapon.trait) + reliable);
  };

  const trackBoxes = (track, total, marked, label) => `
    <div class="dh-track dh-${track}-track" data-track="${track}">
      <div><small>${label}</small><strong>${total - marked}/${total}</strong></div>
      <div class="dh-box-row">
        ${Array.from({ length: total }, (_, index) => `<button class="dh-mark-box ${index < marked ? "is-marked" : ""}" type="button" data-track="${track}" data-index="${index}" aria-label="${label} box ${index + 1}"></button>`).join("")}
      </div>
    </div>
  `;

  const hpState = (character) => {
    const remaining = Math.max(0, character.hp - sheetMarks.hp);
    const ratio = remaining / character.hp;
    if (ratio === 1) return "healthy";
    if (ratio > 0.5) return "hurt";
    if (ratio > 0.25) return "bloodied";
    return "critical";
  };

  const renderInventoryPanel = (character) => {
    const inventory = (character.inventory || []).map(normalizeInventoryItem);
    const gold = { handfuls: 0, bags: 0, chests: 0, ...(character.gold || {}) };
    const itemLabel = `${inventory.length} ${inventory.length === 1 ? "Item" : "Items"}`;
    return `
      <details class="dh-inventory-panel" open>
        <summary><span>Inventory</span><strong>${itemLabel}</strong></summary>
        <div class="dh-inventory-body">
          <section class="dh-gold-row" aria-label="Gold tracker">
            ${["handfuls", "bags", "chests"].map((field) => `
              <label>${titleCaseCategory(field)}
                <input type="number" min="0" step="1" value="${Number(gold[field] || 0)}" data-gold-field="${field}" />
              </label>
            `).join("")}
          </section>
          <div class="dh-inventory-toolbar">
            <button type="button" data-inventory-add="Custom">Add Item</button>
            <button type="button" data-inventory-add="Consumable">Add Consumable</button>
            <button type="button" data-inventory-add="Loot">Add Loot</button>
          </div>
          <div class="dh-inventory-list">
            ${inventory.map((item) => `
              <article class="dh-inventory-item">
                <div>
                  <small>${escapeHtml(item.kind)}${item.source && item.source !== "Custom" ? ` · ${escapeHtml(item.source)}` : ""}</small>
                  <h4>${escapeHtml(item.name)}</h4>
                  <p>${escapeHtml(item.description || "No notes yet.")}</p>
                </div>
                <span>Qty ${escapeHtml(item.quantity)}</span>
                <nav>
                  <button type="button" data-inventory-edit="${escapeHtml(item.id)}">Edit</button>
                  <button type="button" data-inventory-delete="${escapeHtml(item.id)}">Delete</button>
                </nav>
              </article>
            `).join("") || `<article class="dh-inventory-empty">No loose items yet.</article>`}
          </div>
        </div>
      </details>
    `;
  };

  const featureSnippet = (title, meta, body) => `
    <details class="dh-feature-snippet">
      <summary><span>${meta}</span><strong>${title}</strong></summary>
      <p>${body}</p>
    </details>
  `;

  const sidecar = (key) => `
    <button class="dh-sidecar-tab" type="button" data-sidecar="${key}" aria-expanded="false">${sidecars[key].tab}</button>
    <aside class="dh-sidecar" data-sidecar-panel="${key}" hidden>
      <button type="button" data-sidecar-close="${key}" aria-label="Hide ${sidecars[key].title} guide">x</button>
      <p class="dh-kicker">Sheet Guide</p>
      <h4>${sidecars[key].title}</h4>
      <p>${sidecars[key].text}</p>
    </aside>
  `;

  const renderSheet = (character) => {
    sheetMarks = { hp: 0, stress: 0, hope: 2, armor: 0, ...(character.marks || sheetMarks) };
    const selected = character.selectedCards?.length ? character.selectedCards : character.domains.flatMap((domain) => domainCards[domain]).slice(0, 2);
    const cards = selected.map((card) => {
      const domain = Object.keys(domainCards).find((entry) => domainCards[entry].includes(card)) || "Domain";
      const meta = cardMeta[card];
      return compactCard(card, `${domain} · Level ${cardLevels[card] || 1}${meta ? ` · ${meta.type} · Recall ${meta.recall}` : ""}`, cardNotes[card] || "SRD card entry loaded. Full rules text will be expanded in the next data pass.");
    });
    const library = allAvailableCards(character).map((card) => `
      <button type="button" data-sheet-card="${card.name}" data-selected="${selected.includes(card.name)}">
        <small>${card.domain} · Level ${card.level} · ${card.type} · Recall ${card.recall}</small>${card.name}
      </button>
    `).join("");
    const features = [
      featureSnippet(character.feature, character.displayClassName || character.className, "Class feature snippet. This stays compact until the player needs the full reminder."),
      featureSnippet(character.displaySubclass || character.subclass, "Subclass", "Foundation feature snippet for this subclass."),
      featureSnippet(character.displayAncestry || character.ancestry, "Ancestry", "Heritage ancestry snippet."),
      featureSnippet(character.displayCommunity || character.community, "Community", "Heritage community snippet."),
    ];
    const hpClass = `dh-hp-${hpState(character)}`;
    const equipment = character.equipment || defaultEquipment;
    els.sheet.innerHTML = `
      <div class="dh-sheet-head">
        <div>
          <p class="dh-kicker">Character Sheet</p>
          <h3>${character.name}</h3>
          <p>${character.pronouns || "No pronouns"}</p>
        </div>
        <div class="dh-sheet-meta">
          ${metaButton("Level", character.level, "level")}
          ${metaButton("Ancestry", character.displayAncestry || character.ancestry, "jump", "features")}
          ${metaButton("Community", character.displayCommunity || character.community, "jump", "features")}
          ${metaButton("Class", character.displayClassName || character.className, "jump", "features")}
          ${metaButton("Subclass", character.displaySubclass || character.subclass, "jump", "features")}
        </div>
        ${sidecar("identity")}
      </div>
      <div class="dh-sheet-section dh-sheet-grid">
        <div class="dh-evasion-badge"><small>Evasion</small><strong>${character.evasion}</strong></div>
        <div class="dh-stat-strip">${traits.map((trait) => `<span><small>${trait}</small><strong>${character.traits[trait]}</strong></span>`).join("")}</div>
        ${sidecar("traits")}
      </div>
      <div class="dh-sheet-section dh-track-grid ${hpClass}">
        ${trackBoxes("armor", character.armorScore, sheetMarks.armor, "Armor")}
        ${trackBoxes("hp", character.hp, sheetMarks.hp, "HP")}
        ${trackBoxes("stress", character.stress, sheetMarks.stress, "Stress")}
        ${trackBoxes("hope", character.hope, sheetMarks.hope, "Hope")}
        ${sidecar("tracks")}
      </div>
      <div class="dh-sheet-lines">
        <p><strong>Experiences:</strong> ${character.experiences.join(", ") || "None yet"}</p>
        <p><strong>Domains:</strong> ${character.domains.join(" & ")}</p>
      </div>
      <div class="dh-sheet-section dh-gear-grid" data-sheet-section="gear" aria-label="Equipped weapons and armor">
        ${gearCard("Primary Weapon", equipment.primary, [["Hit", attackBonus(character, equipment.primary)], ["Trait", equipment.primary.trait], ["Damage", equipment.primary.damage]])}
        ${gearCard("Secondary Weapon", equipment.secondary, [["Hit", attackBonus(character, equipment.secondary)], ["Trait", equipment.secondary.trait], ["Damage", equipment.secondary.damage]])}
        ${gearCard("Armor", equipment.armor, [["Thresholds", equipment.armor.thresholds], ["Score", equipment.armor.score], ["Repair", equipment.armor.repair]])}
        ${sidecar("equipment")}
      </div>
      <section class="dh-sheet-section dh-snippet-section" data-sheet-section="features">
        <p class="dh-kicker">Features And Heritage</p>
        <div class="dh-feature-list">${features.join("")}</div>
        ${sidecar("snippets")}
      </section>
      <section class="dh-sheet-section dh-snippet-section" data-sheet-section="cards">
        <details class="dh-loadout-panel" open>
          <summary><span>Cards On The Table</span><strong>${selected.length} Active</strong></summary>
          <div class="dh-codex-strip" aria-label="Cards on the table">${cards.join("")}</div>
          <p class="dh-helper">Choose up to two cards to keep on the table.</p>
          <div class="dh-card-library">${library}</div>
        </details>
        ${sidecar("codex")}
      </section>
      ${renderInventoryPanel(character)}
    `;
    bindSheetMarks(character);
    bindSidecars();
    bindSheetActions(character);
  };

  const persistCharacterUpdate = (character) => {
    builderDraft = hydrateDraft(character);
    const records = characters();
    const index = records.findIndex((entry) => entry.id === character.id);
    if (index >= 0) {
      records[index] = character;
      saveCharacters(records);
    }
  };

  const bindSheetActions = (character) => {
    const saveAndRender = (next) => {
      const normalized = hydrateDraft(next);
      const sheetCharacter = normalizeCharacter(normalized);
      persistCharacterUpdate(sheetCharacter);
      renderSheet(sheetCharacter);
    };
    const removeInventoryModal = () => els.sheet.querySelector("[data-inventory-modal]")?.remove();
    const catalogForKind = (kind) => kind === "Consumable" ? consumables : kind === "Loot" ? lootItems : [];
    const openInventoryEditor = (kind, existingItem = null) => {
      removeInventoryModal();
      const item = existingItem ? normalizeInventoryItem(existingItem) : normalizeInventoryItem({ kind, name: "", description: "" });
      const catalog = catalogForKind(item.kind);
      const modal = document.createElement("div");
      modal.className = "dh-modal-backdrop";
      modal.dataset.inventoryModal = "true";
      modal.innerHTML = `
        <form class="dh-item-modal">
          <div class="dh-item-modal-head">
            <div>
              <p class="dh-kicker">${existingItem ? "Edit Inventory" : "Add Inventory"}</p>
              <h3>${existingItem ? "Edit Item" : `Add ${escapeHtml(kind)}`}</h3>
            </div>
            <button type="button" data-inventory-cancel aria-label="Close item editor">x</button>
          </div>
          <div class="dh-item-modal-grid">
            <label>Type
              <select name="kind" data-inventory-kind>
                ${["Custom", "Consumable", "Loot"].map((entry) => `<option value="${entry}" ${entry === item.kind ? "selected" : ""}>${entry}</option>`).join("")}
              </select>
            </label>
            <label>Quantity
              <input name="quantity" type="number" min="1" step="1" value="${escapeHtml(item.quantity)}" />
            </label>
            <label class="dh-modal-wide">SRD Item
              <select data-inventory-catalog>
                <option value="">Custom or flavored item</option>
                ${catalog.map((entry) => `<option value="${escapeHtml(entry.name)}" ${entry.name === item.name ? "selected" : ""}>${escapeHtml(entry.name)}</option>`).join("")}
              </select>
            </label>
            <label class="dh-modal-wide">Name
              <input name="name" value="${escapeHtml(item.name)}" required />
            </label>
            <label class="dh-modal-wide">Notes or Table Effect
              <textarea name="description" rows="5">${escapeHtml(item.description)}</textarea>
            </label>
          </div>
          <div class="dh-item-modal-actions">
            <button type="button" data-inventory-cancel>Cancel</button>
            <button type="submit">${existingItem ? "Save Item" : "Add Item"}</button>
          </div>
        </form>
      `;
      els.sheet.appendChild(modal);
      const form = modal.querySelector("form");
      const kindSelect = modal.querySelector("[data-inventory-kind]");
      const catalogSelect = modal.querySelector("[data-inventory-catalog]");
      const nameInput = modal.querySelector('[name="name"]');
      const descriptionInput = modal.querySelector('[name="description"]');
      const refreshCatalog = () => {
        const records = catalogForKind(kindSelect.value);
        catalogSelect.innerHTML = `<option value="">Custom or flavored item</option>${records.map((entry) => `<option value="${escapeHtml(entry.name)}">${escapeHtml(entry.name)}</option>`).join("")}`;
      };
      kindSelect.addEventListener("change", refreshCatalog);
      catalogSelect.addEventListener("change", () => {
        const match = catalogForKind(kindSelect.value).find((entry) => entry.name === catalogSelect.value);
        if (!match) return;
        nameInput.value = match.name;
        descriptionInput.value = match.description || "";
      });
      modal.querySelectorAll("[data-inventory-cancel]").forEach((button) => button.addEventListener("click", removeInventoryModal));
      modal.addEventListener("click", (event) => {
        if (event.target === modal) removeInventoryModal();
      });
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const nextItem = normalizeInventoryItem({
          ...item,
          kind: data.get("kind"),
          name: data.get("name"),
          quantity: data.get("quantity"),
          description: data.get("description"),
          source: catalogForKind(data.get("kind")).some((entry) => entry.name === data.get("name")) ? "SRD" : "Custom",
        });
        const inventory = (character.inventory || []).map(normalizeInventoryItem);
        saveAndRender({
          ...character,
          inventory: existingItem
            ? inventory.map((entry) => entry.id === item.id ? nextItem : entry)
            : [...inventory, nextItem],
        });
      });
    };
    const openInventoryDelete = (item) => {
      removeInventoryModal();
      const modal = document.createElement("div");
      modal.className = "dh-modal-backdrop";
      modal.dataset.inventoryModal = "true";
      modal.innerHTML = `
        <section class="dh-item-modal dh-confirm-modal">
          <div class="dh-item-modal-head">
            <div>
              <p class="dh-kicker">Delete Inventory</p>
              <h3>Delete ${escapeHtml(item.name)}?</h3>
            </div>
            <button type="button" data-inventory-cancel aria-label="Close delete confirmation">x</button>
          </div>
          <p>This removes the item from this character sheet.</p>
          <div class="dh-item-modal-actions">
            <button type="button" data-inventory-cancel>Cancel</button>
            <button type="button" data-inventory-confirm-delete>Delete</button>
          </div>
        </section>
      `;
      els.sheet.appendChild(modal);
      modal.querySelectorAll("[data-inventory-cancel]").forEach((button) => button.addEventListener("click", removeInventoryModal));
      modal.querySelector("[data-inventory-confirm-delete]").addEventListener("click", () => {
        const inventory = (character.inventory || []).map(normalizeInventoryItem);
        saveAndRender({ ...character, inventory: inventory.filter((entry) => entry.id !== item.id) });
      });
    };
    els.sheet.querySelectorAll("[data-sheet-action]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.sheetAction === "level") {
          showToast("Level up flow comes next.");
          return;
        }
        const target = els.sheet.querySelector(`[data-sheet-section="${button.dataset.sheetTarget}"]`);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    els.sheet.querySelectorAll("[data-sheet-card]").forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.dataset.sheetCard;
        const selectedCards = character.selectedCards?.length ? [...character.selectedCards] : allAvailableCards(character).slice(0, 2).map((entry) => entry.name);
        const nextCards = selectedCards.includes(card)
          ? selectedCards.filter((entry) => entry !== card)
          : selectedCards.length < 2 ? [...selectedCards, card] : [selectedCards[1], card];
        const next = { ...character, selectedCards: nextCards };
        persistCharacterUpdate(next);
        renderSheet(next);
      });
    });
    els.sheet.querySelectorAll("[data-gold-field]").forEach((input) => {
      input.addEventListener("change", () => {
        const gold = { handfuls: 0, bags: 0, chests: 0, ...(character.gold || {}) };
        gold[input.dataset.goldField] = Math.max(0, Number(input.value || 0));
        saveAndRender({ ...character, gold });
      });
    });
    els.sheet.querySelectorAll("[data-inventory-add]").forEach((button) => {
      button.addEventListener("click", () => {
        const kind = button.dataset.inventoryAdd || "Custom";
        openInventoryEditor(kind);
      });
    });
    els.sheet.querySelectorAll("[data-inventory-edit]").forEach((button) => {
      button.addEventListener("click", () => {
        const inventory = (character.inventory || []).map(normalizeInventoryItem);
        const item = inventory.find((entry) => entry.id === button.dataset.inventoryEdit);
        if (!item) return;
        openInventoryEditor(item.kind, item);
      });
    });
    els.sheet.querySelectorAll("[data-inventory-delete]").forEach((button) => {
      button.addEventListener("click", () => {
        const inventory = (character.inventory || []).map(normalizeInventoryItem);
        const item = inventory.find((entry) => entry.id === button.dataset.inventoryDelete);
        if (!item) return;
        openInventoryDelete(item);
      });
    });
  };

  const bindSheetMarks = (character) => {
    els.sheet.querySelectorAll("[data-track][data-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const track = button.dataset.track;
        const index = Number(button.dataset.index);
        sheetMarks[track] = sheetMarks[track] === index + 1 ? index : index + 1;
        builderDraft = { ...builderDraft, marks: { ...sheetMarks } };
        const records = characters();
        const found = records.find((entry) => entry.id === character.id);
        if (found) {
          found.marks = { ...sheetMarks };
          saveCharacters(records);
        }
        renderSheet({ ...character, marks: sheetMarks });
      });
    });
  };

  const bindSidecars = () => {
    els.sheet.querySelectorAll("[data-sidecar]").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.sidecar;
        const panel = els.sheet.querySelector(`[data-sidecar-panel="${key}"]`);
        const isOpen = panel && !panel.hidden;
        els.sheet.querySelectorAll(".dh-sidecar").forEach((sidecarPanel) => { sidecarPanel.hidden = true; });
        els.sheet.querySelectorAll("[data-sidecar]").forEach((tab) => tab.setAttribute("aria-expanded", "false"));
        if (!panel || isOpen) return;
        panel.hidden = false;
        button.setAttribute("aria-expanded", "true");
      });
    });
    els.sheet.querySelectorAll("[data-sidecar-close]").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.sidecarClose;
        const panel = els.sheet.querySelector(`[data-sidecar-panel="${key}"]`);
        const tab = els.sheet.querySelector(`[data-sidecar="${key}"]`);
        if (panel) panel.hidden = true;
        if (tab) tab.setAttribute("aria-expanded", "false");
      });
    });
  };

  const saveCurrentCharacter = async () => {
    const character = normalizeCharacter(builderDraft || newDraft());
    const records = characters();
    const index = records.findIndex((entry) => entry.id === character.id);
    if (index >= 0) records[index] = character;
    else records.push(character);
    saveCharacters(records);
    localStorage.setItem(keys.activeId, character.id);
    builderDraft = character;
    builderMode = "sheet";
    showPanel("builder");
    try {
      const payload = { name: character.name, pronouns: character.pronouns || "", level: character.level, mechanics: { class: character.className, subclass: character.subclass, ancestry: character.ancestry, community: character.community, domains: character.domains, hp: character.hp, stress: character.stress, evasion: character.evasion, armorScore: character.armorScore }, display_names: { class: character.displayClassName || character.className, subclass: character.displaySubclass || character.subclass, ancestry: character.displayAncestry || character.ancestry, community: character.displayCommunity || character.community }, sheet: character };
      const saved = await api(character.backendId ? `/characters/${character.backendId}` : "/characters", { method: character.backendId ? "PUT" : "POST", body: JSON.stringify(payload) });
      character.backendId = saved.id; builderDraft.backendId = saved.id;
      const syncedRecords = characters(); const syncedIndex = syncedRecords.findIndex((entry) => entry.id === character.id); if (syncedIndex >= 0) { syncedRecords[syncedIndex].backendId = saved.id; saveCharacters(syncedRecords); }
      showToast("Character saved to the player portal.");
    } catch (error) { showToast(`Saved on this device. Portal sync failed: ${error.message}`); }
  };

  const renderCharacters = () => {
    const records = characters();
    els.characterList.innerHTML = records.length ? records.map((character) => `
      <article class="dh-character-card">
        <div>
          <h3>${character.name}</h3>
          <p>Level ${character.level} ${character.displayAncestry || character.ancestry} ${character.displayClassName || character.className} · ${character.displaySubclass || character.subclass}</p>
          <p>${character.domains.join(" & ")} · ${character.experiences.join(", ")}</p>
        </div>
        <div class="dh-card-actions">
          <button type="button" data-dh-view-character="${character.id}">View</button>
          <button type="button" data-dh-edit-character="${character.id}">Edit</button>
          <button type="button" data-dh-delete-character="${character.id}">Delete</button>
        </div>
      </article>
    `).join("") : `<article class="dh-empty"><h3>No characters yet.</h3><p>Create a character and set your cards on the table.</p></article>`;

    els.characterList.querySelectorAll("[data-dh-view-character]").forEach((button) => {
      button.addEventListener("click", () => {
        const character = characters().find((entry) => entry.id === button.dataset.dhViewCharacter);
        if (!character) return;
        builderDraft = hydrateDraft(character);
        builderMode = "sheet";
        showPanel("builder");
      });
    });
    els.characterList.querySelectorAll("[data-dh-edit-character]").forEach((button) => {
      button.addEventListener("click", () => {
        const character = characters().find((entry) => entry.id === button.dataset.dhEditCharacter);
        if (!character) return;
        builderDraft = hydrateDraft(character);
        builderStep = 0;
        builderMode = "build";
        showPanel("builder");
      });
    });
    els.characterList.querySelectorAll("[data-dh-delete-character]").forEach((button) => {
      button.addEventListener("click", () => {
        const character = characters().find((entry) => entry.id === button.dataset.dhDeleteCharacter);
        if (!character || !window.confirm(`Delete ${character.name}?`)) return;
        saveCharacters(characters().filter((entry) => entry.id !== character.id));
        renderCharacters();
        showToast("Character deleted.");
      });
    });
  };

  const renderRules = () => {
    if (els.ruleButtons.dataset.rendered === "true") return;
    els.ruleButtons.dataset.rendered = "true";
    els.ruleButtons.innerHTML = rules.map(([title], index) => `<button type="button" data-rule="${index}">${title}</button>`).join("");
    const openRule = (index) => {
      const [title, source, body] = rules[index];
      els.ruleButtons.querySelectorAll("button").forEach((button) => { button.dataset.active = String(Number(button.dataset.rule) === index); });
      els.ruleReader.innerHTML = renderRuleArticle(title, source, body);
      bindRuleJumps();
    };
    els.ruleButtons.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => openRule(Number(button.dataset.rule))));
    openRule(0);
  };

  const escapeHtml = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const ruleSourceMap = () => Object.fromEntries(rules.map(([title, source]) => [title, source]));
  const ruleSource = (title, fallback = "Player SRD Reference") => ruleSourceMap()[title] || fallback;

  const domainProfiles = {
    Arcana: { text: "Innate, instinctual magic: raw energy, elemental force, perception, wards, and reality-bending effects.", classes: ["Druid", "Sorcerer"] },
    Blade: { text: "Weapon mastery and battlefield pressure for characters who solve problems at the edge of steel.", classes: ["Guardian", "Warrior"] },
    Bone: { text: "Tactics, body control, movement, awareness, and clever physical advantages.", classes: ["Ranger", "Warrior"] },
    Codex: { text: "Books, memory, spellcraft, knowledge, and grimoire-style magic.", classes: ["Bard", "Wizard"] },
    Grace: { text: "Charm, inspiration, social leverage, misdirection, and graceful support.", classes: ["Bard", "Rogue"] },
    Midnight: { text: "Shadow, disguise, silence, trickery, and dangerous magic from the dark corners of the table.", classes: ["Rogue", "Sorcerer"] },
    Sage: { text: "Nature, tracking, beasts, restoration, and the old wisdom of the living world.", classes: ["Druid", "Ranger"] },
    Splendor: { text: "Healing, protection, radiance, reason, and magic that keeps the party standing.", classes: ["Seraph", "Wizard"] },
    Valor: { text: "Defense, courage, protection, armored presence, and holding the line when the scene gets ugly.", classes: ["Guardian", "Seraph"] },
  };

  const creationSteps = [
    ["1", "Choose Class and Subclass", "Pick one of the nine player classes, then choose one of its two subclasses. This establishes domains, class feature, starting Evasion, starting Hit Points, and the first subclass feature."],
    ["2", "Choose Heritage", "Choose one ancestry and one community. Together they describe where the character comes from and provide heritage features."],
    ["3", "Assign Character Traits", "Assign +2, +1, +1, 0, 0, and -1 across Agility, Strength, Finesse, Instinct, Presence, and Knowledge."],
    ["4", "Describe Character", "Record name, pronouns, look, style, manner, and the details the table needs to picture the character quickly."],
    ["5", "Choose Experiences", "Write two experiences that describe what the character is especially good at because of their life before the campaign."],
    ["6", "Choose Equipment", "Choose starting weapons and armor. The sheet should show the actual attack modifier, damage dice, thresholds, armor score, and repair state."],
    ["7", "Record Starting Values", "Record Evasion, Hit Points, Stress, Hope, Armor, Proficiency, damage thresholds, and any class or equipment adjustments."],
    ["8", "Choose Domain Cards", "Choose two level 1 cards from the character's class domains. They can both come from one domain or one from each."],
    ["9", "Create Connections", "At the table, describe characters to each other and choose relationships that give the party history before the first scene begins."],
  ];

  const coreMechanics = [
    ["Action Rolls", "Roll the Hope Die and Fear Die, add the relevant trait, and compare to the Difficulty. The higher die colors the result as Hope or Fear."],
    ["Hope", "Hope is the player-facing momentum currency. The sheet should make spending and gaining Hope quick, visible, and satisfying."],
    ["Fear", "Fear gives the GM permission to push pressure, consequences, complications, and scene turns."],
    ["Advantage and Disadvantage", "Roll an extra d6 and add or subtract it from the action roll depending on the circumstance."],
    ["Damage and Armor", "Compare incoming damage to thresholds, mark Hit Points, and spend Armor Slots to reduce severity when appropriate."],
    ["Stress", "Stress tracks strain, pressure, and costs paid for certain moves or features."],
  ];

  const ancestryNotes = {
    Clank: "Constructed people with bodies made from crafted materials and living spirit.",
    Drakona: "Draconic people with striking presence and elemental lineage.",
    Dwarf: "Stout, enduring people shaped by craft, memory, and resilience.",
    Elf: "Long-lived people often associated with keen senses, grace, and old traditions.",
    Faerie: "Winged or fey-touched people with a strong magical presence.",
    Faun: "Hooved people with expressive social lives and a deep sense of rhythm and movement.",
    Firbolg: "Large, gentle, nature-rooted people with quiet strength.",
    Fungril: "Fungal people with unusual bodies and strange connections to growth and decay.",
    Galapa: "Turtle-like people known for patience, protection, and steadiness.",
    Giant: "Towering people with powerful bodies and a big presence in every scene.",
    Goblin: "Sharp, quick people who bring restless energy and clever instincts.",
    Halfling: "Small, nimble people with practical courage and deep community instincts.",
    Human: "Adaptable people whose drive and variety make them fit almost anywhere.",
    Infernis: "People marked by infernal legacy, intense appearance, and dramatic presence.",
    Katari: "Feline people with speed, poise, and sharp senses.",
    Orc: "Powerful people often defined by endurance, directness, and force of will.",
    Ribbet: "Frog-like people with unusual movement, voice, and physicality.",
    Simiah: "Simian people with agile bodies and expressive personalities.",
  };

  const communityNotes = {
    Highborne: "Raised among courts, wealth, reputation, or structured power.",
    Loreborne: "Raised around books, teachers, tradition, study, or protected knowledge.",
    Orderborne: "Raised inside disciplined institutions, vows, law, or service.",
    Ridgeborne: "Raised in highlands, cliffs, hard roads, or remote settlements.",
    Seaborne: "Raised by coasts, ships, harbors, storms, and the demands of travel.",
    Slyborne: "Raised amid secrets, alleys, hidden networks, and social survival.",
    Underborne: "Raised below the surface, in darkness, tunnels, or enclosed worlds.",
    Wanderborne: "Raised on the road, between homes, with motion as a way of life.",
    Wildborne: "Raised in untamed places where instinct and adaptation matter.",
  };

  const titleCaseCategory = (value) => String(value || "Item")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const truncateText = (value, limit = 220) => {
    const clean = String(value || "").replace(/\s+/g, " ").trim();
    if (clean.length <= limit) return clean;
    return `${clean.slice(0, limit).replace(/\s+\S*$/, "")}...`;
  };

  const rulesByTitle = () => Object.fromEntries(rules.map((rule) => [rule[0], rule]));
  const cardCount = (domain) => domainCards[domain]?.length || 0;
  const levelOneCards = (domain) => (domainCards[domain] || []).filter((name) => (cardLevels[name] || 1) <= 1);
  const ruleSlug = (value) => String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const renderSummaryGrid = (cards) => `
    <div class="dh-rule-summary-grid">
      ${cards.map((card) => `
        <button type="button" class="dh-rule-summary-card" data-rule-jump="${escapeHtml(ruleSlug(card.target || card.title))}">
          <small>${escapeHtml(card.kicker || "")}</small>
          <strong>${escapeHtml(card.title)}</strong>
          <span>${escapeHtml(card.text || "")}</span>
        </button>
      `).join("")}
    </div>
  `;

  const renderTopic = (section, index = 0) => {
    const isOpen = section.open ?? index < 2;
    return `
    <details class="dh-rule-topic" data-rule-section="${escapeHtml(ruleSlug(section.title))}" ${isOpen ? "open" : ""}>
      <summary><span>${escapeHtml(section.title)}</span></summary>
      <div>
        ${section.body ? `<p>${escapeHtml(section.body)}</p>` : ""}
        ${section.items?.length ? `<ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
        ${section.html || ""}
      </div>
    </details>
  `;
  };

  const renderDomainCardsPreview = (domain, limit = 6) => `
    <div class="dh-rule-card-list">
      ${(domainCards[domain] || []).slice(0, limit).map((name) => {
        const meta = cardMeta[name] || {};
        return `
          <article class="dh-rule-srd-card">
            <small>${escapeHtml(domain)} · Level ${cardLevels[name] || 1} · ${escapeHtml(meta.type || "Card")} · Recall ${escapeHtml(meta.recall ?? 0)}</small>
            <strong>${escapeHtml(name)}</strong>
            <p>${escapeHtml(meta.text || cardNotes[name] || "Card text loaded from the SRD reference.")}</p>
          </article>
        `;
      }).join("")}
    </div>
  `;

  const renderEquipmentTable = (rows, columns, template = "") => `
    <div class="dh-reference-table" role="table" style="--dh-reference-columns:${columns.length};${template ? `--dh-reference-template:${template};` : ""}">
      <div role="row" class="dh-reference-row dh-reference-head">
        ${columns.map((column) => `<span role="columnheader">${escapeHtml(column[0])}</span>`).join("")}
      </div>
      ${rows.map((row) => `
        <div role="row" class="dh-reference-row">
          ${columns.map((column) => `<span role="cell">${escapeHtml(row[column[1]] ?? "")}</span>`).join("")}
        </div>
      `).join("")}
    </div>
  `;

  const renderItemReference = (items) => `
    <div class="dh-item-reference-grid">
      ${items.map((item) => `
        <article class="dh-item-reference-card">
          <small>${escapeHtml(item.kind || "Item")}${item.roll ? ` · ${escapeHtml(item.roll)}` : ""}</small>
          <h4>${escapeHtml(item.name)}</h4>
          <p>${escapeHtml(item.description || "No table text loaded yet.")}</p>
        </article>
      `).join("")}
    </div>
  `;

  const renderReferenceText = (text) => {
    const headings = [
      "DOMAINS -", "STARTING EVASION -", "STARTING HIT POINTS -", "CLASS ITEMS -",
      "CLASS FEATURE", "CLASS FEATURES", "FOUNDATION FEATURE", "FOUNDATION FEATURES",
      "SPECIALIZATION FEATURE", "SPECIALIZATION FEATURES", "MASTERY FEATURE", "MASTERY FEATURES",
      "SPELLCAST TRAIT", "BACKGROUND QUESTIONS", "CONNECTIONS",
    ];
    let prepared = String(text || "");
    headings.forEach((heading) => {
      prepared = prepared.replaceAll(` ${heading}`, `\n${heading}`);
    });
    prepared = prepared.replace(/\s([A-Z][A-Z’' -]+’S HOPE FEATURE)\s/g, "\n$1 ");
    Object.keys(classes).forEach((name) => {
      prepared = prepared.replaceAll(` ${name.toUpperCase()} SUBCLASSES`, `\n${name.toUpperCase()} SUBCLASSES`);
    });
    [...Object.values(classes).flatMap((info) => info.subclasses), ...ancestries, ...communities].forEach((name) => {
      prepared = prepared.replaceAll(` ${name.toUpperCase()} `, `\n${name.toUpperCase()} `);
    });
    const headingPattern = /^(DOMAINS -|STARTING EVASION -|STARTING HIT POINTS -|CLASS ITEMS -|[A-Z][A-Z’' -]+’S HOPE FEATURE|CLASS FEATURE|CLASS FEATURES|FOUNDATION FEATURE|FOUNDATION FEATURES|SPECIALIZATION FEATURE|SPECIALIZATION FEATURES|MASTERY FEATURE|MASTERY FEATURES|SPELLCAST TRAIT|BACKGROUND QUESTIONS|CONNECTIONS)\s*(.*)$/;
    return `<div class="dh-rule-prose">${prepared.split(/\n+/).filter(Boolean).map((chunk) => {
      const label = chunk.trim();
      const headingMatch = label.match(headingPattern);
      if (headingMatch) {
        return `<h4>${escapeHtml(headingMatch[1])}</h4>${headingMatch[2] ? `<p>${escapeHtml(headingMatch[2])}</p>` : ""}`;
      }
      return /^[A-Z0-9’'&: -]{4,}$/.test(label)
        ? `<h4>${escapeHtml(label)}</h4>`
        : `<p>${escapeHtml(label)}</p>`;
    }).join("")}</div>`;
  };

  const renderClassCards = () => `
    <div class="dh-domain-grid">
      ${(classesFull.length ? classesFull : Object.entries(classes).map(([name, info]) => ({ name, domains: info.domains, startingEvasion: info.evasion, startingHitPoints: info.hp, description: info.feature, subclassNames: [info.subclasses] }))).map((record) => {
        const info = classes[record.name] || {};
        const domains = record.domains?.length ? record.domains : info.domains || [];
        const subclasses = record.subclassNames?.flat?.().filter(Boolean) || info.subclasses || [];
        return `
        <article class="dh-domain-card">
          <small>${escapeHtml(domains.join(" & "))}</small>
          <h4>${escapeHtml(record.name)}</h4>
          <p>Evasion ${escapeHtml(record.startingEvasion || info.evasion || "")} · HP ${escapeHtml(record.startingHitPoints || info.hp || "")}</p>
          <span>${escapeHtml(subclasses.join(" / "))}</span>
        </article>
      `; }).join("")}
    </div>
  `;

  const renderNamedCards = (items, notes = {}) => `
    <div class="dh-domain-grid">
      ${items.map((item) => {
        const name = typeof item === "string" ? item : item.name;
        const text = typeof item === "string" ? notes[name] : item.text || notes[name];
        return `
        <article class="dh-domain-card">
          <small>Player option</small>
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(truncateText(text || "Reference entry ready for player-facing sheet text.", 260))}</p>
        </article>
      `; }).join("")}
    </div>
  `;

  const subclassSections = () => Object.entries(classes).flatMap(([className, info]) => {
    const record = classesFull.find((entry) => entry.name === className);
    return info.subclasses.map((subclass, index) => {
      let text = "";
      if (record?.text) {
        const start = record.text.indexOf(subclass.toUpperCase());
        const nextSubclass = info.subclasses[index + 1];
        const endCandidates = [
          nextSubclass ? record.text.indexOf(nextSubclass.toUpperCase(), start + 1) : -1,
          record.text.indexOf("BACKGROUND QUESTIONS", start + 1),
          record.text.indexOf("CONNECTIONS", start + 1),
        ].filter((position) => position > start);
        const end = endCandidates.length ? Math.min(...endCandidates) : record.text.length;
        text = start >= 0 ? record.text.slice(start, end) : "";
      }
      return {
        className,
        title: subclass,
        text: text || `${subclass} is a ${className} subclass. Full subclass text will appear from the class record when available.`,
      };
    });
  });

  const guideFor = (title) => {
    const source = ruleSource(title);
    const base = {
      title,
      source,
      dek: "Player-facing reference for fast reading at the table.",
      cards: [],
      sections: [],
      side: [],
    };
    if (title === "Character Creation") {
      return {
        ...base,
        dek: "A clean nine-step builder path, matching what the app should walk players through one step at a time.",
        cards: creationSteps.map(([number, name]) => ({ kicker: `Step ${number}`, title: name, text: "Open the detail below.", target: `Step ${number}: ${name}` })),
        sections: creationSteps.map(([number, name, body]) => ({ title: `Step ${number}: ${name}`, body })),
        side: [["Classes", Object.keys(classes).length], ["Ancestries", ancestries.length], ["Communities", communities.length], ["Domains", Object.keys(domainProfiles).length]],
      };
    }
    if (title === "Domains") {
      const entries = Object.entries(domainProfiles);
      return {
        ...base,
        dek: "The nine domains are the card families. Each class opens access to two of them.",
        cards: entries.map(([domain, profile]) => ({ kicker: profile.classes.join(" & "), title: domain, text: `${cardCount(domain)} cards loaded`, target: domain })),
        sections: entries.map(([domain, profile]) => ({
          title: domain,
          body: profile.text,
          items: [`Classes: ${profile.classes.join(" and ")}`, `Level 1 cards: ${levelOneCards(domain).join(", ") || "None loaded"}`],
        })),
        side: entries.map(([domain, profile]) => [domain, profile.classes.join(" / ")]),
      };
    }
    if (title === "Domain Cards") {
      const entries = Object.keys(domainProfiles);
      return {
        ...base,
        dek: "Cards are the tactile bottom-of-sheet powers. This view groups the loaded SRD card catalog by domain.",
        cards: entries.map((domain) => ({ kicker: "Domain deck", title: domain, text: `${cardCount(domain)} total · ${levelOneCards(domain).length} level 1`, target: `${domain} Cards` })),
        sections: entries.map((domain) => ({ title: `${domain} Cards`, body: domainProfiles[domain].text, html: renderDomainCardsPreview(domain, 999) })),
        side: entries.map((domain) => [domain, `${cardCount(domain)} cards`]),
      };
    }
    if (title === "Classes") {
      const classRecords = classesFull.length ? classesFull : [];
      return {
        ...base,
        dek: "Class records show the chassis players need first: domains, subclass choices, Evasion, Hit Points, and class feature.",
        cards: (classRecords.length ? classRecords : Object.entries(classes).map(([name, info]) => ({ name, domains: info.domains, startingEvasion: info.evasion, startingHitPoints: info.hp })))
          .map((record) => ({ kicker: (record.domains || classes[record.name]?.domains || []).join(" & "), title: record.name, text: `Evasion ${record.startingEvasion || classes[record.name]?.evasion} · HP ${record.startingHitPoints || classes[record.name]?.hp}`, target: record.name })),
        sections: classRecords.map((record) => ({ title: record.name, html: renderReferenceText(record.text) })),
        side: (classRecords.length ? classRecords : Object.entries(classes).map(([name, info]) => ({ name, domains: info.domains }))).map((record) => [record.name, (record.domains || []).join(" / ")]),
      };
    }
    if (title === "Subclasses") {
      const subclassRows = Object.entries(classes).flatMap(([className, info]) => info.subclasses.map((subclass) => [subclass, className]));
      const sections = subclassSections();
      return {
        ...base,
        dek: "Subclasses sit under classes and unlock foundation, specialization, and mastery features over time.",
        cards: subclassRows.map(([subclass, className]) => ({ kicker: className, title: subclass, text: "Foundation, specialization, and mastery features.", target: subclass })),
        sections: sections.map((section) => ({ title: section.title, html: renderReferenceText(section.text) })),
        side: subclassRows.map(([subclass, className]) => [subclass, className]),
      };
    }
    if (title === "Ancestries") {
      const records = ancestriesFull.length ? ancestriesFull : ancestries.map((name) => ({ name, text: ancestryNotes[name] }));
      return {
        ...base,
        dek: "Ancestry is one half of heritage and describes lineage, body, and inherited features.",
        cards: records.map((record) => ({ kicker: "Ancestry", title: record.name, text: truncateText(record.text, 120), target: record.name })),
        sections: records.map((record) => ({ title: record.name, html: renderReferenceText(record.text) })),
        side: records.map((record) => [record.name, "Heritage option"]),
      };
    }
    if (title === "Communities") {
      const records = communitiesFull.length ? communitiesFull : communities.map((name) => ({ name, text: communityNotes[name] }));
      return {
        ...base,
        dek: "Community is the cultural or environmental half of heritage.",
        cards: records.map((record) => ({ kicker: "Community", title: record.name, text: truncateText(record.text, 120), target: record.name })),
        sections: records.map((record) => ({ title: record.name, html: renderReferenceText(record.text) })),
        side: records.map((record) => [record.name, "Heritage option"]),
      };
    }
    if (title === "Core Mechanics") {
      return {
        ...base,
        dek: "The player-facing rules that come up constantly during play.",
        cards: coreMechanics.map(([name, body]) => ({ kicker: "Table rule", title: name, text: body, target: name })),
        sections: coreMechanics.map(([name, body]) => ({ title: name, body })),
        side: [["Action", "Hope die + Fear die"], ["Pressure", "Fear and Stress"], ["Survival", "HP and Armor"], ["Flow", "Spotlight, rests, downtime"]],
      };
    }
    if (title === "Equipment" || title === "Weapons") {
      const primary = weapons.filter((weapon) => weapon.category === "primary");
      const secondary = weapons.filter((weapon) => weapon.category === "secondary");
      return {
        ...base,
        dek: "Player equipment should be readable at a glance: weapons, armor, loot, consumables, and gold.",
        cards: [
          { kicker: "Catalog", title: "Primary Weapons", text: `${primary.length} loaded`, target: "Primary Weapons" },
          { kicker: "Catalog", title: "Secondary Weapons", text: `${secondary.length} loaded`, target: "Secondary Weapons" },
          { kicker: "Catalog", title: "Armor", text: `${armors.length} loaded`, target: "Armor" },
          { kicker: "Catalog", title: "Loot", text: `${lootItems.length} loaded`, target: "Loot" },
          { kicker: "Catalog", title: "Consumables", text: `${consumables.length} loaded`, target: "Consumables" },
        ],
        sections: [
          { title: "Primary Weapons", body: "Main equipped weapons.", html: renderEquipmentTable(primary, [["Name", "name"], ["Trait", "trait"], ["Range", "range"], ["Damage", "damage"], ["Burden", "burden"], ["Feature", "feature"]], "1.15fr .7fr .75fr .85fr .95fr 2fr") },
          { title: "Secondary Weapons", body: "Off-hand and supporting weapons.", html: renderEquipmentTable(secondary, [["Name", "name"], ["Trait", "trait"], ["Range", "range"], ["Damage", "damage"], ["Burden", "burden"], ["Feature", "feature"]], "1.15fr .7fr .75fr .85fr .95fr 2fr") },
          { title: "Armor", body: "Armor score and thresholds for reducing incoming damage.", html: renderEquipmentTable(armors, [["Name", "name"], ["Thresholds", "thresholds"], ["Score", "score"], ["Feature", "feature"], ["Repair", "repair"]], "1.3fr .8fr .55fr 2fr .7fr") },
          { title: "Loot", body: "Useful finds, tools, materials, and table-facing treasure.", html: renderItemReference(lootItems.slice(0, 60)) },
          { title: "Consumables", body: "Single-use or limited-use items that belong in the sheet inventory.", html: renderItemReference(consumables.slice(0, 60)) },
        ],
        side: [["Primary", `${primary.length} weapons`], ["Secondary", `${secondary.length} weapons`], ["Armor", `${armors.length} suits`]],
      };
    }
    if (title === "Armor") {
      return {
        ...base,
        dek: "Armor gives thresholds, Armor Slots, and protection choices when damage lands.",
        cards: armors.map((armor) => ({ kicker: `Score ${armor.score}`, title: armor.name, text: `${armor.thresholds}${armor.feature ? ` · ${armor.feature}` : ""}`, target: "Armor" })),
        sections: [{ title: "Armor", body: "Armor records should stay compact on the character sheet and show repair state clearly.", html: renderEquipmentTable(armors, [["Name", "name"], ["Thresholds", "thresholds"], ["Score", "score"], ["Feature", "feature"], ["Repair", "repair"]], "1.3fr .8fr .55fr 2fr .7fr") }],
        side: armors.map((armor) => [armor.name, armor.thresholds]),
      };
    }
    if (title === "Loot" || title === "Consumables") {
      const records = title === "Loot" ? lootItems : consumables;
      return {
        ...base,
        dek: `${title} belong in the collapsible sheet inventory, with room for table flavor and custom edits.`,
        cards: records.slice(0, 12).map((item) => ({ kicker: item.kind, title: item.name, text: truncateText(item.description, 110), target: title })),
        sections: [{ title, body: `${records.length} SRD ${title.toLowerCase()} entries loaded for player reference.`, html: renderItemReference(records) }],
        side: [],
      };
    }
    if (title === "Gold") {
      const catalog = [["Handfuls", "Loose spending money."], ["Bags", "Meaningful wealth."], ["Chests", "Treasure worth planning around."]];
      return {
        ...base,
        dek: "Gold stays as a compact tracker on the character sheet.",
        cards: catalog.map(([name, body]) => ({ kicker: "Gold", title: name, text: body, target: name })),
        sections: catalog.map(([name, body]) => ({ title: name, body })),
        side: [],
      };
    }
    const raw = rulesByTitle()[title]?.[2] || "";
    return {
      ...base,
      cards: [{ kicker: source, title, text: truncateText(raw, 160) }],
      sections: [{ title: "Reference", body: truncateText(raw, 900) }],
      side: [[title, source]],
    };
  };

  const renderRuleArticle = (title) => {
    const guide = guideFor(title);
    return `
      <div class="dh-rule-article-head">
        <p class="dh-kicker">${escapeHtml(guide.source)}</p>
        <h3>${escapeHtml(guide.title)}</h3>
        <p>${escapeHtml(guide.dek)}</p>
      </div>
      ${renderSummaryGrid(guide.cards)}
      <div class="dh-rule-content-grid">
        <div class="dh-rule-main-column">
          ${guide.sections.map(renderTopic).join("")}
        </div>
      </div>
    `;
  };

  const bindRuleJumps = () => {
    els.ruleReader.querySelectorAll("[data-rule-jump]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = els.ruleReader.querySelector(`[data-rule-section="${button.dataset.ruleJump}"]`);
        if (!target) return;
        target.open = true;
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  const traitAssignmentsAreValid = () => {
    const used = Object.values(builderDraft.traits).sort().join("|");
    return used === [...traitValues].sort().join("|");
  };

  const bindTooltip = () => {
    document.addEventListener("pointerover", (event) => {
      const target = event.target.closest("[data-tip]");
      if (!target) return;
      els.tooltip.textContent = target.dataset.tip;
      els.tooltip.hidden = false;
      const rect = target.getBoundingClientRect();
      els.tooltip.style.left = `${Math.min(window.innerWidth - 280, Math.max(12, rect.left))}px`;
      els.tooltip.style.top = `${rect.bottom + 8}px`;
    });
    document.addEventListener("pointerout", (event) => {
      if (event.target.closest("[data-tip]")) els.tooltip.hidden = true;
    });
  };

  els.loginButtons.forEach((button) => button.addEventListener("click", async () => {
    els.loginError.hidden = true;
    els.loginButtons.forEach((entry) => { entry.disabled = true; });
    try {
      const payload = await api("/auth/login", { method: "POST", body: JSON.stringify({ username: els.username.value.trim(), password: els.password.value }) });
      if (button.dataset.dhLogin === "gm" && payload.user.role !== "gm") throw new Error("This account does not have GM access.");
      localStorage.setItem(keys.token, payload.token);
      writeJson(keys.user, payload.user);
      els.password.value = "";
      showPortal();
    } catch (error) {
      els.loginError.textContent = error.message;
      els.loginError.hidden = false;
    } finally {
      els.loginButtons.forEach((entry) => { entry.disabled = false; });
    }
  }));
  els.logout.addEventListener("click", () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reference") === "rules" || params.get("library")) {
      window.location.href = window.location.pathname;
      return;
    }
    localStorage.removeItem(keys.token);
    localStorage.removeItem(keys.user);
    showPortal();
  });
  [els.librarySearch, els.libraryType, els.libraryTier].forEach((control) => control.addEventListener(control === els.librarySearch ? "input" : "change", renderLibrary));
  els.equipmentTabButtons.forEach((button) => button.addEventListener("click", () => {
    els.libraryType.value = button.dataset.equipmentType;
    els.equipmentTabButtons.forEach((entry) => { entry.dataset.active = String(entry === button); });
    renderLibrary();
  }));
  els.libraryType.addEventListener("change", () => els.equipmentTabButtons.forEach((button) => { button.dataset.active = String(button.dataset.equipmentType === els.libraryType.value); }));
  els.createLibrary.addEventListener("click", () => openLibraryEditor());
  els.editorClose.addEventListener("click", () => els.libraryDialog.close());
  els.libraryGrid.addEventListener("click", async (event) => {
    const template = event.target.closest("[data-library-template]");
    const archive = event.target.closest("[data-library-archive]");
    if (template) openLibraryEditor(currentLibraryView[Number(template.dataset.libraryTemplate)]);
    if (archive) {
      try { await api(`/content/${archive.dataset.libraryArchive}`, { method: "DELETE" }); await openLibrary(libraryKind); showToast("Record archived."); } catch (error) { showToast(error.message); }
    }
  });
  els.libraryForm.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = new FormData(els.libraryForm); const data = { description: form.get("description") };
    editorFieldMap[editorKind].forEach(([name, , type]) => { const value = form.get(name); if (value !== "") data[name] = type === "number" ? Number(value) : value; });
    const id = form.get("id");
    try { await api(id ? `/content/${id}` : "/content", { method: id ? "PUT" : "POST", body: JSON.stringify({ kind: editorKind, name: form.get("name"), source: form.get("source") || "Custom", data }) }); els.libraryDialog.close(); await openLibrary(libraryKind); showToast("Saved to My Library."); } catch (error) { showToast(error.message); }
  });
  els.campaignCreate.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(els.campaignCreate);
    try {
      await api("/campaigns", { method: "POST", body: JSON.stringify({ name: form.get("name"), notes: "" }) });
      els.campaignCreate.reset();
      await renderCampaigns();
      showToast("Campaign created.");
    } catch (error) {
      showToast(error.message);
    }
  });
  els.backCampaigns.addEventListener("click", () => { els.campaignWorkspace.hidden = true; els.vtt.hidden = true; els.gmHome.hidden = false; activeCampaign = null; renderCampaigns(); });
  els.campaignPlanner.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(els.campaignPlanner);
    try {
      activeCampaign = await api(`/campaigns/${activeCampaign.id}`, { method: "PUT", body: JSON.stringify({ name: form.get("name"), notes: activeCampaign.notes || "", session_notes: activeCampaign.session_notes || [], session_number: Number(form.get("session_number")), next_session_at: form.get("next_session_at") ? new Date(form.get("next_session_at")).toISOString() : null }) });
      els.campaignTitle.textContent = activeCampaign.name; showToast("Campaign saved."); renderCampaignRoster();
    } catch (error) { showToast(error.message); }
  });
  els.addExistingPlayer.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = new FormData(els.addExistingPlayer).get("username");
    if (!username) return;
    try { await api(`/campaigns/${activeCampaign.id}/members`, { method: "POST", body: JSON.stringify({ username, status: "active" }) }); await openCampaign(activeCampaign.id); showToast("Player added."); } catch (error) { showToast(error.message); }
  });
  els.openInvitePlayer.addEventListener("click", () => { els.createPlayer.reset(); els.playerDialog.showModal(); });
  els.playerDialogClose.addEventListener("click", () => els.playerDialog.close());
  els.createPlayer.addEventListener("submit", async (event) => { event.preventDefault(); const form = new FormData(els.createPlayer); try { const player = await api("/players", { method: "POST", body: JSON.stringify({ username: form.get("username"), password: form.get("password"), display_name: form.get("display_name") || "" }) }); await api(`/campaigns/${activeCampaign.id}/members`, { method: "POST", body: JSON.stringify({ username: player.username, status: "active" }) }); els.playerDialog.close(); await openCampaign(activeCampaign.id); showToast("Player account created and added."); } catch (error) { showToast(error.message); } });
  els.campaignNotesForm.addEventListener("submit", async (event) => { event.preventDefault(); const notes = new FormData(els.campaignNotesForm).get("notes"); try { activeCampaign = await api(`/campaigns/${activeCampaign.id}`, { method: "PUT", body: JSON.stringify({ name: activeCampaign.name, notes, session_notes: activeCampaign.session_notes || [], session_number: activeCampaign.session_number || 1, next_session_at: activeCampaign.next_session_at }) }); renderCampaignRoster(); showToast("Campaign notes saved."); } catch (error) { showToast(error.message); } });
  els.addCharacter.addEventListener("submit", async (event) => {
    event.preventDefault();
    const characterId = Number(new FormData(els.addCharacter).get("character_id"));
    if (!characterId) return;
    try { await api(`/campaigns/${activeCampaign.id}/characters`, { method: "POST", body: JSON.stringify({ character_id: characterId }) }); await openCampaign(activeCampaign.id); showToast("Character added."); } catch (error) { showToast(error.message); }
  });
  els.memberList.addEventListener("click", async (event) => { const view = event.target.closest("[data-view-campaign-character]"); const removeCharacter = event.target.closest("[data-remove-character]"); const remove = event.target.closest("[data-remove-member]"); if (view) { const character = activeCampaign.characters.find((item) => item.id === Number(view.dataset.viewCampaignCharacter)); if (!character) return; const sheet = character.sheet || {}; els.characterPopoutBody.innerHTML = `<div class="dh-section-head"><div><p class="dh-kicker">Player Character</p><h2>${escapeHtml(character.name)}</h2></div></div><div class="dh-character-popout-grid"><p><strong>Player:</strong> ${escapeHtml(activeCampaign.members.find((member) => member.user.id === character.owner_id)?.user.display_name || "—")}</p><p><strong>Level:</strong> ${character.level}</p><p><strong>Class:</strong> ${escapeHtml(character.display_names?.class || character.mechanics?.class || sheet.displayClassName || sheet.className || "—")}</p><p><strong>Heritage:</strong> ${escapeHtml(character.display_names?.ancestry || sheet.displayAncestry || sheet.ancestry || "—")}</p><p><strong>HP:</strong> ${sheet.marks?.hp || 0}/${sheet.hp || character.mechanics?.hp || "—"}</p><p><strong>Stress:</strong> ${sheet.marks?.stress || 0}/${sheet.stress || character.mechanics?.stress || "—"}</p><p><strong>Armor:</strong> ${sheet.marks?.armor || 0}/${sheet.armorScore || character.mechanics?.armorScore || "—"}</p><p><strong>Domains:</strong> ${escapeHtml((sheet.domains || character.mechanics?.domains || []).join(" & ") || "—")}</p></div>`; els.characterPopout.showModal(); return; } if (removeCharacter) { try { await api(`/campaigns/${activeCampaign.id}/characters/${removeCharacter.dataset.removeCharacter}`, { method: "DELETE" }); await openCampaign(activeCampaign.id); } catch (error) { showToast(error.message); } return; } if (!remove) return; try { await api(`/campaigns/${activeCampaign.id}/members/${remove.dataset.removeMember}`, { method: "DELETE" }); await openCampaign(activeCampaign.id); } catch (error) { showToast(error.message); } });
  els.characterPopoutClose.addEventListener("click", () => els.characterPopout.close());
  els.assignedList.addEventListener("click", async (event) => { const button = event.target.closest("[data-remove-character]"); if (!button) return; try { await api(`/campaigns/${activeCampaign.id}/characters/${button.dataset.removeCharacter}`, { method: "DELETE" }); await openCampaign(activeCampaign.id); } catch (error) { showToast(error.message); } });
  els.launchGame.addEventListener("click", launchVtt);
  els.backCampaign.addEventListener("click", () => { els.vtt.hidden = true; els.campaignWorkspace.hidden = false; els.brandTitle.textContent = "GM Toolbox"; els.portalTitle.textContent = "GM Toolbox"; });
  els.sessionNotes.addEventListener("input", () => {
    tableRecord.gm_state.notes = els.sessionNotes.value;
    window.clearTimeout(els.sessionNotes.saveTimer);
    els.sessionNotes.saveTimer = window.setTimeout(saveTable, 500);
  });
  els.endSession.addEventListener("click", async () => {
    const sessionNumber = activeCampaign.session_number || 1;
    if (!window.confirm(`End Session ${sessionNumber} and archive its notes?`)) return;
    const notes = els.sessionNotes.value.trim();
    const sessionNotes = [...(activeCampaign.session_notes || []), { session_number: sessionNumber, played_on: new Date().toISOString().slice(0, 10), notes }];
    try {
      tableRecord.gm_state.notes = "";
      await saveTable();
      activeCampaign = await api(`/campaigns/${activeCampaign.id}`, { method: "PUT", body: JSON.stringify({ name: activeCampaign.name, notes: activeCampaign.notes || "", session_notes: sessionNotes, session_number: sessionNumber + 1, next_session_at: activeCampaign.next_session_at }) });
      showToast(`Session ${sessionNumber} saved.`);
      await openCampaign(activeCampaign.id);
    } catch (error) { showToast(error.message); }
  });
  els.fearPlus.addEventListener("click", () => { tableRecord.public_state.fear = Math.min(12, (tableRecord.public_state.fear || 0) + 1); renderVtt(); saveTable(); });
  els.fearMinus.addEventListener("click", () => { tableRecord.public_state.fear = Math.max(0, (tableRecord.public_state.fear || 0) - 1); renderVtt(); saveTable(); });
  els.fearBeads.addEventListener("click", (event) => { if (!event.target.closest("[data-spend-fear]")) return; tableRecord.public_state.fear = Math.max(0, (tableRecord.public_state.fear || 0) - 1); renderVtt(); saveTable(); });
  els.addCountdown.addEventListener("click", () => { els.countdownForm.reset(); els.countdownDialog.showModal(); });
  els.countdownClose.addEventListener("click", () => els.countdownDialog.close());
  els.countdownForm.addEventListener("submit", (event) => { event.preventDefault(); const form = new FormData(els.countdownForm); const maximum = Number(form.get("die")); tableRecord.public_state.countdowns = [...(tableRecord.public_state.countdowns || []), { name: form.get("name"), current: maximum, maximum }]; els.countdownDialog.close(); renderVtt(); saveTable(); });
  els.countdownList.addEventListener("click", (event) => { const button = event.target.closest("[data-countdown]"); if (!button) return; const index = Number(button.dataset.countdown); const item = tableRecord.public_state.countdowns[index]; if ((item.current ?? item.maximum) <= 1) tableRecord.public_state.countdowns.splice(index, 1); else item.current = (item.current ?? item.maximum) - 1; renderVtt(); saveTable(); });
  els.gridBuilder.addEventListener("submit", (event) => { event.preventDefault(); const form = new FormData(els.gridBuilder); tableRecord.public_state.grid = { columns: Math.max(4, Math.min(20, Number(form.get("columns")))), rows: Math.max(4, Math.min(20, Number(form.get("rows")))), cell_feet: 5 }; renderVtt(); saveTable(); });
  els.addAdversary.addEventListener("click", () => openPicker("adversary"));
  els.vttAdversaries.addEventListener("click", (event) => { const remove = event.target.closest("[data-remove-adversary]"); const toggle = event.target.closest("[data-toggle-adversary-map]"); const mark = event.target.closest("[data-adversary-mark]"); if (remove) { const item = tableRecord.gm_state.adversaries[Number(remove.dataset.removeAdversary)]; tableRecord.public_state.tokens = (tableRecord.public_state.tokens || []).filter((token) => token.adversaryId !== item.instanceId); tableRecord.gm_state.adversaries.splice(Number(remove.dataset.removeAdversary), 1); renumberAdversaries(); } else if (toggle) { const item = tableRecord.gm_state.adversaries[Number(toggle.dataset.toggleAdversaryMap)]; const tokens = tableRecord.public_state.tokens || []; const existing = tokens.find((token) => token.adversaryId === item.instanceId); tableRecord.public_state.tokens = existing ? tokens.filter((token) => token !== existing) : [...tokens, { id: `token-${item.instanceId}`, adversaryId: item.instanceId, name: item.name, kind: "adversary", x: 1, y: 1 }]; } else if (mark) { const item = tableRecord.gm_state.adversaries[Number(mark.dataset.index)]; const [track, amount] = mark.dataset.adversaryMark.split(":"); const key = `${track}Marked`; item[key] = Math.max(0, Math.min(item[track] || 0, (item[key] || 0) + Number(amount))); } else return; renderVtt(); saveTable(); });
  els.addEnvironment.addEventListener("click", () => openPicker("environment"));
  els.environmentList.addEventListener("click", (event) => { const button = event.target.closest("[data-remove-environment]"); if (!button) return; tableRecord.public_state.environments.splice(Number(button.dataset.removeEnvironment), 1); renderVtt(); saveTable(); });
  els.pickerClose.addEventListener("click", () => els.pickerDialog.close());
  [els.pickerSearch, els.pickerType, els.pickerTier].forEach((control) => control.addEventListener(control === els.pickerSearch ? "input" : "change", renderPicker));
  els.pickerResults.addEventListener("click", (event) => { const button = event.target.closest("[data-picker-id]"); if (!button) return; const item = pickerRecords.find((record) => record._pickerId === button.dataset.pickerId); if (!item) return; const copy = JSON.parse(JSON.stringify(item)); delete copy._pickerId; if (pickerKind === "adversary") { copy.baseName = copy.name; copy.hpMarked = 0; copy.stressMarked = 0; tableRecord.gm_state.adversaries = [...(tableRecord.gm_state.adversaries || []), copy]; renumberAdversaries(); } else tableRecord.public_state.environments = [...(tableRecord.public_state.environments || []), copy]; els.pickerDialog.close(); renderVtt(); saveTable(); });
  els.battleGrid.addEventListener("click", (event) => { const tokenButton = event.target.closest("[data-map-token]"); const cell = event.target.closest("[data-grid-x]"); if (tokenButton) { selectedMapTokenId = selectedMapTokenId === tokenButton.dataset.mapToken ? "" : tokenButton.dataset.mapToken; renderVtt(); return; } if (cell && selectedMapTokenId) { const token = (tableRecord.public_state.tokens || []).find((item) => item.id === selectedMapTokenId); if (token) { token.x = Number(cell.dataset.gridX); token.y = Number(cell.dataset.gridY); selectedMapTokenId = ""; renderVtt(); saveTable(); } } });
  els.battleGrid.addEventListener("dragstart", (event) => { const token = event.target.closest("[data-map-token]"); if (token) event.dataTransfer.setData("text/plain", token.dataset.mapToken); });
  els.battleGrid.addEventListener("dragover", (event) => { if (event.target.closest("[data-grid-x]")) event.preventDefault(); });
  els.battleGrid.addEventListener("drop", (event) => { const cell = event.target.closest("[data-grid-x]"); if (!cell) return; event.preventDefault(); const token = (tableRecord.public_state.tokens || []).find((item) => item.id === event.dataTransfer.getData("text/plain")); if (!token) return; token.x = Number(cell.dataset.gridX); token.y = Number(cell.dataset.gridY); renderVtt(); saveTable(); });
  window.addEventListener("resize", () => { if (tableRecord && !els.vtt.hidden) sizeBattleGrid(tableRecord.public_state.grid || { columns: 16, rows: 12 }); });
  els.playerCampaign.addEventListener("change", () => loadPlayerTable(Number(els.playerCampaign.value)));
  els.playerTokenCharacter.addEventListener("change", renderPlayerSheet);
  els.placePlayerToken.addEventListener("click", () => { playerPlacementMode = true; els.playerMapHelp.textContent = "Choose a square for your character token."; });
  els.playerGrid.addEventListener("click", async (event) => {
    const cell = event.target.closest("[data-player-grid-x]"); const characterId = Number(els.playerTokenCharacter.value);
    if (!cell || !characterId || !playerPlacementMode) return;
    try {
      playerTableRecord = await api(`/campaigns/${playerCampaign.id}/player-token`, { method: "PUT", body: JSON.stringify({ expected_revision: playerTableRecord.revision, character_id: characterId, x: Number(cell.dataset.playerGridX), y: Number(cell.dataset.playerGridY) }) });
      playerPlacementMode = false; els.playerMapHelp.textContent = "Select your character, click Place / Move Token, then choose a square."; renderPlayerTable();
    } catch (error) { showToast(error.message); await loadPlayerTable(playerCampaign.id); }
  });
  els.playerSheet.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-player-mark]"); if (!button) return;
    const characterId = Number(els.playerTokenCharacter.value); const record = playerCampaign?.characters?.find((item) => item.id === characterId); if (!record) return;
    const [track, amount] = button.dataset.playerMark.split(":"); const sheet = { ...(record.sheet || {}), marks: { hp: 0, stress: 0, armor: 0, hope: 2, ...(record.sheet?.marks || {}) } };
    const maximum = Number(track === "armor" ? sheet.armorScore || record.mechanics?.armorScore || 0 : sheet[track] || record.mechanics?.[track] || (track === "hope" ? 6 : 6));
    sheet.marks[track] = Math.max(0, Math.min(maximum, sheet.marks[track] + Number(amount)));
    record.sheet = sheet; renderPlayerSheet();
    try { const saved = await api(`/characters/${record.id}`, { method: "PUT", body: JSON.stringify(playerCharacterPayload(record, sheet)) }); Object.assign(record, saved); } catch (error) { showToast(error.message); }
  });
  els.tabButtons.forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.dhTab === "builder") {
      builderMode = "build";
      builderStep = 0;
      if (!builderDraft) builderDraft = newDraft();
    }
    showPanel(button.dataset.dhTab);
  }));
  els.startBuilder.addEventListener("click", () => {
    localStorage.removeItem(keys.activeId);
    builderDraft = newDraft();
    builderStep = 0;
    builderMode = "build";
    showPanel("builder");
  });
  els.saveCharacter.addEventListener("click", saveCurrentCharacter);
  els.builder.addEventListener("input", (event) => {
    const target = event.target;
    if (target.dataset.draft) builderDraft[target.dataset.draft] = target.value;
    if (target.dataset.experience) builderDraft.experiences[Number(target.dataset.experience)] = target.value;
  });
  els.builder.addEventListener("change", (event) => {
    const target = event.target;
    if (target.dataset.draft) builderDraft[target.dataset.draft] = target.value;
    if (target.dataset.trait) builderDraft.traits[target.dataset.trait] = target.value;
    if (target.dataset.equipment) {
      const list = target.dataset.equipment === "armor" ? armors : weapons;
      builderDraft.equipment[target.dataset.equipment] = { ...list.find((entry) => entry.name === target.value) };
    }
    renderBuilder();
  });
  els.builder.addEventListener("click", (event) => {
    const classButton = event.target.closest("[data-class-choice]");
    const cardButton = event.target.closest("[data-card-choice]");
    const removeCard = event.target.closest("[data-remove-card]");
    const stepButton = event.target.closest("[data-builder-step]");
    const back = event.target.closest("[data-builder-back]");
    const next = event.target.closest("[data-builder-next]");
    if (classButton) {
      builderDraft.className = classButton.dataset.classChoice;
      builderDraft.subclass = classes[builderDraft.className].subclasses[0];
      builderDraft.displayClassName = "";
      builderDraft.displaySubclass = "";
      builderDraft.selectedCards = [];
      renderBuilder();
    }
    if (cardButton) {
      const name = cardButton.dataset.cardChoice;
      if (builderDraft.selectedCards.includes(name)) builderDraft.selectedCards = builderDraft.selectedCards.filter((card) => card !== name);
      else if (builderDraft.selectedCards.length < 2) builderDraft.selectedCards.push(name);
      renderBuilder();
    }
    if (removeCard) {
      builderDraft.selectedCards.splice(Number(removeCard.dataset.removeCard), 1);
      renderBuilder();
    }
    if (stepButton) {
      builderStep = Number(stepButton.dataset.builderStep);
      renderBuilder();
    }
    if (back) {
      builderStep = Math.max(0, builderStep - 1);
      renderBuilder();
    }
    if (next) {
      if (builderStep === 3 && !traitAssignmentsAreValid()) {
        showToast("Use each trait value exactly once.");
        return;
      }
      if (builderStep === 5 && builderDraft.selectedCards.length < 2) {
        showToast("Choose two cards for the table.");
        return;
      }
      if (builderStep === steps.length - 1) saveCurrentCharacter();
      else {
        builderStep += 1;
        renderBuilder();
      }
    }
  });
  document.querySelector("[data-dh-grab-seat]").addEventListener("click", () => showToast("Seat held. Campaign connection comes next."));

  bindTooltip();
  bindDiceRollers();
  showPortal();
})();
