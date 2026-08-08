from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional
from src.credits.domain.entity import QRCode

class CreditsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_qr_by_user_id(self, user_id: int) -> Optional[QRCode]:
        query = select(QRCode).where(QRCode.user_id == user_id)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_qr_by_key(self, qr_key: str) -> Optional[QRCode]:
        query = select(QRCode).where(QRCode.qr_key == qr_key)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def create_qr_code(self, qr: QRCode) -> QRCode:
        self.db.add(qr)
        await self.db.commit()
        await self.db.refresh(qr)
        return qr