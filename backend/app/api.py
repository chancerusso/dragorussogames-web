from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import (
    create_admin_token,
    create_player_token,
    hash_password,
    require_admin as require_jwt_admin,
    require_player,
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
    is_allowed_equipment,
    proficiency_count,
    seed_vault_catalogs,
    spell_slot_summary,
)
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
DRAGONLANCE_RACE_DIR = Path(__file__).resolve().parents[2] / "content" / "settings" / "dragonlance" / "races"


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


def ensure_vault_seeded(db: Session) -> None:
    seed_vault_catalogs(db)


def equipment_payload(item: EquipmentCatalog) -> dict:
    return {
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
    return {
        "id": campaign.id,
        "name": campaign.name,
        "description": campaign.description,
        "dm_user_id": campaign.dm_user_id,
        "setting": campaign.setting,
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


def character_payload(character: VaultCharacter) -> dict:
    abilities = character.abilities
    coins = character.coins
    combat = character.combat
    inventory = [
        {
            "id": item.id,
            "equipment_id": item.equipment_id,
            "quantity": item.quantity,
            "status": item.status,
            "container_id": item.container_id,
            "storage_location": item.storage_location,
            "notes": item.notes,
            "equipment": equipment_payload(item.equipment),
        }
        for item in character.inventory
    ]
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
        "abilities": {ability: getattr(abilities, ability) for ability in ABILITIES} if abilities else {},
        "adjusted_abilities": {
            ability: getattr(abilities, f"racial_adjusted_{ability}") for ability in ABILITIES
        } if abilities else {},
        "exceptional_strength": abilities.exceptional_strength if abilities else None,
        "coins": {
            "platinum": coins.platinum if coins else 0,
            "gold": coins.gold if coins else 0,
            "electrum": coins.electrum if coins else 0,
            "silver": coins.silver if coins else 0,
            "copper": coins.copper if coins else 0,
        },
        "combat": {
            "max_hp": combat.max_hp if combat else 1,
            "current_hp": combat.current_hp if combat else 1,
            "armor_class": combat.armor_class if combat else 10,
            "unarmored_ac": combat.unarmored_ac if combat else 10,
            "shield_bonus": combat.shield_bonus if combat else 0,
            "dex_adjustment": combat.dex_adjustment if combat else 0,
            "movement_rate": combat.movement_rate if combat else 120,
            "carried_weight": combat.carried_weight if combat else 0,
            "encumbrance_band": combat.encumbrance_band if combat else "Unencumbered",
            "surprise_adjustment": combat.surprise_adjustment if combat else "Manual DM Review",
            "initiative_adjustment": combat.initiative_adjustment if combat else "Manual DM Review",
            "saving_throws": combat.saving_throws if combat else {"status": "Manual DM Review"},
        },
        "warnings": character_warnings(character.race, character.class_name, character.alignment),
        "class_details": {
            **(CLASSES.get(character.class_name, {})),
            "proficiency_count": proficiency_count(character.class_name, character.level),
        },
        "race_details": RACES.get(character.race, {}),
        "inventory": inventory,
        "weapon_proficiencies": [
            {
                "id": prof.id,
                "equipment_id": prof.equipment_id,
                "equipment": equipment_payload(prof.equipment),
                "proficient": prof.proficient,
                "specialization": prof.specialization,
                "notes": prof.notes,
            }
            for prof in character.proficiencies
        ],
        "spells": spell_entries,
        "spell_slots": spell_slot_summary(character.class_name, character.level, spell_entries),
        "rules": {
            "ability_scores": "/1e/character-creation/001-ability-scores/",
            "race": f"/1e/races/{character.race.lower().replace(' ', '-').replace('half-', 'half-')}/",
            "class": f"/1e/classes/{character.class_name.lower().replace(' ', '-').replace('magic-user', 'magic-user')}/",
            "equipment": "/1e/equipment/",
            "encumbrance": "/1e/how-to-play/equipment-encumbrance/",
            "magic": "/1e/how-to-play/magic/",
        },
    }


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
    stats = derived_stats(adjusted, inventory, coins, character.class_name, character.race, character.level)
    for field, value in stats.items():
        if hasattr(character.combat, field):
            setattr(character.combat, field, value)
    db.flush()


def validate_non_negative_coins(coins: dict) -> None:
    for coin in ("platinum", "gold", "electrum", "silver", "copper"):
        if int(coins.get(coin, 0) or 0) < 0:
            raise HTTPException(status_code=422, detail=f"{coin} cannot be negative.")


def validate_character_choice(data: dict) -> None:
    race = data.get("race")
    class_name = data.get("class_name")
    alignment = data.get("alignment")
    if race and race not in RACES and race not in DRAGONLANCE_RACE_NAMES:
        raise HTTPException(status_code=422, detail=f"Unsupported race: {race}.")
    if class_name and class_name not in CLASSES:
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
    allowed, reason = is_allowed_equipment(character.class_name, equipment_payload(equipment))
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


def validate_spell_preparation(character: VaultCharacter, spell: SpellsCatalog, data: dict, exclude_id: int | None = None) -> None:
    class_info = CLASSES.get(character.class_name, {})
    class_lists = class_info.get("spell_lists") or []
    if not class_lists:
        raise HTTPException(status_code=422, detail=f"{character.class_name} does not have normal spell preparation.")
    starts_level = int(class_info.get("spellcasting_starts_level") or 1)
    if character.level < starts_level:
        raise HTTPException(status_code=422, detail=f"{character.class_name} spellcasting begins at level {starts_level}.")
    matching_lists = set(class_lists).intersection(set(spell.class_list or []))
    if not matching_lists:
        raise HTTPException(status_code=422, detail=f"{spell.name} is not on the {character.class_name} spell list.")
    prepared = bool(data.get("prepared", False))
    memorized_count = int(data.get("memorized_count") or (1 if prepared else 0))
    if memorized_count < 0:
        raise HTTPException(status_code=422, detail="Memorized count cannot be negative.")
    if prepared or memorized_count > 0:
        if character.class_name in {"Magic-User", "Illusionist"} and not (data.get("known") or data.get("in_spellbook")):
            raise HTTPException(status_code=422, detail=f"{character.class_name} can only prepare spells recorded as known/in spellbook.")
        candidate = {
            "spell": spell_payload(spell),
            "prepared": prepared,
            "memorized_count": memorized_count,
        }
        summary = spell_slot_summary(character.class_name, character.level, character_spell_entries(character, exclude_id, candidate))
        remaining = summary["remaining"]
        if character.class_name == "Ranger":
            buckets = [name for name in ("druid", "magic-user") if name in matching_lists]
            if not any(remaining.get(bucket, {}).get(str(spell.spell_level), 0) >= 0 for bucket in buckets):
                raise HTTPException(status_code=422, detail=f"No remaining level {spell.spell_level} spell slots.")
            if all(summary["used"].get(bucket, {}).get(str(spell.spell_level), 0) > summary["slots"].get(bucket, {}).get(str(spell.spell_level), 0) for bucket in buckets):
                raise HTTPException(status_code=422, detail=f"No remaining level {spell.spell_level} spell slots.")
        else:
            level_key = str(spell.spell_level)
            if summary["used"].get(level_key, 0) > summary["slots"].get(level_key, 0):
                raise HTTPException(status_code=422, detail=f"No remaining level {spell.spell_level} spell slots.")


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
def player_login(data: dict, db: Session = Depends(get_db)) -> dict:
    username = validate_username(data.get("username"))
    player = db.scalar(select(Player).where(Player.username == username))
    if player is None or not player.active or not verify_password(data.get("password"), player.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    token = create_player_token(player.id, player.username or username, player.display_name or player.player_name)
    return {"token": token, "user": player_payload(player)}


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
def vault_rules_data() -> dict:
    return {"races": RACES, "classes": CLASSES, "alignments": ALIGNMENTS}


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
    db: Session = Depends(get_db),
) -> list[dict]:
    ensure_vault_seeded(db)
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
    db: Session = Depends(get_db),
) -> list[dict]:
    ensure_vault_seeded(db)
    spells = db.scalars(select(SpellsCatalog).order_by(SpellsCatalog.name)).all()
    filtered = []
    for spell in spells:
        if q and q.lower() not in spell.name.lower():
            continue
        if class_name and class_name.lower().replace(" ", "-") not in (spell.class_list or []):
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
    character.combat = CharacterCombatStats(max_hp=hp, current_hp=int((data.get("combat") or {}).get("current_hp") or hp))
    db.add(character)
    db.flush()
    if character.campaign_id and not db.get(CampaignPlayer, (character.campaign_id, player.id)):
        db.add(CampaignPlayer(campaign_id=character.campaign_id, user_id=player.id, role="player"))
    recalculate_character(db, character)
    db.commit()
    db.refresh(character)
    return character_payload(character)


@router.post("/player/characters")
def create_player_vault_character(data: dict, claims: dict = Depends(require_player), db: Session = Depends(get_db)) -> dict:
    player = player_from_claims(db, claims)
    campaign_id = data.get("campaign_id")
    if campaign_id:
        ensure_player_campaign_member(db, int(campaign_id), player.id)
    data = {**data, "user_id": player.id}
    return create_vault_character_for_player(data, player, db)


@router.post("/1e/characters")
def create_vault_character(data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    player = apply_player_fields(get_or_create_vault_player(db, data.get("owner_name") or data.get("display_name") or data.get("player_name"), data.get("user_id")), data)
    return create_vault_character_for_player(data, player, db)


@router.get("/1e/characters/{character_id}")
def get_vault_character(character_id: int, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    return character_payload(get_vault_character_or_404(db, character_id))


@router.put("/1e/characters/{character_id}")
def update_vault_character(character_id: int, data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    character = get_vault_character_or_404(db, character_id)
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
    ):
        if field in data:
            setattr(character, field, data[field])
    if "abilities" in data:
        for ability in ABILITIES:
            if ability in data["abilities"]:
                setattr(character.abilities, ability, int(data["abilities"][ability]))
    if "coins" in data:
        validate_non_negative_coins(data["coins"])
        for coin in ("platinum", "gold", "electrum", "silver", "copper"):
            if coin in data["coins"]:
                setattr(character.coins, coin, int(data["coins"][coin] or 0))
    if "combat" in data:
        for field in ("max_hp", "current_hp"):
            if field in data["combat"]:
                setattr(character.combat, field, int(data["combat"][field] or 0))
    recalculate_character(db, character)
    db.commit()
    db.refresh(character)
    payload = character_payload(character)
    if "level" in data and character.level != old_level:
        payload["level_review"] = "Level changed — review HP."
    return payload


@router.delete("/1e/characters/{character_id}")
def delete_vault_character(character_id: int, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    character = get_vault_character_or_404(db, character_id)
    character.status = "archived"
    db.commit()
    return {"ok": True, "archived": True}


@router.post("/1e/characters/{character_id}/inventory")
def add_vault_inventory(character_id: int, data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    character = get_vault_character_or_404(db, character_id)
    equipment = db.get(EquipmentCatalog, int(data["equipment_id"]))
    if equipment is None:
        raise HTTPException(status_code=404, detail="Equipment not found.")
    status = data.get("status") or "carried"
    quantity = int(data.get("quantity") or 1)
    if quantity < 1:
        raise HTTPException(status_code=422, detail="Equipment quantity must be at least 1.")
    if status == "stored" and not (data.get("storage_location") or character.safe_storage_location):
        raise HTTPException(status_code=422, detail="Stored equipment requires a storage location.")
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
    validate_equipped_inventory(character, item, bool(data.get("dm_override", False)))
    recalculate_character(db, character)
    db.commit()
    db.refresh(character)
    return character_payload(character)


@router.put("/1e/characters/{character_id}/inventory/{inventory_id}")
def update_vault_inventory(character_id: int, inventory_id: int, data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    character = get_vault_character_or_404(db, character_id)
    item = db.get(CharacterInventory, inventory_id)
    if item is None or item.character_id != character.id:
        raise HTTPException(status_code=404, detail="Inventory item not found.")
    for field in ("quantity", "status", "container_id", "storage_location", "notes"):
        if field in data:
            setattr(item, field, data[field])
    if item.quantity < 1:
        raise HTTPException(status_code=422, detail="Equipment quantity must be at least 1.")
    if item.status == "stored" and not (item.storage_location or character.safe_storage_location):
        raise HTTPException(status_code=422, detail="Stored equipment requires a storage location.")
    validate_equipped_inventory(character, item, bool(data.get("dm_override", False)))
    recalculate_character(db, character)
    db.commit()
    db.refresh(character)
    return character_payload(character)


@router.delete("/1e/characters/{character_id}/inventory/{inventory_id}")
def delete_vault_inventory(character_id: int, inventory_id: int, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    character = get_vault_character_or_404(db, character_id)
    item = db.get(CharacterInventory, inventory_id)
    if item is None or item.character_id != character.id:
        raise HTTPException(status_code=404, detail="Inventory item not found.")
    db.delete(item)
    db.flush()
    recalculate_character(db, character)
    db.commit()
    db.refresh(character)
    return character_payload(character)


@router.post("/1e/characters/{character_id}/spells")
def add_vault_character_spell(character_id: int, data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    character = get_vault_character_or_404(db, character_id)
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


@router.put("/1e/characters/{character_id}/spells/{character_spell_id}")
def update_vault_character_spell(character_id: int, character_spell_id: int, data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    character = get_vault_character_or_404(db, character_id)
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


@router.post("/1e/characters/{character_id}/weapon-proficiencies")
def add_vault_weapon_proficiency(character_id: int, data: dict, _: dict = Depends(require_jwt_admin), db: Session = Depends(get_db)) -> dict:
    character = get_vault_character_or_404(db, character_id)
    equipment = db.get(EquipmentCatalog, int(data["equipment_id"]))
    if equipment is None or equipment.type != "weapon":
        raise HTTPException(status_code=422, detail="Weapon proficiency requires a catalog weapon.")
    allowed, reason = is_allowed_equipment(character.class_name, equipment_payload(equipment))
    if not allowed and not data.get("dm_override"):
        raise HTTPException(status_code=422, detail=f"{character.class_name} cannot normally choose {equipment.name}. {reason}")
    db.add(
        WeaponProficiency(
            character_id=character.id,
            equipment_id=equipment.id,
            proficient=bool(data.get("proficient", True)),
            specialization=data.get("specialization"),
            notes=data.get("notes"),
        )
    )
    db.commit()
    db.refresh(character)
    return character_payload(character)


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
