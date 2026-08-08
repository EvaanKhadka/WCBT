from pydantic import BaseModel
from datetime import datetime

class QRCodeResponse(BaseModel):
    id: int
    user_id: int
    qr_key: str
    is_active: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}