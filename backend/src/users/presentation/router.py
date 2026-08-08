from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List

from src.core.database import get_db
from src.core.security import verify_password, get_password_hash, create_access_token, get_current_user
from src.users.domain.entity import User, RoleEnum
from src.users.infrastructure.repository import UserRepository
from src.users.application.service import UserService
from src.users.presentation.schemas import (
    UserCreate, UserLogin, AuthToken, UserResponse, PasswordUpdate, 
    CardRequestCreate, CardRequestResponse, CardKeyPayload, TopUpPayload, 
    HardwareChargePayload, CreateBookingPayload, PublicParkingLotResponse,
    MyBookingResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_user_service(db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)
    return UserService(repo)

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_public_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    query = select(User).where((User.email == payload.email) | (User.phone == payload.phone))
    result = await db.execute(query)
    if result.scalars().first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Account exists.")

    new_user = User(
        full_name=payload.full_name, email=payload.email, phone=payload.phone,
        hashed_password=get_password_hash(payload.password), role=RoleEnum.USER
    )
    db.add(new_user)
    await db.commit()
    
    fetch_query = select(User).options(
        selectinload(User.rfid_card), 
        selectinload(User.card_request)
    ).where(User.id == new_user.id)
    
    result = await db.execute(fetch_query)
    return result.scalars().first()

@router.post("/login", response_model=AuthToken)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    query = select(User).where(User.email == payload.email)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    return AuthToken(access_token=create_access_token(subject=str(user.id)), role=user.role)

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user), service: UserService = Depends(get_user_service)):
    return await service.get_profile(current_user.id)

@router.patch("/password")
async def update_my_password(payload: PasswordUpdate, current_user: User = Depends(get_current_user), service: UserService = Depends(get_user_service)):
    return await service.update_password(current_user.id, payload)

@router.post("/me/requests", response_model=CardRequestResponse)
async def submit_card_request(payload: CardRequestCreate, current_user: User = Depends(get_current_user), service: UserService = Depends(get_user_service)):
    return await service.create_card_request(current_user.id, payload)

@router.patch("/me/requests/confirm", response_model=CardRequestResponse)
async def confirm_card_delivery(current_user: User = Depends(get_current_user), service: UserService = Depends(get_user_service)):
    return await service.confirm_delivery(current_user.id)

@router.post("/me/cards/verify")
async def verify_card(payload: CardKeyPayload, service: UserService = Depends(get_user_service)):
    return await service.verify_card_key(payload.card_key)

@router.post("/me/cards/link")
async def link_card(payload: CardKeyPayload, current_user: User = Depends(get_current_user), service: UserService = Depends(get_user_service)):
    return await service.link_rfid_card(current_user.id, payload.card_key)

@router.delete("/me/cards/disconnect")
async def disconnect_card(current_user: User = Depends(get_current_user), service: UserService = Depends(get_user_service)):
    return await service.disconnect_rfid_card(current_user.id)

@router.post("/me/credits/topup")
async def topup_credits(payload: TopUpPayload, current_user: User = Depends(get_current_user), service: UserService = Depends(get_user_service)):
    return await service.top_up_credits(current_user.id, payload.amount)

# --- MAPS & BOOKINGS ---
@router.get("/parkinglots/active", response_model=List[PublicParkingLotResponse])
async def get_active_parking_lots(service: UserService = Depends(get_user_service)):
    return await service.get_open_parkinglots()

@router.post("/me/bookings")
async def book_parking(payload: CreateBookingPayload, current_user: User = Depends(get_current_user), service: UserService = Depends(get_user_service)):
    return await service.book_parking_spot(current_user.id, payload)

@router.get("/me/bookings", response_model=List[MyBookingResponse])
async def my_bookings(current_user: User = Depends(get_current_user), service: UserService = Depends(get_user_service)):
    return await service.get_my_bookings(current_user.id)

@router.post("/me/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: int, current_user: User = Depends(get_current_user), service: UserService = Depends(get_user_service)):
    return await service.cancel_booking(current_user.id, booking_id)

@router.post("/hardware/charge")
async def process_hardware_payment(payload: HardwareChargePayload, service: UserService = Depends(get_user_service)):
    return await service.hardware_charge_card(payload)