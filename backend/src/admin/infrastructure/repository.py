from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from typing import List, Optional

from src.users.domain.entity import User, CardRequest
from src.admin.domain.entity import ParkingLotAccount

class AdminRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()
        
    async def get_parking_lot_by_user_id(self, user_id: int) -> Optional[ParkingLotAccount]:
        query = select(ParkingLotAccount).options(joinedload(ParkingLotAccount.user)).where(ParkingLotAccount.user_id == user_id)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def create_parking_lot_profile(self, user: User, profile: ParkingLotAccount) -> User:
        self.db.add(user)
        await self.db.flush() 
        
        profile.user_id = user.id
        self.db.add(profile)
        await self.db.commit()
        return user

    async def get_all_parking_lot_accounts(self) -> List[ParkingLotAccount]:
        query = select(ParkingLotAccount).options(joinedload(ParkingLotAccount.user))
        result = await self.db.execute(query)
        return result.scalars().all()

    async def update_user(self, user: User):
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
        
    async def update_parking_lot(self, account: ParkingLotAccount):
        self.db.add(account)
        await self.db.commit()
        await self.db.refresh(account)
        return account

    async def delete_user(self, user: User):
        await self.db.delete(user)
        await self.db.commit()

    async def get_all_card_requests(self) -> List[CardRequest]:
        query = select(CardRequest).order_by(CardRequest.created_at.desc())
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_card_request_by_id(self, request_id: int) -> Optional[CardRequest]:
        query = select(CardRequest).where(CardRequest.id == request_id)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def update_card_request(self, request: CardRequest):
        self.db.add(request)
        await self.db.commit()
        await self.db.refresh(request)
        return request