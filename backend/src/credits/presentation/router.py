from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.security import get_current_user
from src.users.domain.entity import User

from src.credits.infrastructure.repository import CreditsRepository
from src.credits.application.service import CreditsService
from src.credits.presentation.schemas import QRCodeResponse

router = APIRouter(prefix="/credits", tags=["Credits & QR Systems"])

def get_credits_service(db: AsyncSession = Depends(get_db)):
    repo = CreditsRepository(db)
    return CreditsService(repo)

@router.post("/qr/generate", response_model=QRCodeResponse)
async def generate_qr_code(current_user: User = Depends(get_current_user), service: CreditsService = Depends(get_credits_service)):
    return await service.generate_qr(current_user.id)

@router.get("/qr/me", response_model=QRCodeResponse)
async def get_my_qr_code(current_user: User = Depends(get_current_user), service: CreditsService = Depends(get_credits_service)):
    qr = await service.get_my_qr(current_user.id)
    if not qr:
        raise HTTPException(status_code=404, detail="No active QR code associated with this account.")
    return qr