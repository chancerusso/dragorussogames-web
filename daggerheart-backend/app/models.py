from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class User(TimestampMixin, Base):
    __tablename__ = "dh_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(320), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="player", server_default="player", nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)


class Character(TimestampMixin, Base):
    __tablename__ = "dh_characters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("dh_users.id", ondelete="CASCADE"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    pronouns: Mapped[str] = mapped_column(String(120), default="", server_default="", nullable=False)
    level: Mapped[int] = mapped_column(Integer, default=1, server_default="1", nullable=False)
    mechanics: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    display_names: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    sheet: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    archived: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)

    owner: Mapped[User] = relationship()


class Campaign(TimestampMixin, Base):
    __tablename__ = "dh_campaigns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    gm_id: Mapped[int] = mapped_column(ForeignKey("dh_users.id", ondelete="RESTRICT"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    notes: Mapped[str] = mapped_column(Text, default="", server_default="", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", server_default="active", nullable=False)

    gm: Mapped[User] = relationship()


class CampaignMember(TimestampMixin, Base):
    __tablename__ = "dh_campaign_members"
    __table_args__ = (UniqueConstraint("campaign_id", "user_id", name="uq_dh_campaign_member"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("dh_campaigns.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("dh_users.id", ondelete="CASCADE"), index=True, nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="player", server_default="player", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="invited", server_default="invited", nullable=False)

    user: Mapped[User] = relationship()


class CampaignCharacter(TimestampMixin, Base):
    __tablename__ = "dh_campaign_characters"
    __table_args__ = (UniqueConstraint("campaign_id", "character_id", name="uq_dh_campaign_character"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("dh_campaigns.id", ondelete="CASCADE"), index=True, nullable=False)
    character_id: Mapped[int] = mapped_column(ForeignKey("dh_characters.id", ondelete="CASCADE"), index=True, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)

    character: Mapped[Character] = relationship()


class TableState(TimestampMixin, Base):
    __tablename__ = "dh_table_states"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("dh_campaigns.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    revision: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    public_state: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    gm_state: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    updated_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("dh_users.id", ondelete="SET NULL"), nullable=True)


class TableSnapshot(Base):
    __tablename__ = "dh_table_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("dh_campaigns.id", ondelete="CASCADE"), index=True, nullable=False)
    revision: Mapped[int] = mapped_column(Integer, nullable=False)
    public_state: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    gm_state: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ContentRecord(TimestampMixin, Base):
    __tablename__ = "dh_content_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("dh_users.id", ondelete="RESTRICT"), index=True, nullable=False)
    kind: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(180), index=True, nullable=False)
    source: Mapped[str] = mapped_column(String(180), default="Custom", server_default="Custom", nullable=False)
    data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    archived: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
