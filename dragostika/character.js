(() => {
  const sheet = document.querySelector("[data-sheet]");
  const key = "dragostika.character";
  const abilities = ["strength", "intelligence", "wisdom", "dexterity", "constitution", "charisma"];
  const labels = { strength: "STR", intelligence: "INT", wisdom: "WIS", dexterity: "DEX", constitution: "CON", charisma: "CHA" };

  const readCharacter = () => {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  };

  const writeCharacter = (character) => localStorage.setItem(key, JSON.stringify(character));

  const dexAcAdjustment = (dex) => {
    if (dex <= 3) return 4;
    if (dex === 4) return 3;
    if (dex === 5) return 2;
    if (dex === 6) return 1;
    if (dex === 15) return -1;
    if (dex === 16) return -2;
    if (dex === 17) return -3;
    if (dex >= 18) return -4;
    return 0;
  };

  const carriedWeight = (character) => character.inventory.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  const armorClass = (character) => 8 + dexAcAdjustment(character.adjusted.dexterity);
  const saves = {
    "Death/Poison": 14,
    Wands: 16,
    "Paralysis/Petrify": 15,
    Breath: 17,
    Spells: 17,
  };

  const render = () => {
    const character = readCharacter();
    if (!character) return;
    sheet.innerHTML = `
      <p class="eyebrow">Dragostika Character</p>
      <h1>${character.name}</h1>
      <p>${character.race} ${character.className} / ${character.alignment}</p>
      <div class="dragostika-sheet-stats">
        <span><strong>${character.currentHp}/${character.maxHp}</strong>HP</span>
        <span><strong>${armorClass(character)}</strong>AC</span>
        <span><strong>20</strong>THAC0</span>
        <span><strong>${carriedWeight(character)}</strong>LB</span>
        <span><strong>${character.gp}</strong>GP</span>
      </div>
      <h2>Abilities</h2>
      <div class="dragostika-sheet-stats">
        ${abilities.map((ability) => `<span><strong>${character.adjusted[ability]}</strong>${labels[ability]}</span>`).join("")}
      </div>
      <h2>Saves</h2>
      <div class="dragostika-sheet-list">
        ${Object.entries(saves).map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("")}
      </div>
      <h2>Inventory</h2>
      <div class="dragostika-sheet-list">
        ${character.inventory.map((item, index) => `
          <div>
            <span>${item.name} / ${item.status}</span>
            <button type="button" data-drop="${index}">Drop</button>
          </div>
        `).join("")}
      </div>
    `;
    sheet.querySelectorAll("[data-drop]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.drop);
        const item = character.inventory[index];
        if (!window.confirm(`Drop ${item.name}? This can only be recovered through play.`)) return;
        character.inventory.splice(index, 1);
        writeCharacter(character);
        render();
      });
    });
  };

  render();
})();
