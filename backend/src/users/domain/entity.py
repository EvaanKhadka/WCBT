import enum
from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy import String, Enum, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.database import Base

class RoleEnum(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"
    PARKING_LOT = "PARKING_LOT"

class CardStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    OUT_OF_STOCK = "OUT_OF_STOCK"
    DELIVERED_UNCONFIRMED = "DELIVERED_UNCONFIRMED"
    DELIVERED_CONFIRMED = "DELIVERED_CONFIRMED"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    credit_balance: Mapped[float] = mapped_column(Float, default=0.0)
    role: Mapped[RoleEnum] = mapped_column(Enum(RoleEnum), default=RoleEnum.USER)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    card_request: Mapped[Optional["CardRequest"]] = relationship("CardRequest", back_populates="user", uselist=False)
    rfid_card: Mapped[Optional["RFIDCard"]] = relationship("RFIDCard", back_populates="user", uselist=False)
    bookings: Mapped[List["Booking"]] = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    
    # [FIX]: Properly map the QRCode relation to the User table
    qr_code: Mapped[Optional["QRCode"]] = relationship("QRCode", back_populates="user", uselist=False, cascade="all, delete-orphan")


class CardRequest(Base):
    __tablename__ = "card_requests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    owner_name: Mapped[str] = mapped_column(String(100))
    phone_with_code: Mapped[str] = mapped_column(String(20))
    province: Mapped[str] = mapped_column(String(50))
    district: Mapped[str] = mapped_column(String(50))
    city: Mapped[str] = mapped_column(String(100), nullable=True)
    street_name: Mapped[str] = mapped_column(String(255))
    
    status: Mapped[CardStatusEnum] = mapped_column(Enum(CardStatusEnum), default=CardStatusEnum.PENDING)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="card_request")


class RFIDCard(Base):
    __tablename__ = "rfid_cards"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    card_key: Mapped[str] = mapped_column(String(255), unique=True, index=True) 
    photo_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    user: Mapped["User"] = relationship("User", back_populates="rfid_card")


class CardVault(Base):
    __tablename__ = "card_vault"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    card_key: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    is_assigned: Mapped[bool] = mapped_column(Boolean, default=False)