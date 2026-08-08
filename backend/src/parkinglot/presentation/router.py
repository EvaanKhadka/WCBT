from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.core.security import get_current_user
from src.users.domain.entity import User, RoleEnum
from src.parkinglot.infrastructure.repository import ParkingLotRepository
from src.parkinglot.application.service import ParkingLotService
from src.parkinglot.presentation.schemas import (
    SlotsUpdate, LocationUpdate, StatusUpdate, PasswordUpdate, 
    ParkingLotProfileResponse, BookingResponse, HardwareTapPayload, QRScanPayload
)

router = APIRouter(prefix="/parkinglot", tags=["Parking Lot Portal"])

# --- IN-MEMORY GATE TRIGGER SYSTEM FOR ESP32 ---
# This stores a temporary "True" flag when a mobile app scans a QR code.
gate_triggers = {}

def get_service(db: AsyncSession = Depends(get_db)):
    return ParkingLotService(ParkingLotRepository(db))

def verify_parking_lot_role(current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.PARKING_LOT:
        raise Exception("Access Denied")
    return current_user

# Public endpoints for Gate hardware and software Camera scanners
@router.post("/hardware/tap")
async def process_hardware_tap(payload: HardwareTapPayload, service: ParkingLotService = Depends(get_service)):
    return await service.process_hardware_tap(payload)


@router.post("/hardware/qr-scan")
async def process_qr_scan(payload: QRScanPayload, service: ParkingLotService = Depends(get_service)):
    result = await service.process_qr_scan(payload)
    
    # If the QR Scan successfully granted entry/exit (credits deducted), flag the physical gate!
    if result.get("action") == "open_gate":
        gate_triggers[payload.parking_lot_id] = True
        
    return result


@router.get("/hardware/gate-status/{parking_lot_id}")
async def check_gate_status(parking_lot_id: int):
    """
    ESP32 constantly polls this endpoint. 
    If a QR scan occurred, it returns True and immediately resets to False.
    """
    should_open = gate_triggers.get(parking_lot_id, False)
    if should_open:
        gate_triggers[parking_lot_id] = False # Reset so gate doesn't stay stuck open
        return {"open_gate": True}
    return {"open_gate": False}


# Protected UI Endpoints
@router.get("/me", response_model=ParkingLotProfileResponse)
async def get_profile(current_user: User = Depends(verify_parking_lot_role), service: ParkingLotService = Depends(get_service)):
    return await service.get_my_profile(current_user.id)

@router.patch("/me/slots")
async def update_slots(payload: SlotsUpdate, current_user: User = Depends(verify_parking_lot_role), service: ParkingLotService = Depends(get_service)):
    return await service.update_slots(current_user.id, payload)

@router.patch("/me/location")
async def update_location(payload: LocationUpdate, current_user: User = Depends(verify_parking_lot_role), service: ParkingLotService = Depends(get_service)):
    return await service.update_location(current_user.id, payload)

@router.patch("/me/status")
async def update_status(payload: StatusUpdate, current_user: User = Depends(verify_parking_lot_role), service: ParkingLotService = Depends(get_service)):
    return await service.update_status(current_user.id, payload)

@router.get("/me/bookings")
async def get_bookings(current_user: User = Depends(verify_parking_lot_role), service: ParkingLotService = Depends(get_service)):
    return await service.get_my_bookings(current_user.id)

@router.get("/me/sessions")
async def get_sessions(current_user: User = Depends(verify_parking_lot_role), service: ParkingLotService = Depends(get_service)):
    return await service.get_all_sessions(current_user.id)

@router.patch("/me/password")
async def update_password(payload: PasswordUpdate, current_user: User = Depends(verify_parking_lot_role), service: ParkingLotService = Depends(get_service)):
    return await service.update_password(current_user.id, payload)