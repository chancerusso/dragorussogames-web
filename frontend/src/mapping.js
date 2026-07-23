export const MAP_CELL_SIZE = 20;

export const MAP_TOOLS = [
  ["pan", "Move"],
  ["line", "Wall"],
  ["freehand", "Pencil"],
  ["door", "Door"],
  ["secret-door", "Secret Door"],
  ["window", "Window"],
  ["stairs-up", "Stairs Up"],
  ["stairs-down", "Stairs Down"],
  ["trap", "Trap"],
  ["pit", "Pit"],
  ["note", "Note"],
  ["eraser", "Eraser"],
];

export const MAP_COLORS = ["#2b2926", "#8f2f28", "#315b7d", "#3f6b43", "#815e2c"];

export function emptyDrawingState() {
  return {
    version: 2,
    activeLevelId: "level-1",
    levels: [{ id: "level-1", name: "Level 1", objects: [], notes: [] }],
  };
}

export function normalizeLevelDrawingState(state) {
  if (Array.isArray(state?.levels) && state.levels.length) {
    const alreadyNormalized = state.version === 2
      && typeof state.activeLevelId === "string"
      && state.levels.some((level) => level?.id === state.activeLevelId)
      && state.levels.every((level) => (
        typeof level?.id === "string"
        && typeof level?.name === "string"
        && Array.isArray(level?.objects)
        && Array.isArray(level?.notes)
      ));
    if (alreadyNormalized) return state;
    const levels = state.levels.map((level, index) => ({
      id: String(level?.id || `level-${index + 1}`),
      name: String(level?.name || `Level ${index + 1}`),
      objects: Array.isArray(level?.objects) ? level.objects : [],
      notes: Array.isArray(level?.notes) ? level.notes : [],
    }));
    const activeLevelId = levels.some((level) => level.id === state.activeLevelId)
      ? state.activeLevelId
      : levels[0].id;
    return { version: 2, activeLevelId, levels };
  }
  return {
    version: 2,
    activeLevelId: "level-1",
    levels: [{
      id: "level-1",
      name: "Level 1",
      objects: Array.isArray(state?.objects) ? state.objects : [],
      notes: Array.isArray(state?.notes) ? state.notes : [],
    }],
  };
}

export function activeMapLevel(state) {
  const normalized = normalizeLevelDrawingState(state);
  return normalized.levels.find((level) => level.id === normalized.activeLevelId) || normalized.levels[0];
}

export function updateActiveMapLevel(state, nextLevel) {
  const normalized = normalizeLevelDrawingState(state);
  return {
    ...normalized,
    levels: normalized.levels.map((level) => level.id === normalized.activeLevelId ? { ...level, ...nextLevel } : level),
  };
}

export function selectMapLevel(state, levelId) {
  const normalized = normalizeLevelDrawingState(state);
  return normalized.levels.some((level) => level.id === levelId)
    ? { ...normalized, activeLevelId: levelId }
    : normalized;
}

export function addMapLevel(state, name) {
  const normalized = normalizeLevelDrawingState(state);
  const id = globalThis.crypto?.randomUUID?.() || `level-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const level = { id, name: String(name || `Level ${normalized.levels.length + 1}`).trim(), objects: [], notes: [] };
  return { ...normalized, activeLevelId: id, levels: [...normalized.levels, level] };
}

export function renameMapLevel(state, levelId, name) {
  const normalized = normalizeLevelDrawingState(state);
  const nextName = String(name || "").trim();
  if (!nextName) return normalized;
  return {
    ...normalized,
    levels: normalized.levels.map((level) => level.id === levelId ? { ...level, name: nextName } : level),
  };
}

export function removeMapLevel(state, levelId) {
  const normalized = normalizeLevelDrawingState(state);
  if (normalized.levels.length === 1) return normalized;
  const levels = normalized.levels.filter((level) => level.id !== levelId);
  return {
    ...normalized,
    levels,
    activeLevelId: normalized.activeLevelId === levelId ? levels[0].id : normalized.activeLevelId,
  };
}

export function snapPoint(point, cellSize = MAP_CELL_SIZE) {
  return {
    x: Math.round(point.x / cellSize) * cellSize,
    y: Math.round(point.y / cellSize) * cellSize,
  };
}

export function snapCellCenter(point, cellSize = MAP_CELL_SIZE) {
  return {
    x: Math.floor(point.x / cellSize) * cellSize + cellSize / 2,
    y: Math.floor(point.y / cellSize) * cellSize + cellSize / 2,
  };
}

export function snapEdgeMidpoint(point, cellSize = MAP_CELL_SIZE) {
  const vertical = {
    x: Math.round(point.x / cellSize) * cellSize,
    y: Math.floor(point.y / cellSize) * cellSize + cellSize / 2,
  };
  const horizontal = {
    x: Math.floor(point.x / cellSize) * cellSize + cellSize / 2,
    y: Math.round(point.y / cellSize) * cellSize,
  };
  const verticalDistance = Math.hypot(point.x - vertical.x, point.y - vertical.y);
  const horizontalDistance = Math.hypot(point.x - horizontal.x, point.y - horizontal.y);
  return verticalDistance <= horizontalDistance ? vertical : horizontal;
}

export function snapPlacementPoint(type, point) {
  if (["door", "secret-door", "window"].includes(type)) return snapEdgeMidpoint(point);
  if (["stairs-up", "stairs-down", "trap", "pit", "note"].includes(type)) return snapCellCenter(point);
  return snapPoint(point);
}

export function normalizeDrawingPositions(state) {
  if (Array.isArray(state?.levels)) {
    let changed = false;
    const normalized = normalizeLevelDrawingState(state);
    const levels = normalized.levels.map((level) => {
      const nextLevel = normalizeDrawingPositions({ objects: level.objects, notes: level.notes });
      if (nextLevel.objects !== level.objects) changed = true;
      return { ...level, objects: nextLevel.objects, notes: nextLevel.notes };
    });
    return changed ? { ...normalized, levels } : normalized;
  }
  let changed = false;
  const objects = (state.objects || []).map((object) => {
    if (!["door", "secret-door", "window", "stairs-up", "stairs-down", "trap", "pit", "note"].includes(object.type)) return object;
    const snapped = snapPlacementPoint(object.type, object);
    if (snapped.x === object.x && snapped.y === object.y) return object;
    changed = true;
    return { ...object, x: snapped.x, y: snapped.y };
  });
  return changed ? { ...state, objects } : state;
}

export function nextNoteNumber(notes = []) {
  return notes.reduce((highest, note) => Math.max(highest, Number(note.number) || 0), 0) + 1;
}

export function appendObject(state, object) {
  return { ...state, objects: [...(state.objects || []), object] };
}

export function removeObject(state, objectId) {
  const object = (state.objects || []).find((entry) => entry.id === objectId);
  const notes = object?.type === "note"
    ? (state.notes || []).filter((note) => note.number !== object.number)
    : state.notes || [];
  return {
    ...state,
    objects: (state.objects || []).filter((entry) => entry.id !== objectId),
    notes,
  };
}

export function updateNoteText(state, number, text) {
  return {
    ...state,
    notes: (state.notes || []).map((note) => note.number === number ? { ...note, text } : note),
  };
}

export function makeMapObject(type, point, color, extra = {}) {
  return {
    id: globalThis.crypto?.randomUUID?.() || `map-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    color,
    x: point.x,
    y: point.y,
    ...extra,
  };
}

export function translateMapObject(object, dx, dy) {
  if (object.type === "freehand") {
    return { ...object, points: (object.points || []).map((point) => ({ x: point.x + dx, y: point.y + dy })) };
  }
  if (object.type === "line") {
    return { ...object, x: object.x + dx, y: object.y + dy, x2: object.x2 + dx, y2: object.y2 + dy };
  }
  return { ...object, x: object.x + dx, y: object.y + dy };
}

export function shouldEndWallChain({ editable, tool, button = 2 }) {
  return Boolean(editable && tool === "line" && button === 2);
}
