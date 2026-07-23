import test from "node:test";
import assert from "node:assert/strict";

import { appendObject, emptyDrawingState, nextNoteNumber, removeObject, snapPoint, updateNoteText } from "./mapping.js";

test("map points snap to graph-paper intersections", () => {
  assert.deepEqual(snapPoint({ x: 31, y: 49 }), { x: 40, y: 40 });
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
