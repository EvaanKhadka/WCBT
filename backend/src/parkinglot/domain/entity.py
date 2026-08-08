from sqlalchemy import String, Integer, ForeignKey, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from src.core.database import Base
from typing import Optional

class Booking(Base):
    __tablename__ = "bookings"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    parking_lot_id: Mapped[int] = mapped_column(ForeignKey("parking_lot_accounts.id"))
    vehicle_type: Mapped[str] = mapped_column(String(50)) 
    hours: Mapped[int] = mapped_column(Integer)
    price: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="bookings", lazy="joined")
    parking_lot: Mapped["ParkingLotAccount"] = relationship("ParkingLotAccount", back_populates="bookings", lazy="joined")

class ParkingSession(Base):
    __tablename__ = "parking_sessions"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    parking_lot_id: Mapped[int] = mapped_column(ForeignKey("parking_lot_accounts.id"))
    
    # Updated to dynamically support both RFID and QR Code unique identifier strings
    access_key: Mapped[str] = mapped_column(String(255))
    access_method: Mapped[str] = mapped_column(String(50), default="RFID") # "RFID" or "QR"
    
    vehicle_type: Mapped[str] = mapped_column(String(50), default="car")
    
    entry_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    exit_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    total_cost: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(50), default="PARKED") # PARKED or COMPLETED
    
    user: Mapped["User"] = relationship("User", lazy="joined")
    parking_lot: Mapped["ParkingLotAccount"] = relationship("ParkingLotAccount", back_populates="sessions", lazy="joined")