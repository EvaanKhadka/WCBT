from fastapi import HTTPException, status
from src.admin.infrastructure.repository import AdminRepository
from src.admin.presentation.schemas import ParkingLotCreate, AdminPasswordUpdate
from src.users.domain.entity import User, RoleEnum, CardStatusEnum
from src.admin.domain.entity import ParkingLotAccount
from src.core.security import get_password_hash, verify_password

class AdminService:
    def __init__(self, repository: AdminRepository):
        self.repository = repository

    async def create_parking_lot_account(self, payload: ParkingLotCreate):
        existing = await self.repository.get_user_by_email(payload.email)
        if existing:
            raise HTTPException(status_code=409, detail="User with this email already exists.")
        
        new_user = User(
            full_name=payload.full_name,
            email=payload.email,
            phone=payload.phone,
            hashed_password=get_password_hash(payload.password),
            role=RoleEnum.PARKING_LOT,
            is_active=True
        )
        
        new_profile = ParkingLotAccount(
            business_name=payload.business_name,
            location_address=payload.location_address,
            is_suspended=False
        )
        
        await self.repository.create_parking_lot_profile(new_user, new_profile)
        return {"message": "Parking Lot Owner provisions successfully."}

    async def list_parking_lot_accounts(self):
        profiles = await self.repository.get_all_parking_lot_accounts()
        result = []
        for p in profiles:
            result.append({
                "id": p.id,
                "user_id": p.user.id,
                "full_name": p.user.full_name,
                "email": p.user.email,
                "phone": p.user.phone,
                "is_suspended": p.is_suspended,
                "business_name": p.business_name,
                "location_address": p.location_address
            })
        return result

    async def toggle_account_suspension(self, user_id: int):
        account = await self.repository.get_parking_lot_by_user_id(user_id)
        if not account:
            raise HTTPException(status_code=404, detail="Parking lot account not found.")
        
        account.is_suspended = not account.is_suspended
        account.user.is_active = not account.is_suspended
        
        await self.repository.update_parking_lot(account)
        await self.repository.update_user(account.user)
        
        status_msg = "suspended" if account.is_suspended else "unsuspended"
        return {"message": f"Account successfully {status_msg}."}

    async def delete_account(self, user_id: int):
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Account not found.")
        
        await self.repository.delete_user(user)
        return {"message": "Account completely removed from system."}

    async def update_admin_password(self, admin_user: User, payload: AdminPasswordUpdate):
        if not verify_password(payload.old_password, admin_user.hashed_password):
            raise HTTPException(status_code=400, detail="Incorrect current password.")
            
        admin_user.hashed_password = get_password_hash(payload.new_password)
        await self.repository.update_user(admin_user)
        return {"message": "Admin password updated securely."}

    async def list_card_requests(self):
        return await self.repository.get_all_card_requests()

    async def update_card_request_status(self, request_id: int, status_str: str):
        valid_statuses = [e.value for e in CardStatusEnum]
        if status_str not in valid_statuses:
            raise HTTPException(status_code=400, detail="Invalid status provided.")

        request = await self.repository.get_card_request_by_id(request_id)
        if not request:
            raise HTTPException(status_code=404, detail="Card request not found.")
            
        request.status = CardStatusEnum(status_str)
        await self.repository.update_card_request(request)
        return {"message": "Status updated successfully.", "new_status": request.status.value}