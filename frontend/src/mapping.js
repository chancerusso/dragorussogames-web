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
