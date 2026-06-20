from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models import AuditLog, Campaign, Character, Player
from app.db.session import get_db
from app.schemas import CharacterCreateRequest, CharacterResponse, HealthResponse, LedgerPatchRequest
from app.services.ledger import build_initial_ledger, merge_ledger

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

    db.query(Character).filter(
        Character.discord_user_id == data.discord_user_id,
        Character.is_active.is_(True),
    ).update({"is_active": False})

    character = Character(
        campaign_id=campaign.id,
        player_id=player.id,
        character_name=data.character_name,
        player_name=data.player_name,
        discord_username=data.discord_username,
        discord_user_id=data.discord_user_id,
        ledger=build_initial_ledger(data),
        is_active=True,
    )
    db.add(character)
    db.flush()
    db.add(
        AuditLog(
            actor_discord_user_id=data.discord_user_id,
            action="character.create",
            entity_type="character",
            entity_id=character.id,
            payload={"character_name": data.character_name},
        )
    )
    db.commit()
    db.refresh(character)
    return character


@router.get("/characters/by-discord/{discord_user_id}", response_model=CharacterResponse)
def get_character_by_discord(discord_user_id: str, db: Session = Depends(get_db)) -> Character:
    character = db.scalar(
        select(Character)
        .where(Character.discord_user_id == discord_user_id, Character.is_active.is_(True))
        .order_by(Character.created_at.desc())
    )
    if character is None:
        raise HTTPException(status_code=404, detail="No active character found for this Discord user.")
    return character


@router.patch("/characters/{character_id}/ledger", response_model=CharacterResponse)
def patch_character_ledger(
    character_id: int,
    data: LedgerPatchRequest,
    db: Session = Depends(get_db),
) -> Character:
    character = db.get(Character, character_id)
    if character is None:
        raise HTTPException(status_code=404, detail="Character not found.")

    character.ledger = merge_ledger(character.ledger or {}, data.patch)
    flag_modified(character, "ledger")
    db.add(
        AuditLog(
            actor_discord_user_id=data.actor_discord_user_id,
            action=data.audit_action,
            entity_type="character",
            entity_id=character.id,
            payload={"patch": data.patch},
        )
    )
    db.commit()
    db.refresh(character)
    return character
