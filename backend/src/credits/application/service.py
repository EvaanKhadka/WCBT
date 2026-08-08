import uuid
from src.credits.infrastructure.repository import CreditsRepository
from src.credits.domain.entity import QRCode

class CreditsService:
    def __init__(self, repository: CreditsRepository):
        self.repository = repository

    async def generate_qr(self, user_id: int):
        existing = await self.repository.get_qr_by_user_id(user_id)
        if existing:
            return existing
            
        # Generate Secure UUID for QR Key Authentication
        unique_qr_key = f"QR-{uuid.uuid4().hex.upper()}"
        
        new_qr = QRCode(
            user_id=user_id,
            qr_key=unique_qr_key,
            is_active=True
        )
        return await self.repository.create_qr_code(new_qr)

    async def get_my_qr(self, user_id: int):
        return await self.repository.get_qr_by_user_id(user_id)