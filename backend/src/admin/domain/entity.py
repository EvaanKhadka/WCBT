from sqlalchemy import String, Integer, ForeignKey, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.core.database import Base
from typing import List

class ParkingLotAccount(Base):
    __tablename__ = "parking_lot_accounts"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    
    business_name: Mapped[str] = mapped_column(String(255), nullable=True)
    location_address: Mapped[str] = mapped_column(String(500), nullable=True)
    is_suspended: Mapped[bool] = mapped_column(Boolean, default=False)

    car_slots: Mapped[int] = mapped_column(Integer, default=0)
    bike_slots: Mapped[int] = mapped_column(Integer, default=0)
    latitude: Mapped[float] = mapped_column(Float, nullable=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=True)
    is_open: Mapped[bool] = mapped_column(Boolean, default=False)
    
    total_earnings: Mapped[float] = mapped_column(Float, default=0.0) # ADDED

    user: Mapped["User"] = relationship("User", lazy="joined")
    bookings: Mapped[List["Booking"]] = relationship("Booking", back_populates="parking_lot", cascade="all, delete-orphan")
    sessions: Mapped[List["ParkingSession"]] = relationship("ParkingSession", back_populates="parking_lot", cascade="all, delete-orphan")