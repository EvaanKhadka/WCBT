from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SlotsUpdate(BaseModel):
    car_slots: int
    bike_slots: int

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float

class StatusUpdate(BaseModel):
    is_open: bool

class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str

class HardwareTapPayload(BaseModel):
    card_key: str
    parking_lot_id: int

class QRScanPayload(BaseModel):
    qr_key: str
    parking_lot_id: int

class ParkingSessionResponse(BaseModel):
    id: int
    user_id: int
    access_key: str
    access_method: str
    entry_time: datetime
    exit_time: Optional[datetime]
    total_cost: float
    status: str
    customer_name: str
    model_config = {"from_attributes": True}

class BookingResponse(BaseModel):
    id: int
    user_id: int
    vehicle_type: str
    hours: int
    price: float
    status: str
    created_at: datetime
    customer_name: str
    customer_phone: str
    model_config = {"from_attributes": True}

class ParkingLotProfileResponse(BaseModel):
    id: int
    business_name: Optional[str]
    car_slots: int
    bike_slots: int
    latitude: Optional[float]
    longitude: Optional[float]
    is_open: bool
    owner_name: str
    owner_phone: str
    total_earnings: float
    model_config = {"from_attributes": True}