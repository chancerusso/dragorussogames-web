from __future__ import annotations

import hmac
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.auth import create_token, hash_password, require_gm, require_user, verify_password
from app.config import settings
from app.db import get_db
from app.models import Campaign, CampaignCharacter, CampaignMember, Character, ContentRecord, TableSnapshot, TableState, User
from app.schemas import BootstrapGMRequest, CampaignWrite, CharacterAssignment, CharacterWrite, ContentWrite, LoginRequest, MemberWrite, PlayerTokenWrite, RegisterRequest, TableStateWrite

router = APIRouter(prefix="/api")


def user_payload(user: User) -> dict:
    return {"id": user.id, "username": user.username, "display_name": user.display_name, "role": user.role}


def character_payload(character: Character) -> dict:
    return {
        "id": character.id, "owner_id": character.owner_id, "name": character.name, "pronouns": character.pronouns,
        "level": character.level, "mechanics": character.mechanics, "display_names": character.display_names,
        "sheet": character.sheet, "archived": character.archived, "updated_at": character.updated_at,
    }


def content_payload(record: ContentRecord) -> dict:
    return {"id": record.id, "kind": record.kind, "name": record.name, "source": record.source, "data": record.data, "archived": record.archived, "updated_at": record.updated_at}


def current_user(db: Session, claims: dict) -> User:
    user = db.get(User, int(claims["sub"]))
    if user is None or not user.active:
        raise HTTPException(status_code=401, detail="Account unavailable.")
    return user


def gm_campaign(db: Session, campaign_id: int, claims: dict) -> Campaign:
    campaign = db.get(Campaign, campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    if claims.get("role") != "gm" or campaign.gm_id != int(claims["sub"]):
        raise HTTPException(status_code=403, detail="Campaign GM access required.")
    return campaign


def can_view_campaign(db: Session, campaign_id: int, claims: dict) -> Campaign:
    campaign = db.get(Campaign, campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    user_id = int(claims["sub"])
    if campaign.gm_id == user_id:
        return campaign
    member = db.scalar(select(CampaignMember).where(CampaignMember.campaign_id == campaign_id, CampaignMember.user_id == user_id, CampaignMember.status == "active"))
    if member is None:
        raise HTTPException(status_code=403, detail="Campaign membership required.")
    return campaign


def campaign_payload(db: Session, campaign: Campaign, detail: bool = False) -> dict:
    payload = {"id": campaign.id, "gm_id": campaign.gm_id, "name": campaign.name, "notes": campaign.notes, "status": campaign.status, "updated_at": campaign.updated_at}
    if detail:
        members = db.scalars(select(CampaignMember).where(CampaignMember.campaign_id == campaign.id)).all()
        assignments = db.scalars(select(CampaignCharacter).where(CampaignCharacter.campaign_id == campaign.id, CampaignCharacter.active.is_(True))).all()
        payload["members"] = [{"id": item.id, "role": item.role, "status": item.status, "user": user_payload(item.user)} for item in members]
        payload["characters"] = [character_payload(item.character) for item in assignments]
    return payload


@router.get("/health")
def health() -> dict:
    return {"ok": True, "service": "daggerheart"}


@router.post("/auth/register", status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)) -> dict:
    username = data.username.strip().lower()
    if db.scalar(select(User).where(User.username == username)):
        raise HTTPException(status_code=409, detail="Username already exists.")
    user = User(username=username, display_name=data.display_name.strip(), password_hash=hash_password(data.password), role="player")
    db.add(user); db.commit(); db.refresh(user)
    return {"token": create_token(user.id, user.role), "user": user_payload(user)}


@router.post("/auth/bootstrap-gm", status_code=201)
def bootstrap_gm(data: BootstrapGMRequest, db: Session = Depends(get_db)) -> dict:
    if not settings.gm_bootstrap_password or not hmac.compare_digest(data.bootstrap_password, settings.gm_bootstrap_password):
        raise HTTPException(status_code=401, detail="Invalid GM bootstrap password.")
    username = data.username.strip().lower()
    if db.scalar(select(User).where(User.username == username)):
        raise HTTPException(status_code=409, detail="Username already exists.")
    user = User(username=username, display_name=data.display_name.strip(), password_hash=hash_password(data.password), role="gm")
    db.add(user); db.commit(); db.refresh(user)
    return {"token": create_token(user.id, user.role), "user": user_payload(user)}


@router.post("/auth/login")
def login(data: LoginRequest, db: Session = Depends(get_db)) -> dict:
    user = db.scalar(select(User).where(User.username == data.username.strip().lower()))
    if user is None or not user.active or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    return {"token": create_token(user.id, user.role), "user": user_payload(user)}


@router.get("/me")
def me(claims: dict = Depends(require_user), db: Session = Depends(get_db)) -> dict:
    return user_payload(current_user(db, claims))


@router.get("/characters")
def list_characters(include_archived: bool = False, claims: dict = Depends(require_user), db: Session = Depends(get_db)) -> list[dict]:
    query = select(Character)
    if claims.get("role") != "gm": query = query.where(Character.owner_id == int(claims["sub"]))
    if not include_archived: query = query.where(Character.archived.is_(False))
    return [character_payload(item) for item in db.scalars(query.order_by(Character.name)).all()]


@router.get("/content")
def list_content(kind: Optional[str] = None, claims: dict = Depends(require_gm), db: Session = Depends(get_db)) -> list[dict]:
    query = select(ContentRecord).where(ContentRecord.archived.is_(False))
    if kind: query = query.where(ContentRecord.kind == kind)
    return [content_payload(item) for item in db.scalars(query.order_by(ContentRecord.kind, ContentRecord.name)).all()]


@router.post("/content", status_code=201)
def create_content(data: ContentWrite, claims: dict = Depends(require_gm), db: Session = Depends(get_db)) -> dict:
    record = ContentRecord(created_by_id=int(claims["sub"]), **data.model_dump())
    db.add(record); db.commit(); db.refresh(record)
    return content_payload(record)


@router.put("/content/{record_id}")
def update_content(record_id: int, data: ContentWrite, claims: dict = Depends(require_gm), db: Session = Depends(get_db)) -> dict:
    record = db.get(ContentRecord, record_id)
    if record is None or record.archived: raise HTTPException(status_code=404, detail="Content record not found.")
    for key, value in data.model_dump().items(): setattr(record, key, value)
    db.commit(); db.refresh(record)
    return content_payload(record)


@router.delete("/content/{record_id}")
def archive_content(record_id: int, claims: dict = Depends(require_gm), db: Session = Depends(get_db)) -> dict:
    record = db.get(ContentRecord, record_id)
    if record is None: raise HTTPException(status_code=404, detail="Content record not found.")
    record.archived = True; db.commit()
    return {"ok": True}


@router.post("/characters", status_code=201)
def create_character(data: CharacterWrite, claims: dict = Depends(require_user), db: Session = Depends(get_db)) -> dict:
    character = Character(owner_id=int(claims["sub"]), **data.model_dump())
    db.add(character); db.commit(); db.refresh(character)
    return character_payload(character)


@router.put("/characters/{character_id}")
def update_character(character_id: int, data: CharacterWrite, claims: dict = Depends(require_user), db: Session = Depends(get_db)) -> dict:
    character = db.get(Character, character_id)
    if character is None: raise HTTPException(status_code=404, detail="Character not found.")
    if claims.get("role") != "gm" and character.owner_id != int(claims["sub"]): raise HTTPException(status_code=403, detail="Character owner access required.")
    for key, value in data.model_dump().items(): setattr(character, key, value)
    db.commit(); db.refresh(character)
    return character_payload(character)


@router.get("/campaigns")
def list_campaigns(claims: dict = Depends(require_user), db: Session = Depends(get_db)) -> list[dict]:
    user_id = int(claims["sub"])
    if claims.get("role") == "gm": campaigns = db.scalars(select(Campaign).where(Campaign.gm_id == user_id, Campaign.status != "archived")).all()
    else:
        campaign_ids = select(CampaignMember.campaign_id).where(CampaignMember.user_id == user_id, CampaignMember.status == "active")
        campaigns = db.scalars(select(Campaign).where(Campaign.id.in_(campaign_ids), Campaign.status != "archived")).all()
    return [campaign_payload(db, item) for item in campaigns]


@router.get("/invitations")
def list_invitations(claims: dict = Depends(require_user), db: Session = Depends(get_db)) -> list[dict]:
    memberships = db.scalars(select(CampaignMember).where(CampaignMember.user_id == int(claims["sub"]), CampaignMember.status == "invited")).all()
    campaigns = [db.get(Campaign, membership.campaign_id) for membership in memberships]
    return [campaign_payload(db, campaign) for campaign in campaigns if campaign is not None and campaign.status != "archived"]


@router.post("/campaigns", status_code=201)
def create_campaign(data: CampaignWrite, claims: dict = Depends(require_gm), db: Session = Depends(get_db)) -> dict:
    campaign = Campaign(gm_id=int(claims["sub"]), **data.model_dump())
    db.add(campaign); db.flush()
    db.add(TableState(campaign_id=campaign.id, public_state={"fear": 0, "countdowns": [], "grid": {"columns": 16, "rows": 12, "cell_feet": 5}, "tokens": [], "environments": []}, gm_state={"adversaries": [], "notes": ""}))
    db.commit(); db.refresh(campaign)
    return campaign_payload(db, campaign, detail=True)


@router.get("/campaigns/{campaign_id}")
def get_campaign(campaign_id: int, claims: dict = Depends(require_user), db: Session = Depends(get_db)) -> dict:
    campaign = can_view_campaign(db, campaign_id, claims)
    payload = campaign_payload(db, campaign, detail=True)
    if campaign.gm_id != int(claims["sub"]):
        payload["characters"] = [item for item in payload["characters"] if item["owner_id"] == int(claims["sub"])]
    return payload


@router.post("/campaigns/{campaign_id}/members")
def add_member(campaign_id: int, data: MemberWrite, claims: dict = Depends(require_gm), db: Session = Depends(get_db)) -> dict:
    gm_campaign(db, campaign_id, claims)
    user = db.scalar(select(User).where(User.username == data.username.strip().lower(), User.role == "player"))
    if user is None: raise HTTPException(status_code=404, detail="Player not found.")
    member = db.scalar(select(CampaignMember).where(CampaignMember.campaign_id == campaign_id, CampaignMember.user_id == user.id))
    if member: member.status = data.status
    else: member = CampaignMember(campaign_id=campaign_id, user_id=user.id, status=data.status); db.add(member)
    db.commit(); db.refresh(member)
    return {"id": member.id, "status": member.status, "user": user_payload(user)}


@router.post("/campaigns/{campaign_id}/accept")
def accept_invite(campaign_id: int, claims: dict = Depends(require_user), db: Session = Depends(get_db)) -> dict:
    member = db.scalar(select(CampaignMember).where(CampaignMember.campaign_id == campaign_id, CampaignMember.user_id == int(claims["sub"]), CampaignMember.status == "invited"))
    if member is None: raise HTTPException(status_code=404, detail="Invitation not found.")
    member.status = "active"; db.commit()
    return {"ok": True}


@router.delete("/campaigns/{campaign_id}/members/{user_id}")
def remove_member(campaign_id: int, user_id: int, claims: dict = Depends(require_gm), db: Session = Depends(get_db)) -> dict:
    gm_campaign(db, campaign_id, claims)
    member = db.scalar(select(CampaignMember).where(CampaignMember.campaign_id == campaign_id, CampaignMember.user_id == user_id))
    if member is None: raise HTTPException(status_code=404, detail="Campaign member not found.")
    character_ids = select(Character.id).where(Character.owner_id == user_id)
    db.execute(delete(CampaignCharacter).where(CampaignCharacter.campaign_id == campaign_id, CampaignCharacter.character_id.in_(character_ids)))
    db.delete(member); db.commit()
    return {"ok": True}


@router.post("/campaigns/{campaign_id}/characters")
def assign_character(campaign_id: int, data: CharacterAssignment, claims: dict = Depends(require_gm), db: Session = Depends(get_db)) -> dict:
    gm_campaign(db, campaign_id, claims)
    character = db.get(Character, data.character_id)
    if character is None or character.archived: raise HTTPException(status_code=404, detail="Character not found.")
    assignment = db.scalar(select(CampaignCharacter).where(CampaignCharacter.campaign_id == campaign_id, CampaignCharacter.character_id == character.id))
    if assignment: assignment.active = True
    else: assignment = CampaignCharacter(campaign_id=campaign_id, character_id=character.id); db.add(assignment)
    db.commit()
    return character_payload(character)


@router.delete("/campaigns/{campaign_id}/characters/{character_id}")
def unassign_character(campaign_id: int, character_id: int, claims: dict = Depends(require_gm), db: Session = Depends(get_db)) -> dict:
    gm_campaign(db, campaign_id, claims)
    assignment = db.scalar(select(CampaignCharacter).where(CampaignCharacter.campaign_id == campaign_id, CampaignCharacter.character_id == character_id))
    if assignment is None: raise HTTPException(status_code=404, detail="Assigned character not found.")
    db.delete(assignment); db.commit()
    return {"ok": True}


@router.get("/campaigns/{campaign_id}/table-state")
def get_table_state(campaign_id: int, claims: dict = Depends(require_user), db: Session = Depends(get_db)) -> dict:
    campaign = can_view_campaign(db, campaign_id, claims)
    state = db.scalar(select(TableState).where(TableState.campaign_id == campaign.id))
    payload = {"campaign_id": campaign.id, "revision": state.revision, "public_state": state.public_state, "updated_at": state.updated_at}
    if campaign.gm_id == int(claims["sub"]): payload["gm_state"] = state.gm_state
    return payload


@router.put("/campaigns/{campaign_id}/table-state")
def save_table_state(campaign_id: int, data: TableStateWrite, claims: dict = Depends(require_gm), db: Session = Depends(get_db)) -> dict:
    campaign = gm_campaign(db, campaign_id, claims)
    state = db.scalar(select(TableState).where(TableState.campaign_id == campaign.id))
    if state.revision != data.expected_revision:
        raise HTTPException(status_code=409, detail={"message": "Table state changed.", "current_revision": state.revision})
    db.add(TableSnapshot(campaign_id=campaign.id, revision=state.revision, public_state=state.public_state, gm_state=state.gm_state))
    state.revision += 1; state.public_state = data.public_state; state.gm_state = data.gm_state; state.updated_by_id = int(claims["sub"])
    db.flush()
    old_ids = db.scalars(select(TableSnapshot.id).where(TableSnapshot.campaign_id == campaign.id).order_by(TableSnapshot.id.desc()).offset(20)).all()
    if old_ids: db.execute(delete(TableSnapshot).where(TableSnapshot.id.in_(old_ids)))
    db.commit(); db.refresh(state)
    return {"campaign_id": campaign.id, "revision": state.revision, "public_state": state.public_state, "gm_state": state.gm_state, "updated_at": state.updated_at}


@router.put("/campaigns/{campaign_id}/player-token")
def save_player_token(campaign_id: int, data: PlayerTokenWrite, claims: dict = Depends(require_user), db: Session = Depends(get_db)) -> dict:
    campaign = can_view_campaign(db, campaign_id, claims)
    character = db.get(Character, data.character_id)
    if character is None or character.owner_id != int(claims["sub"]):
        raise HTTPException(status_code=403, detail="Assigned character owner access required.")
    assignment = db.scalar(select(CampaignCharacter).where(CampaignCharacter.campaign_id == campaign.id, CampaignCharacter.character_id == character.id, CampaignCharacter.active.is_(True)))
    if assignment is None: raise HTTPException(status_code=403, detail="Character is not assigned to this campaign.")
    state = db.scalar(select(TableState).where(TableState.campaign_id == campaign.id))
    if state.revision != data.expected_revision:
        raise HTTPException(status_code=409, detail={"message": "Table state changed.", "current_revision": state.revision})
    public_state = dict(state.public_state or {})
    tokens = [dict(token) for token in public_state.get("tokens", [])]
    token = next((item for item in tokens if int(item.get("character_id", 0)) == character.id), None)
    if token is None:
        token = {"character_id": character.id, "name": character.name, "kind": "character"}
        tokens.append(token)
    token.update({"x": data.x, "y": data.y})
    public_state["tokens"] = tokens
    db.add(TableSnapshot(campaign_id=campaign.id, revision=state.revision, public_state=state.public_state, gm_state=state.gm_state))
    state.revision += 1; state.public_state = public_state; state.updated_by_id = int(claims["sub"])
    db.commit(); db.refresh(state)
    return {"campaign_id": campaign.id, "revision": state.revision, "public_state": state.public_state, "updated_at": state.updated_at}
