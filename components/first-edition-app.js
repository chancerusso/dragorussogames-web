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
  { title: "Downloads", href: "/1e/downloads/" }
];

const sectionItems = {
  index: [
    ["Character Creation", "/1e/character-creation/"],
    ["How To Play", "/1e/how-to-play/"],
    ["House Rules", "/1e/house-rules/"],
    ["Downloads", "/1e/downloads/"]
  ],
  "character-creation": [
    ["001 Ability Scores", "/1e/character-creation/001-ability-scores/"],
    ["002 Race", "/1e/character-creation/002-race/"],
    ["003 Class", "/1e/character-creation/003-class/"],
    ["004 Alignment", "/1e/character-creation/004-alignment/"],
    ["005 Starting Wealth", "/1e/character-creation/005-starting-wealth/"],
    ["006 Equipment", "/1e/character-creation/006-equipment/"],
    ["007 Hit Points", "/1e/character-creation/007-hit-points/"],
    ["008 Languages", "/1e/character-creation/008-languages/"],
    ["009 Final Character", "/1e/character-creation/009-final-character/"]
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

  function closeList() {
    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
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
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  closeList();
  return html.join("\n");
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

  const items = sectionItems[slug];
  if (!items) {
    target.innerHTML = "";
    return;
  }

  target.innerHTML = items
    .map(([title, href]) => `
      <a class="one-e-card link-card" href="${href}">
        <p class="tag">Placeholder</p>
        <h3>${title}</h3>
        <p>Markdown scaffold ready for this page.</p>
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
