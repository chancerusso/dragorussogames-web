import { useEffect, useRef, useState } from "react";
import {
  MAP_CELL_SIZE,
  MAP_COLORS,
  MAP_TOOLS,
  activeMapLevel,
  addMapLevel,
  appendObject,
  emptyDrawingState,
  makeMapObject,
  nextNoteNumber,
  normalizeDrawingPositions,
  normalizeLevelDrawingState,
  removeObject,
  removeMapLevel,
  renameMapLevel,
  selectMapLevel,
  shouldEndWallChain,
  snapPlacementPoint,
  snapPoint,
  translateMapObject,
  updateActiveMapLevel,
  updateNoteText,
} from "./mapping.js";

export function MappingCanvas({ campaignMap, editable = false, onChange, onViewportChange, followViewport = false }) {
  const [tool, setTool] = useState("line");
  const [color, setColor] = useState(MAP_COLORS[0]);
  const [lineStart, setLineStart] = useState(null);
  const [freehand, setFreehand] = useState(null);
  const [moving, setMoving] = useState(null);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [zoom, setZoom] = useState(Number(campaignMap?.viewport?.zoom) || 1);
  const [levelName, setLevelName] = useState("");
  const scrollRef = useRef(null);
  const movingRef = useRef(null);
  const drawingState = normalizeLevelDrawingState(campaignMap?.drawing_state || emptyDrawingState());
  const state = activeMapLevel(drawingState);
  const width = (campaignMap?.width || 80) * MAP_CELL_SIZE;
  const height = (campaignMap?.height || 80) * MAP_CELL_SIZE;

  useEffect(() => {
    setLevelName(state.name);
  }, [state.id, state.name]);

  useEffect(() => {
    if (!followViewport || !scrollRef.current) return;
    const viewport = campaignMap?.viewport || {};
    setZoom(Number(viewport.zoom) || 1);
    scrollRef.current.scrollTo({ left: viewport.x || 0, top: viewport.y || 0 });
  }, [campaignMap?.revision, campaignMap?.viewport, followViewport]);

  useEffect(() => {
    if (!editable || !onChange) return;
    const normalized = normalizeDrawingPositions(drawingState);
    if (normalized !== drawingState) onChange(normalized);
  }, [campaignMap?.id, campaignMap?.revision, editable]);

  function commit(nextState) {
    if (!editable) return;
    setHistory((entries) => [...entries.slice(-49), drawingState]);
    setFuture([]);
    onChange(updateActiveMapLevel(drawingState, nextState));
  }

  function pointFromEvent(event, snap = true) {
    const svg = event.currentTarget.ownerSVGElement || event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const point = {
      x: Math.max(0, Math.min(width, ((event.clientX - rect.left) / rect.width) * width)),
      y: Math.max(0, Math.min(height, ((event.clientY - rect.top) / rect.height) * height)),
    };
    return snap ? snapPoint(point) : point;
  }

  function handleCanvasPointerDown(event) {
    if (!editable || event.button !== 0 || tool === "pan" || tool === "eraser") return;
    const rawPoint = pointFromEvent(event, false);
    const point = tool === "freehand" ? rawPoint : snapPlacementPoint(tool, rawPoint);
    if (tool === "line") {
      if (!lineStart) {
        setLineStart(point);
      } else {
        commit(appendObject(state, makeMapObject("line", lineStart, color, { x2: point.x, y2: point.y })));
        setLineStart(point);
      }
      return;
    }
    if (tool === "freehand") {
      event.currentTarget.setPointerCapture(event.pointerId);
      setFreehand({ id: makeMapObject("freehand", point, color).id, type: "freehand", color, points: [point] });
      return;
    }
    if (tool === "note") {
      const number = nextNoteNumber(state.notes);
      commit({
        ...appendObject(state, makeMapObject("note", point, color, { number })),
        notes: [...(state.notes || []), { number, text: "" }],
      });
      return;
    }
    commit(appendObject(state, makeMapObject(tool, point, color)));
  }

  function handleCanvasPointerMove(event) {
    if (!editable) return;
    if (moving) {
      const point = pointFromEvent(event, false);
      const snapped = snapPlacementPoint(moving.object.type, point);
      const start = snapPlacementPoint(moving.object.type, moving.pointerStart);
      const nextMoving = { ...moving, preview: translateMapObject(moving.object, snapped.x - start.x, snapped.y - start.y) };
      movingRef.current = nextMoving;
      setMoving(nextMoving);
      return;
    }
    if (!freehand) return;
    const point = pointFromEvent(event, false);
    const previous = freehand.points[freehand.points.length - 1];
    if (Math.hypot(point.x - previous.x, point.y - previous.y) < 3) return;
    setFreehand({ ...freehand, points: [...freehand.points, point] });
  }

  function finishFreehand() {
    if (!freehand) return;
    if (freehand.points.length > 1) commit(appendObject(state, freehand));
    setFreehand(null);
  }

  function finishPointerAction() {
    finishFreehand();
    const currentMove = movingRef.current;
    if (!currentMove) return;
    if (currentMove.preview) {
      commit({ ...state, objects: (state.objects || []).map((object) => object.id === currentMove.object.id ? currentMove.preview : object) });
    }
    movingRef.current = null;
    setMoving(null);
  }

  function handleObjectPointerDown(event, object) {
    if (!editable || event.button !== 0) return;
    if (tool === "eraser") {
      event.stopPropagation();
      commit(removeObject(state, object.id));
      return;
    }
    if (tool !== "pan") return;
    event.stopPropagation();
    const nextMoving = { object, pointerStart: pointFromEvent(event, false), preview: object };
    movingRef.current = nextMoving;
    setMoving(nextMoving);
  }

  function undo() {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory(history.slice(0, -1));
    setFuture([drawingState, ...future].slice(0, 50));
    onChange(previous);
  }

  function redo() {
    const next = future[0];
    if (!next) return;
    setFuture(future.slice(1));
    setHistory([...history, drawingState].slice(-50));
    onChange(next);
  }

  function changeLevel(levelId) {
    setLineStart(null);
    setFreehand(null);
    movingRef.current = null;
    setMoving(null);
    onChange(selectMapLevel(drawingState, levelId));
  }

  function createLevel() {
    const name = levelName.trim() && levelName.trim() !== state.name
      ? levelName.trim()
      : `Level ${drawingState.levels.length + 1}`;
    setHistory((entries) => [...entries.slice(-49), drawingState]);
    setFuture([]);
    onChange(addMapLevel(drawingState, name));
  }

  function renameLevel() {
    const name = levelName.trim();
    if (!name || name === state.name) return;
    setHistory((entries) => [...entries.slice(-49), drawingState]);
    setFuture([]);
    onChange(renameMapLevel(drawingState, state.id, name));
  }

  function deleteLevel() {
    if (drawingState.levels.length === 1) return;
    if (!window.confirm(`Delete "${state.name}" and everything drawn on it? You can recover it from map history.`)) return;
    setHistory((entries) => [...entries.slice(-49), drawingState]);
    setFuture([]);
    onChange(removeMapLevel(drawingState, state.id));
  }

  function updateZoom(nextZoom) {
    const clamped = Math.max(0.5, Math.min(2, Number(nextZoom.toFixed(2))));
    const scroller = scrollRef.current;
    const centerX = scroller ? (scroller.scrollLeft + scroller.clientWidth / 2) / zoom : 0;
    const centerY = scroller ? (scroller.scrollTop + scroller.clientHeight / 2) / zoom : 0;
    setZoom(clamped);
    window.requestAnimationFrame(() => {
      if (!scroller) return;
      const x = Math.max(0, centerX * clamped - scroller.clientWidth / 2);
      const y = Math.max(0, centerY * clamped - scroller.clientHeight / 2);
      scroller.scrollTo({ left: x, top: y });
      if (editable && onViewportChange) onViewportChange({ x, y, zoom: clamped });
    });
  }

  return (
    <div
      className={`mapping-workspace ${editable ? `is-editable tool-${tool}` : "is-viewer"}`}
      onContextMenu={(event) => {
        if (!shouldEndWallChain({ editable, tool, button: event.button })) return;
        event.preventDefault();
        setLineStart(null);
      }}
      onKeyDown={(event) => {
        if (editable && tool === "line" && event.key === "Escape") {
          event.preventDefault();
          setLineStart(null);
        }
      }}
    >
      {editable ? (
        <aside className="mapping-toolrail" aria-label="Map tools">
          {MAP_TOOLS.map(([value, label]) => (
            <button key={value} type="button" className={tool === value ? "is-active" : ""} onClick={() => { setTool(value); setLineStart(null); }}>{label}</button>
          ))}
          <div className="mapping-history-actions">
            <button type="button" disabled={!history.length} onClick={undo}>Undo</button>
            <button type="button" disabled={!future.length} onClick={redo}>Redo</button>
          </div>
          <div className="mapping-colors" aria-label="Pencil color">
            {MAP_COLORS.map((value) => <button key={value} type="button" aria-label={value} className={color === value ? "is-active" : ""} style={{ "--map-color": value }} onClick={() => setColor(value)} />)}
          </div>
        </aside>
      ) : null}
      <div className="mapping-paper-frame">
        <div className="mapping-view-controls">
          <label>
            <span>Floor</span>
            <select disabled={!editable} value={drawingState.activeLevelId} onChange={(event) => changeLevel(event.target.value)}>
              {drawingState.levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
            </select>
          </label>
          {editable ? <input aria-label="Floor name" value={levelName} onChange={(event) => setLevelName(event.target.value)} /> : null}
          {editable ? <button type="button" onClick={createLevel}>New Floor</button> : null}
          {editable ? <button type="button" disabled={!levelName.trim() || levelName.trim() === state.name} onClick={renameLevel}>Rename Floor</button> : null}
          {editable ? <button type="button" disabled={drawingState.levels.length === 1} onClick={deleteLevel}>Delete Floor</button> : null}
          <div className="mapping-zoom-controls" aria-label="Map zoom">
            <button type="button" disabled={!editable || zoom <= 0.5} onClick={() => updateZoom(zoom - 0.25)}>−</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button type="button" disabled={!editable || zoom >= 2} onClick={() => updateZoom(zoom + 0.25)}>+</button>
            <button type="button" disabled={!editable} onClick={() => updateZoom(1)}>Reset</button>
          </div>
        </div>
        <div
          className="mapping-paper-scroll"
          ref={scrollRef}
          onScroll={(event) => {
            if (!editable || !onViewportChange) return;
            onViewportChange({ x: event.currentTarget.scrollLeft, y: event.currentTarget.scrollTop, zoom: 1 });
          }}
        >
          <svg
            className="mapping-paper"
            style={{ width: width * zoom, height: height * zoom }}
            viewBox={`0 0 ${width} ${height}`}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={finishPointerAction}
            onPointerCancel={finishPointerAction}
          >
            <defs>
              <pattern id={`small-grid-${campaignMap?.id}`} width={MAP_CELL_SIZE} height={MAP_CELL_SIZE} patternUnits="userSpaceOnUse">
                <path d={`M ${MAP_CELL_SIZE} 0 L 0 0 0 ${MAP_CELL_SIZE}`} fill="none" stroke="#9bb0b6" strokeWidth="0.7" />
              </pattern>
              <pattern id={`large-grid-${campaignMap?.id}`} width={MAP_CELL_SIZE * 5} height={MAP_CELL_SIZE * 5} patternUnits="userSpaceOnUse">
                <rect width={MAP_CELL_SIZE * 5} height={MAP_CELL_SIZE * 5} fill={`url(#small-grid-${campaignMap?.id})`} />
                <path d={`M ${MAP_CELL_SIZE * 5} 0 L 0 0 0 ${MAP_CELL_SIZE * 5}`} fill="none" stroke="#748e96" strokeWidth="1.2" />
              </pattern>
            </defs>
            <rect width={width} height={height} fill={`url(#large-grid-${campaignMap?.id})`} />
            {(state.objects || []).map((object) => {
              const renderedObject = moving?.object.id === object.id ? moving.preview : object;
              return <MapObject key={object.id} object={renderedObject} onPointerDown={(event) => handleObjectPointerDown(event, object)} />;
            })}
            {freehand ? <MapObject object={freehand} /> : null}
            {lineStart ? <circle cx={lineStart.x} cy={lineStart.y} r="4" fill={color} /> : null}
          </svg>
        </div>
        {editable && lineStart ? <p className="mapping-hint">Choose the next grid intersection. Continue clicking for connected walls; right-click to end this wall and begin somewhere new.</p> : null}
      </div>
      <aside className="mapping-notes-panel">
        <p className="eyebrow">Map Notes</p>
        <h2>{state.name}</h2>
        {(state.notes || []).length ? (state.notes || []).map((note) => (
          <label className="mapping-note-row" key={note.number}>
            <span>{note.number}</span>
            {editable ? <textarea value={note.text || ""} onChange={(event) => onChange(updateActiveMapLevel(drawingState, updateNoteText(state, note.number, event.target.value)))} /> : <p>{note.text || "No description yet."}</p>}
          </label>
        )) : <p className="muted">No numbered notes yet.</p>}
        <div className="mapping-key">
          <strong>Key</strong>
          <span>▱ Door</span><span>S Secret Door</span><span>⌁ Window</span><span>△ Trap</span><span>○ Pit</span><span>↥ / ↧ Stairs</span>
        </div>
      </aside>
    </div>
  );
}

function MapObject({ object, onPointerDown }) {
  const common = { onPointerDown, className: "mapping-object", "data-map-object": object.id };
  if (object.type === "line") return <line {...common} x1={object.x} y1={object.y} x2={object.x2} y2={object.y2} stroke={object.color} strokeWidth="4" strokeLinecap="round" />;
  if (object.type === "freehand") return <polyline {...common} points={(object.points || []).map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke={object.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />;
  if (object.type === "note") return <g {...common}><circle cx={object.x} cy={object.y} r="10" fill="#fffaf0" stroke={object.color} strokeWidth="2" /><text x={object.x} y={object.y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill={object.color}>{object.number}</text></g>;
  const symbols = { door: "▱", "secret-door": "S", window: "⌁", "stairs-up": "↥", "stairs-down": "↧", trap: "△", pit: "○" };
  return <text {...common} x={object.x} y={object.y + 7} textAnchor="middle" fontSize="22" fontWeight="700" fill={object.color}>{symbols[object.type] || "•"}</text>;
}
