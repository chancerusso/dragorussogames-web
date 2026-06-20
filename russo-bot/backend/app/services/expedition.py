from typing import Any

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.db.models import ExpeditionTracker, MarchingOrder

VALID_MOVE_RATES = {120, 90, 60, 30}


def require_admin(actor_is_admin: bool) -> None:
    if not actor_is_admin:
        raise HTTPException(status_code=403, detail="Only the Referee/admin can update the expedition tracker.")


def tracker_payload(tracker: ExpeditionTracker, reminders: list[str] | None = None) -> dict[str, Any]:
    return {
        "guild_id": tracker.guild_id,
        "channel_id": tracker.channel_id,
        "active": tracker.active,
        "day": tracker.day,
        "turn": tracker.turn,
        "move_rate": tracker.move_rate,
        "oil_pints": tracker.oil_pints,
        "rations": tracker.rations,
        "active_lights": tracker.active_lights or [],
        "combat_rest_required": tracker.combat_rest_required,
        "notes": tracker.notes,
        "reminders": reminders or [],
    }


def get_tracker(db: Session, guild_id: str, channel_id: str) -> ExpeditionTracker:
    tracker = db.scalar(select(ExpeditionTracker).where(ExpeditionTracker.guild_id == guild_id, ExpeditionTracker.channel_id == channel_id))
    if tracker is None:
        raise HTTPException(status_code=404, detail="No expedition tracker is active in this channel.")
    return tracker


def start_tracker(db: Session, guild_id: str, channel_id: str, actor_id: str, move_rate: int, rations: int, oil_pints: int, notes: str | None) -> dict[str, Any]:
    if move_rate not in VALID_MOVE_RATES:
        raise HTTPException(status_code=422, detail="move_rate must be 120, 90, 60, or 30.")
    tracker = db.scalar(select(ExpeditionTracker).where(ExpeditionTracker.guild_id == guild_id, ExpeditionTracker.channel_id == channel_id))
    if tracker is None:
        tracker = ExpeditionTracker(
            guild_id=guild_id,
            channel_id=channel_id,
            created_by_discord_id=actor_id,
            active_lights=[],
        )
        db.add(tracker)
    tracker.active = True
    tracker.day = 1
    tracker.turn = 0
    tracker.move_rate = move_rate
    tracker.rations = rations
    tracker.oil_pints = oil_pints
    tracker.active_lights = []
    tracker.combat_rest_required = False
    tracker.notes = notes
    db.commit()
    db.refresh(tracker)
    return tracker_payload(tracker, ["Expedition tracker started."])


def _advance_lights(tracker: ExpeditionTracker) -> list[str]:
    reminders: list[str] = []
    lights = []
    for light in tracker.active_lights or []:
        previous_turns = int(light.get("remaining_turns", 0) or 0)
        light["remaining_turns"] = previous_turns - 1
        label = f"{light.get('holder') or 'Unassigned'} {light.get('type')}"
        if light["remaining_turns"] <= 0:
            reminders.append(f"{label} expired.")
            if light.get("type") == "lantern" and tracker.oil_pints > 0:
                tracker.oil_pints = max(0, tracker.oil_pints - 1)
            continue
        if light.get("type") == "lantern" and previous_turns % 24 == 1 and tracker.oil_pints > 0:
            tracker.oil_pints = max(0, tracker.oil_pints - 1)
        if light["remaining_turns"] == 1:
            reminders.append(f"{label} expires next turn.")
        if light.get("type") == "lantern" and light["remaining_turns"] % 24 == 1:
            reminders.append("Lantern oil pint has 1 turn remaining.")
        lights.append(light)
    tracker.active_lights = lights
    flag_modified(tracker, "active_lights")
    return reminders


def advance_turn(db: Session, tracker: ExpeditionTracker, *, rest: bool = False) -> dict[str, Any]:
    tracker.turn += 1
    reminders = _advance_lights(tracker)
    if not rest and tracker.turn % 3 == 0:
        reminders.append("Wandering monster check due.")
    if not rest and tracker.turn % 6 == 0:
        reminders.append("1-in-6 exploration rest due.")
    if tracker.combat_rest_required:
        if rest:
            reminders.append("Combat rest completed.")
            tracker.combat_rest_required = False
        else:
            reminders.append("Combat rest required.")
    if rest:
        reminders.append("Party rests for 1 exploration turn.")
    db.commit()
    db.refresh(tracker)
    return tracker_payload(tracker, reminders)


def update_tracker(db: Session, tracker: ExpeditionTracker, action: str, amount: int | None = None, move_rate: int | None = None, holder: str | None = None, advance: bool = False) -> dict[str, Any]:
    reminders: list[str] = []
    if action == "next":
        return advance_turn(db, tracker)
    if action == "rest":
        return advance_turn(db, tracker, rest=True)
    if action == "combat":
        tracker.combat_rest_required = True
        reminders.append("Combat marked. Party should rest 1 turn after combat.")
        if advance:
            db.flush()
            return advance_turn(db, tracker)
    elif action == "move":
        if move_rate not in VALID_MOVE_RATES:
            raise HTTPException(status_code=422, detail="move_rate must be 120, 90, 60, or 30.")
        tracker.move_rate = int(move_rate or 120)
        reminders.append(f"Party movement set to {tracker.move_rate} ft per turn.")
    elif action == "torch_light":
        tracker.active_lights = [*(tracker.active_lights or []), {"type": "torch", "holder": holder, "remaining_turns": 6}]
        flag_modified(tracker, "active_lights")
        reminders.append("Torch lit for 6 turns.")
    elif action == "torch_extinguish":
        tracker.active_lights = [light for light in tracker.active_lights or [] if light.get("type") != "torch"]
        flag_modified(tracker, "active_lights")
        reminders.append("Torches extinguished.")
    elif action == "lantern_light":
        if tracker.oil_pints <= 0:
            raise HTTPException(status_code=422, detail="No oil pints available for lantern.")
        tracker.active_lights = [*(tracker.active_lights or []), {"type": "lantern", "holder": holder, "remaining_turns": tracker.oil_pints * 24}]
        flag_modified(tracker, "active_lights")
        reminders.append(f"Lantern lit for {tracker.oil_pints * 24} turns of oil.")
    elif action == "lantern_extinguish":
        tracker.active_lights = [light for light in tracker.active_lights or [] if light.get("type") != "lantern"]
        flag_modified(tracker, "active_lights")
        reminders.append("Lanterns extinguished.")
    elif action in {"oil_add", "oil_subtract", "oil_set", "ration_add", "ration_subtract", "ration_set", "ration_consume"}:
        if amount is None:
            raise HTTPException(status_code=422, detail="amount is required.")
        field = "oil_pints" if action.startswith("oil") else "rations"
        current = int(getattr(tracker, field))
        if action.endswith("add"):
            setattr(tracker, field, current + amount)
        elif action.endswith("subtract") or action.endswith("consume"):
            setattr(tracker, field, max(0, current - amount))
        else:
            setattr(tracker, field, max(0, amount))
        reminders.append(f"{field.replace('_', ' ').title()} updated.")
    elif action == "stop":
        tracker.active = False
        reminders.append("Expedition tracker stopped.")
    elif action in {"status", "torch_status", "lantern_status"}:
        pass
    else:
        raise HTTPException(status_code=422, detail="Unknown tracker action.")
    db.commit()
    db.refresh(tracker)
    return tracker_payload(tracker, reminders)


def get_order(db: Session, guild_id: str, channel_id: str) -> MarchingOrder | None:
    return db.scalar(select(MarchingOrder).where(MarchingOrder.guild_id == guild_id, MarchingOrder.channel_id == channel_id))


def order_payload(order: MarchingOrder | None, guild_id: str, channel_id: str) -> dict[str, Any]:
    positions = {f"pos{i}": None for i in range(1, 9)}
    notes = None
    if order is not None:
        positions.update(order.positions or {})
        notes = order.notes
    return {"guild_id": guild_id, "channel_id": channel_id, "positions": positions, "notes": notes}


def upsert_order(db: Session, guild_id: str, channel_id: str, actor_id: str, positions: dict[str, str | None], notes: str | None) -> dict[str, Any]:
    order = get_order(db, guild_id, channel_id)
    if order is None:
        order = MarchingOrder(guild_id=guild_id, channel_id=channel_id, positions={}, updated_by_discord_id=actor_id)
        db.add(order)
    current = {f"pos{i}": None for i in range(1, 9)}
    current.update(order.positions or {})
    for key, value in positions.items():
        if key in current:
            current[key] = value
    order.positions = current
    order.notes = notes if notes is not None else order.notes
    order.updated_by_discord_id = actor_id
    flag_modified(order, "positions")
    db.commit()
    db.refresh(order)
    return order_payload(order, guild_id, channel_id)
