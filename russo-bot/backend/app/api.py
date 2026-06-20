from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models import AuditLog, Campaign, Character, Player
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
    TrackerScope,
    TrackerResponse,
    TrackerStartRequest,
    TrackerUpdateRequest,
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
    get_tracker,
    order_payload,
    require_admin,
    start_tracker,
    tracker_payload,
    update_tracker,
    upsert_order,
)

router = APIRouter(prefix="/api")


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(ok=True)


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
    character_name: str | None = None,
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
    require_admin(data.actor_is_admin)
    return start_tracker(db, data.guild_id, data.channel_id, data.actor_discord_user_id, data.move_rate, data.rations, data.oil_pints, data.notes)


@router.post("/tracker/status", response_model=TrackerResponse)
def tracker_status_route(data: TrackerScope, db: Session = Depends(get_db)) -> dict:
    return tracker_payload(get_tracker(db, data.guild_id, data.channel_id))


@router.post("/tracker/update", response_model=TrackerResponse)
def tracker_update_route(data: TrackerUpdateRequest, db: Session = Depends(get_db)) -> dict:
    require_admin(data.actor_is_admin)
    tracker = get_tracker(db, data.guild_id, data.channel_id)
    return update_tracker(db, tracker, data.action, data.amount, data.move_rate, data.holder, data.advance_turn)


@router.post("/order", response_model=MarchingOrderResponse)
def marching_order_route(data: MarchingOrderRequest, db: Session = Depends(get_db)) -> dict:
    if data.positions or data.notes is not None:
        require_admin(data.actor_is_admin)
        return upsert_order(db, data.guild_id, data.channel_id, data.actor_discord_user_id, data.positions, data.notes)
    return order_payload(get_order(db, data.guild_id, data.channel_id), data.guild_id, data.channel_id)
