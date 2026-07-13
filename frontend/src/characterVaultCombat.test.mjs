import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const vaultSource = readFileSync(resolve(repoRoot, "components", "character-vault.js"), "utf8");
const vaultCss = readFileSync(resolve(repoRoot, "styles", "character-vault.css"), "utf8");

test("character sheet renders combat summary from runtime payload", () => {
  assert.match(vaultSource, /function combatSummaryHtml/);
  assert.match(vaultSource, /c\.combat\?\.runtime/);
  assert.match(vaultSource, /combatStatDetails\("THAC0"/);
  assert.match(vaultSource, /combatStatDetails\("TO HIT"/);
  assert.match(vaultSource, /combatStatDetails\("DAMAGE"/);
  assert.match(vaultSource, /combatStatDetails\("Armor Class"/);
  assert.match(vaultSource, /function armorClassFacingSummary/);
  assert.match(vaultSource, /flank_armor_class/);
  assert.match(vaultSource, /rear_armor_class/);
  assert.match(vaultSource, /combatStatDetails\("ATTACKS"/);
  assert.match(vaultSource, /combatStatDetails\("Move"/);
  assert.match(vaultSource, /combatStatDetails\("Enc"/);
  assert.match(vaultSource, /function thac0DetailsHtml/);
  assert.match(vaultSource, /function toHitDetailsHtml/);
  assert.match(vaultSource, /function damageDetailsHtml/);
  assert.match(vaultSource, /function attackRateDetailsHtml/);
  assert.doesNotMatch(vaultSource, /thac0_source/);
  assert.doesNotMatch(vaultSource, /attack_progression_ref/);
});

test("ability, armor class, saves, and encumbrance render backend breakdown payloads", () => {
  assert.match(vaultSource, /ability_breakdown/);
  assert.match(vaultSource, /armor_class_breakdown/);
  assert.match(vaultSource, /saves\.breakdown/);
  assert.match(vaultSource, /enc\.weight_movement/);
  assert.doesNotMatch(vaultSource, /function equippedArmor/);
  assert.doesNotMatch(vaultSource, /const armorAdjustment =/);
  assert.doesNotMatch(vaultSource, /const shieldAdjustment =/);
});

test("weapon cards expose runtime breakdown and illegal equipment state", () => {
  assert.match(vaultSource, /function weaponCardHtml/);
  assert.match(vaultSource, /calculations_disabled/);
  assert.match(vaultSource, /Illegal Equipment/);
  assert.match(vaultSource, /function modifierBreakdownHtml/);
  assert.match(vaultSource, /function damageBreakdownHtml/);
  assert.match(vaultSource, /vault-weapon-stat-block/);
  assert.doesNotMatch(vaultSource, /Runtime derived/);
});

test("builder weapon preview requests backend combat runtime", () => {
  assert.match(vaultSource, /data-preview-equipment/);
  assert.match(vaultSource, /combat-preview/);
  assert.match(vaultSource, /builderWeaponPreviewHtml/);
});

test("spell slot table renders backend remaining values without fallback arithmetic", () => {
  assert.match(vaultSource, /const remainingValue = remaining\[level\]/);
  assert.doesNotMatch(vaultSource, /Math\.max\(0, Number\(count\) - usedCount\)/);
});

test("combat presentation has responsive readable styles", () => {
  assert.match(vaultSource, /vault-sheet-layout/);
  assert.match(vaultSource, /vault-sheet-card/);
  assert.match(vaultSource, /vault-sheet-header-grid/);
  assert.match(vaultSource, /raceClassSummaryHtml/);
  assert.match(vaultCss, /\.vault-combat-summary/);
  assert.match(vaultCss, /\.vault-combat-body/);
  assert.match(vaultCss, /\.vault-weapon-card/);
  assert.match(vaultCss, /\.vault-weapon-stat-block/);
  assert.match(vaultCss, /\.vault-breakdown-list/);
  assert.match(vaultCss, /\.vault-ability-mods/);
  assert.match(vaultCss, /\.vault-saving-row summary/);
  assert.match(vaultCss, /@media \(max-width: 820px\)/);
});

test("top summary uses separate identity pills and concise ability labels", () => {
  assert.match(vaultSource, /vault-identity-pills/);
  assert.match(vaultSource, /\["Hit", runtime\.melee_to_hit/);
  assert.match(vaultSource, /\["Dmg", runtime\.melee_damage/);
  assert.doesNotMatch(vaultSource, /\["Carry", runtime\.carry_adjustment/);
  assert.match(vaultCss, /\.vault-identity-pills span/);
});

test("sheet top line shows constant combat stats and HP", () => {
  const headerMatch = vaultSource.match(/function sheetHeaderHtml\(c\) \{([\s\S]*?)function raceClassSummaryHtml/);
  assert.ok(headerMatch);
  const header = headerMatch[1];
  assert.match(header, /function hpSummary/);
  for (const label of ["XP", "HP", "AC", "THAC0", "Move", "Enc"]) {
    assert.match(header, new RegExp(`<strong>${label}<\\/strong>`));
  }
  assert.match(header, /encumbranceSummary\(c\)/);
  assert.doesNotMatch(header, /<strong>Load<\/strong>/);
  assert.doesNotMatch(header, /<strong>Day<\/strong>/);
  assert.doesNotMatch(header, /<strong>Status<\/strong>/);
  assert.match(vaultSource, /temporary_hp/);
  assert.match(vaultCss, /\.vault-topline\{[\s\S]*?grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
});

test("sheet header actions sit under the left combat summary", () => {
  const headerMatch = vaultSource.match(/function sheetHeaderHtml\(c\) \{([\s\S]*?)function raceClassSummaryHtml/);
  assert.ok(headerMatch);
  const header = headerMatch[1];
  assert.match(header, /vault-sheet-primary/);
  assert.match(header, /vault-actions vault-sheet-actions/);
  assert.ok(header.indexOf("vault-topline") < header.indexOf("vault-sheet-actions"));
  assert.ok(header.indexOf("vault-sheet-actions") < header.indexOf("vault-sheet-race-class"));
  assert.ok(header.indexOf("Open Details") > header.indexOf("vault-sheet-race-class"));
  assert.match(vaultCss, /\.vault-sheet-actions\{[\s\S]*?margin-top:10px/);
  assert.match(vaultCss, /\.vault-sheet-actions \.vault-button\{[\s\S]*?white-space:nowrap/);
  assert.match(vaultCss, /\.vault-hero-compact\{[\s\S]*?gap:8px/);
});

test("character sheet hierarchy is full-width and combat-centered", () => {
  const sheetMatch = vaultSource.match(/function sheetHtml\(c\) \{([\s\S]*?)function sheetSectionHeading/);
  assert.ok(sheetMatch);
  const sheet = sheetMatch[1];
  assert.match(sheet, /vault-sheet-abilities/);
  assert.match(sheet, /vault-sheet-combat/);
  assert.match(sheet, /vault-sheet-inventory/);
  assert.match(sheet, /vault-sheet-spells/);
  assert.match(sheet, /data-sheet-disclosure="spellsOpen"/);
  assert.match(sheet, /vault-sheet-notes/);
  assert.ok(sheet.indexOf("vault-sheet-combat") < sheet.indexOf("vault-sheet-inventory"));
  assert.ok(sheet.indexOf("vault-sheet-inventory") < sheet.indexOf("vault-sheet-spells"));
  assert.ok(sheet.indexOf("vault-sheet-spells") < sheet.indexOf("vault-sheet-notes"));
  assert.doesNotMatch(sheet, /vault-sheet-weapons/);
  assert.doesNotMatch(sheet, /vault-sheet-details/);
});

test("equipped weapons and saves live inside combat", () => {
  const combatMatch = vaultSource.match(/function combatSummaryHtml\(c\) \{([\s\S]*?)function combatStat/);
  assert.ok(combatMatch);
  const combat = combatMatch[1];
  assert.match(combat, /vault-combat-body/);
  assert.match(combat, /vault-equipped-weapons/);
  assert.match(combat, /equippedWeaponsHtml\(c\)/);
  assert.match(combat, /vault-combat-saves/);
  assert.match(combat, /savingThrowsHtml\(c\)/);
  assert.match(combat, /combatStatDetails\("Armor Class", armorClassFacingSummary\(c\)/);
  assert.match(combat, /combatStatDetails\("THAC0"/);
  assert.match(combat, /combatStatDetails\("TO HIT"/);
  assert.match(combat, /combatStatDetails\("DAMAGE"/);
  assert.match(combat, /combatStatDetails\("ATTACKS"/);
  assert.match(combat, /combatStatDetails\("Move"/);
  assert.match(combat, /combatStatDetails\("Enc"/);
  assert.doesNotMatch(combat, /combatStatDetails\("Load"/);
  assert.doesNotMatch(combat, /Armor Class"\)\}\$\{armorClassBreakdownHtml/);
  assert.doesNotMatch(combat, /Movement"\)\}\$\{movementEncumbranceHtml/);
});

test("combat breakdown panels open as compact popovers", () => {
  assert.match(vaultCss, /\.vault-combat-tile\[open\]/);
  assert.match(vaultCss, /\.vault-tile-details\{[\s\S]*?position:absolute/);
  assert.match(vaultCss, /\.vault-tile-details\{[\s\S]*?font-size:\.72rem/);
  assert.match(vaultCss, /\.vault-combat-tile:nth-last-child\(-n\+2\) \.vault-tile-details/);
});

test("armor class tile exposes standard flank and rear values", () => {
  assert.match(vaultSource, /function armorClassValue/);
  assert.match(vaultSource, /function armorClassFacingValues/);
  assert.match(vaultSource, /function armorClassFacingSummary/);
  assert.match(vaultSource, /calculatedFlankAc = finalAc - shieldFacingAdjustment/);
  assert.match(vaultSource, /calculatedRearAc = flankAc - dexterityFacingAdjustment/);
  assert.match(vaultSource, /`\$\{finalAc\} \/ \$\{flankAc\} \/ \$\{rearAc\}`/);
  assert.match(vaultSource, /\["Flank AC", facingAc\.flankAc/);
  assert.match(vaultSource, /\["Rear AC", facingAc\.rearAc/);
});

test("player sheet hero is compact and no longer says level up is coming soon", () => {
  assert.match(vaultSource, /playerCharacterPage = isPlayerCharacterMode\(\)/);
  assert.match(vaultSource, /dmPage \|\| playerCharacterPage \? "vault-hero-compact"/);
  assert.match(vaultCss, /\.vault-hero\.vault-hero-compact p\{/);
  assert.match(vaultCss, /white-space:nowrap/);
  assert.doesNotMatch(vaultSource, /Level Up tools coming soon/);
});

test("player sheet nav and level-up modal expose campaign-aware controls", () => {
  assert.match(vaultSource, /function isDragonlanceCampaignContext/);
  assert.match(vaultSource, /sourcebooks\.includes\("DRAGOLANCE"\)/);
  assert.match(vaultSource, /const dragonlanceReference = isDragonlanceCampaignContext\(\)/);
  assert.match(vaultSource, /data-level-up-save-xp/);
  assert.match(vaultSource, /Save XP \/ Refresh Preview/);
  assert.match(vaultSource, /Current XP/);
  assert.match(vaultSource, /function strictClassRulesHtml/);
  assert.match(vaultSource, /chosen at character creation for eligible non-human races/);
  assert.match(vaultSource, /human-only; the character stops advancing the original class/);
  assert.match(vaultCss, /\.vault-hero-compact \.vault-actions/);
});

test("weapon stat blocks place To Hit before Damage and omit zero detail rows", () => {
  const weaponMatch = vaultSource.match(/function weaponCardHtml\(runtime[\s\S]*?function statRow/);
  assert.ok(weaponMatch);
  const weapon = weaponMatch[0];
  assert.ok(weapon.indexOf('statRow("TO HIT"') < weapon.indexOf('statRow("DAMAGE"'));
  assert.match(vaultSource, /Number\(value \|\| 0\) !== 0/);
  assert.match(vaultSource, /\["Weapon", damage\.base_small_medium/);
  assert.match(vaultSource, /\["Final Damage", damage\.final_small_medium/);
});

test("equipped weapon cards are compact two-up cards with bounded text", () => {
  assert.match(vaultSource, /vault-equipped-weapon-grid/);
  assert.match(vaultCss, /\.vault-equipped-weapon-grid\{/);
  assert.match(vaultCss, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(vaultCss, /\.vault-weapon-head h3\{[\s\S]*?font-size:\.9rem/);
  assert.match(vaultCss, /\.vault-weapon-card\{[\s\S]*?overflow:hidden/);
  assert.match(vaultCss, /\.vault-weapon-stat-block\{[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(vaultCss, /overflow-wrap:anywhere/);
});

test("saves column can show compact daily magic summary", () => {
  assert.match(vaultSource, /dailyMagicSummaryHtml\(c\)/);
  assert.match(vaultSource, /function dailyMagicSummaryHtml/);
  assert.match(vaultSource, /function compactSpellSlotRows/);
  assert.match(vaultSource, /\$\{h\(row\.used\)\}\/\$\{h\(row\.total\)\} slots/);
  assert.match(vaultCss, /\.vault-daily-magic/);
  assert.match(vaultCss, /\.vault-magic-slot-list/);
  assert.match(vaultCss, /\.vault-prepared-spell-list/);
});

test("spell section is collapsible and tracks duplicate prepared spells", () => {
  const spellsMatch = vaultSource.match(/function spellsHtml\(c\) \{([\s\S]*?)function hasSpellSlots/);
  assert.ok(spellsMatch);
  const spells = spellsMatch[1];
  assert.ok(spells.indexOf("Prepared Spells") < spells.indexOf("Known Spells"));
  assert.match(vaultSource, /data-spell-action="\$\{entry\.id\}:cast"/);
  assert.match(vaultSource, /data-spell-action="\$\{entry\.id\}:prepare">Prepare \+1/);
  assert.match(vaultSource, /memorized_count: currentCount \+ 1/);
  assert.match(vaultSource, /memorized_count: Math\.max\(0, currentCount - 1\)/);
});

test("saving throws use compact classic rows without source text", () => {
  assert.match(vaultCss, /\.vault-saving-row summary::after/);
  assert.match(vaultCss, /border-bottom:1px dotted/);
  assert.doesNotMatch(vaultSource, /saves\.source/);
});

test("compact non-spellcaster empty state and mobile stacking are present", () => {
  assert.match(vaultSource, /No spellcasting ability at this class and level/);
  assert.match(vaultSource, /function hasSpellSlots/);
  assert.match(vaultCss, /\.vault-compact-empty/);
  assert.match(vaultCss, /\.vault-sheet-header-grid/);
  assert.match(vaultCss, /\.vault-combat-body/);
});

test("combat tiles use equal grid sizing and compact popover-safe values", () => {
  assert.match(vaultCss, /\.vault-combat-summary\{\s*align-items:stretch;/);
  assert.match(vaultCss, /grid-template-columns:repeat\(7,minmax\(0,1fr\)\)/);
  assert.match(vaultCss, /\.vault-combat-summary \.vault-long-value/);
  assert.match(vaultSource, /String\(value \?\? ""\)\.length > 10/);
  assert.match(vaultSource, /function encumbranceSummary/);
  assert.match(vaultSource, /return "None"/);
});

test("equipment preview toggles without resetting catalog filters", () => {
  assert.match(vaultSource, /equipmentFilters: \{ q: "", type: "", allowedOnly: false \}/);
  assert.match(vaultSource, /delete state\.equipmentPreviews\[equipmentId\]/);
  assert.match(vaultSource, /filterEquipment\(\);/);
  assert.doesNotMatch(vaultSource, /state\.equipmentPreviews\[equipmentId\] = await combatPreviewApi\(equipmentId\);\s*renderBuilder\(\);/);
});

test("character sheet and edit boot lazy-load heavy catalogs", () => {
  const bootMatch = vaultSource.match(/async function boot\(\) \{([\s\S]*?)async function hydratePlayerBuilderContext/);
  assert.ok(bootMatch);
  const boot = bootMatch[1];
  assert.doesNotMatch(boot, /api\("\/rules-data"\)/);
  assert.doesNotMatch(boot, /api\("\/spells"\)/);
  assert.doesNotMatch(boot, /api\("\/equipment"\)/);
  assert.match(boot, /cachedApi\(`\/characters\/\$\{characterId\(\)\}`\)/);
  assert.match(vaultSource, /function cachedApi/);
  assert.match(vaultSource, /sessionDataCache\.api/);
  assert.match(vaultSource, /function builderStepDataGate/);
  assert.match(vaultSource, /state\.step === 9 && !state\.spells\.length/);
  assert.match(vaultSource, /\[7, 8\]\.includes\(state\.step\) && !state\.equipment\.length/);
});

test("character mutations reuse returned payloads instead of immediate duplicate GETs", () => {
  const saveMatch = vaultSource.match(/async function saveDraft\([\s\S]*?function characterSavePayload/);
  assert.ok(saveMatch);
  assert.doesNotMatch(saveMatch[0], /await rootApi\(`\/player\/characters\/\$\{state\.character\.id\}`,\s*\{ headers: playerAuthHeaders\(\) \}\)/);
  assert.doesNotMatch(saveMatch[0], /await api\(`\/characters\/\$\{state\.character\.id\}`\)/);
  const quickEditMatch = vaultSource.match(/function openQuickEditModal[\s\S]*?function sheetHtml/);
  assert.ok(quickEditMatch);
  assert.doesNotMatch(quickEditMatch[0], /await rootApi\(`\/player\/characters\/\$\{state\.character\.id\}`,\s*\{ headers: playerAuthHeaders\(\) \}\)/);
  assert.doesNotMatch(quickEditMatch[0], /await api\(`\/characters\/\$\{state\.character\.id\}`\)/);
  assert.match(vaultSource, /function invalidateCharacterCache/);
});

test("quick edit keeps notes player-owned and omits personal storage", () => {
  const quickEditMatch = vaultSource.match(/function openQuickEditModal[\s\S]*?async function openLevelUpModal/);
  assert.ok(quickEditMatch);
  const quickEdit = quickEditMatch[0];
  assert.match(quickEdit, /<label class="vault-field full">Notes/);
  assert.doesNotMatch(quickEdit, /Personal Storage Location/);
  assert.doesNotMatch(quickEdit, /safe_storage_location/);
  const levelUpMatch = vaultSource.match(/async function openLevelUpModal[\s\S]*?function strictClassRulesHtml/);
  assert.ok(levelUpMatch);
  assert.match(levelUpMatch[0], /Player Notes<textarea name="notes"><\/textarea>/);
  assert.doesNotMatch(levelUpMatch[0], /Level-up reviewed and applied/);
});

test("equipment catalog is scrollable and no longer hard-caps first rows", () => {
  assert.match(vaultSource, /vault-equipment-catalog-scroll/);
  assert.match(vaultCss, /\.vault-equipment-catalog-scroll/);
  assert.match(vaultCss, /max-height:46vh/);
  assert.doesNotMatch(vaultSource, /classAwareEquipment\(\)\.slice\(0, 40\)/);
});

test("inventory drop deletes rows and inventory rows get quantity controls", () => {
  assert.match(vaultSource, /data-inventory-action="\$\{item\.id\}:delete"/);
  assert.match(vaultSource, /Drop Item/);
  assert.match(vaultSource, /status === "quantity"/);
  assert.match(vaultSource, /vault-ammo-quantity/);
  assert.match(vaultSource, /inventoryActionMessage\(status\)/);
  assert.doesNotMatch(vaultSource, /"dropped", "Dropped"/);
  assert.doesNotMatch(vaultSource, /const quantityActions = ammo \?/);
});

test("equipment catalog supports adding another copy of an existing item", () => {
  assert.match(vaultSource, /const addLabel = added \|\| feedback === "added" \? "Add \+1" : "Add"/);
  assert.match(vaultSource, /quantity: status === "carried" \? existingQuantity \+ quantityStep : Math\.max\(existingQuantity, quantityStep\)/);
  assert.match(vaultSource, /const nextStatus = status === "equipped" \? "equipped" : existing\.status \|\| "carried"/);
  assert.doesNotMatch(vaultSource, /data-status="carried" \$\{added \|\| restricted \? "disabled" : ""\}/);
});

test("sheet disclosure state survives inventory refreshes", () => {
  assert.match(vaultSource, /sheetDisclosure: \{ inventoryOpen: false, spellsOpen: true, campaignOpen: false \}/);
  assert.match(vaultSource, /function bindSheetDisclosureState/);
  assert.match(vaultSource, /data-sheet-disclosure="inventoryOpen"/);
  assert.match(vaultSource, /state\.sheetDisclosure\.inventoryOpen \? "open" : ""/);
  assert.match(vaultSource, /data-sheet-disclosure="campaignOpen"/);
  assert.match(vaultSource, /details\.addEventListener\("toggle"/);
  assert.match(vaultSource, /afterAction\(\{ preserveScrollY, changedInventoryId: id, keepInventoryVisible: true \}\)/);
  assert.match(vaultSource, /state\.sheetDisclosure\.inventoryOpen = true/);
  assert.match(vaultSource, /function restoreSheetPosition/);
  assert.match(vaultSource, /data-inventory-row="\$\{h\(item\.id\)\}"/);
  assert.doesNotMatch(vaultSource, /sheetDisclosure: \{ inventoryOpen: false, spellsOpen: true, campaignOpen: false \}[\s\S]*?state\.sheetDisclosure =/);
});

test("ammunition is separated from weapons and shown on compatible missile cards", () => {
  assert.match(vaultSource, /const AMMUNITION_COMPATIBILITY/);
  assert.match(vaultSource, /function compatibleAmmunitionForWeapon/);
  assert.match(vaultSource, /item\.equipment\.type === "weapon" && !isAmmunition\(item\.equipment\)/);
  assert.match(vaultSource, /runtime\.mode === "missile" \? compatibleAmmunitionForWeapon/);
  assert.match(vaultSource, /statRow\("AMMO"/);
});
