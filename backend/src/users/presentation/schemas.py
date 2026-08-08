from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from src.users.domain.entity import RoleEnum, CardStatusEnum

class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=7, max_length=20)
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class AuthToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: RoleEnum

class RFIDCardResponse(BaseModel):
    card_key: str
    is_active: bool
    model_config = {"from_attributes": True}

class QRCodeResponse(BaseModel):
    qr_key: str
    is_active: bool
    model_config = {"from_attributes": True}

class CardRequestCreate(BaseModel):
    owner_name: str
    phone_with_code: str
    province: str
    district: str
    city: str
    street_name: str

class CardRequestResponse(BaseModel):
    id: int
    status: CardStatusEnum
    province: str
    district: str
    city: Optional[str]
    street_name: str
    created_at: datetime
    updated_at: Optional[datetime]
    model_config = {"from_attributes": True}

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: str
    credit_balance: float
    role: RoleEnum
    rfid_card: Optional[RFIDCardResponse] = None
    qr_code: Optional[QRCodeResponse] = None
    card_request: Optional[CardRequestResponse] = None
    model_config = {"from_attributes": True}

class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)

class CardKeyPayload(BaseModel):
    card_key: str

class TopUpPayload(BaseModel):
    amount: float
    
class HardwareChargePayload(BaseModel):
    card_key: str
    amount: float

class CreateBookingPayload(BaseModel):
    parking_lot_id: int
    vehicle_type: str
    hours: int
    price: float

class PublicParkingLotResponse(BaseModel):
    id: int
    business_name: Optional[str]
    car_slots: int
    bike_slots: int
    latitude: Optional[float]
    longitude: Optional[float]
    model_config = {"from_attributes": True}

class MyBookingResponse(BaseModel):
    id: int
    parking_lot_id: int
    business_name: Optional[str]
    vehicle_type: str
    hours: int
    price: float
    status: str
    created_at: datetime
    model_config = {"from_attributes": True}