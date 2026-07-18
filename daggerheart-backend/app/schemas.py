from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=80)
    display_name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=200)


class BootstrapGMRequest(RegisterRequest):
    bootstrap_password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class CharacterWrite(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    pronouns: str = Field(default="", max_length=120)
    level: int = Field(default=1, ge=1, le=10)
    mechanics: dict[str, Any] = Field(default_factory=dict)
    display_names: dict[str, Any] = Field(default_factory=dict)
    sheet: dict[str, Any] = Field(default_factory=dict)


class CampaignWrite(BaseModel):
    name: str = Field(min_length=1, max_length=180)
    notes: str = ""


class MemberWrite(BaseModel):
    username: str
    status: Literal["invited", "active"] = "invited"


class CharacterAssignment(BaseModel):
    character_id: int


class TableStateWrite(BaseModel):
    expected_revision: int
    public_state: dict[str, Any]
    gm_state: dict[str, Any]


class PlayerTokenWrite(BaseModel):
    expected_revision: int
    character_id: int
    x: int = Field(ge=1)
    y: int = Field(ge=1)
