from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.future import select

from src.core.config import settings
from src.core.database import engine, Base, AsyncSessionLocal
from src.core.security import get_password_hash

# Entities must be imported before Base.metadata.create_all
from src.users.domain.entity import User, RoleEnum, CardVault, CardRequest, RFIDCard
from src.admin.domain.entity import ParkingLotAccount
from src.parkinglot.domain.entity import Booking, ParkingSession
from src.credits.domain.entity import QRCode # IMPORTED QR ENTITY

# Routers
from src.users.presentation.router import router as auth_router
from src.admin.presentation.router import router as admin_router
from src.parkinglot.presentation.router import router as parkinglot_router
from src.credits.presentation.router import router as credits_router

async def init_superadmin():
    admin_email = "admin@admin.com" 
    admin_pwd = "Nidi@123"
    
    async with AsyncSessionLocal() as session:
        query = select(User).where(User.email == admin_email)
        result = await session.execute(query)
        admin = result.scalars().first()
        
        if not admin:
            new_admin = User(
                full_name="HQ Admin",
                email=admin_email,
                phone="0000000000",
                hashed_password=get_password_hash(admin_pwd),
                role=RoleEnum.ADMIN
            )
            session.add(new_admin)
            await session.commit()
            print(f"🔒 SECURE ADMIN INITIALIZED -> User: {admin_email} | Password: {admin_pwd}")

async def init_vault():
    async with AsyncSessionLocal() as session:
        for key in ["9B 20 C8 05", "A4 5A 49 01"]:
            query = select(CardVault).where(CardVault.card_key == key)
            result = await session.execute(query)
            card = result.scalars().first()
            if not card:
                session.add(CardVault(card_key=key))
        await session.commit()
        print("🔐 SECURE CARD VAULT INITIALIZED")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Mount Schema Architecture & Auto-Migrate missing columns to Postgres Engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all) 
        
    await init_superadmin()
    await init_vault()
    
    yield
    await engine.dispose()

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(parkinglot_router)
app.include_router(credits_router)

@app.get("/")
async def root():
    return {"message": "Server Systems Operational."}