(() => {
  const abilities = ["strength", "intelligence", "wisdom", "dexterity", "constitution", "charisma"];
  const abilityLabels = { strength: "STR", intelligence: "INT", wisdom: "WIS", dexterity: "DEX", constitution: "CON", charisma: "CHA" };
  const raceAdjustments = {
    Elf: { dexterity: 1, constitution: -1 },
    "Half-Orc": { strength: 1, constitution: 1, charisma: -2 },
    Halfling: { strength: -1, dexterity: 1 },
    Dwarf: { constitution: 1, charisma: -1 },
  };
  const starterInventory = [
    ["Short sword", "weapon", 3, "equipped"],
    ["Short bow", "weapon", 2, "equipped"],
    ["Leather armor", "armor", 15, "equipped"],
    ["Dagger", "weapon", 1, "equipped"],
    ["Thieves' Tools", "tool", 1, "carried"],
    ["Backpack", "container", 2, "carried"],
    ["Belt pouch", "container", 0.5, "carried"],
    ["Grappling hook", "gear", 4, "carried"],
    ["50' silk rope", "gear", 5, "carried"],
    ["Caltrops", "gear", 2, "carried"],
    ["Flint, steel, tinderbox", "gear", 1, "carried"],
    ["Waterskin", "gear", 4, "carried"],
    ["Small sack", "container", 0.5, "carried"],
  ].map(([name, type, weight, status]) => ({ name, type, weight, status }));
  const adventures = [
    {
      id: "rio-frio",
      title: "The Village of Rio Frio",
      range: "Level 1",
      description: "A cold mountain village, a locked old road, and rumors from the ruins above the river.",
    },
  ];
  const keys = {
    player: "dragostika.previewPlayer",
    rolls: "dragostika.rolledStats",
    characters: "dragostika.characters",
    activeId: "dragostika.activeCharacterId",
    activeStartedAt: "dragostika.activeStartedAt",
    sheetCharacter: "dragostika.character",
    introNarrated: "dragostika.introNarrated",
  };
  const els = {
    guest: document.querySelector("[data-dragostika-guest]"),
    mainArt: document.querySelector("[data-dragostika-main-art]"),
    playerNames: Array.from(document.querySelectorAll("[data-dragostika-player-name]")),
    activeNames: Array.from(document.querySelectorAll("[data-dragostika-active-character]")),
    activeAdventures: Array.from(document.querySelectorAll("[data-dragostika-active-adventure]")),
    sessionActions: document.querySelector("[data-dragostika-session-actions]"),
    logout: document.querySelector("[data-dragostika-logout]"),
    views: Array.from(document.querySelectorAll("[data-dragostika-view]")),
    login: document.querySelector("[data-dragostika-login]"),
    newGame: document.querySelector("[data-dragostika-new-game]"),
    loadGame: document.querySelector("[data-dragostika-load-game]"),
    save: document.querySelector("[data-dragostika-save]"),
    exit: document.querySelector("[data-dragostika-exit]"),
    builder: document.querySelector("[data-dragostika-builder]"),
    rollButton: document.querySelector("[data-dragostika-roll]"),
    rollSlots: document.querySelector("[data-dragostika-rolls]"),
    assignment: document.querySelector("[data-dragostika-assignment]"),
    viewButton: document.querySelector("[data-dragostika-view-character]"),
    loadList: document.querySelector("[data-dragostika-load-list]"),
    adventureList: document.querySelector("[data-dragostika-adventures]"),
    beginAdventure: document.querySelector("[data-dragostika-begin-adventure]"),
  };
  let setAudioMode = () => {};

  const readJson = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  };
  const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const characters = () => readJson(keys.characters, []);
  const saveCharacters = (records) => writeJson(keys.characters, records);
  const activeId = () => localStorage.getItem(keys.activeId);
  const activeCharacter = () => characters().find((character) => character.id === activeId()) || null;
  const setText = (nodes, text) => nodes.forEach((node) => { node.textContent = text; });
  const setMainArt = (name) => {
    if (!els.mainArt) return;
    const useIntroArt = name === "intro";
    els.mainArt.src = useIntroArt ? els.mainArt.dataset.introSrc : els.mainArt.dataset.defaultSrc;
    els.mainArt.alt = useIntroArt ? els.mainArt.dataset.introAlt : els.mainArt.dataset.defaultAlt;
  };

  const showView = (name) => {
    els.views.forEach((view) => { view.hidden = view.dataset.dragostikaView !== name; });
    setMainArt(name);
    if (els.sessionActions) els.sessionActions.hidden = !["builder", "load", "adventures", "intro", "game"].includes(name);
    if (!["intro", "game"].includes(name)) pauseActiveTimer();
    setAudioMode(["intro", "game"].includes(name) ? "intro" : "title", name);
    renderHeaderState();
  };

  const secondsLabel = (seconds = 0) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const pauseActiveTimer = () => {
    const startedAt = Number(localStorage.getItem(keys.activeStartedAt) || 0);
    if (!startedAt) return;
    const id = activeId();
    const records = characters();
    const current = records.find((character) => character.id === id);
    if (current) current.playSeconds = Number(current.playSeconds || 0) + Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    saveCharacters(records);
    localStorage.removeItem(keys.activeStartedAt);
  };

  const startActiveTimer = () => {
    if (!localStorage.getItem(keys.activeStartedAt)) localStorage.setItem(keys.activeStartedAt, String(Date.now()));
  };

  const currentPlaySeconds = (character) => {
    const startedAt = character.id === activeId() ? Number(localStorage.getItem(keys.activeStartedAt) || 0) : 0;
    return Number(character.playSeconds || 0) + (startedAt ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000)) : 0);
  };

  const rollD6 = () => Math.floor(Math.random() * 6) + 1;
  const rollStat = () => [rollD6(), rollD6(), rollD6(), rollD6()].sort((a, b) => b - a).slice(0, 3).reduce((sum, die) => sum + die, 0);
  const clampScore = (score) => Math.max(3, Math.min(18, Number(score)));
  const adjustedAbilities = (scores, race) => {
    const adjustments = raceAdjustments[race] || {};
    return Object.fromEntries(abilities.map((ability) => [ability, clampScore((scores[ability] || 10) + (adjustments[ability] || 0))]));
  };
  const conHpAdjustment = (con) => {
    if (con <= 3) return -2;
    if (con <= 6) return -1;
    if (con === 15) return 1;
    if (con === 16) return 2;
    if (con === 17) return 3;
    if (con >= 18) return 4;
    return 0;
  };

  const buildCharacter = (form) => {
    const rolled = readJson(keys.rolls, []);
    const usedIndexes = abilities.map((ability) => form.querySelector(`[name="${ability}"]`)?.value || "");
    if (rolled.length !== 6 || usedIndexes.some((value) => value === "")) {
      alert("Roll ability scores once, then assign each score.");
      return null;
    }
    if (new Set(usedIndexes).size !== abilities.length) {
      alert("Each rolled score must be assigned exactly once.");
      return null;
    }
    const scores = Object.fromEntries(abilities.map((ability, index) => [ability, Number(rolled[Number(usedIndexes[index])])]));
    const race = form.elements.race.value;
    const adjusted = adjustedAbilities(scores, race);
    const maxHp = Math.max(1, 12 + conHpAdjustment(adjusted.constitution));
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: form.elements.character_name.value.trim() || "Nameless Delver",
      race,
      className: "Fighter/Thief",
      alignment: form.elements.alignment.value,
      level: 1,
      xp: 0,
      gp: 15,
      adventureId: null,
      adventure: "Not yet assigned",
      playSeconds: 0,
      scores,
      adjusted,
      maxHp,
      currentHp: maxHp,
      inventory: starterInventory,
      createdAt: Date.now(),
    };
  };

  const assignmentIsComplete = () => {
    const values = abilities.map((ability) => els.builder?.querySelector(`[name="${ability}"]`)?.value || "");
    return values.every(Boolean) && new Set(values).size === abilities.length;
  };

  const updateAssignmentOptions = () => {
    const selects = abilities.map((ability) => els.builder?.querySelector(`[name="${ability}"]`)).filter(Boolean);
    const selected = selects.map((select) => select.value).filter(Boolean);
    selects.forEach((select) => {
      Array.from(select.options).forEach((option) => {
        option.disabled = option.value !== "" && option.value !== select.value && selected.includes(option.value);
      });
    });
    if (els.viewButton) els.viewButton.disabled = !assignmentIsComplete();
  };

  const renderRolls = () => {
    const rolled = readJson(keys.rolls, []);
    if (!els.rollSlots || !els.assignment) return;
    els.rollSlots.innerHTML = rolled.length ? rolled.map((score) => `<span>${score}</span>`).join("") : `<span>Roll once</span>`;
    els.assignment.innerHTML = abilities.map((ability) => `
      <label>
        <span>${abilityLabels[ability]}</span>
        <select name="${ability}" required>
          <option value="">Assign</option>
          ${rolled.map((score, index) => `<option value="${index}">${score}</option>`).join("")}
        </select>
      </label>
    `).join("");
    if (els.rollButton) els.rollButton.disabled = rolled.length > 0;
    updateAssignmentOptions();
  };

  const renderHeaderState = () => {
    const player = localStorage.getItem(keys.player);
    setText(els.playerNames, player || "Adventurer");
    const active = activeCharacter();
    setText(els.activeNames, active?.name || "your character");
    setText(els.activeAdventures, active?.adventure || "Unassigned");
  };

  const renderLoadList = () => {
    const records = characters();
    if (!els.loadList) return;
    els.loadList.innerHTML = records.length ? records.map((character) => `
      <article class="dragostika-save-row">
        <div>
          <h3>${character.name}</h3>
          <p>Level ${character.level} ${character.race} ${character.className} / ${character.adventure}</p>
          <p>${secondsLabel(currentPlaySeconds(character))} played</p>
        </div>
        <button type="button" data-enter-character="${character.id}">Enter</button>
      </article>
    `).join("") : `<p class="dragostika-session-line">No characters yet. Choose New Game to build your first solo adventurer.</p>`;
    els.loadList.querySelectorAll("[data-enter-character]").forEach((button) => {
      button.addEventListener("click", () => {
        localStorage.setItem(keys.activeId, button.dataset.enterCharacter);
        const character = activeCharacter();
        if (character?.adventureId) enterIntro();
        else {
          renderAdventures();
          showView("adventures");
        }
      });
    });
  };

  const renderAdventures = () => {
    if (!els.adventureList) return;
    els.adventureList.innerHTML = adventures.map((adventure) => `
      <article class="dragostika-save-row">
        <div>
          <h3>${adventure.title}</h3>
          <p>${adventure.description}</p>
          <p>${adventure.range}</p>
        </div>
        <button type="button" data-adventure="${adventure.id}">Choose</button>
      </article>
    `).join("");
    els.adventureList.querySelectorAll("[data-adventure]").forEach((button) => {
      button.addEventListener("click", () => assignAdventure(button.dataset.adventure));
    });
  };

  const assignAdventure = (adventureId) => {
    const adventure = adventures.find((entry) => entry.id === adventureId);
    const id = activeId();
    const records = characters();
    const character = records.find((entry) => entry.id === id);
    if (!adventure || !character) return;
    character.adventureId = adventure.id;
    character.adventure = adventure.title;
    saveCharacters(records);
    localStorage.removeItem(keys.introNarrated);
    enterIntro();
  };

  const enterIntro = () => {
    startActiveTimer();
    renderLoadList();
    renderHeaderState();
    showView("intro");
  };

  const openCharacterWindow = (character) => {
    writeJson(keys.sheetCharacter, character);
    window.open("./character.html", "dragostika-character", "popup=yes,width=920,height=820,menubar=no,toolbar=no,location=yes,status=no");
  };

  els.login?.addEventListener("click", () => {
    localStorage.setItem(keys.player, "Chance");
    showView("player");
    renderHeaderState();
  });
  els.newGame?.addEventListener("click", () => {
    localStorage.removeItem(keys.rolls);
    els.builder?.reset();
    renderRolls();
    showView("builder");
  });
  els.loadGame?.addEventListener("click", () => {
    renderLoadList();
    showView("load");
  });
  els.rollButton?.addEventListener("click", () => {
    if (readJson(keys.rolls, []).length) return;
    writeJson(keys.rolls, Array.from({ length: 6 }, rollStat));
    renderRolls();
  });
  els.builder?.addEventListener("input", updateAssignmentOptions);
  els.builder?.addEventListener("change", updateAssignmentOptions);
  els.builder?.addEventListener("submit", (event) => {
    event.preventDefault();
    const character = buildCharacter(els.builder);
    if (!character) return;
    const records = characters();
    records.push(character);
    saveCharacters(records);
    localStorage.setItem(keys.activeId, character.id);
    localStorage.removeItem(keys.rolls);
    renderLoadList();
    renderAdventures();
    showView("adventures");
  });
  els.viewButton?.addEventListener("click", () => {
    const character = buildCharacter(els.builder);
    if (character) openCharacterWindow(character);
  });
  els.beginAdventure?.addEventListener("click", () => {
    startActiveTimer();
    showView("game");
  });
  els.save?.addEventListener("click", () => {
    pauseActiveTimer();
    renderLoadList();
    showView("player");
  });
  els.exit?.addEventListener("click", () => {
    pauseActiveTimer();
    showView("player");
  });
  els.logout?.addEventListener("click", () => {
    pauseActiveTimer();
    localStorage.removeItem(keys.player);
    showView("login");
  });

  if (localStorage.getItem(keys.player)) showView("player");
  else showView("login");
  renderRolls();
  renderLoadList();
  renderAdventures();
  window.setInterval(() => {
    if (!document.querySelector('[data-dragostika-view="intro"]')?.hidden) renderLoadList();
  }, 30000);

  const audioRoot = document.querySelector("[data-dragostika-audio]");
  if (!audioRoot) return;
  const audio = audioRoot.querySelector("[data-dragostika-track]");
  const narration = audioRoot.querySelector("[data-dragostika-narration]");
  const toggle = audioRoot.querySelector("[data-dragostika-toggle]");
  const volume = audioRoot.querySelector("[data-dragostika-volume]");
  const status = audioRoot.querySelector("[data-dragostika-status]");
  let audioMode = "title";
  const setPlaying = (playing) => {
    toggle.textContent = playing ? "Pause" : "Music";
    toggle.setAttribute("aria-pressed", playing ? "true" : "false");
    status.textContent = playing ? "Playing" : "Click Music";
  };
  const baseVolume = () => Number(volume.value) / 100;
  const setLayerVolumes = () => {
    const quietMusicBed = audioMode === "intro";
    audio.volume = Math.max(0, Math.min(1, baseVolume() * (quietMusicBed ? 0.22 : 1)));
    if (narration) narration.volume = Math.max(0, Math.min(1, baseVolume() * 1.75));
  };
  const playNarrationOnce = async () => {
    if (!narration || localStorage.getItem(keys.introNarrated) === "true") return;
    try {
      narration.currentTime = 0;
      setLayerVolumes();
      await narration.play();
      setLayerVolumes();
      status.textContent = "Narration";
    } catch {
      status.textContent = "Click Music";
    }
  };
  setLayerVolumes();
  setAudioMode = (mode, view = "") => {
    audioMode = mode;
    const nextSrc = mode === "intro" ? audio.dataset.introSrc : audio.dataset.titleSrc;
    const resolved = new URL(nextSrc, window.location.href).href;
    if (narration && view !== "intro") {
      narration.pause();
      narration.currentTime = 0;
      if (mode === "intro") localStorage.setItem(keys.introNarrated, "true");
      setLayerVolumes();
    }
    if (audio.src === resolved) {
      if (view === "intro") playNarrationOnce();
      return;
    }
    const wasPlaying = !audio.paused;
    audio.src = nextSrc;
    audio.load();
    setLayerVolumes();
    if (wasPlaying || mode === "intro") play().then(() => {
      if (view === "intro") playNarrationOnce();
    });
  };
  const play = async () => {
    try { await audio.play(); setLayerVolumes(); setPlaying(true); } catch { setPlaying(false); }
  };
  toggle.addEventListener("click", () => {
    if (audio.paused) {
      audioRoot.dataset.userPaused = "false";
      play().then(() => {
        if (!document.querySelector('[data-dragostika-view="intro"]')?.hidden) playNarrationOnce();
      });
    }
    else {
      audioRoot.dataset.userPaused = "true";
      audio.pause();
      narration?.pause();
      setPlaying(false);
    }
  });
  volume.addEventListener("input", setLayerVolumes);
  document.addEventListener("pointerdown", () => {
    if (audio.paused && audioRoot.dataset.userPaused !== "true") {
      play().then(() => {
        if (!document.querySelector('[data-dragostika-view="intro"]')?.hidden) playNarrationOnce();
      });
    }
  }, { once: true });
  audio.addEventListener("play", () => setPlaying(true));
  audio.addEventListener("pause", () => setPlaying(false));
  narration?.addEventListener("play", setLayerVolumes);
  narration?.addEventListener("ended", () => {
    localStorage.setItem(keys.introNarrated, "true");
    setLayerVolumes();
    setPlaying(!audio.paused);
  });
  play();
})();
