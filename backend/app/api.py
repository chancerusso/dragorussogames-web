from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import (
    create_admin_token,
    create_player_token,
    hash_password,
    require_admin as require_jwt_admin,
    require_player,
    require_player_or_admin,
    validate_admin_password,
    verify_password,
)
from app.config import settings
from app.db.models import (
    AuditLog,
    Campaign,
    Character,
    CharacterAbilityScores,
    CharacterCoins,
    CharacterCombatStats,
    CharacterInventory,
    CharacterSpell,
    CampaignPlayer,
    EquipmentCatalog,
    Player,
    SafeStorageLocation,
    SpellsCatalog,
    VaultCharacter,
    WeaponProficiency,
)
from app.db.session import get_db
from app.schemas import (
    ActivateCharacterRequest,
    CharacterCreateRequest,
    CharacterResponse,
    EquipmentAddRequest,
    EquipmentMoveRequest,
    EquipmentRemoveRequest,
    HealthResponse,
    LedgerPatchRequest,
    MarchingOrderRequest,
    MarchingOrderResponse,
    GroupStoreRequest,
    GroupStoreResponse,
    TrackerScope,
    TrackerResponse,
    TrackerStartRequest,
    TrackerUpdateRequest,
)
from app.services.vault_rules import (
    ABILITIES,
    ALIGNMENTS,
    CLASSES,
    RACES,
    adjusted_abilities,
    character_warnings,
    derived_stats,
    ammunition_profile,
    ammunition_unit_cost,
    equipment_total_weight,
    equipment_stack_value,
    is_allowed_equipment,
    is_ammunition,
    proficiency_count,
    seed_vault_catalogs,
    spell_slot_summary,
    strength_display,
)
from app.services.combat_runtime import combat_payload, weapon_combat
from app.services.characters import (
    activate_character,
    add_equipment,
    find_character_by_name,
    get_character,
    get_active_character_by_discord,
    list_owned_characters,
    player_character_count,
    remove_equipment,
    update_ledger_section,
    move_equipment,
)
from app.services.ledger import build_initial_ledger, sync_active_status
from app.services.advancement import AdvancementPreviewService, runtime_audit_payload
from app.services.canonical_content import CanonicalContentError, CanonicalContentService
from app.services.expedition import (
    get_order,
    get_store,
    get_tracker,
    order_payload,
    require_admin as require_expedition_admin,
    start_tracker,
    tracker_payload,
    update_tracker,
    update_store,
    upsert_order,
)

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)
DRAGONLANCE_RACE_DIR = Path(__file__).resolve().parents[2] / "content" / "settings" / "dragonlance" / "races"
DRAGONLANCE_CLASS_DIR = Path(__file__).resolve().parents[2] / "content" / "settings" / "dragonlance" / "classes"


def load_dragonlance_race_names() -> set[str]:
    try:
        files = json.loads((DRAGONLANCE_RACE_DIR / "index.json").read_text())
        return {
            json.loads((DRAGONLANCE_RACE_DIR / file_name).read_text()).get("name")
            for file_name in files
        } - {None}
    except OSError:
        return set()


DRAGONLANCE_RACE_NAMES = load_dragonlance_race_names()
REFERENCE_CONTENT = CanonicalContentService(enabled=True)


def load_dragonlance_class_names() -> set[str]:
    try:
        files = json.loads((DRAGONLANCE_CLASS_DIR / "index.json").read_text())
        return {
            json.loads((DRAGONLANCE_CLASS_DIR / file_name).read_text()).get("name")
            for file_name in files
        } - {None}
    except OSError:
        return set()


DRAGONLANCE_CLASS_NAMES = load_dragonlance_class_names()
DRAGONLANCE_CLASS_PROFILES = {}
try:
    for file_name in json.loads((DRAGONLANCE_CLASS_DIR / "index.json").read_text()):
        profile = json.loads((DRAGONLANCE_CLASS_DIR / file_name).read_text())
        DRAGONLANCE_CLASS_PROFILES[profile.get("name")] = profile
except OSError:
    DRAGONLANCE_CLASS_PROFILES = {}

VALID_INVENTORY_STATUSES = {"carried", "equipped", "stored", "dropped", "lost", "destroyed"}


def ensure_vault_seeded(db: Session) -> None:
    seed_vault_catalogs(db)


def equipment_payload(item: EquipmentCatalog) -> dict:
    base_payload = {
        "id": item.id,
        "name": item.name,
        "type": item.type,
        "subtype": item.subtype,
        "cost_amount": item.cost_amount,
        "cost_coin": item.cost_coin,
        "weight": item.weight,
        "damage_small_medium": item.damage_small_medium,
        "damage_large": item.damage_large,
        "rate_of_fire": item.rate_of_fire,
        "range": item.range,
        "armor_class_value": item.armor_class_value,
        "armor_class_adjustment": item.armor_class_adjustment,
        "properties": item.properties or {},
        "rules_reference": item.rules_reference,
        "is_core_osric": item.is_core_osric,
        "is_dm_created": item.is_dm_created,
        "created_by_user_id": item.created_by_user_id,
        "campaign_id": item.campaign_id,
        "notes": item.notes,
        "archived": item.archived,
    }
    profile = ammunition_profile(base_payload)
    if profile:
        base_payload.update(
            {
                "is_ammunition": True,
                "ammunition_kind": profile["kind"],
                "ammunition_display_name": profile["display_name"],
                "compatible_weapon_terms": list(profile["compatible_weapon_terms"]),
                "bundle_size": profile["bundle_size"],
            }
        )
    else:
        base_payload["is_ammunition"] = False
    return base_payload


def inventory_payload(item: CharacterInventory) -> dict:
    equipment = equipment_payload(item.equipment)
    quantity = max(0, int(item.quantity or 0))
    profile = ammunition_profile(equipment)
    stack_value = equipment_stack_value(equipment, quantity)
    return {
        "id": item.id,
        "equipment_id": item.equipment_id,
        "quantity": quantity,
        "status": item.status,
        "container_id": item.container_id,
        "storage_location": item.storage_location,
        "notes": item.notes,
        "equipment": equipment,
        "is_ammunition": is_ammunition(equipment),
        "ammunition_kind": equipment.get("ammunition_kind"),
        "ammunition_display_name": equipment.get("ammunition_display_name"),
        "compatible_weapon_terms": equipment.get("compatible_weapon_terms") or [],
        "unit_weight": equipment_total_weight(equipment, 1) if profile else float(equipment.get("weight") or 0),
        "total_weight": round(equipment_total_weight(equipment, quantity), 4),
        "unit_cost": round(ammunition_unit_cost(equipment), 6) if profile and ammunition_unit_cost(equipment) is not None else equipment.get("cost_amount"),
        "stack_value": round(stack_value, 4) if stack_value is not None else None,
        "stack_value_coin": equipment.get("cost_coin"),
    }


def _numeric_effect(effects: dict[str, Any], *keys: str) -> int:
    for key in keys:
        if effects.get(key) not in (None, ""):
            try:
                return int(effects[key])
            except (TypeError, ValueError):
                return 0
    return 0


def applied_magic_equipment_payload(item: dict) -> dict | None:
    base = item.get("applied_equipment") if isinstance(item.get("applied_equipment"), dict) else None
    if not base:
        base = default_applied_magic_equipment(item)
    if not base:
        return None
    effects = item.get("equipment_effects") if isinstance(item.get("equipment_effects"), dict) else {}
    equipment = dict(base)
    properties = dict(equipment.get("properties") or {})
    magic_bonus = _numeric_effect(effects, "magic_bonus")
    attack_bonus = _numeric_effect(effects, "attack_bonus")
    damage_bonus = _numeric_effect(effects, "damage_bonus")
    ac_adjustment = _numeric_effect(effects, "armor_class_adjustment")
    if magic_bonus:
        properties["magic_bonus"] = magic_bonus
    if attack_bonus:
        properties["attack_bonus"] = attack_bonus
    if damage_bonus:
        properties["damage_bonus"] = damage_bonus
    for key in ("damage_small_medium", "damage_large", "range", "rate_of_fire"):
        if effects.get(key) not in (None, ""):
            equipment[key] = effects[key]
    if effects.get("weight") not in (None, ""):
        try:
            equipment["weight"] = max(0, float(effects["weight"]))
        except (TypeError, ValueError):
            pass
    if effects.get("weapon_mode") in {"melee", "missile", "thrown"}:
        properties["weapon_mode"] = effects["weapon_mode"]
    if effects.get("base_item"):
        properties["proficiency_equipment_name"] = effects["base_item"]
    elif base.get("name") and not properties.get("proficiency_equipment_name"):
        properties["proficiency_equipment_name"] = base["name"]
    if equipment.get("type") == "armor" and equipment.get("armor_class_value") is not None and ac_adjustment:
        equipment["armor_class_value"] = int(equipment["armor_class_value"]) + ac_adjustment
    if equipment.get("type") == "shield" and ac_adjustment:
        properties["shield_bonus"] = max(1, 1 + abs(ac_adjustment))
    equipment.update(
        {
            "name": item.get("name") or equipment.get("name"),
            "properties": properties,
            "is_magic_item": True,
            "magic_item_id": item.get("id"),
            "magic_catalog_id": item.get("catalog_id"),
            "magic_description": item.get("description") or "",
        }
    )
    return equipment


def default_applied_magic_equipment(item: dict) -> dict | None:
    if item.get("catalog_id") != "osric.magic_item.hammer_of_thunderbolts":
        return None
    return {
        "id": 0,
        "name": "Hammer of Thunderbolts",
        "type": "weapon",
        "subtype": "melee",
        "cost_amount": None,
        "cost_coin": None,
        "weight": 15,
        "damage_small_medium": "4d6",
        "damage_large": "4d6",
        "rate_of_fire": None,
        "range": "30 ft",
        "armor_class_value": None,
        "armor_class_adjustment": None,
        "properties": {"weapon_mode": "thrown", "proficiency_equipment_name": "Hammer, war, heavy"},
        "rules_reference": "/1e/how-to-play/magic/",
    }


def magic_item_inventory_payload(item: dict) -> dict | None:
    if item.get("status") in {"lost", "destroyed"}:
        return None
    equipment = applied_magic_equipment_payload(item)
    if not equipment:
        return None
    quantity = 1
    stack_value = equipment_stack_value(equipment, quantity)
    return {
        "id": item.get("id"),
        "magic_item_id": item.get("id"),
        "equipment_id": equipment.get("id"),
        "quantity": quantity,
        "status": item.get("status") or "carried",
        "container_id": None,
        "storage_location": None,
        "notes": item.get("notes") or "",
        "equipment": equipment,
        "is_magic_item": True,
        "is_ammunition": False,
        "ammunition_kind": None,
        "ammunition_display_name": None,
        "compatible_weapon_terms": [],
        "unit_weight": float(equipment.get("weight") or 0),
        "total_weight": round(equipment_total_weight(equipment, quantity), 4),
        "unit_cost": equipment.get("cost_amount"),
        "stack_value": round(stack_value, 4) if stack_value is not None else None,
        "stack_value_coin": equipment.get("cost_coin"),
    }


def spell_payload(spell: SpellsCatalog) -> dict:
    return {
        "id": spell.id,
        "name": spell.name,
        "class_list": spell.class_list or [],
        "spell_level": spell.spell_level,
        "range": spell.range,
        "duration": spell.duration,
        "area_of_effect": spell.area_of_effect,
        "components": spell.components,
        "description": spell.description,
        "rules_reference": spell.rules_reference,
    }


def campaign_payload(campaign: Campaign) -> dict:
    allowed_sourcebooks = ["DRAGOLANCE"] if campaign.setting in {"dragonlance", "dragolance"} else ["OSRIC", "GREYHAWK"]
    return {
        "id": campaign.id,
        "name": campaign.name,
        "description": campaign.description,
        "dm_user_id": campaign.dm_user_id,
        "setting": campaign.setting,
        "allowed_sourcebooks": allowed_sourcebooks,
        "schedule": campaign.schedule,
        "next_session_date": campaign.next_session_date,
        "session_number": campaign.session_number,
        "current_campaign_day": campaign.current_campaign_day,
        "default_location": campaign.default_location,
        "status": campaign.status,
        "created_at": campaign.created_at,
        "updated_at": campaign.updated_at,
    }


def player_payload(player: Player) -> dict:
    return {
        "id": player.id,
        "username": player.username,
        "display_name": player.display_name or player.player_name,
        "player_name": player.player_name,
        "discord_user_id": player.discord_user_id,
        "email": player.email,
        "role": player.role,
        "status": player.status,
        "active": player.active,
        "created_at": player.created_at,
        "updated_at": player.updated_at,
    }


def campaign_player_payload(membership: CampaignPlayer, player: Player | None = None) -> dict:
    payload = {
        "campaign_id": membership.campaign_id,
        "user_id": membership.user_id,
        "role": membership.role,
        "created_at": membership.created_at,
        "updated_at": membership.updated_at,
    }
    if player:
        payload["player"] = player_payload(player)
    return payload


def safe_storage_payload(location: SafeStorageLocation, stored_items: list[dict] | None = None) -> dict:
    return {
        "id": location.id,
        "campaign_id": location.campaign_id,
        "name": location.name,
        "description": location.description,
        "status": location.status,
        "created_at": location.created_at,
        "updated_at": location.updated_at,
        "stored_items": stored_items or [],
    }


def combat_runtime_error_payload() -> dict:
    return {
        "thac0": {"automation_status": "runtime_error"},
        "attacks_per_round": {"automation_status": "runtime_error"},
        "weapons": [],
        "runtime_matrix": [],
        "automation_status": "runtime_error",
        "error": "Combat runtime unavailable. The rest of the character payload is preserved.",
    }


def character_combat_runtime(character_id: int, adjusted_scores: dict, inventory: list[dict], class_name: str, race: str, level: int, weapon_proficiencies: list[dict], exceptional_strength: int | None = None) -> dict:
    try:
        return combat_payload(
            adjusted_scores,
            inventory,
            class_name,
            race,
            level,
            weapon_proficiencies,
            exceptional_strength,
        )
    except Exception:
        logger.exception("Combat runtime generation failed for character %s", character_id)
        return combat_runtime_error_payload()


def character_payload(character: VaultCharacter) -> dict:
    abilities = character.abilities
    coins = character.coins
    combat = character.combat
    inventory = [
        inventory_payload(item)
        for item in character.inventory
    ]
    magic_inventory = [
        payload
        for payload in (magic_item_inventory_payload(item) for item in (character.magic_items or []))
        if payload is not None
    ]
    runtime_inventory = [*inventory, *magic_inventory]
    spell_entries = [
        {
            "id": spell.id,
            "spell_id": spell.spell_id,
            "spell": spell_payload(spell.spell),
            "known": spell.known,
            "in_spellbook": spell.in_spellbook,
            "prepared": spell.prepared,
            "memorized_count": spell.memorized_count,
            "notes": spell.notes,
        }
        for spell in character.spells
    ]
    weapon_proficiencies = [
        {
            "id": prof.id,
            "equipment_id": prof.equipment_id,
            "equipment": equipment_payload(prof.equipment),
            "proficient": prof.proficient,
            "specialization": prof.specialization,
            "notes": prof.notes,
        }
        for prof in character.proficiencies
    ]
    adjusted_scores = {
        ability: getattr(abilities, f"racial_adjusted_{ability}") for ability in ABILITIES
    } if abilities else {}
    coins_payload = {
        "platinum": coins.platinum if coins else 0,
        "gold": coins.gold if coins else 0,
        "electrum": coins.electrum if coins else 0,
        "silver": coins.silver if coins else 0,
        "copper": coins.copper if coins else 0,
    }
    derived = derived_stats(
        adjusted_scores,
        runtime_inventory,
        coins_payload,
        rules_class_name(character.class_name),
        rules_race_name(character.race),
        character.level,
        abilities.exceptional_strength if abilities else None,
    ) if abilities else {}
    combat_runtime = character_combat_runtime(
        character.id,
        adjusted_scores,
        runtime_inventory,
        rules_class_name(character.class_name),
        rules_race_name(character.race),
        character.level,
        weapon_proficiencies,
        abilities.exceptional_strength if abilities else None,
    ) if abilities else combat_runtime_error_payload()
    return {
        "id": character.id,
        "user_id": character.user_id,
        "player": player_payload(character.player) if getattr(character, "player", None) else None,
        "campaign_id": character.campaign_id,
        "name": character.name,
        "race": character.race,
        "class_name": character.class_name,
        "subclass_or_specialty": character.subclass_or_specialty,
        "alignment": character.alignment,
        "level": character.level,
        "xp": character.xp,
        "status": character.status,
        "life_status": character.life_status,
        "campaign_day": character.campaign_day,
        "current_location": character.current_location,
        "safe_storage_location": character.safe_storage_location,
        "notes": character.notes,
        "original_rolls": character.original_rolls or [],
        "magic_items": character.magic_items or [],
        "abilities": {ability: getattr(abilities, ability) for ability in ABILITIES} if abilities else {},
        "adjusted_abilities": adjusted_scores,
        "exceptional_strength": abilities.exceptional_strength if abilities else None,
        "strength_display": strength_display(
            abilities.racial_adjusted_strength if abilities else 10,
            abilities.exceptional_strength if abilities else None,
            rules_class_name(character.class_name),
        ),
        "coins": coins_payload,
        "combat": {
            "max_hp": combat.max_hp if combat else 1,
            "current_hp": combat.current_hp if combat else 1,
            "temporary_hp": combat.temporary_hp if combat else 0,
            "armor_class": derived.get("armor_class", combat.armor_class if combat else 10),
            "flank_armor_class": derived.get("flank_armor_class"),
            "rear_armor_class": derived.get("rear_armor_class"),
            "unarmored_ac": derived.get("unarmored_ac", combat.unarmored_ac if combat else 10),
            "shield_bonus": derived.get("shield_bonus", combat.shield_bonus if combat else 0),
            "dex_adjustment": derived.get("dex_adjustment", combat.dex_adjustment if combat else 0),
            "movement_rate": derived.get("movement_rate", combat.movement_rate if combat else 120),
            "carried_weight": derived.get("carried_weight", combat.carried_weight if combat else 0),
            "encumbrance_band": derived.get("encumbrance_band", combat.encumbrance_band if combat else "Unencumbered"),
            "encumbrance": derived.get("encumbrance", {}),
            "surprise_adjustment": derived.get("surprise_adjustment", combat.surprise_adjustment if combat else "Manual DM Review"),
            "initiative_adjustment": derived.get("initiative_adjustment", combat.initiative_adjustment if combat else "Manual DM Review"),
            "saving_throws": derived.get("saving_throws", combat.saving_throws if combat else {"status": "Manual DM Review"}),
            "ability_modifiers": derived.get("ability_modifiers", {}),
            "ability_breakdown": derived.get("ability_breakdown", {}),
            "armor_class_breakdown": derived.get("armor_class_breakdown", {}),
            "coin_weight": derived.get("coin_weight", 0),
            "coin_count": derived.get("coin_count", 0),
            "runtime": combat_runtime,
        },
        "warnings": character_warnings(character.race, character.class_name, character.alignment),
        "class_details": {
            **(CLASSES.get(rules_class_name(character.class_name), CLASSES.get(character.class_name, {}))),
            "proficiency_count": proficiency_count(rules_class_name(character.class_name), character.level),
            "rules_class_name": rules_class_name(character.class_name),
        },
        "race_details": RACES.get(rules_race_name(character.race), {}),
        "inventory": runtime_inventory,
        "weapon_proficiencies": weapon_proficiencies,
        "spells": spell_entries,
        "spell_slots": spell_slot_summary(spell_rules_class_name(character.class_name), character.level, spell_entries),
        "rules": {
            "ability_scores": "/1e/character-creation/001-ability-scores/",
            "race": f"/1e/races/{character.race.lower().replace(' ', '-').replace('half-', 'half-')}/",
            "class": f"/1e/classes/{character.class_name.lower().replace(' ', '-').replace('magic-user', 'magic-user')}/",
            "equipment": "/1e/equipment/",
            "encumbrance": "/1e/how-to-play/equipment-encumbrance/",
            "magic": "/1e/how-to-play/magic/",
        },
    }


def character_weapon_preview(character: VaultCharacter, equipment: EquipmentCatalog) -> dict:
    if character.abilities is None:
        raise HTTPException(status_code=422, detail="Character ability scores are required for combat preview.")
    adjusted_scores = {
        ability: getattr(character.abilities, f"racial_adjusted_{ability}") for ability in ABILITIES
    }
    proficiencies = [
        {
            "id": prof.id,
            "equipment_id": prof.equipment_id,
            "equipment": equipment_payload(prof.equipment),
            "proficient": prof.proficient,
            "specialization": prof.specialization,
            "notes": prof.notes,
        }
        for prof in character.proficiencies
    ]
    return weapon_combat(
        equipment_payload(equipment),
        adjusted_scores,
        rules_class_name(character.class_name),
        rules_race_name(character.race),
        character.level,
        proficiencies,
        character.abilities.exceptional_strength,
    )


def get_vault_character_or_404(db: Session, character_id: int) -> VaultCharacter:
    character = db.get(VaultCharacter, character_id)
    if character is None:
        raise HTTPException(status_code=404, detail="Character not found.")
    return character


def get_or_create_vault_player(db: Session, display_name: Optional[str], user_id: Optional[int] = None) -> Player:
    if user_id:
        player = db.get(Player, user_id)
        if player:
            return player
    name = display_name or "Placeholder Player"
    player = db.scalar(select(Player).where(Player.display_name == name))
    if player is None:
        player = Player(player_name=name, display_name=name, role="player")
        db.add(player)
        db.flush()
    return player


def apply_player_fields(player: Player, data: dict) -> Player:
    if data.get("owner_name") and not data.get("display_name"):
        data = {**data, "display_name": data["owner_name"]}
    if data.get("display_name"):
        player.display_name = data["display_name"]
        player.player_name = data.get("player_name") or data["display_name"]
    if data.get("email") is not None:
        player.email = data.get("email")
    if data.get("discord_user_id") is not None:
        player.discord_user_id = data.get("discord_user_id")
    if data.get("role"):
        player.role = validate_player_role(data["role"])
    if data.get("status"):
        player.status = validate_player_status(data["status"])
        player.active = player.status == "active"
    if "active" in data:
        player.active = bool(data["active"])
        player.status = "active" if player.active else "inactive"
    return player


def validate_player_role(role: str) -> str:
    if role not in {"player", "dm", "admin"}:
        raise HTTPException(status_code=422, detail="role must be player, dm, or admin.")
    return role


def validate_player_status(status: str) -> str:
    if status not in {"active", "inactive"}:
        raise HTTPException(status_code=422, detail="status must be active or inactive.")
    return status


def validate_username(username: Optional[str]) -> str:
    value = (username or "").strip().lower()
    if not value:
        raise HTTPException(status_code=422, detail="username is required.")
    if len(value) < 3 or len(value) > 80:
        raise HTTPException(status_code=422, detail="username must be 3-80 characters.")
    if not all(character.isalnum() or character in {"_", "-", "."} for character in value):
        raise HTTPException(status_code=422, detail="username can only include letters, numbers, dots, dashes, and underscores.")
    return value


def ensure_unique_username(db: Session, username: str, player_id: int | None = None) -> None:
    existing = db.scalar(select(Player).where(Player.username == username))
    if existing and existing.id != player_id:
        raise HTTPException(status_code=409, detail="username is already in use.")


def validate_campaign_setting(setting: str) -> str:
    if setting not in {"greyhawk", "dragonlance"}:
        raise HTTPException(status_code=422, detail="setting must be greyhawk or dragonlance.")
    return setting


def get_player_or_404(db: Session, user_id: int) -> Player:
    player = db.get(Player, user_id)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found.")
    return player


def get_campaign_or_404(db: Session, campaign_id: int) -> Campaign:
    campaign = db.get(Campaign, campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    return campaign


def campaign_counts(db: Session, campaign_id: int) -> dict[str, int]:
    player_count = db.scalar(select(func.count()).select_from(CampaignPlayer).where(CampaignPlayer.campaign_id == campaign_id)) or 0
    character_count = db.scalar(
        select(func.count())
        .select_from(VaultCharacter)
        .where(VaultCharacter.campaign_id == campaign_id, VaultCharacter.status != "archived")
    ) or 0
    return {"player_count": player_count, "character_count": character_count}


def campaign_detail_payload(db: Session, campaign: Campaign) -> dict:
    payload = campaign_payload(campaign)
    payload.update(campaign_counts(db, campaign.id))
    memberships = db.scalars(select(CampaignPlayer).where(CampaignPlayer.campaign_id == campaign.id)).all()
    players = {player.id: player for player in db.scalars(select(Player).where(Player.id.in_([m.user_id for m in memberships]))).all()} if memberships else {}
    characters = [character_payload(character) for character in db.scalars(select(VaultCharacter).where(VaultCharacter.campaign_id == campaign.id)).all()]
    stored_items = stored_items_for_campaign(db, campaign.id)
    payload["players"] = [campaign_player_payload(membership, players.get(membership.user_id)) for membership in memberships]
    payload["characters"] = characters
    payload["active_characters"] = [character for character in characters if character["status"] == "active" and character["life_status"] == "alive"]
    payload["inactive_characters"] = [character for character in characters if character["status"] != "active" or character["life_status"] != "alive"]
    payload["safe_storage_locations"] = [
        safe_storage_payload(
            location,
            [item for item in stored_items if item["storage_location"] == location.name],
        )
        for location in db.scalars(select(SafeStorageLocation).where(SafeStorageLocation.campaign_id == campaign.id, SafeStorageLocation.status != "archived").order_by(SafeStorageLocation.name)).all()
    ]
    payload["stored_items"] = stored_items
    return payload


def player_from_claims(db: Session, claims: dict) -> Player:
    try:
        player_id = int(claims["sub"])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid session.") from None
    player = db.get(Player, player_id)
    if player is None or not player.active:
        raise HTTPException(status_code=401, detail="Player account is inactive.")
    return player


def ensure_player_campaign_member(db: Session, campaign_id: int, player_id: int) -> CampaignPlayer:
    membership = db.get(CampaignPlayer, (campaign_id, player_id))
    if membership is None:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    return membership


def stored_items_for_campaign(db: Session, campaign_id: int) -> list[dict]:
    rows = db.scalars(
        select(CharacterInventory)
        .join(VaultCharacter, CharacterInventory.character_id == VaultCharacter.id)
        .where(VaultCharacter.campaign_id == campaign_id, CharacterInventory.status == "stored")
    ).all()
    return [
        {
            "id": item.id,
            "character_id": item.character_id,
            "character_name": item.character.name,
            "storage_location": item.storage_location,
            "quantity": item.quantity,
            "equipment": equipment_payload(item.equipment),
            "notes": item.notes,
        }
        for item in rows
    ]


def recalculate_character(db: Session, character: VaultCharacter) -> None:
    scores = {ability: getattr(character.abilities, ability) for ability in ABILITIES}
    adjusted = adjusted_abilities(scores, character.race)
    for ability, value in adjusted.items():
        setattr(character.abilities, f"racial_adjusted_{ability}", value)
    inventory = [
        {"quantity": item.quantity, "status": item.status, "equipment": equipment_payload(item.equipment)}
        for item in character.inventory
    ]
    coins = {
        "platinum": character.coins.platinum,
        "gold": character.coins.gold,
        "electrum": character.coins.electrum,
        "silver": character.coins.silver,
        "copper": character.coins.copper,
    }
    stats = derived_stats(
        adjusted,
        inventory,
        coins,
        rules_class_name(character.class_name),
        rules_race_name(character.race),
        character.level,
        character.abilities.exceptional_strength,
    )
    for field, value in stats.items():
        if hasattr(character.combat, field):
            setattr(character.combat, field, value)
    db.flush()


def validate_non_negative_coins(coins: dict) -> None:
    for coin in ("platinum", "gold", "electrum", "silver", "copper"):
        if int(coins.get(coin, 0) or 0) < 0:
            raise HTTPException(status_code=422, detail=f"{coin} cannot be negative.")


def normalize_magic_items(items: list[dict] | None) -> list[dict]:
    normalized = []
    for index, item in enumerate(items or [], start=1):
        if not isinstance(item, dict):
            continue
        name = str(item.get("name") or "").strip()
        if not name:
            continue
        status = str(item.get("status") or "carried").strip().lower()
        if status not in {"equipped", "carried", "stored", "lost", "destroyed"}:
            status = "carried"
        charges_raw = item.get("charges")
        max_charges_raw = item.get("max_charges")
        charges = None if charges_raw in (None, "") else max(0, int(charges_raw))
        max_charges = None if max_charges_raw in (None, "") else max(0, int(max_charges_raw))
        effects = item.get("equipment_effects") if isinstance(item.get("equipment_effects"), dict) else {}
        source_ref = item.get("source_ref") if isinstance(item.get("source_ref"), dict) else {}
        applied_equipment = item.get("applied_equipment") if isinstance(item.get("applied_equipment"), dict) else None
        weight_raw = item.get("weight")
        try:
            weight = None if weight_raw in (None, "") else max(0, float(weight_raw))
        except (TypeError, ValueError):
            weight = None
        normalized.append(
            {
                "id": str(item.get("id") or f"magic-{index}"),
                "catalog_id": str(item.get("catalog_id") or "").strip()[:160],
                "name": name[:160],
                "category": str(item.get("category") or "Misc Magic").strip()[:80],
                "source": str(item.get("source") or "").strip()[:80],
                "source_ref": source_ref,
                "description": str(item.get("description") or "").strip()[:1200],
                "weight": weight,
                "equipment_effects": effects,
                "applied_equipment": applied_equipment,
                "status": status,
                "identified": bool(item.get("identified", False)),
                "charges": charges,
                "max_charges": max_charges,
                "notes": str(item.get("notes") or "").strip()[:1000],
            }
        )
    return normalized


def validate_character_choice(data: dict) -> None:
    race = data.get("race")
    class_name = data.get("class_name")
    alignment = data.get("alignment")
    if race and race not in RACES and race not in DRAGONLANCE_RACE_NAMES:
        raise HTTPException(status_code=422, detail=f"Unsupported race: {race}.")
    if class_name and class_name not in CLASSES and class_name not in DRAGONLANCE_CLASS_NAMES and not is_sword_knight_class(class_name):
        raise HTTPException(status_code=422, detail=f"Unsupported class: {class_name}.")
    if alignment and alignment not in ALIGNMENTS:
        raise HTTPException(status_code=422, detail=f"Unsupported alignment: {alignment}.")


def validate_equipped_inventory(character: VaultCharacter, item: CharacterInventory, override: bool = False) -> None:
    if override or item.status != "equipped":
        return
    equipment = item.equipment
    if equipment.type == "armor":
        equipped_armors = [
            inventory_item for inventory_item in character.inventory
            if inventory_item.status == "equipped" and inventory_item.equipment.type == "armor" and inventory_item.id != item.id
        ]
        if equipped_armors:
            raise HTTPException(status_code=422, detail="Only one suit of armor can be equipped.")
    if equipment.type == "shield":
        equipped_shields = [
            inventory_item for inventory_item in character.inventory
            if inventory_item.status == "equipped" and inventory_item.equipment.type == "shield" and inventory_item.id != item.id
        ]
        if equipped_shields:
            raise HTTPException(status_code=422, detail="Only one shield can be equipped.")
    allowed, reason = is_allowed_equipment(rules_class_name(character.class_name), equipment_payload(equipment))
    if not allowed:
        raise HTTPException(status_code=422, detail=f"{character.class_name} cannot equip {equipment.name}. {reason}")


def character_spell_entries(character: VaultCharacter, exclude_id: int | None = None, candidate: dict | None = None) -> list[dict]:
    entries = []
    for spell in character.spells:
        if exclude_id is not None and spell.id == exclude_id:
            continue
        entries.append(
            {
                "id": spell.id,
                "spell": spell_payload(spell.spell),
                "prepared": spell.prepared,
                "memorized_count": spell.memorized_count,
            }
        )
    if candidate:
        entries.append(candidate)
    return entries


def normalized_class_name(class_name: str) -> str:
    return " ".join(str(class_name or "").strip().split()).lower()


def is_sword_knight_class(class_name: str) -> bool:
    return normalized_class_name(class_name) == "knight of the sword"


def spell_rules_class_name(class_name: str) -> str:
    if is_sword_knight_class(class_name):
        return "Knight of the Sword"
    return rules_class_name(class_name)


def spell_class_info(class_name: str) -> dict:
    if is_sword_knight_class(class_name):
        return {
            "spellcaster": True,
            "spell_lists": ["cleric"],
            "spellcasting_starts_level": 6,
    }
    return CLASSES.get(spell_rules_class_name(class_name), {})


def spell_filter_lists(class_name: str | None) -> set[str]:
    if not class_name:
        return set()
    normalized = class_name.lower().replace(" ", "-")
    class_info = spell_class_info(class_name)
    return set(class_info.get("spell_lists") or [normalized])


def rules_class_name(class_name: str) -> str:
    if is_sword_knight_class(class_name):
        return "Fighter"
    if class_name in CLASSES:
        return class_name
    aliases = {
        "Knight of Solamnia": "Fighter",
        "Knight of the Crown": "Fighter",
        "Knight of the Sword": "Fighter",
        "Knight of the Rose": "Fighter",
        "Robe Order Wizard": "Magic-User",
        "Student Magic-User": "Magic-User",
        "White Robe Wizard": "Magic-User",
        "Red Robe Wizard": "Magic-User",
        "Black Robe Wizard": "Magic-User",
        "Thief / Handler": "Thief",
    }
    if class_name in aliases:
        return aliases[class_name]
    profile = DRAGONLANCE_CLASS_PROFILES.get(class_name) or {}
    base_class = profile.get("base_class")
    return aliases.get(base_class, base_class if base_class in CLASSES else class_name)


def rules_race_name(race: str) -> str:
    if race in RACES:
        return race
    lowered = (race or "").lower()
    if "dwarf" in lowered:
        return "Dwarf"
    if "half-elf" in lowered or "half elf" in lowered:
        return "Half-Elf"
    if "elf" in lowered:
        return "Elf"
    if "gnome" in lowered:
        return "Gnome"
    if "kender" in lowered:
        return "Halfling"
    return race


def spell_has_available_slot(class_name: str, level: int, spell: SpellsCatalog) -> bool:
    rules_class = spell_rules_class_name(class_name)
    slots = spell_slot_summary(rules_class, level, [])["slots"]
    level_key = str(spell.spell_level)
    if rules_class == "Ranger":
        matching_lists = set(spell.class_list or [])
        return any(int(levels.get(level_key) or 0) > 0 for bucket, levels in slots.items() if bucket in matching_lists)
    return int(slots.get(level_key) or 0) > 0


def validate_spell_preparation(character: VaultCharacter, spell: SpellsCatalog, data: dict, exclude_id: int | None = None) -> None:
    rules_class = spell_rules_class_name(character.class_name)
    class_info = spell_class_info(character.class_name)
    class_lists = class_info.get("spell_lists") or []
    if not class_lists:
        raise HTTPException(status_code=422, detail=f"{character.class_name} does not have normal spell preparation.")
    starts_level = int(class_info.get("spellcasting_starts_level") or 1)
    if character.level < starts_level:
        raise HTTPException(status_code=422, detail=f"{character.class_name} spellcasting begins at level {starts_level}.")
    matching_lists = set(class_lists).intersection(set(spell.class_list or []))
    if not matching_lists:
        raise HTTPException(status_code=422, detail=f"{spell.name} is not on the {character.class_name} spell list.")
    if data.get("known", True) and not spell_has_available_slot(character.class_name, character.level, spell):
        raise HTTPException(status_code=422, detail=f"{character.class_name} cannot use level {spell.spell_level} spells at level {character.level}.")
    prepared = bool(data.get("prepared", False))
    memorized_count = int(data.get("memorized_count") or (1 if prepared else 0))
    if memorized_count < 0:
        raise HTTPException(status_code=422, detail="Memorized count cannot be negative.")
    if prepared or memorized_count > 0:
        if not (data.get("known") or data.get("in_spellbook")):
            raise HTTPException(status_code=422, detail=f"{character.class_name} can only prepare known spells.")
        candidate = {
            "spell": spell_payload(spell),
            "prepared": prepared,
            "memorized_count": memorized_count,
        }
        summary = spell_slot_summary(rules_class, character.level, character_spell_entries(character, exclude_id, candidate))
        remaining = summary["remaining"]
        if rules_class == "Ranger":
            buckets = [name for name in ("druid", "magic-user") if name in matching_lists]
            if not any(remaining.get(bucket, {}).get(str(spell.spell_level), 0) >= 0 for bucket in buckets):
                raise HTTPException(status_code=422, detail=f"No remaining level {spell.spell_level} spell slots.")
            if all(summary["used"].get(bucket, {}).get(str(spell.spell_level), 0) > summary["slots"].get(bucket, {}).get(str(spell.spell_level), 0) for bucket in buckets):
                raise HTTPException(status_code=422, detail=f"No remaining level {spell.spell_level} spell slots.")
        else:
            level_key = str(spell.spell_level)
            if summary["used"].get(level_key, 0) > summary["slots"].get(level_key, 0):
                raise HTTPException(status_code=422, detail=f"No remaining level {spell.spell_level} spell slots.")


def add_spell_record(character: VaultCharacter, data: dict, db: Session) -> dict:
    spell = db.get(SpellsCatalog, int(data["spell_id"]))
    if spell is None:
        raise HTTPException(status_code=404, detail="Spell not found.")
    existing = db.scalar(select(CharacterSpell).where(CharacterSpell.character_id == character.id, CharacterSpell.spell_id == spell.id))
    validate_spell_preparation(character, spell, data, existing.id if existing else None)
    if existing:
        existing.known = bool(data.get("known", existing.known))
        existing.in_spellbook = bool(data.get("in_spellbook", existing.in_spellbook))
        existing.prepared = bool(data.get("prepared", existing.prepared))
        existing.memorized_count = int(data.get("memorized_count", existing.memorized_count) or 0)
        existing.notes = data.get("notes", existing.notes)
    else:
        character_spell = CharacterSpell(
            character_id=character.id,
            spell_id=spell.id,
            known=bool(data.get("known", True)),
            in_spellbook=bool(data.get("in_spellbook", False)),
            prepared=bool(data.get("prepared", False)),
            memorized_count=int(data.get("memorized_count") or 0),
            notes=data.get("notes"),
        )
        db.add(character_spell)
    db.commit()
    db.refresh(character)
    return character_payload(character)


def update_spell_record(character: VaultCharacter, character_spell_id: int, data: dict, db: Session) -> dict:
    character_spell = db.get(CharacterSpell, character_spell_id)
    if character_spell is None or character_spell.character_id != character.id:
        raise HTTPException(status_code=404, detail="Character spell not found.")
    merged = {
        "known": character_spell.known,
        "in_spellbook": character_spell.in_spellbook,
        "prepared": character_spell.prepared,
        "memorized_count": character_spell.memorized_count,
        "notes": character_spell.notes,
        **data,
    }
    validate_spell_preparation(character, character_spell.spell, merged, character_spell.id)
    for field in ("known", "in_spellbook", "prepared", "memorized_count", "notes"):
        if field in data:
            setattr(character_spell, field, data[field])
    db.commit()
    db.refresh(character)
    return character_payload(character)


def delete_spell_record(character: VaultCharacter, character_spell_id: int, db: Session) -> dict:
    character_spell = db.get(CharacterSpell, character_spell_id)
    if character_spell is None or character_spell.character_id != character.id:
        raise HTTPException(status_code=404, detail="Character spell not found.")
    db.delete(character_spell)
    db.commit()
    db.refresh(character)
    return character_payload(character)


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(ok=True)


@router.post("/auth/login")
def admin_login(data: dict, response: Response) -> dict:
    validate_admin_password(data.get("password"))
    token = create_admin_token()
    response.set_cookie(
        key="drg_admin_session",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=60 * 60 * 12,
        path="/",
    )
    return {"token": token, "user": {"role": "admin", "display_name": "Admin"}}


@router.post("/auth/logout")
def admin_logout(response: Response) -> dict:
    response.delete_cookie(key="drg_admin_session", path="/")
    return {"ok": True}


@router.get("/auth/me")
def admin_me(admin: dict = Depends(require_jwt_admin)) -> dict:
    return {"role": admin["role"], "display_name": "Admin", "expires_at": admin["exp"]}


@router.post("/player/login")
def player_login(data: dict, response: Response, db: Session = Depends(get_db)) -> dict:
    username = validate_username(data.get("username"))
    player = db.scalar(select(Player).where(Player.username == username))
    if player is None or not player.active or not verify_password(data.get("password"), player.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    token = create_player_token(player.id, player.username or username, player.display_name or player.player_name)
    response.set_cookie(
        key="drg_player_session",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=60 * 60 * 12,
        path="/",
    )
    return {"token": token, "user": player_payload(player)}


@router.post("/player/logout")
def player_logout(response: Response) -> dict:
    response.delete_cookie(key="drg_player_session", path="/")
    return {"ok": True}


@router.get("/player/me")
def player_me(claims: dict = Depends(require_player), db: Session = Depends(get_db)) -> dict:
    return player_payload(player_from_claims(db, claims))


@router.get("/player/campaigns")
def list_player_campaigns(claims: dict = Depends(require_player), db: Session = Depends(get_db)) -> list[dict]:
    player = player_from_claims(db, claims)
    memberships = db.scalars(select(CampaignPlayer).where(CampaignPlayer.user_id == player.id)).all()
    campaigns = [db.get(Campaign, membership.campaign_id) for membership in memberships]
    payloads = []
    for campaign in campaigns:
        if campaign is None or campaign.status == "archived":
            continue
        payload = campaign_detail_payload(db, campaign)
        payload["my_character"] = next((character for character in payload["characters"] if character["user_id"] == player.id), None)
        payloads.append(payload)
    return payloads


@router.get("/player/campaigns/{campaign_id}")
def get_player_campaign(campaign_id: int, claims: dict = Depends(require_player), db: Session = Depends(get_db)) -> dict:
    player = player_from_claims(db, claims)
    ensure_player_campaign_member(db, campaign_id, player.id)
    campaign = get_campaign_or_404(db, campaign_id)
    payload = campaign_detail_payload(db, campaign)
    payload["my_character"] = next((character for character in payload["characters"] if character["user_id"] == player.id), None)
    return payload


@router.get("/1e/rules-data")
def vault_rules_data(_: dict = Depends(require_player_or_admin)) -> dict:
    return {"races": RACES, "classes": CLASSES, "alignments": ALIGNMENTS}


def reference_service() -> CanonicalContentService:
    try:
        return REFERENCE_CONTENT.load_all()
    except CanonicalContentError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


def review_status(record: dict) -> str:
    review = record.get("review")
    if isinstance(review, dict):
        return str(review.get("status") or "")
    return str(review or "")


def canonical_summary(record: dict) -> dict:
    return {
        "id": record.get("id"),
        "type": record.get("type"),
        "name": record.get("name"),
        "display_name": record.get("display_name") or record.get("name") or record.get("id"),
        "source_library_id": record.get("source_library_id"),
        "review_status": review_status(record),
        "summary": record.get("summary") or record.get("description") or record.get("notes") or "",
    }


@router.get("/1e/reference/catalog")
def canonical_reference_catalog(
    source_library_id: Optional[str] = None,
    record_type: Optional[str] = None,
    q: Optional[str] = None,
    _: dict = Depends(require_jwt_admin),
) -> dict:
    service = reference_service()
    normalized_source = None if source_library_id in {None, "", "all"} else source_library_id
    normalized_type = None if record_type in {None, "", "all"} else record_type
    records = service.list_records(record_type=normalized_type, source_library_id=normalized_source, search=q)
    rules_pages = []
    if normalized_type in {None, "rules_page"} and normalized_source in {None, "osric"}:
        rules_pages = service.list_rules_pages(search=q)
    return {
        "sources": [canonical_summary(source) for source in service.list_source_libraries()],
        "record_types": sorted(set(service.list_record_types()) | ({"rules_page"} if service.list_rules_pages() else set())),
        "records": [canonical_summary(record) for record in records],
        "rules_pages": rules_pages,
    }


@router.get("/1e/reference/records/{record_id}")
def canonical_reference_record(record_id: str, _: dict = Depends(require_jwt_admin)) -> dict:
    service = reference_service()
    record = service.get_by_id(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Canonical record not found.")
    return {
        "record": record,
        "summary": canonical_summary(record),
        "references": service.resolved_references(record_id),
    }


def advancement_service() -> AdvancementPreviewService:
    return AdvancementPreviewService(reference_service())


def apply_advancement_to_character(character: VaultCharacter, data: dict, db: Session) -> dict:
    target_level = int(data.get("target_level") or (int(character.level or 1) + 1))
    if target_level <= int(character.level or 1):
        raise HTTPException(status_code=422, detail="Target level must be higher than current level.")
    if data.get("class_track") or data.get("mode") in {"multiclass", "dual_class"}:
        raise HTTPException(status_code=422, detail="Multiclass and dual-class advancement require strict class-track state and are not writable yet.")
    service = advancement_service()
    preview = service.preview_advancement(character, target_level=target_level, proposed_xp=data.get("proposed_xp"))
    blockers = list(preview.get("advancement_blockers") or [])
    if blockers and not data.get("dm_override"):
        raise HTTPException(status_code=422, detail={"message": "Advancement is blocked.", "blockers": blockers})
    hp_preview = preview.get("hit_point_advancement") or {}
    hp_gain = data.get("hp_gain")
    if hp_preview.get("roll") and hp_gain is None:
        raise HTTPException(status_code=422, detail="HP gain is required when the advancement preview calls for a hit-point roll.")
    fixed_gain = int(hp_preview.get("fixed_hp_gain") or 0)
    con_gain = int(hp_preview.get("constitution_modifier") or 0) if hp_preview.get("roll") else 0
    total_hp_gain = fixed_gain
    if hp_gain is not None:
        total_hp_gain += int(hp_gain) + con_gain
    if hp_preview.get("roll"):
        total_hp_gain = max(int(hp_preview.get("minimum_gain") or 1), total_hp_gain)
    character.level = target_level
    if data.get("xp") is not None:
        character.xp = int(data["xp"])
    elif preview.get("xp_required"):
        character.xp = max(int(character.xp or 0), int(preview["xp_required"]))
    if total_hp_gain:
        character.combat.max_hp = int(character.combat.max_hp or 0) + total_hp_gain
        character.combat.current_hp = int(character.combat.current_hp or 0) + total_hp_gain
    note = str(data.get("notes") or "").strip()
    if note:
        character.notes = note if not character.notes else f"{character.notes}\n{note}"
    recalculate_character(db, character)
    db.commit()
    db.refresh(character)
    payload = character_payload(character)
    payload["advancement_applied"] = {
        "target_level": target_level,
        "hp_gain_total": total_hp_gain,
        "preview": preview,
    }
    return payload


@router.get("/1e/characters/{character_id}/advancement-preview")
def preview_vault_character_advancement(
    character_id: int,
    target_level: Optional[int] = None,
    class_track: Optional[str] = None,
    proposed_xp: Optional[int] = None,
    _: dict = Depends(require_jwt_admin),
    db: Session = Depends(get_db),
) -> dict:
    character = get_vault_character_or_404(db, character_id)
    return advancement_service().preview_advancement(character, target_level=target_level, class_track=class_track, proposed_xp=proposed_xp)


@router.post("/1e/characters/{character_id}/advance")
def advance_vault_character(
    character_id: int,
    data: dict,
    _: dict = Depends(require_jwt_admin),
    db: Session = Depends(get_db),
) -> dict:
    character = get_vault_character_or_404(db, character_id)
    return apply_advancement_to_character(character, data, db)


@router.get("/player/characters/{character_id}/advancement-preview")
def preview_player_character_advancement(
    character_id: int,
    target_level: Optional[int] = None,
    class_track: Optional[str] = None,
    proposed_xp: Optional[int] = None,
    claims: dict = Depends(require_player),
    db: Session = Depends(get_db),
) -> dict:
    player = player_from_claims(db, claims)
    character = player_character_or_404(db, character_id, player.id)
    return advancement_service().preview_advancement(character, target_level=target_level, class_track=class_track, proposed_xp=proposed_xp)


@router.post("/player/characters/{character_id}/advance")
def advance_player_character(
    character_id: int,
    data: dict,
    claims: dict = Depends(require_player),
    db: Session = Depends(get_db),
) -> dict:
    player = player_from_claims(db, claims)
    character = player_character_or_404(db, character_id, player.id)
    return apply_advancement_to_character(character, data, db)


@router.get("/1e/character-runtime-audit")
def character_runtime_audit(_: dict = Depends(require_jwt_admin)) -> list[dict[str, str]]:
    return runtime_audit_payload()


@router.get("/1e/players")
def list_vault_players(_: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> list[dict]:
    players = db.scalars(select(Player).order_by(Player.display_name, Player.player_name)).all()
    payloads = []
    for player in players:
        payload = player_payload(player)
        payload["campaign_count"] = db.scalar(select(func.count()).select_from(CampaignPlayer).where(CampaignPlayer.user_id == player.id)) or 0
        payload["character_count"] = db.scalar(select(func.count()).select_from(VaultCharacter).where(VaultCharacter.user_id == player.id, VaultCharacter.status != "archived")) or 0
        payloads.append(payload)
    return payloads


@router.post("/1e/players")
def create_vault_player(data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    role = validate_player_role(data.get("role") or "player")
    active = bool(data.get("active", True))
    status = validate_player_status(data.get("status") or ("active" if active else "inactive"))
    display_name = data.get("display_name") or data.get("player_name")
    if not display_name:
        raise HTTPException(status_code=422, detail="display_name is required.")
    username = validate_username(data.get("username"))
    ensure_unique_username(db, username)
    player = Player(
        player_name=data.get("player_name") or display_name,
        username=username,
        password_hash=hash_password(data.get("password") or ""),
        display_name=display_name,
        email=data.get("email"),
        discord_user_id=data.get("discord_user_id"),
        role=role,
        status=status,
        active=active and status == "active",
    )
    db.add(player)
    db.commit()
    db.refresh(player)
    return player_payload(player)


@router.get("/1e/players/{user_id}")
def get_vault_player(user_id: int, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    return player_payload(get_player_or_404(db, user_id))


@router.put("/1e/players/{user_id}")
def update_vault_player(user_id: int, data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    player = get_player_or_404(db, user_id)
    for field in ("display_name", "player_name", "email", "discord_user_id"):
        if field in data:
            setattr(player, field, data[field])
    if "username" in data:
        username = validate_username(data["username"])
        ensure_unique_username(db, username, player.id)
        player.username = username
    if "role" in data:
        player.role = validate_player_role(data["role"])
    if "status" in data:
        player.status = validate_player_status(data["status"])
        player.active = player.status == "active"
    if "active" in data:
        player.active = bool(data["active"])
        player.status = "active" if player.active else "inactive"
    if not player.player_name:
        player.player_name = player.display_name or f"Player {player.id}"
    db.commit()
    db.refresh(player)
    return player_payload(player)


@router.post("/1e/players/{user_id}/reset-password")
def reset_vault_player_password(user_id: int, data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    player = get_player_or_404(db, user_id)
    player.password_hash = hash_password(data.get("password") or "")
    db.commit()
    return {"ok": True}


@router.get("/1e/equipment")
def list_vault_equipment(
    q: Optional[str] = None,
    type: Optional[str] = None,
    subtype: Optional[str] = None,
    class_name: Optional[str] = None,
    campaign_id: Optional[int] = None,
    allowed_only: bool = False,
    include_archived: bool = False,
    actor: dict = Depends(require_player_or_admin),
    db: Session = Depends(get_db),
) -> list[dict]:
    ensure_vault_seeded(db)
    if actor.get("role") != "admin":
        include_archived = False
    statement = select(EquipmentCatalog).order_by(EquipmentCatalog.name)
    items = db.scalars(statement).all()
    filtered = []
    for item in items:
        if item.archived and not include_archived:
            continue
        if campaign_id and item.campaign_id not in {None, campaign_id}:
            continue
        if q and q.lower() not in item.name.lower():
            continue
        if type and item.type != type:
            continue
        if subtype and item.subtype != subtype:
            continue
        payload = equipment_payload(item)
        if class_name:
            allowed, reason = is_allowed_equipment(class_name, payload)
            payload["class_allowed"] = allowed
            payload["class_allowed_reason"] = reason
            if allowed_only and not allowed:
                continue
        filtered.append(payload)
    return filtered


@router.post("/1e/equipment")
def create_vault_equipment(data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    item = EquipmentCatalog(
        name=data["name"],
        type=data.get("type", "other"),
        subtype=data.get("subtype"),
        cost_amount=data.get("cost_amount"),
        cost_coin=data.get("cost_coin"),
        weight=float(data.get("weight") or 0),
        damage_small_medium=data.get("damage_small_medium"),
        damage_large=data.get("damage_large"),
        rate_of_fire=data.get("rate_of_fire"),
        range=data.get("range"),
        armor_class_value=data.get("armor_class_value"),
        armor_class_adjustment=data.get("armor_class_adjustment"),
        properties=data.get("properties") or {},
        rules_reference=data.get("rules_reference") or "/1e/equipment/",
        is_core_osric=bool(data.get("is_core_osric", False)),
        is_dm_created=bool(data.get("is_dm_created", True)),
        created_by_user_id=data.get("created_by_user_id"),
        campaign_id=data.get("campaign_id"),
        notes=data.get("notes"),
        archived=bool(data.get("archived", False)),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return equipment_payload(item)


@router.put("/1e/equipment/{equipment_id}")
def update_vault_equipment(equipment_id: int, data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    item = db.get(EquipmentCatalog, equipment_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Equipment not found.")
    for field in (
        "name",
        "type",
        "subtype",
        "cost_amount",
        "cost_coin",
        "weight",
        "damage_small_medium",
        "damage_large",
        "rate_of_fire",
        "range",
        "armor_class_value",
        "armor_class_adjustment",
        "properties",
        "rules_reference",
        "is_core_osric",
        "is_dm_created",
        "created_by_user_id",
        "campaign_id",
        "notes",
        "archived",
    ):
        if field in data:
            setattr(item, field, data[field])
    db.commit()
    db.refresh(item)
    return equipment_payload(item)


@router.delete("/1e/equipment/{equipment_id}")
def delete_vault_equipment(equipment_id: int, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    item = db.get(EquipmentCatalog, equipment_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Equipment not found.")
    item.archived = True
    db.commit()
    return {"ok": True, "archived": True}


@router.get("/1e/spells")
def list_vault_spells(
    q: Optional[str] = None,
    class_name: Optional[str] = None,
    spell_level: Optional[int] = None,
    _: dict = Depends(require_player_or_admin),
    db: Session = Depends(get_db),
) -> list[dict]:
    ensure_vault_seeded(db)
    spells = db.scalars(select(SpellsCatalog).order_by(SpellsCatalog.name)).all()
    filtered = []
    for spell in spells:
        if q and q.lower() not in spell.name.lower():
            continue
        if class_name and not spell_filter_lists(class_name).intersection(set(spell.class_list or [])):
            continue
        if spell_level is not None and spell.spell_level != spell_level:
            continue
        filtered.append(spell_payload(spell))
    return filtered


@router.get("/1e/campaigns")
def list_vault_campaigns(include_archived: bool = False, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> list[dict]:
    statement = select(Campaign).order_by(Campaign.name)
    if not include_archived:
        statement = statement.where(Campaign.status != "archived")
    campaigns = db.scalars(statement).all()
    payloads = []
    for campaign in campaigns:
        payload = campaign_payload(campaign)
        payload.update(campaign_counts(db, campaign.id))
        payloads.append(payload)
    return payloads


@router.post("/1e/campaigns")
def create_vault_campaign(data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    campaign = Campaign(
        name=data["name"],
        description=data.get("description"),
        dm_user_id=data.get("dm_user_id"),
        setting=validate_campaign_setting(data.get("setting") or "dragonlance"),
        schedule=data.get("schedule"),
        next_session_date=data.get("next_session_date"),
        session_number=int(data.get("session_number") or 1),
        current_campaign_day=int(data.get("current_campaign_day") or 1),
        default_location=data.get("default_location") or "Town",
        status=data.get("status") or "active",
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    payload = campaign_payload(campaign)
    payload.update(campaign_counts(db, campaign.id))
    return payload


@router.get("/1e/campaigns/{campaign_id}")
def get_vault_campaign(campaign_id: int, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    campaign = get_campaign_or_404(db, campaign_id)
    return campaign_detail_payload(db, campaign)


@router.put("/1e/campaigns/{campaign_id}")
def update_vault_campaign(campaign_id: int, data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    campaign = db.get(Campaign, campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    for field in ("name", "description", "dm_user_id", "schedule", "next_session_date", "default_location", "status"):
        if field in data:
            setattr(campaign, field, data[field])
    if "setting" in data:
        campaign.setting = validate_campaign_setting(data["setting"] or "greyhawk")
    if "current_campaign_day" in data:
        campaign.current_campaign_day = int(data["current_campaign_day"] or 1)
    if "session_number" in data:
        campaign.session_number = int(data["session_number"] or 1)
    db.commit()
    db.refresh(campaign)
    payload = campaign_payload(campaign)
    payload.update(campaign_counts(db, campaign.id))
    return payload


@router.delete("/1e/campaigns/{campaign_id}")
def delete_vault_campaign(campaign_id: int, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    campaign = get_campaign_or_404(db, campaign_id)
    campaign.status = "archived"
    db.commit()
    return {"ok": True, "archived": True}


@router.post("/1e/campaigns/{campaign_id}/players")
def add_vault_campaign_player(campaign_id: int, data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    campaign = get_campaign_or_404(db, campaign_id)
    user_id = data.get("user_id")
    if not user_id:
        player = get_or_create_vault_player(db, data.get("display_name") or data.get("player_name"))
        player.email = data.get("email", player.email)
        player.discord_user_id = data.get("discord_user_id", player.discord_user_id)
        if data.get("role"):
            player.role = validate_player_role(data["role"])
        user_id = player.id
    player = get_player_or_404(db, int(user_id))
    role = data.get("campaign_role") or data.get("role") or ("dm" if player.role in {"dm", "admin"} else "player")
    if role not in {"player", "dm", "observer"}:
        raise HTTPException(status_code=422, detail="campaign role must be player, dm, or observer.")
    membership = db.get(CampaignPlayer, (campaign.id, player.id))
    if membership is None:
        membership = CampaignPlayer(campaign_id=campaign.id, user_id=player.id, role=role)
        db.add(membership)
    else:
        membership.role = role
    db.commit()
    db.refresh(membership)
    return campaign_player_payload(membership, player)


@router.delete("/1e/campaigns/{campaign_id}/players/{user_id}")
def remove_vault_campaign_player(campaign_id: int, user_id: int, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    membership = db.get(CampaignPlayer, (campaign_id, user_id))
    if membership is None:
        raise HTTPException(status_code=404, detail="Campaign player not found.")
    db.delete(membership)
    db.commit()
    return {"ok": True}


@router.post("/1e/campaigns/{campaign_id}/characters/{character_id}")
def assign_vault_character_to_campaign(campaign_id: int, character_id: int, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    campaign = get_campaign_or_404(db, campaign_id)
    character = get_vault_character_or_404(db, character_id)
    character.campaign_id = campaign.id
    if not db.get(CampaignPlayer, (campaign.id, character.user_id)):
        db.add(CampaignPlayer(campaign_id=campaign.id, user_id=character.user_id, role="player"))
    db.commit()
    db.refresh(character)
    return character_payload(character)


@router.delete("/1e/campaigns/{campaign_id}/characters/{character_id}")
def unassign_vault_character_from_campaign(campaign_id: int, character_id: int, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    character = get_vault_character_or_404(db, character_id)
    if character.campaign_id != campaign_id:
        raise HTTPException(status_code=404, detail="Character is not assigned to that campaign.")
    character.campaign_id = None
    db.commit()
    db.refresh(character)
    return character_payload(character)


@router.get("/1e/campaigns/{campaign_id}/safe-storage")
def list_vault_safe_storage(campaign_id: int, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> list[dict]:
    get_campaign_or_404(db, campaign_id)
    stored_items = stored_items_for_campaign(db, campaign_id)
    locations = db.scalars(select(SafeStorageLocation).where(SafeStorageLocation.campaign_id == campaign_id, SafeStorageLocation.status != "archived").order_by(SafeStorageLocation.name)).all()
    return [safe_storage_payload(location, [item for item in stored_items if item["storage_location"] == location.name]) for location in locations]


@router.post("/1e/campaigns/{campaign_id}/safe-storage")
def create_vault_safe_storage(campaign_id: int, data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    campaign = get_campaign_or_404(db, campaign_id)
    name = data.get("name")
    if not name:
        raise HTTPException(status_code=422, detail="Safe storage name is required.")
    existing = db.scalar(select(SafeStorageLocation).where(SafeStorageLocation.campaign_id == campaign.id, SafeStorageLocation.name == name))
    if existing:
        existing.description = data.get("description", existing.description)
        existing.status = data.get("status", existing.status)
        db.commit()
        db.refresh(existing)
        return safe_storage_payload(existing)
    location = SafeStorageLocation(campaign_id=campaign.id, name=name, description=data.get("description"), status=data.get("status") or "active")
    db.add(location)
    db.commit()
    db.refresh(location)
    return safe_storage_payload(location)


@router.put("/1e/campaigns/{campaign_id}/safe-storage/{location_id}")
def update_vault_safe_storage(campaign_id: int, location_id: int, data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    location = db.get(SafeStorageLocation, location_id)
    if location is None or location.campaign_id != campaign_id:
        raise HTTPException(status_code=404, detail="Safe storage location not found.")
    for field in ("name", "description", "status"):
        if field in data:
            setattr(location, field, data[field])
    db.commit()
    db.refresh(location)
    return safe_storage_payload(location)


@router.delete("/1e/campaigns/{campaign_id}/safe-storage/{location_id}")
def archive_vault_safe_storage(campaign_id: int, location_id: int, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    location = db.get(SafeStorageLocation, location_id)
    if location is None or location.campaign_id != campaign_id:
        raise HTTPException(status_code=404, detail="Safe storage location not found.")
    location.status = "archived"
    db.commit()
    return {"ok": True, "archived": True}


@router.get("/1e/characters")
def list_vault_characters(user_id: Optional[int] = None, include_archived: bool = False, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> list[dict]:
    statement = select(VaultCharacter).where(VaultCharacter.status != "archived").order_by(VaultCharacter.updated_at.desc())
    if include_archived:
        statement = select(VaultCharacter).order_by(VaultCharacter.updated_at.desc())
    if user_id:
        statement = statement.where(VaultCharacter.user_id == user_id)
    return [character_payload(character) for character in db.scalars(statement).all()]


def player_character_or_404(db: Session, character_id: int, player_id: int) -> VaultCharacter:
    character = get_vault_character_or_404(db, character_id)
    if character.user_id != player_id:
        raise HTTPException(status_code=404, detail="Character not found.")
    return character


def create_vault_character_for_player(data: dict, player: Player, db: Session) -> dict:
    ensure_vault_seeded(db)
    validate_character_choice(data)
    scores = {ability: int((data.get("abilities") or {}).get(ability) or 10) for ability in ABILITIES}
    race = data.get("race") or "Human"
    class_name = data.get("class_name") or "Fighter"
    adjusted = adjusted_abilities(scores, race)
    coins = data.get("coins") or {}
    validate_non_negative_coins(coins)
    hp = int((data.get("combat") or {}).get("max_hp") or 1)
    character = VaultCharacter(
        user_id=player.id,
        campaign_id=data.get("campaign_id"),
        name=data.get("name") or "Unnamed Adventurer",
        race=race,
        class_name=class_name,
        subclass_or_specialty=data.get("subclass_or_specialty"),
        alignment=data.get("alignment") or "True Neutral",
        level=int(data.get("level") or 1),
        xp=int(data.get("xp") or 0),
        status=data.get("status") or "active",
        life_status=data.get("life_status") or "alive",
        campaign_day=int(data.get("campaign_day") or 1),
        current_location=data.get("current_location") or "Town",
        safe_storage_location=data.get("safe_storage_location"),
        notes=data.get("notes"),
        original_rolls=data.get("original_rolls") or [],
    )
    character.abilities = CharacterAbilityScores(
        **scores,
        exceptional_strength=data.get("exceptional_strength"),
        **{f"racial_adjusted_{ability}": value for ability, value in adjusted.items()},
    )
    character.coins = CharacterCoins(
        platinum=int(coins.get("platinum") or 0),
        gold=int(coins.get("gold") or 0),
        electrum=int(coins.get("electrum") or 0),
        silver=int(coins.get("silver") or 0),
        copper=int(coins.get("copper") or 0),
    )
    character.combat = CharacterCombatStats(
        max_hp=hp,
        current_hp=int((data.get("combat") or {}).get("current_hp") or hp),
        temporary_hp=int((data.get("combat") or {}).get("temporary_hp") or 0),
    )
    db.add(character)
    db.flush()
    if character.campaign_id and not db.get(CampaignPlayer, (character.campaign_id, player.id)):
        db.add(CampaignPlayer(campaign_id=character.campaign_id, user_id=player.id, role="player"))
    recalculate_character(db, character)
    db.commit()
    db.refresh(character)
    return character_payload(character)


@router.get("/player/characters")
def list_player_vault_characters(claims: dict = Depends(require_player), db: Session = Depends(get_db)) -> list[dict]:
    player = player_from_claims(db, claims)
    characters = db.scalars(
        select(VaultCharacter)
        .where(VaultCharacter.user_id == player.id, VaultCharacter.status != "archived")
        .order_by(VaultCharacter.updated_at.desc())
    ).all()
    return [character_payload(character) for character in characters]


@router.post("/player/characters")
def create_player_vault_character(data: dict, claims: dict = Depends(require_player), db: Session = Depends(get_db)) -> dict:
    player = player_from_claims(db, claims)
    campaign_id = data.get("campaign_id")
    if campaign_id:
        ensure_player_campaign_member(db, int(campaign_id), player.id)
    data = {**data, "user_id": player.id}
    return create_vault_character_for_player(data, player, db)


@router.get("/player/characters/{character_id}")
def get_player_vault_character(character_id: int, claims: dict = Depends(require_player), db: Session = Depends(get_db)) -> dict:
    player = player_from_claims(db, claims)
    return character_payload(player_character_or_404(db, character_id, player.id))


@router.post("/1e/characters")
def create_vault_character(data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    player = apply_player_fields(get_or_create_vault_player(db, data.get("owner_name") or data.get("display_name") or data.get("player_name"), data.get("user_id")), data)
    return create_vault_character_for_player(data, player, db)


@router.get("/1e/characters/{character_id}")
def get_vault_character(character_id: int, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    return character_payload(get_vault_character_or_404(db, character_id))


def update_vault_character_record(character: VaultCharacter, data: dict, db: Session) -> dict:
    validate_character_choice(data)
    old_level = character.level
    for field in (
        "campaign_id",
        "name",
        "race",
        "class_name",
        "subclass_or_specialty",
        "alignment",
        "level",
        "xp",
        "status",
        "life_status",
        "campaign_day",
        "current_location",
        "safe_storage_location",
        "notes",
        "original_rolls",
        "magic_items",
    ):
        if field in data:
            setattr(character, field, normalize_magic_items(data[field]) if field == "magic_items" else data[field])
    if "abilities" in data:
        for ability in ABILITIES:
            if ability in data["abilities"]:
                setattr(character.abilities, ability, int(data["abilities"][ability]))
    if "exceptional_strength" in data:
        value = data.get("exceptional_strength")
        character.abilities.exceptional_strength = None if value in (None, "") else int(value)
    if "coins" in data:
        validate_non_negative_coins(data["coins"])
        for coin in ("platinum", "gold", "electrum", "silver", "copper"):
            if coin in data["coins"]:
                setattr(character.coins, coin, int(data["coins"][coin] or 0))
    if "combat" in data:
        for field in ("max_hp", "current_hp", "temporary_hp"):
            if field in data["combat"]:
                setattr(character.combat, field, int(data["combat"][field] or 0))
    recalculate_character(db, character)
    db.commit()
    db.refresh(character)
    payload = character_payload(character)
    if "level" in data and character.level != old_level:
        payload["level_review"] = "Level changed — review HP."
    return payload


@router.put("/player/characters/{character_id}")
def update_player_vault_character(character_id: int, data: dict, claims: dict = Depends(require_player), db: Session = Depends(get_db)) -> dict:
    player = player_from_claims(db, claims)
    character = player_character_or_404(db, character_id, player.id)
    campaign_id = data.get("campaign_id")
    if campaign_id:
        ensure_player_campaign_member(db, int(campaign_id), player.id)
    return update_vault_character_record(character, data, db)


@router.patch("/player/characters/{character_id}")
def patch_player_vault_character(character_id: int, data: dict, claims: dict = Depends(require_player), db: Session = Depends(get_db)) -> dict:
    return update_player_vault_character(character_id, data, claims, db)


@router.put("/1e/characters/{character_id}")
def update_vault_character(character_id: int, data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    character = get_vault_character_or_404(db, character_id)
    return update_vault_character_record(character, data, db)


@router.patch("/1e/characters/{character_id}")
def patch_vault_character(character_id: int, data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    character = get_vault_character_or_404(db, character_id)
    return update_vault_character_record(character, data, db)


@router.delete("/player/characters/{character_id}")
def delete_player_vault_character(character_id: int, claims: dict = Depends(require_player), db: Session = Depends(get_db)) -> dict:
    player = player_from_claims(db, claims)
    character = player_character_or_404(db, character_id, player.id)
    character.status = "archived"
    db.commit()
    return {"ok": True, "archived": True}


@router.delete("/1e/characters/{character_id}")
def delete_vault_character(character_id: int, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    character = get_vault_character_or_404(db, character_id)
    character.status = "archived"
    db.commit()
    return {"ok": True, "archived": True}


def add_inventory_record(character: VaultCharacter, data: dict, db: Session) -> dict:
    equipment = db.get(EquipmentCatalog, int(data["equipment_id"]))
    if equipment is None:
        raise HTTPException(status_code=404, detail="Equipment not found.")
    status = data.get("status") or "carried"
    if status not in VALID_INVENTORY_STATUSES:
        raise HTTPException(status_code=422, detail="Invalid equipment status.")
    default_quantity = int((ammunition_profile(equipment_payload(equipment)) or {}).get("bundle_size") or 1)
    quantity = int(data.get("quantity") or default_quantity)
    if quantity < 1:
        raise HTTPException(status_code=422, detail="Equipment quantity must be at least 1.")
    if status == "stored" and not (data.get("storage_location") or character.safe_storage_location):
        raise HTTPException(status_code=422, detail="Stored equipment requires a storage location.")
    profile = ammunition_profile(equipment_payload(equipment))
    if profile:
        existing = db.scalar(
            select(CharacterInventory).where(
                CharacterInventory.character_id == character.id,
                CharacterInventory.equipment_id == equipment.id,
                CharacterInventory.status == status,
            )
        )
        if existing is not None:
            existing.quantity = int(existing.quantity or 0) + quantity
            if status == "stored":
                existing.storage_location = data.get("storage_location") or existing.storage_location or character.safe_storage_location
            recalculate_character(db, character)
            db.commit()
            db.refresh(character)
            return character_payload(character)
    item = CharacterInventory(
        character_id=character.id,
        equipment_id=equipment.id,
        quantity=quantity,
        status=status,
        container_id=data.get("container_id"),
        storage_location=data.get("storage_location") or (character.safe_storage_location if status == "stored" else None),
        notes=data.get("notes"),
    )
    db.add(item)
    db.flush()
    override = bool(data.get("dm_override", False))
    validate_equipped_inventory(character, item, override)
    if override and status == "equipped":
        item.notes = "DM Override Applied" if not item.notes else f"{item.notes}\nDM Override Applied"
    recalculate_character(db, character)
    db.commit()
    db.refresh(character)
    return character_payload(character)


def update_inventory_record(character: VaultCharacter, inventory_id: int, data: dict, db: Session) -> dict:
    item = db.get(CharacterInventory, inventory_id)
    if item is None or item.character_id != character.id:
        raise HTTPException(status_code=404, detail="Inventory item not found.")
    for field in ("quantity", "status", "container_id", "storage_location", "notes"):
        if field in data:
            setattr(item, field, data[field])
    if item.status not in VALID_INVENTORY_STATUSES:
        raise HTTPException(status_code=422, detail="Invalid equipment status.")
    if item.quantity < 0:
        raise HTTPException(status_code=422, detail="Equipment quantity cannot be negative.")
    if item.quantity == 0:
        db.delete(item)
        db.flush()
        recalculate_character(db, character)
        db.commit()
        db.refresh(character)
        return character_payload(character)
    if item.quantity < 1:
        raise HTTPException(status_code=422, detail="Equipment quantity must be at least 1.")
    if item.status == "stored" and not (item.storage_location or character.safe_storage_location):
        raise HTTPException(status_code=422, detail="Stored equipment requires a storage location.")
    override = bool(data.get("dm_override", False))
    validate_equipped_inventory(character, item, override)
    if override and item.status == "equipped" and "DM Override Applied" not in (item.notes or ""):
        item.notes = "DM Override Applied" if not item.notes else f"{item.notes}\nDM Override Applied"
    recalculate_character(db, character)
    db.commit()
    db.refresh(character)
    return character_payload(character)


def delete_inventory_record(character: VaultCharacter, inventory_id: int, db: Session) -> dict:
    item = db.get(CharacterInventory, inventory_id)
    if item is None or item.character_id != character.id:
        raise HTTPException(status_code=404, detail="Inventory item not found.")
    db.delete(item)
    db.flush()
    recalculate_character(db, character)
    db.commit()
    db.refresh(character)
    return character_payload(character)


@router.post("/player/characters/{character_id}/inventory")
def add_player_vault_inventory(character_id: int, data: dict, claims: dict = Depends(require_player), db: Session = Depends(get_db)) -> dict:
    player = player_from_claims(db, claims)
    character = player_character_or_404(db, character_id, player.id)
    return add_inventory_record(character, data, db)


@router.put("/player/characters/{character_id}/inventory/{inventory_id}")
def update_player_vault_inventory(character_id: int, inventory_id: int, data: dict, claims: dict = Depends(require_player), db: Session = Depends(get_db)) -> dict:
    player = player_from_claims(db, claims)
    character = player_character_or_404(db, character_id, player.id)
    return update_inventory_record(character, inventory_id, data, db)


@router.delete("/player/characters/{character_id}/inventory/{inventory_id}")
def delete_player_vault_inventory(character_id: int, inventory_id: int, claims: dict = Depends(require_player), db: Session = Depends(get_db)) -> dict:
    player = player_from_claims(db, claims)
    character = player_character_or_404(db, character_id, player.id)
    return delete_inventory_record(character, inventory_id, db)


@router.get("/player/characters/{character_id}/combat-preview/{equipment_id}")
def player_combat_preview(character_id: int, equipment_id: int, claims: dict = Depends(require_player), db: Session = Depends(get_db)) -> dict:
    player = player_from_claims(db, claims)
    character = player_character_or_404(db, character_id, player.id)
    equipment = db.get(EquipmentCatalog, equipment_id)
    if equipment is None or equipment.type != "weapon":
        raise HTTPException(status_code=404, detail="Weapon not found.")
    return character_weapon_preview(character, equipment)


def upsert_weapon_proficiency(character: VaultCharacter, data: dict, db: Session) -> dict:
    equipment = db.get(EquipmentCatalog, int(data["equipment_id"]))
    if equipment is None or equipment.type != "weapon":
        raise HTTPException(status_code=422, detail="Weapon proficiency requires a catalog weapon.")
    allowed, reason = is_allowed_equipment(rules_class_name(character.class_name), equipment_payload(equipment))
    if not allowed and not data.get("dm_override"):
        raise HTTPException(status_code=422, detail=f"Weapon proficiency requires DM review for {equipment.name}. {reason}")
    existing = db.scalar(
        select(WeaponProficiency).where(
            WeaponProficiency.character_id == character.id,
            WeaponProficiency.equipment_id == equipment.id,
        )
    )
    if existing is None:
        existing = WeaponProficiency(character_id=character.id, equipment_id=equipment.id)
        db.add(existing)
    existing.proficient = bool(data.get("proficient", True))
    existing.specialization = data.get("specialization")
    existing.notes = data.get("notes")
    db.commit()
    db.refresh(character)
    return character_payload(character)


def remove_weapon_proficiency(character: VaultCharacter, equipment_id: int, db: Session) -> dict:
    existing = db.scalar(
        select(WeaponProficiency).where(
            WeaponProficiency.character_id == character.id,
            WeaponProficiency.equipment_id == equipment_id,
        )
    )
    if existing is not None:
        db.delete(existing)
        db.commit()
    db.refresh(character)
    return character_payload(character)


@router.post("/player/characters/{character_id}/spells")
def add_player_vault_character_spell(character_id: int, data: dict, claims: dict = Depends(require_player), db: Session = Depends(get_db)) -> dict:
    player = player_from_claims(db, claims)
    character = player_character_or_404(db, character_id, player.id)
    return add_spell_record(character, data, db)


@router.put("/player/characters/{character_id}/spells/{character_spell_id}")
def update_player_vault_character_spell(character_id: int, character_spell_id: int, data: dict, claims: dict = Depends(require_player), db: Session = Depends(get_db)) -> dict:
    player = player_from_claims(db, claims)
    character = player_character_or_404(db, character_id, player.id)
    return update_spell_record(character, character_spell_id, data, db)


@router.delete("/player/characters/{character_id}/spells/{character_spell_id}")
def delete_player_vault_character_spell(character_id: int, character_spell_id: int, claims: dict = Depends(require_player), db: Session = Depends(get_db)) -> dict:
    player = player_from_claims(db, claims)
    character = player_character_or_404(db, character_id, player.id)
    return delete_spell_record(character, character_spell_id, db)


@router.post("/1e/characters/{character_id}/inventory")
def add_vault_inventory(character_id: int, data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    character = get_vault_character_or_404(db, character_id)
    return add_inventory_record(character, data, db)


@router.put("/1e/characters/{character_id}/inventory/{inventory_id}")
def update_vault_inventory(character_id: int, inventory_id: int, data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    character = get_vault_character_or_404(db, character_id)
    return update_inventory_record(character, inventory_id, data, db)


@router.delete("/1e/characters/{character_id}/inventory/{inventory_id}")
def delete_vault_inventory(character_id: int, inventory_id: int, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    character = get_vault_character_or_404(db, character_id)
    return delete_inventory_record(character, inventory_id, db)


@router.get("/1e/characters/{character_id}/combat-preview/{equipment_id}")
def admin_combat_preview(character_id: int, equipment_id: int, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    character = get_vault_character_or_404(db, character_id)
    equipment = db.get(EquipmentCatalog, equipment_id)
    if equipment is None or equipment.type != "weapon":
        raise HTTPException(status_code=404, detail="Weapon not found.")
    return character_weapon_preview(character, equipment)


@router.post("/1e/characters/{character_id}/spells")
def add_vault_character_spell(character_id: int, data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    character = get_vault_character_or_404(db, character_id)
    return add_spell_record(character, data, db)


@router.put("/1e/characters/{character_id}/spells/{character_spell_id}")
def update_vault_character_spell(character_id: int, character_spell_id: int, data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    character = get_vault_character_or_404(db, character_id)
    return update_spell_record(character, character_spell_id, data, db)


@router.delete("/1e/characters/{character_id}/spells/{character_spell_id}")
def delete_vault_character_spell(character_id: int, character_spell_id: int, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    character = get_vault_character_or_404(db, character_id)
    return delete_spell_record(character, character_spell_id, db)


@router.post("/player/characters/{character_id}/weapon-proficiencies")
def add_player_vault_weapon_proficiency(character_id: int, data: dict, claims: dict = Depends(require_player), db: Session = Depends(get_db)) -> dict:
    player = player_from_claims(db, claims)
    character = player_character_or_404(db, character_id, player.id)
    return upsert_weapon_proficiency(character, data, db)


@router.delete("/player/characters/{character_id}/weapon-proficiencies/{equipment_id}")
def delete_player_vault_weapon_proficiency(character_id: int, equipment_id: int, claims: dict = Depends(require_player), db: Session = Depends(get_db)) -> dict:
    player = player_from_claims(db, claims)
    character = player_character_or_404(db, character_id, player.id)
    return remove_weapon_proficiency(character, equipment_id, db)


@router.post("/1e/characters/{character_id}/weapon-proficiencies")
def add_vault_weapon_proficiency(character_id: int, data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    character = get_vault_character_or_404(db, character_id)
    return upsert_weapon_proficiency(character, data, db)


@router.delete("/1e/characters/{character_id}/weapon-proficiencies/{equipment_id}")
def delete_vault_weapon_proficiency(character_id: int, equipment_id: int, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    character = get_vault_character_or_404(db, character_id)
    return remove_weapon_proficiency(character, equipment_id, db)


@router.post("/characters", response_model=CharacterResponse)
def create_character(data: CharacterCreateRequest, db: Session = Depends(get_db)) -> Character:
    campaign = db.scalar(select(Campaign).where(Campaign.name == settings.russo_default_campaign))
    if campaign is None:
        campaign = Campaign(name=settings.russo_default_campaign)
        db.add(campaign)
        db.flush()

    player = db.scalar(select(Player).where(Player.discord_user_id == data.discord_user_id))
    if player is None:
        player = Player(
            player_name=data.player_name,
            discord_username=data.discord_username,
            discord_user_id=data.discord_user_id,
        )
        db.add(player)
        db.flush()
    else:
        player.player_name = data.player_name
        player.discord_username = data.discord_username

    is_first_character = player_character_count(db, data.discord_user_id) == 0
    status = "Active" if is_first_character else "Inactive"
    ledger = sync_active_status(build_initial_ledger(data), status)

    character = Character(
        campaign_id=campaign.id,
        player_id=player.id,
        character_name=data.character_name,
        player_name=data.player_name,
        discord_username=data.discord_username,
        discord_user_id=data.discord_user_id,
        ledger=ledger,
        is_active=is_first_character,
        status=status,
    )
    db.add(character)
    db.flush()
    db.add(
        AuditLog(
            actor_discord_user_id=data.discord_user_id,
            action="character.create",
            entity_type="character",
            entity_id=character.id,
            payload={"character_name": data.character_name, "status": character.status},
        )
    )
    db.commit()
    db.refresh(character)
    return character


@router.get("/characters/by-discord/{discord_user_id}", response_model=CharacterResponse)
def get_character_by_discord(discord_user_id: str, db: Session = Depends(get_db)) -> Character:
    return get_active_character_by_discord(db, discord_user_id)


@router.get("/characters", response_model=list[CharacterResponse])
def list_characters(discord_user_id: str, db: Session = Depends(get_db)) -> list[Character]:
    return list_owned_characters(db, discord_user_id)


@router.get("/characters/lookup", response_model=CharacterResponse)
def lookup_character(
    actor_discord_user_id: str,
    actor_is_admin: bool = False,
    character_name: Optional[str] = None,
    db: Session = Depends(get_db),
) -> Character:
    if character_name:
        return find_character_by_name(db, character_name, actor_discord_user_id, actor_is_admin)
    return get_active_character_by_discord(db, actor_discord_user_id)


@router.post("/characters/{character_id}/activate", response_model=CharacterResponse)
def activate_character_route(
    character_id: int,
    data: ActivateCharacterRequest,
    db: Session = Depends(get_db),
) -> Character:
    character = get_character(db, character_id, data.actor_discord_user_id, data.actor_is_admin)
    return activate_character(db, character, data.actor_discord_user_id, data.actor_is_admin)


@router.patch("/characters/{character_id}/ledger", response_model=CharacterResponse)
def patch_character_ledger(
    character_id: int,
    data: LedgerPatchRequest,
    db: Session = Depends(get_db),
) -> Character:
    actor_discord_user_id = data.actor_discord_user_id
    if actor_discord_user_id is None:
        raise HTTPException(status_code=422, detail="actor_discord_user_id is required.")
    character = get_character(db, character_id, actor_discord_user_id, data.actor_is_admin)
    return update_ledger_section(db, character, data.patch, actor_discord_user_id, data.audit_action)


@router.post("/characters/{character_id}/equipment/add", response_model=CharacterResponse)
def add_equipment_route(
    character_id: int,
    data: EquipmentAddRequest,
    db: Session = Depends(get_db),
) -> Character:
    character = get_character(db, character_id, data.actor_discord_user_id, data.actor_is_admin)
    return add_equipment(
        db,
        character,
        data.actor_discord_user_id,
        data.item_name,
        data.quantity,
        data.weight,
        data.damage,
        data.value,
        data.equipped,
        data.location,
        data.notes,
    )


@router.post("/characters/{character_id}/equipment/remove", response_model=CharacterResponse)
def remove_equipment_route(
    character_id: int,
    data: EquipmentRemoveRequest,
    db: Session = Depends(get_db),
) -> Character:
    character = get_character(db, character_id, data.actor_discord_user_id, data.actor_is_admin)
    return remove_equipment(db, character, data.actor_discord_user_id, data.item_name, data.quantity)


@router.post("/characters/{character_id}/equipment/equip", response_model=CharacterResponse)
def equip_equipment_route(
    character_id: int,
    data: EquipmentMoveRequest,
    db: Session = Depends(get_db),
) -> Character:
    character = get_character(db, character_id, data.actor_discord_user_id, data.actor_is_admin)
    return move_equipment(db, character, data.actor_discord_user_id, data.item_name, "equipped")


@router.post("/characters/{character_id}/equipment/unequip", response_model=CharacterResponse)
def unequip_equipment_route(
    character_id: int,
    data: EquipmentMoveRequest,
    db: Session = Depends(get_db),
) -> Character:
    character = get_character(db, character_id, data.actor_discord_user_id, data.actor_is_admin)
    return move_equipment(db, character, data.actor_discord_user_id, data.item_name, "inventory")


@router.post("/tracker/start", response_model=TrackerResponse)
def start_tracker_route(data: TrackerStartRequest, db: Session = Depends(get_db)) -> dict:
    require_expedition_admin(data.actor_is_admin)
    return start_tracker(db, data.guild_id, data.channel_id, data.actor_discord_user_id, data.move_rate, data.rations, data.oil_pints, data.notes)


@router.post("/tracker/status", response_model=TrackerResponse)
def tracker_status_route(data: TrackerScope, db: Session = Depends(get_db)) -> dict:
    return tracker_payload(get_tracker(db, data.guild_id, data.channel_id))


@router.post("/tracker/update", response_model=TrackerResponse)
def tracker_update_route(data: TrackerUpdateRequest, db: Session = Depends(get_db)) -> dict:
    require_expedition_admin(data.actor_is_admin)
    tracker = get_tracker(db, data.guild_id, data.channel_id)
    return update_tracker(db, tracker, data.action, data.amount, data.move_rate, data.holder, data.advance_turn)


@router.post("/order", response_model=MarchingOrderResponse)
def marching_order_route(data: MarchingOrderRequest, db: Session = Depends(get_db)) -> dict:
    if data.positions or data.notes is not None:
        require_expedition_admin(data.actor_is_admin)
        return upsert_order(db, data.guild_id, data.channel_id, data.actor_discord_user_id, data.positions, data.notes)
    return order_payload(get_order(db, data.guild_id, data.channel_id), data.guild_id, data.channel_id)


@router.post("/store", response_model=GroupStoreResponse)
def group_store_route(data: GroupStoreRequest, db: Session = Depends(get_db)) -> dict:
    if data.action != "status":
        require_expedition_admin(data.actor_is_admin)
    store = get_store(db, data.guild_id, data.channel_id, data.actor_discord_user_id, data.channel_name_snapshot)
    item = data.item.model_dump() if data.item is not None else None
    return update_store(db, store, data.actor_discord_user_id, data.action, item, data.coin, data.amount, data.notes)
