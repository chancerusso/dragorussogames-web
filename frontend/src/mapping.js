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
  return { objects: [], notes: [] };
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
