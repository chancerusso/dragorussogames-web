const RULES_BASE = "/1e";
const CONTENT_BASE = "/content/1e";

const navItems = [
  { title: "Home", href: "/1e/" },
  { title: "Character Creation", href: "/1e/character-creation/" },
  { title: "Character Sheet", href: "/1e/character-sheet/" },
  { title: "Rules", href: "/1e/how-to-play/" },
  { title: "Races", href: "/1e/races/" },
  { title: "Classes", href: "/1e/classes/" },
  { title: "House Rules", href: "/1e/house-rules/" }
];

const sectionItems = {
  index: [
    ["Character Creation", "/1e/character-creation/", "Build a character step by step with rules, tables, and write-this-down guidance."],
    ["Rules", "/1e/how-to-play/", "Read the procedures for exploration, encounters, combat, magic, and advancement."],
    ["Races", "/1e/races/", "Use race references after reading the Race step."],
    ["Classes", "/1e/classes/", "Use class references after reading the Class step."],
    ["Character Sheet", "/1e/character-sheet/", "Download blank and fillable Drago Russo First Edition sheets."],
    ["House Rules", "/1e/house-rules/", "Read Drago Russo campaign changes separately from the baseline rules."]
  ],
  "character-sheet": [
    ["Character Sheet", "/1e/character-sheet/", "Download official Drago Russo Games First Edition sheets."],
    ["Character Creation", "/1e/character-creation/", "Use the rules flow before recording the sheet."],
    ["Languages", "/1e/character-creation/008-languages/", "Finish the character creation flow."],
    ["Start Here", "/1e/start-here/", "Read the First Edition orientation."]
  ],
  "character-creation": [
    ["Ability Scores", "/1e/character-creation/001-ability-scores/", "Roll six scores, assign them, and record your ability line."],
    ["Race", "/1e/character-creation/002-race/", "Choose ancestry, movement, vision, languages, restrictions, and race notes."],
    ["Class", "/1e/character-creation/003-class/", "Choose your adventuring role, hit die, advancement path, and class abilities."],
    ["Alignment", "/1e/character-creation/004-alignment/", "Choose the moral and cosmic direction of the character."],
    ["Starting Wealth", "/1e/character-creation/005-starting-wealth/", "Roll starting money before buying equipment."],
    ["Equipment", "/1e/character-creation/006-equipment/", "Buy armor, weapons, gear, and expedition supplies."],
    ["Hit Points", "/1e/character-creation/007-hit-points/", "Determine starting durability and record hit points."],
    ["Languages", "/1e/character-creation/008-languages/", "Record starting languages and any Intelligence-based choices."]
  ],
  races: [
    ["Races", "/1e/races/", "Race reference index."],
    ["Human", "/1e/races/human/", "Human race rules."],
    ["Dwarf", "/1e/races/dwarf/", "Dwarf race rules."],
    ["Elf", "/1e/races/elf/", "Elf race rules."],
    ["Gnome", "/1e/races/gnome/", "Gnome race rules."],
    ["Half-Elf", "/1e/races/half-elf/", "Half-Elf race rules."],
    ["Halfling", "/1e/races/halfling/", "Halfling race rules."],
    ["Half-Orc", "/1e/races/half-orc/", "Half-Orc race rules."]
  ],
  classes: [
    ["Classes", "/1e/classes/", "Class reference index."],
    ["Fighter", "/1e/classes/fighter/", "Fighter class rules."],
    ["Cleric", "/1e/classes/cleric/", "Cleric class rules."],
    ["Magic-User", "/1e/classes/magic-user/", "Magic-User class rules."],
    ["Thief", "/1e/classes/thief/", "Thief class rules."],
    ["Assassin", "/1e/classes/assassin/", "Assassin class rules."],
    ["Druid", "/1e/classes/druid/", "Druid class rules."],
    ["Illusionist", "/1e/classes/illusionist/", "Illusionist class rules."],
    ["Paladin", "/1e/classes/paladin/", "Paladin class rules."],
    ["Ranger", "/1e/classes/ranger/", "Ranger class rules."],
    ["Monk", "/1e/classes/monk/", "Monk class rules."],
    ["Bard", "/1e/classes/bard/", "Advanced / Special Entry class rules."]
  ],
  "how-to-play": [
    ["Time", "/1e/how-to-play/001-time/"],
    ["Movement", "/1e/how-to-play/002-movement/"],
    ["Exploration", "/1e/how-to-play/003-exploration/"],
    ["Encounters", "/1e/how-to-play/004-encounters/"],
    ["Surprise", "/1e/how-to-play/005-surprise/"],
    ["Initiative", "/1e/how-to-play/006-initiative/"],
    ["Combat", "/1e/how-to-play/007-combat/"],
    ["Magic", "/1e/how-to-play/008-magic/"],
    ["Death", "/1e/how-to-play/009-death/"],
    ["Experience", "/1e/how-to-play/010-experience/"]
  ],
  "house-rules": [
    ["Character Rules", "/1e/house-rules/001-character-rules/"],
    ["Combat Rules", "/1e/house-rules/002-combat-rules/"],
    ["Rest Rules", "/1e/house-rules/003-rest-rules/"],
    ["Encumbrance", "/1e/house-rules/004-encumbrance/"],
    ["Death Rules", "/1e/house-rules/005-death-rules/"],
    ["Table Rules", "/1e/house-rules/006-table-rules/"]
  ],
  procedures: [
    ["Dungeon Turn", "/1e/procedures/001-dungeon-turn/"],
    ["Marching Order", "/1e/procedures/002-marching-order/"],
    ["Watches", "/1e/procedures/003-watches/"],
    ["Camping", "/1e/procedures/004-camping/"],
    ["Roles", "/1e/procedures/005-roles/"],
    ["Mapping", "/1e/procedures/006-mapping/"],
    ["Treasure Handling", "/1e/procedures/007-treasure-handling/"]
  ],
};

const pageAliases = {
  "/1e": "index",
  "/1e/": "index",
  "/1e/character-creation/alignment/": "character-creation/alignment",
  "/1e/character-creation/starting-wealth/": "character-creation/starting-wealth",
  "/1e/character-creation/equipment/": "character-creation/equipment",
  "/1e/character-creation/hit-points/": "character-creation/hit-points",
  "/1e/character-creation/languages/": "character-creation/languages"
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
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isTableSeparator(line) {
  const cells = parseTableRow(line);
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function isTableRow(line) {
  return line.includes("|") && parseTableRow(line).length > 1 && !isTableSeparator(line);
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
  const columnCount = header.length;
  const body = rows.slice(2).map((row) => {
    const cells = parseTableRow(row);
    return Array.from({ length: columnCount }, (_, index) => cells[index] || "");
  });

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
      const columnCount = parseTableRow(line).length;
      index += 2;

      while (
        index < lines.length
      ) {
        const tableLine = lines[index].trim();
        if (!tableLine) {
          const nextTableLine = lines[index + 1]?.trim() || "";
          if (isTableRow(nextTableLine) && parseTableRow(nextTableLine).length === columnCount) {
            index += 1;
            continue;
          }
          break;
        }

        if (!isTableRow(tableLine) || parseTableRow(tableLine).length !== columnCount) break;

        tableRows.push(tableLine);
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

    if (/^[A-Za-z][A-Za-z0-9 /&'()?-]{1,48}:$/.test(line)) {
      closeList();
      html.push(`<p class="one-e-field-label">${inlineMarkdown(line.slice(0, -1))}</p>`);
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
  "thief",
  "monk",
  "bard"
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
  const navHeadings = article.querySelectorAll("#race-navigation, #class-navigation, #choose-your-next-step, #character-creation-path, #equipment-categories, #previous-next, #continue, #record-your-character");

  for (const heading of navHeadings) {
    const list = heading.nextElementSibling;
    if (list?.tagName === "UL") {
      list.classList.add("one-e-anchor-nav");
    }

    if (heading.id === "equipment-categories") {
      heading.closest(".one-e-rule-panel")?.classList.add("one-e-sticky-panel");
    }
  }

  const comparisonSections = article.querySelectorAll("#race-comparison, #class-comparison, #standard-classes, #advanced-special-paths, #race-references");
  for (const heading of comparisonSections) {
    const section = heading.closest(".one-e-rule-panel");
    const list = section?.querySelector("ul");
    if (list) list.classList.add("one-e-comparison-grid");
  }
}

function enhanceSubcardPanels(article) {
  const panelIds = new Set(["alignment-choices", "recommended-starting-kits"]);

  for (const heading of article.querySelectorAll("h2")) {
    if (!panelIds.has(heading.id)) continue;

    const panel = heading.closest(".one-e-rule-panel");
    if (!panel) continue;

    panel.classList.add("one-e-subcard-panel");
    if (heading.id === "alignment-choices") panel.classList.add("one-e-alignment-panel");

    let node = heading.nextElementSibling;
    while (node) {
      if (node.tagName === "H2") break;
      if (node.tagName !== "H3") {
        node = node.nextElementSibling;
        continue;
      }

      const card = document.createElement("section");
      card.className = "one-e-subcard";
      node.before(card);

      while (node && node.tagName !== "H2" && !(node.tagName === "H3" && card.children.length > 0)) {
        const next = node.nextElementSibling;
        card.appendChild(node);
        node = next;
      }
    }
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

function enhancePdfLinks(article) {
  const links = article.querySelectorAll('a[href$=".pdf"]');

  for (const link of links) {
    link.classList.add("one-e-download-button");
    link.setAttribute("download", "");
    link.closest("ul")?.classList.add("one-e-download-list");
  }
}

function headingLevel(heading) {
  return Number(heading.tagName.slice(1));
}

function enhanceWriteThisDown(article) {
  const headings = article.querySelectorAll("#write-this-down");

  for (const heading of headings) {
    const panel = heading.closest(".one-e-rule-panel");
    if (panel) panel.classList.add("one-e-write-panel");
    heading.classList.add("one-e-write-heading");

    const notebook = document.createElement("div");
    notebook.className = "one-e-write-card";
    heading.after(notebook);

    const level = headingLevel(heading);
    let node = notebook.nextElementSibling;

    while (node && !(node.matches("h1, h2, h3") && headingLevel(node) <= level)) {
      const next = node.nextElementSibling;
      notebook.appendChild(node);
      node = next;
    }
  }
}

function enhanceMarkdownUi(article) {
  wrapRulePanels(article);
  enhanceChapterNavigation(article);
  enhanceSubcardPanels(article);
  enhanceWriteThisDown(article);
  enhancePdfLinks(article);
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

function renderSectionCards(slug) {
  const target = document.querySelector("[data-section-cards]");
  if (!target) return;

  if (slug === "classes" || slug === "character-sheet") {
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
      <h1>Page Not Found</h1>
      <p>This First Edition page is not available.</p>
    `;
    console.error(error);
  }

  renderSectionCards(slug);
}

loadPage();
