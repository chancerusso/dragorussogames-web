const RULES_BASE = "/1e";
const CONTENT_BASE = "/content/1e";

const navItems = [
  { title: "Home", href: "/1e/" },
  { title: "Start Here", href: "/1e/start-here/" },
  { title: "Character Creation", href: "/1e/character-creation/" },
  { title: "How To Play", href: "/1e/how-to-play/" },
  { title: "House Rules", href: "/1e/house-rules/" },
  { title: "Procedures", href: "/1e/procedures/" },
  { title: "Reference", href: "/1e/reference/" },
  { title: "Races", href: "/1e/races/" },
  { title: "Classes", href: "/1e/classes/" },
  { title: "Downloads", href: "/1e/downloads/" }
];

const sectionItems = {
  index: [
    ["Character Creation", "/1e/character-creation/", "Build a character step by step with rules, tables, and write-this-down guidance."],
    ["How To Play", "/1e/how-to-play/", "Use the table procedures for exploration, encounters, combat, magic, and advancement."],
    ["House Rules", "/1e/house-rules/", "Read Drago Russo campaign changes separately from the baseline rules."],
    ["Downloads", "/1e/downloads/", "Find printable sheets and table aids as they become available."]
  ],
  "character-creation": [
    ["001 Ability Scores", "/1e/character-creation/001-ability-scores/", "Roll six scores, assign them, and record your ability line."],
    ["002 Race", "/1e/character-creation/002-race/", "Choose ancestry, movement, vision, languages, restrictions, and race notes."],
    ["003 Class", "/1e/character-creation/003-class/", "Choose your adventuring role, hit die, advancement path, and class abilities."],
    ["004 Alignment", "/1e/character-creation/004-alignment/", "Choose the moral and cosmic direction of the character."],
    ["005 Starting Wealth", "/1e/character-creation/005-starting-wealth/", "Roll starting money before buying equipment."],
    ["006 Equipment", "/1e/character-creation/006-equipment/", "Buy armor, weapons, gear, and expedition supplies."],
    ["007 Hit Points", "/1e/character-creation/007-hit-points/", "Determine starting durability and record hit points."],
    ["008 Languages", "/1e/character-creation/008-languages/", "Record starting languages and any Intelligence-based choices."],
    ["009 Final Character", "/1e/character-creation/009-final-character/", "Review the sheet before the character enters play."]
  ],
  races: [
    ["Race Index", "/1e/races/", "Reference stubs for race pages."],
    ["Human", "/1e/races/human/", "Future complete Human reference."],
    ["Dwarf", "/1e/races/dwarf/", "Future complete Dwarf reference."],
    ["Elf", "/1e/races/elf/", "Future complete Elf reference."],
    ["Gnome", "/1e/races/gnome/", "Future complete Gnome reference."],
    ["Half-Elf", "/1e/races/half-elf/", "Future complete Half-Elf reference."],
    ["Halfling", "/1e/races/halfling/", "Future complete Halfling reference."],
    ["Half-Orc", "/1e/races/half-orc/", "Future complete Half-Orc reference."]
  ],
  classes: [
    ["Class Index", "/1e/classes/", "Reference stubs for class pages."],
    ["Fighter", "/1e/classes/fighter/", "Future complete Fighter reference."],
    ["Cleric", "/1e/classes/cleric/", "Future complete Cleric reference."],
    ["Magic-User", "/1e/classes/magic-user/", "Future complete Magic-User reference."],
    ["Thief", "/1e/classes/thief/", "Future complete Thief reference."],
    ["Assassin", "/1e/classes/assassin/", "Future complete Assassin reference."],
    ["Druid", "/1e/classes/druid/", "Future complete Druid reference."],
    ["Illusionist", "/1e/classes/illusionist/", "Future complete Illusionist reference."],
    ["Paladin", "/1e/classes/paladin/", "Future complete Paladin reference."],
    ["Ranger", "/1e/classes/ranger/", "Future complete Ranger reference."],
    ["Monk", "/1e/classes/monk/", "Future complete Monk reference."],
    ["Bard", "/1e/classes/bard/", "Advanced/special path reference."]
  ],
  "how-to-play": [
    ["001 Time", "/1e/how-to-play/001-time/"],
    ["002 Movement", "/1e/how-to-play/002-movement/"],
    ["003 Exploration", "/1e/how-to-play/003-exploration/"],
    ["004 Encounters", "/1e/how-to-play/004-encounters/"],
    ["005 Surprise", "/1e/how-to-play/005-surprise/"],
    ["006 Initiative", "/1e/how-to-play/006-initiative/"],
    ["007 Combat", "/1e/how-to-play/007-combat/"],
    ["008 Magic", "/1e/how-to-play/008-magic/"],
    ["009 Death", "/1e/how-to-play/009-death/"],
    ["010 Experience", "/1e/how-to-play/010-experience/"]
  ],
  "house-rules": [
    ["001 Character Rules", "/1e/house-rules/001-character-rules/"],
    ["002 Combat Rules", "/1e/house-rules/002-combat-rules/"],
    ["003 Rest Rules", "/1e/house-rules/003-rest-rules/"],
    ["004 Encumbrance", "/1e/house-rules/004-encumbrance/"],
    ["005 Death Rules", "/1e/house-rules/005-death-rules/"],
    ["006 Table Rules", "/1e/house-rules/006-table-rules/"]
  ],
  procedures: [
    ["001 Dungeon Turn", "/1e/procedures/001-dungeon-turn/"],
    ["002 Marching Order", "/1e/procedures/002-marching-order/"],
    ["003 Watches", "/1e/procedures/003-watches/"],
    ["004 Camping", "/1e/procedures/004-camping/"],
    ["005 Roles", "/1e/procedures/005-roles/"],
    ["006 Mapping", "/1e/procedures/006-mapping/"],
    ["007 Treasure Handling", "/1e/procedures/007-treasure-handling/"]
  ],
  reference: [
    ["Classes", "/1e/reference/#classes"],
    ["Races", "/1e/reference/#races"],
    ["Equipment", "/1e/reference/#equipment"],
    ["Conditions", "/1e/reference/#conditions"],
    ["Glossary", "/1e/reference/#glossary"]
  ]
};

const downloadItems = [
  ["Character Sheet (Full)", "Traditional complete character sheet.", "/public/downloads/character-sheet-full.pdf"],
  ["Character Sheet (Session)", "One-page play aid for active sessions.", "/public/downloads/character-sheet-session.pdf"],
  ["Party Tracker", "Shared party state and expedition tracker.", "/public/downloads/party-tracker.pdf"],
  ["Inventory Sheet", "Inventory and encumbrance worksheet.", "/public/downloads/inventory-sheet.pdf"],
  ["Campaign Log", "Campaign notes, sessions, and discoveries.", "/public/downloads/campaign-log.pdf"]
];

const pageAliases = {
  "/1e": "index",
  "/1e/": "index"
};

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isTableSeparator(line) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line);
}

function isTableRow(line) {
  return line.includes("|") && !isTableSeparator(line);
}

function parseTableRow(line) {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function tableToHtml(rows) {
  const header = parseTableRow(rows[0]);
  const body = rows.slice(2).map(parseTableRow);

  return `
<div class="one-e-table-wrap" role="region" aria-label="Scrollable rules table" tabindex="0">
  <table>
    <thead>
      <tr>${header.map((cell) => `<th scope="col">${inlineMarkdown(cell)}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${body
        .map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`)
        .join("\n")}
    </tbody>
  </table>
</div>`;
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let listOpen = false;
  let orderedListOpen = false;

  function closeList() {
    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }
    if (orderedListOpen) {
      html.push("</ol>");
      orderedListOpen = false;
    }
  }

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (!line) {
      closeList();
      continue;
    }

    const nextLine = lines[index + 1]?.trim() || "";
    if (isTableRow(line) && isTableSeparator(nextLine)) {
      closeList();
      const tableRows = [line, nextLine];
      index += 2;

      while (index < lines.length && isTableRow(lines[index].trim())) {
        tableRows.push(lines[index].trim());
        index += 1;
      }

      index -= 1;
      html.push(tableToHtml(tableRows));
      continue;
    }

    if (line.startsWith("### ")) {
      closeList();
      const heading = line.slice(4);
      html.push(`<h3 id="${slugify(heading)}">${inlineMarkdown(heading)}</h3>`);
      continue;
    }

    if (line.startsWith("## ")) {
      closeList();
      const heading = line.slice(3);
      html.push(`<h2 id="${slugify(heading)}">${inlineMarkdown(heading)}</h2>`);
      continue;
    }

    if (line.startsWith("# ")) {
      closeList();
      const heading = line.slice(2);
      html.push(`<h1 id="${slugify(heading)}">${inlineMarkdown(heading)}</h1>`);
      continue;
    }

    if (line.startsWith("- ")) {
      if (orderedListOpen) {
        html.push("</ol>");
        orderedListOpen = false;
      }
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      if (listOpen) {
        html.push("</ul>");
        listOpen = false;
      }
      if (!orderedListOpen) {
        html.push("<ol>");
        orderedListOpen = true;
      }
      html.push(`<li>${inlineMarkdown(orderedMatch[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  closeList();
  return html.join("\n");
}

const detailIds = new Set([
  "human",
  "dwarf",
  "elf",
  "gnome",
  "half-elf",
  "halfling",
  "half-orc",
  "assassin",
  "cleric",
  "druid",
  "fighter",
  "illusionist",
  "magic-user",
  "paladin",
  "ranger",
  "thief"
]);

function wrapRulePanels(article) {
  const children = Array.from(article.children);
  let currentPanel = null;

  for (const child of children) {
    if (child.tagName === "H2") {
      currentPanel = document.createElement("section");
      currentPanel.className = detailIds.has(child.id)
        ? "one-e-rule-panel one-e-detail-panel"
        : "one-e-rule-panel";
      child.before(currentPanel);
    }

    if (currentPanel && child.tagName !== "H1") {
      currentPanel.appendChild(child);
    }
  }
}

function enhanceChapterNavigation(article) {
  const navHeadings = article.querySelectorAll("#race-navigation, #class-navigation, #choose-your-next-step, #character-creation-path");

  for (const heading of navHeadings) {
    const list = heading.nextElementSibling;
    if (list?.tagName === "UL") {
      list.classList.add("one-e-anchor-nav");
    }
  }

  const comparisonSections = article.querySelectorAll("#race-comparison, #class-comparison, #standard-classes, #advanced-special-paths, #race-references");
  for (const heading of comparisonSections) {
    const section = heading.closest(".one-e-rule-panel");
    const list = section?.querySelector("ul");
    if (list) list.classList.add("one-e-comparison-grid");
  }
}

function enhanceActiveAnchorNav(article) {
  const navLinks = Array.from(article.querySelectorAll(".one-e-anchor-nav a[href^='#']"));

  function updateActiveLink() {
    const activeHash = window.location.hash;
    for (const link of navLinks) {
      link.toggleAttribute("aria-current", activeHash && link.getAttribute("href") === activeHash);
    }
  }

  updateActiveLink();
  window.addEventListener("hashchange", updateActiveLink);
}

function enhanceMarkdownUi(article) {
  wrapRulePanels(article);
  enhanceChapterNavigation(article);
  enhanceActiveAnchorNav(article);
}

function currentSlug() {
  const path = window.location.pathname.replace(/\/+$/, "/");
  if (pageAliases[path]) return pageAliases[path];
  return path
    .replace(/^\/1e\/?/, "")
    .replace(/\/$/, "")
    .replace(/\/index$/, "") || "index";
}

function contentPath(slug) {
  return `${CONTENT_BASE}/${slug}.md`;
}

function topSection(slug) {
  return slug.split("/")[0];
}

function renderNav(slug) {
  const nav = document.querySelector("[data-rules-nav]");
  const active = topSection(slug);
  nav.innerHTML = navItems
    .map((item) => {
      const itemSlug = item.href.replace(/^\/1e\/?/, "").replace(/\/$/, "") || "index";
      const isActive = active === itemSlug || slug === itemSlug;
      return `<a ${isActive ? 'aria-current="page"' : ""} href="${item.href}">${item.title}</a>`;
    })
    .join("");
}

function renderSidebar(slug) {
  const sidebar = document.querySelector("[data-section-nav]");
  const section = topSection(slug);
  const items = sectionItems[section] || navItems.map((item) => [item.title, item.href]);

  sidebar.innerHTML = items
    .map(([title, href]) => `<a href="${href}">${title}</a>`)
    .join("");
}

function renderDownloads() {
  const target = document.querySelector("[data-downloads]");
  if (!target) return;

  target.innerHTML = downloadItems
    .map(([title, description, href]) => `
      <article class="one-e-card">
        <p class="tag">PDF Placeholder</p>
        <h3>${title}</h3>
        <p>${description}</p>
        <a class="btn ghost" href="${href}" aria-disabled="true">Coming Soon</a>
      </article>
    `)
    .join("");
}

function renderSectionCards(slug) {
  const target = document.querySelector("[data-section-cards]");
  if (!target) return;

  if (slug === "classes") {
    target.innerHTML = "";
    return;
  }

  const items = sectionItems[slug];
  if (!items) {
    target.innerHTML = "";
    return;
  }

  target.innerHTML = items
    .map(([title, href, description = "Open this rules page."]) => `
      <a class="one-e-card link-card" href="${href}">
        <p class="tag">Rules Chapter</p>
        <h3>${title}</h3>
        <p>${description}</p>
      </a>
    `)
    .join("");
}

async function loadPage() {
  const slug = currentSlug();
  const article = document.querySelector("[data-markdown]");

  renderNav(slug);
  renderSidebar(slug);

  try {
    const response = await fetch(contentPath(slug));
    if (!response.ok) throw new Error(`Missing markdown: ${slug}`);
    const markdown = await response.text();
    article.innerHTML = markdownToHtml(markdown);
    enhanceMarkdownUi(article);

    const title = article.querySelector("h1")?.textContent || "First Edition";
    document.title = `${title} | Drago Russo Games`;
  } catch (error) {
    article.innerHTML = `
      <h1>Page Placeholder</h1>
      <p>This route exists, but its Markdown file has not been added yet.</p>
      <h2>Rule Source</h2>
      <p>Pending.</p>
    `;
    console.error(error);
  }

  renderSectionCards(slug);
  renderDownloads();
}

loadPage();
