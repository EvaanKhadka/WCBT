from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class ParkingLotCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str
    business_name: Optional[str] = None
    location_address: Optional[str] = None

class ParkingLotResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: str
    phone: str
    is_suspended: bool
    business_name: Optional[str]
    location_address: Optional[str]
    model_config = {"from_attributes": True}

class AdminPasswordUpdate(BaseModel):
    old_password: str
    new_password: str

class AdminCardRequestResponse(BaseModel):
    id: int
    user_id: int
    owner_name: str
    phone_with_code: str
    province: str
    district: str
    city: Optional[str]
    street_name: str
    status: str
    created_at: datetime
    model_config = {"from_attributes": True}

class AdminUpdateCardRequestStatus(BaseModel):
    status: str