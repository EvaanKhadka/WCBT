from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from typing import Optional, List
from src.admin.domain.entity import ParkingLotAccount
from src.parkinglot.domain.entity import Booking, ParkingSession
from src.users.domain.entity import User, RFIDCard
from src.credits.domain.entity import QRCode

class ParkingLotRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_parking_lot_by_user(self, user_id: int) -> Optional[ParkingLotAccount]:
        query = select(ParkingLotAccount).options(joinedload(ParkingLotAccount.user)).where(ParkingLotAccount.user_id == user_id)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_parking_lot_by_id(self, lot_id: int) -> Optional[ParkingLotAccount]:
        query = select(ParkingLotAccount).where(ParkingLotAccount.id == lot_id)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def update_parking_lot(self, lot: ParkingLotAccount):
        self.db.add(lot)
        await self.db.commit()
        await self.db.refresh(lot)
        return lot

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    async def update_user(self, user: User):
        self.db.add(user)
        await self.db.commit()

    async def get_active_bookings(self, parking_lot_id: int) -> List[Booking]:
        query = select(Booking).options(joinedload(Booking.user)).where(
            Booking.parking_lot_id == parking_lot_id,
            Booking.status == "ACTIVE"
        ).order_by(Booking.created_at.desc())
        result = await self.db.execute(query)
        return result.scalars().all()
        
    async def get_active_booking_by_user_and_lot(self, user_id: int, parking_lot_id: int) -> Optional[Booking]:
        query = select(Booking).where(
            Booking.user_id == user_id,
            Booking.parking_lot_id == parking_lot_id,
            Booking.status == "ACTIVE"
        ).order_by(Booking.created_at.asc())
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_active_rfid_card(self, card_key: str) -> Optional[RFIDCard]:
        query = select(RFIDCard).where(RFIDCard.card_key == card_key, RFIDCard.is_active == True)
        result = await self.db.execute(query)
        return result.scalars().first()
        
    async def get_active_qr_code(self, qr_key: str) -> Optional[QRCode]:
        query = select(QRCode).where(QRCode.qr_key == qr_key, QRCode.is_active == True)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_active_session_by_key(self, access_key: str) -> Optional[ParkingSession]:
        query = select(ParkingSession).where(
            ParkingSession.access_key == access_key,
            ParkingSession.status == "PARKED"
        )
        result = await self.db.execute(query)
        return result.scalars().first()

    async def create_parking_session(self, session: ParkingSession):
        self.db.add(session)
        await self.db.commit()

    async def update_parking_session(self, session: ParkingSession):
        self.db.add(session)
        await self.db.commit()

    async def get_all_sessions(self, parking_lot_id: int) -> List[ParkingSession]:
        query = select(ParkingSession).options(joinedload(ParkingSession.user)).where(
            ParkingSession.parking_lot_id == parking_lot_id
        ).order_by(ParkingSession.entry_time.desc())
        result = await self.db.execute(query)
        return result.scalars().all()