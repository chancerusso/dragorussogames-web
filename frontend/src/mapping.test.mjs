import test from "node:test";
import assert from "node:assert/strict";

import { appendObject, emptyDrawingState, nextNoteNumber, removeObject, snapCellCenter, snapEdgeMidpoint, snapPoint, translateMapObject, updateNoteText } from "./mapping.js";

test("map points snap to graph-paper intersections", () => {
  assert.deepEqual(snapPoint({ x: 31, y: 49 }), { x: 40, y: 40 });
});

test("room symbols snap to square centers and wall fixtures snap to edge centers", () => {
  assert.deepEqual(snapCellCenter({ x: 31, y: 49 }), { x: 30, y: 50 });
  assert.deepEqual(snapEdgeMidpoint({ x: 39, y: 49 }), { x: 40, y: 50 });
  assert.deepEqual(snapEdgeMidpoint({ x: 31, y: 41 }), { x: 30, y: 40 });
});

test("moving a wall translates both endpoints", () => {
  assert.deepEqual(
    translateMapObject({ id: "wall", type: "line", x: 20, y: 20, x2: 60, y2: 20 }, 20, 40),
    { id: "wall", type: "line", x: 40, y: 60, x2: 80, y2: 60 },
  );
});

test("numbered notes remain stable and are removed with their marker", () => {
  let state = emptyDrawingState();
  state = appendObject(state, { id: "note-1", type: "note", number: 1, x: 20, y: 20 });
  state = { ...state, notes: [{ number: 1, text: "Old door" }] };
  assert.equal(nextNoteNumber(state.notes), 2);
  state = updateNoteText(state, 1, "Locked old door");
  assert.equal(state.notes[0].text, "Locked old door");
  state = removeObject(state, "note-1");
  assert.deepEqual(state.notes, []);
});
