import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

function loadAdapter() {
  const element = () => ({
    addEventListener() {},
    classList: { add() {}, remove() {} },
    setAttribute() {},
    getAttribute() { return "false"; },
    focus() {},
    hidden: false,
    value: "",
    textContent: "",
    innerHTML: "",
    className: "",
    files: []
  });
  const elements = new Map();
  const context = {
    document: {
      title: "",
      querySelector(selector) {
        if (!elements.has(selector)) elements.set(selector, element());
        return elements.get(selector);
      },
      querySelectorAll() { return []; }
    },
    window: { scrollTo() {}, print() {} },
    FileReader: class {}
  };
  vm.createContext(context);
  const viewerSource = fs.readFileSync(new URL("./viewer.js", import.meta.url), "utf8")
    .replace(/\}\)\(\);\s*$/, "globalThis.__viewerTest = { adaptArs };\n})();");
  vm.runInContext(viewerSource, context);
  return context.__viewerTest.adaptArs;
}

function actorFixture({ strength = 16, dexterity = 16 } = {}) {
  return {
    type: "character",
    name: "Importer Test",
    system: {
      abilities: { str: { value: strength, percent: 0 }, dex: { value: dexterity }, con: { value: 10 }, int: { value: 10 }, wis: { value: 10 }, cha: { value: 10 } },
      attributes: { ac: { value: 10 }, thaco: { value: 20 }, hp: { value: 8, max: 8 } },
      saves: {},
      currency: {}
    },
    items: [
      { _id: "armor", type: "armor", name: "Banded Armour", system: { location: { state: "equipped" }, protection: { type: "armor", ac: 4, modifier: 0 }, quantity: 1, weight: 35 } },
      { _id: "shield", type: "armor", name: "Medium Shield", system: { location: { state: "equipped" }, protection: { type: "shield", ac: 1, modifier: 0 }, quantity: 1, weight: 8 } },
      { _id: "sword", type: "weapon", name: "Sword", system: { location: { state: "equipped" }, attributes: { type: "" }, attack: { type: "melee", modifier: 0, magicBonus: 0, speed: 5, perRound: "1/1", range: {} }, damage: { normal: "1d8", large: "1d12", modifier: 0, magicBonus: 0 }, actionGroups: [], quantity: 1, weight: 5 } },
      { _id: "bow", type: "weapon", name: "Bow (Long)", system: { location: { state: "equipped" }, attributes: { type: "" }, resource: { itemId: "arrows" }, attack: { type: "ranged", modifier: 0, magicBonus: 0, speed: 0, perRound: "2/1", range: { short: 70, medium: 140, long: 210 } }, damage: { normal: "", large: "", modifier: 0, magicBonus: 0 }, actionGroups: [], quantity: 1, weight: 12 } },
      { _id: "javelin", type: "weapon", name: "Javelin", system: { location: { state: "equipped" }, attributes: { type: "" }, attack: { type: "ranged", modifier: 0, magicBonus: 0, speed: 4, perRound: "1/1", range: { short: 20, medium: 40, long: 60 } }, damage: { normal: "1d6", large: "1d6", modifier: 0, magicBonus: 0 }, actionGroups: [], quantity: 1, weight: 2 } },
      { _id: "arrows", type: "weapon", name: "Arrow", system: { location: { state: "carried" }, attributes: { type: "ammunition" }, attack: { type: "ranged", modifier: 0, magicBonus: 0, range: {} }, damage: { normal: "1d6", large: "1d6", modifier: 0, magicBonus: 0 }, quantity: 20, weight: 0.33 } }
    ]
  };
}

const adaptArs = loadAdapter();

test("derives descending AC from equipped armor, shield, and Dexterity", () => {
  const model = adaptArs(actorFixture());
  assert.equal(model.quickStats.find((stat) => stat.label === "Armor Class").value, "1");
  assert.equal(model.quickStats.find((stat) => stat.label === "Armor Class").note, "Banded Armour + Medium Shield");
});

test("uses linked ammunition damage and Dexterity for ranged attacks", () => {
  const bow = adaptArs(actorFixture()).weapons.find((weapon) => weapon.name === "Bow (Long)");
  assert.equal(bow.damage, "1d6");
  assert.equal(bow.secondary, "L 1d6");
  assert.equal(bow.attackBonus, "+1");
  assert.equal(bow.rate, "2/1");
  assert.equal(bow.range, "70 / 140 / 210");
});

test("applies exact OSRIC Strength melee adjustments", () => {
  const strength16 = adaptArs(actorFixture({ strength: 16, dexterity: 10 })).weapons.find((weapon) => weapon.name === "Sword");
  assert.equal(strength16.attackBonus, "");
  assert.equal(strength16.damage, "1d8+1");

  const strength18 = adaptArs(actorFixture({ strength: 18, dexterity: 10 })).weapons.find((weapon) => weapon.name === "Sword");
  assert.equal(strength18.attackBonus, "+1");
  assert.equal(strength18.damage, "1d8+2");
});

test("applies Strength damage, but Dexterity to hit, for OSRIC hurled weapons", () => {
  const javelin = adaptArs(actorFixture({ strength: 18, dexterity: 16 })).weapons.find((weapon) => weapon.name === "Javelin");
  assert.equal(javelin.attackBonus, "+1");
  assert.equal(javelin.damage, "1d6+2");
});
