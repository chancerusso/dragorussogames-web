from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class Campaign(TimestampMixin, Base):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)

    parties: Mapped[list["Party"]] = relationship(back_populates="campaign")
    characters: Mapped[list["Character"]] = relationship(back_populates="campaign")


class Player(TimestampMixin, Base):
    __tablename__ = "players"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    player_name: Mapped[str] = mapped_column(String(120), nullable=False)
    discord_username: Mapped[str] = mapped_column(String(120), nullable=False)
    discord_user_id: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)

    characters: Mapped[list["Character"]] = relationship(back_populates="player")


class Party(TimestampMixin, Base):
    __tablename__ = "parties"
    __table_args__ = (UniqueConstraint("campaign_id", "name", name="uq_parties_campaign_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)

    campaign: Mapped[Campaign] = relationship(back_populates="parties")
    characters: Mapped[list["Character"]] = relationship(back_populates="party")


class Character(TimestampMixin, Base):
    __tablename__ = "characters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int | None] = mapped_column(ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True)
    party_id: Mapped[int | None] = mapped_column(ForeignKey("parties.id", ondelete="SET NULL"), nullable=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    character_name: Mapped[str] = mapped_column(String(120), nullable=False)
    player_name: Mapped[str] = mapped_column(String(120), nullable=False)
    discord_username: Mapped[str] = mapped_column(String(120), nullable=False)
    discord_user_id: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    ledger: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="Inactive", server_default="Inactive", nullable=False)

    campaign: Mapped[Campaign | None] = relationship(back_populates="characters")
    party: Mapped[Party | None] = relationship(back_populates="characters")
    player: Mapped[Player] = relationship(back_populates="characters")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    actor_discord_user_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
