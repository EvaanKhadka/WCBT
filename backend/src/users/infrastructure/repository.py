from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload, joinedload
from typing import Optional, List
from src.users.domain.entity import User, CardRequest, CardVault, RFIDCard
from src.admin.domain.entity import ParkingLotAccount
from src.parkinglot.domain.entity import Booking

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> Optional[User]:
        query = select(User).where(User.email == email)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_user_profile(self, user_id: int) -> Optional[User]:
        query = select(User).options(
            selectinload(User.rfid_card), 
            selectinload(User.card_request),
            selectinload(User.qr_code)
        ).where(User.id == user_id)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def update_user(self, user: User):
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def get_card_request_by_user(self, user_id: int) -> Optional[CardRequest]:
        query = select(CardRequest).where(CardRequest.user_id == user_id)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def create_card_request(self, request: CardRequest) -> CardRequest:
        self.db.add(request)
        await self.db.commit()
        return request

    async def update_card_request(self, request: CardRequest) -> CardRequest:
        self.db.add(request)
        await self.db.commit()
        return request

    async def get_vault_card(self, card_key: str) -> Optional[CardVault]:
        query = select(CardVault).where(CardVault.card_key == card_key)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def update_vault_card(self, vault_card: CardVault):
        self.db.add(vault_card)
        await self.db.commit()

    async def get_rfid_card_by_key(self, card_key: str) -> Optional[RFIDCard]:
        query = select(RFIDCard).where(RFIDCard.card_key == card_key)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def create_rfid_card(self, rfid_card: RFIDCard) -> RFIDCard:
        self.db.add(rfid_card)
        await self.db.commit()
        return rfid_card

    async def delete_rfid_card(self, rfid_card: RFIDCard):
        await self.db.delete(rfid_card)
        await self.db.commit()

    async def get_open_parking_lots(self) -> List[ParkingLotAccount]:
        query = select(ParkingLotAccount).where(ParkingLotAccount.is_open == True)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_parking_lot_by_id(self, lot_id: int) -> Optional[ParkingLotAccount]:
        query = select(ParkingLotAccount).where(ParkingLotAccount.id == lot_id)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def update_parking_lot(self, lot: ParkingLotAccount):
        self.db.add(lot)
        await self.db.commit()

    async def create_booking(self, booking: Booking) -> Booking:
        self.db.add(booking)
        await self.db.commit()
        return booking

    async def get_bookings_by_user(self, user_id: int) -> List[Booking]:
        query = select(Booking).options(joinedload(Booking.parking_lot)).where(Booking.user_id == user_id).order_by(Booking.created_at.desc())
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_booking_by_id(self, booking_id: int) -> Optional[Booking]:
        query = select(Booking).where(Booking.id == booking_id)
        result = await self.db.execute(query)
        return result.scalars().first()