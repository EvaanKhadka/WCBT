from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.security import get_current_admin
from src.users.domain.entity import User

from src.admin.infrastructure.repository import AdminRepository
from src.admin.application.service import AdminService
from src.admin.presentation.schemas import ParkingLotCreate, AdminPasswordUpdate, AdminUpdateCardRequestStatus

router = APIRouter(
    prefix="/admin", 
    tags=["Admin Portal"],
    dependencies=[Depends(get_current_admin)] 
)

def get_admin_service(db: AsyncSession = Depends(get_db)):
    repo = AdminRepository(db)
    return AdminService(repo)

@router.post("/parking-lots")
async def create_parking_lot(payload: ParkingLotCreate, service: AdminService = Depends(get_admin_service)):
    return await service.create_parking_lot_account(payload)

@router.get("/parking-lots")
async def get_parking_lots(service: AdminService = Depends(get_admin_service)):
    return await service.list_parking_lot_accounts()

@router.patch("/parking-lots/{user_id}/suspend")
async def suspend_parking_lot(user_id: int, service: AdminService = Depends(get_admin_service)):
    return await service.toggle_account_suspension(user_id)

@router.delete("/parking-lots/{user_id}")
async def delete_parking_lot(user_id: int, service: AdminService = Depends(get_admin_service)):
    return await service.delete_account(user_id)

@router.patch("/settings/password")
async def update_password(
    payload: AdminPasswordUpdate, 
    current_admin: User = Depends(get_current_admin), 
    service: AdminService = Depends(get_admin_service)
):
    return await service.update_admin_password(current_admin, payload)

@router.get("/requests")
async def get_all_requests(service: AdminService = Depends(get_admin_service)):
    return await service.list_card_requests()

@router.patch("/requests/{request_id}/status")
async def update_request_status(
    request_id: int,
    payload: AdminUpdateCardRequestStatus,
    service: AdminService = Depends(get_admin_service)
):
    return await service.update_card_request_status(request_id, payload.status)