from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.db.models import AuditLog, Character
from app.services.ability_modifiers import sync_ability_modifiers
from app.services.ledger import merge_ledger, sync_active_status

VALID_STATUSES = {"Active", "Inactive", "Dead", "Retired", "Missing", "Poisoned", "Petrified", "Imprisoned"}


def sync_response_ledger(character: Character) -> Character:
    character.ledger = sync_ability_modifiers(character.ledger or {})
    return character


def audit(
    db: Session,
    actor_discord_user_id: str | None,
    action: str,
    character: Character,
    payload: dict[str, Any],
) -> None:
    db.add(
        AuditLog(
            actor_discord_user_id=actor_discord_user_id,
            action=action,
            entity_type="character",
            entity_id=character.id,
            payload=payload,
        )
    )


def player_character_count(db: Session, discord_user_id: str) -> int:
    return len(
        db.scalars(select(Character).where(Character.discord_user_id == discord_user_id)).all()
    )


def ensure_can_access(character: Character, actor_discord_user_id: str, actor_is_admin: bool) -> None:
    if actor_is_admin or character.discord_user_id == actor_discord_user_id:
        return
    raise HTTPException(status_code=403, detail="You cannot view or edit another player's character.")


def get_character(db: Session, character_id: int, actor_discord_user_id: str, actor_is_admin: bool) -> Character:
    character = db.get(Character, character_id)
    if character is None:
        raise HTTPException(status_code=404, detail="Character not found.")
    ensure_can_access(character, actor_discord_user_id, actor_is_admin)
    return sync_response_ledger(character)


def get_active_character_by_discord(db: Session, discord_user_id: str) -> Character:
    character = db.scalar(
        select(Character)
        .where(Character.discord_user_id == discord_user_id, Character.is_active.is_(True))
        .order_by(Character.created_at.desc())
    )
    if character is None:
        raise HTTPException(status_code=404, detail="No active character found for this Discord user.")
    return sync_response_ledger(character)


def find_character_by_name(
    db: Session,
    character_name: str,
    actor_discord_user_id: str,
    actor_is_admin: bool,
) -> Character:
    query = select(Character).where(Character.character_name.ilike(f"%{character_name}%"))
    if not actor_is_admin:
        query = query.where(Character.discord_user_id == actor_discord_user_id)

    matches = db.scalars(query.order_by(Character.created_at.desc())).all()
    if not matches:
        raise HTTPException(status_code=404, detail="Character not found.")
    if len(matches) > 1:
        names = ", ".join(f"{match.character_name} ({match.player_name})" for match in matches[:8])
        raise HTTPException(status_code=409, detail=f"More than one character matches that name: {names}.")
    return sync_response_ledger(matches[0])


def list_owned_characters(db: Session, discord_user_id: str) -> list[Character]:
    characters = db.scalars(
        select(Character)
        .where(Character.discord_user_id == discord_user_id)
        .order_by(Character.is_active.desc(), Character.character_name.asc())
    ).all()
    return [sync_response_ledger(character) for character in characters]


def update_character_status(character: Character, status: str) -> None:
    if status not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail="Invalid character status.")
    character.status = status
    character.is_active = status == "Active"
    character.ledger = sync_active_status(character.ledger or {}, status)
    flag_modified(character, "ledger")


def activate_character(db: Session, character: Character, actor_discord_user_id: str, actor_is_admin: bool) -> Character:
    ensure_can_access(character, actor_discord_user_id, actor_is_admin)
    siblings = db.scalars(select(Character).where(Character.discord_user_id == character.discord_user_id)).all()
    for sibling in siblings:
        update_character_status(sibling, "Active" if sibling.id == character.id else "Inactive")
    audit(db, actor_discord_user_id, "character.activate", character, {"character_name": character.character_name})
    db.commit()
    db.refresh(character)
    return character


def update_ledger_section(
    db: Session,
    character: Character,
    patch: dict[str, Any],
    actor_discord_user_id: str | None,
    action: str,
) -> Character:
    character.ledger = merge_ledger(character.ledger or {}, patch)
    if "abilities" in patch or "Ability Scores" in patch:
        character.ledger = sync_ability_modifiers(character.ledger)
    status = None
    if "identity" in patch and "status" in patch["identity"]:
        raw_status = patch["identity"]["status"]
        if isinstance(raw_status, str):
            status = raw_status
    if status == "Active":
        siblings = db.scalars(select(Character).where(Character.discord_user_id == character.discord_user_id)).all()
        for sibling in siblings:
            update_character_status(sibling, "Active" if sibling.id == character.id else "Inactive")
    elif status is not None:
        if isinstance(status, str):
            update_character_status(character, status)
    flag_modified(character, "ledger")
    audit(db, actor_discord_user_id, action, character, {"patch": patch})
    db.commit()
    db.refresh(character)
    return character


def _equipment(ledger: dict[str, Any]) -> dict[str, Any]:
    equipment = ledger.get("equipment")
    if not isinstance(equipment, dict):
        equipment = {}
    equipment.setdefault("inventory", [])
    equipment.setdefault("equipped", [])
    equipment.setdefault("stored", [])
    equipment.setdefault("encumbrance_total", 0)
    equipment.setdefault("encumbrance_category", None)
    return equipment


def _bucket_for_location(location: str) -> str:
    normalized = location.lower()
    if normalized == "equipped":
        return "equipped"
    if normalized == "stored":
        return "stored"
    return "inventory"


def _find_item(items: list[dict[str, Any]], item_name: str) -> dict[str, Any] | None:
    lowered = item_name.lower()
    for item in items:
        if str(item.get("item_name", "")).lower() == lowered:
            return item
    return None


def _recalculate_encumbrance(equipment: dict[str, Any]) -> None:
    total = 0.0
    for bucket in ("inventory", "equipped", "stored"):
        for item in equipment.get(bucket, []):
            if bucket == "stored":
                continue
            total += float(item.get("weight", 0) or 0) * int(item.get("quantity", 1) or 1)
    equipment["encumbrance_total"] = total


def add_equipment(
    db: Session,
    character: Character,
    actor_discord_user_id: str,
    item_name: str,
    quantity: int,
    weight: float,
    damage: str | None,
    value: str | None,
    equipped: bool,
    location: str,
    notes: str | None,
) -> Character:
    ledger = dict(character.ledger or {})
    equipment = _equipment(ledger)
    bucket = "equipped" if equipped else _bucket_for_location(location)
    items = equipment[bucket]
    item = _find_item(items, item_name)
    if item is None:
        item = {
            "item_name": item_name,
            "quantity": quantity,
            "weight": weight,
            "damage": damage,
            "value": value,
            "equipped": bucket == "equipped",
            "location": "equipped" if bucket == "equipped" else location,
            "notes": notes,
        }
        items.append(item)
    else:
        item["quantity"] = int(item.get("quantity", 0) or 0) + quantity
        item["weight"] = weight
        if damage:
            item["damage"] = damage
        if value:
            item["value"] = value
        item["equipped"] = bucket == "equipped"
        if notes:
            item["notes"] = notes
    _recalculate_encumbrance(equipment)
    ledger["equipment"] = equipment
    character.ledger = ledger
    flag_modified(character, "ledger")
    audit(db, actor_discord_user_id, "ledger.equipment.add", character, {"item_name": item_name, "quantity": quantity})
    db.commit()
    db.refresh(character)
    return character


def remove_equipment(db: Session, character: Character, actor_discord_user_id: str, item_name: str, quantity: int) -> Character:
    ledger = dict(character.ledger or {})
    equipment = _equipment(ledger)
    remaining = quantity
    for bucket in ("inventory", "equipped", "stored"):
        items = equipment[bucket]
        item = _find_item(items, item_name)
        if item is None:
            continue
        current = int(item.get("quantity", 1) or 1)
        removed = min(current, remaining)
        item["quantity"] = current - removed
        remaining -= removed
        if item["quantity"] <= 0:
            items.remove(item)
        if remaining <= 0:
            break
    if remaining == quantity:
        raise HTTPException(status_code=404, detail="Equipment item not found.")
    _recalculate_encumbrance(equipment)
    ledger["equipment"] = equipment
    character.ledger = ledger
    flag_modified(character, "ledger")
    audit(db, actor_discord_user_id, "ledger.equipment.remove", character, {"item_name": item_name, "quantity": quantity})
    db.commit()
    db.refresh(character)
    return character


def move_equipment(
    db: Session,
    character: Character,
    actor_discord_user_id: str,
    item_name: str,
    destination: str,
) -> Character:
    ledger = dict(character.ledger or {})
    equipment = _equipment(ledger)
    target = _find_item(equipment[destination], item_name)
    source_bucket = None
    source_item = None
    for bucket in ("inventory", "equipped", "stored"):
        if bucket == destination:
            continue
        item = _find_item(equipment[bucket], item_name)
        if item is not None:
            source_bucket = bucket
            source_item = item
            break
    if source_item is None or source_bucket is None:
        raise HTTPException(status_code=404, detail="Equipment item not found.")
    equipment[source_bucket].remove(source_item)
    source_item["location"] = "equipped" if destination == "equipped" else "carried"
    source_item["equipped"] = destination == "equipped"
    if target is None:
        equipment[destination].append(source_item)
    else:
        target["quantity"] = int(target.get("quantity", 0) or 0) + int(source_item.get("quantity", 1) or 1)
    _recalculate_encumbrance(equipment)
    ledger["equipment"] = equipment
    character.ledger = ledger
    flag_modified(character, "ledger")
    audit(db, actor_discord_user_id, f"ledger.equipment.{destination}", character, {"item_name": item_name})
    db.commit()
    db.refresh(character)
    return character
