from fastapi import HTTPException, status
from src.users.infrastructure.repository import UserRepository
from src.users.presentation.schemas import PasswordUpdate, CardRequestCreate, HardwareChargePayload, CreateBookingPayload
from src.core.security import verify_password, get_password_hash
from src.users.domain.entity import CardRequest, CardStatusEnum, RFIDCard
from src.parkinglot.domain.entity import Booking

class UserService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    async def get_profile(self, user_id: int):
        user = await self.repository.get_user_profile(user_id)
        if not user: raise HTTPException(status_code=404, detail="User not found")
        return user

    async def update_password(self, user_id: int, payload: PasswordUpdate):
        user = await self.repository.get_user_profile(user_id)
        if not verify_password(payload.old_password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Incorrect current password")
        user.hashed_password = get_password_hash(payload.new_password)
        await self.repository.update_user(user)
        return {"message": "Password updated successfully"}

    async def create_card_request(self, user_id: int, payload: CardRequestCreate):
        if await self.repository.get_card_request_by_user(user_id):
            raise HTTPException(status_code=409, detail="Request already exists.")
        new_request = CardRequest(
            user_id=user_id, owner_name=payload.owner_name, phone_with_code=payload.phone_with_code,
            province=payload.province, district=payload.district, city=payload.city, 
            street_name=payload.street_name, status=CardStatusEnum.PENDING
        )
        return await self.repository.create_card_request(new_request)

    async def confirm_delivery(self, user_id: int):
        request = await self.repository.get_card_request_by_user(user_id)
        if not request or request.status != CardStatusEnum.DELIVERED_UNCONFIRMED:
            raise HTTPException(status_code=400, detail="Cannot confirm at this stage.")
        request.status = CardStatusEnum.DELIVERED_CONFIRMED
        return await self.repository.update_card_request(request)

    async def verify_card_key(self, card_key: str):
        vault_card = await self.repository.get_vault_card(card_key)
        if not vault_card or vault_card.is_assigned:
            raise HTTPException(status_code=400, detail="Invalid or assigned Card Key.")
        return {"valid": True, "card_key": vault_card.card_key}

    async def link_rfid_card(self, user_id: int, card_key: str):
        user = await self.repository.get_user_profile(user_id)
        if user.rfid_card: raise HTTPException(status_code=400, detail="Active card exists.")
        vault_card = await self.repository.get_vault_card(card_key)
        if not vault_card or vault_card.is_assigned: raise HTTPException(status_code=400, detail="Card invalid.")

        vault_card.is_assigned = True
        await self.repository.update_vault_card(vault_card)
        await self.repository.create_rfid_card(RFIDCard(user_id=user_id, card_key=card_key, is_active=True))
        return {"message": "Card linked successfully!"}

    async def disconnect_rfid_card(self, user_id: int):
        user = await self.repository.get_user_profile(user_id)
        if not user.rfid_card: raise HTTPException(status_code=400, detail="No active card.")
        
        vault_card = await self.repository.get_vault_card(user.rfid_card.card_key)
        if vault_card:
            vault_card.is_assigned = False
            await self.repository.update_vault_card(vault_card)

        await self.repository.delete_rfid_card(user.rfid_card)
        user.credit_balance = 0.0
        await self.repository.update_user(user)
        return {"message": "Card disconnected. Credits wiped."}

    async def top_up_credits(self, user_id: int, amount: float):
        if amount <= 0: raise HTTPException(status_code=400, detail="Invalid amount.")
        user = await self.repository.get_user_profile(user_id)
        user.credit_balance += amount
        await self.repository.update_user(user)
        return {"message": f"Loaded ${amount}", "new_balance": user.credit_balance}

    async def get_open_parkinglots(self):
        lots = await self.repository.get_open_parking_lots()
        return [
            {
                "id": lot.id, "business_name": lot.business_name, "car_slots": lot.car_slots,
                "bike_slots": lot.bike_slots, "latitude": lot.latitude, "longitude": lot.longitude
            }
            for lot in lots if lot.latitude and lot.longitude and (lot.car_slots > 0 or lot.bike_slots > 0)
        ]

    async def book_parking_spot(self, user_id: int, payload: CreateBookingPayload):
        user = await self.repository.get_user_profile(user_id)
        if user.credit_balance < payload.price: raise HTTPException(status_code=400, detail="Insufficient credits.")
        
        lot = await self.repository.get_parking_lot_by_id(payload.parking_lot_id)
        if not lot or not lot.is_open: raise HTTPException(status_code=404, detail="Closed or unavailable.")

        if payload.vehicle_type == "car":
            if lot.car_slots <= 0: raise HTTPException(status_code=400, detail="No car slots.")
            lot.car_slots -= 1
        elif payload.vehicle_type == "bike":
            if lot.bike_slots <= 0: raise HTTPException(status_code=400, detail="No bike slots.")
            lot.bike_slots -= 1
        
        user.credit_balance -= payload.price
        await self.repository.update_user(user)
        await self.repository.update_parking_lot(lot)

        await self.repository.create_booking(Booking(
            user_id=user_id, parking_lot_id=lot.id, vehicle_type=payload.vehicle_type,
            hours=payload.hours, price=payload.price
        ))
        return {"message": "Parking Booked Successfully!"}

    async def get_my_bookings(self, user_id: int):
        bookings = await self.repository.get_bookings_by_user(user_id)
        return [
            {
                "id": b.id,
                "parking_lot_id": b.parking_lot_id,
                "business_name": b.parking_lot.business_name,
                "vehicle_type": b.vehicle_type,
                "hours": b.hours,
                "price": b.price,
                "status": b.status,
                "created_at": b.created_at
            }
            for b in bookings
        ]

    async def cancel_booking(self, user_id: int, booking_id: int):
        booking = await self.repository.get_booking_by_id(booking_id)
        if not booking or booking.user_id != user_id:
            raise HTTPException(status_code=404, detail="Booking not found.")
        if booking.status != "ACTIVE":
            raise HTTPException(status_code=400, detail="Cannot cancel this booking.")

        lot = await self.repository.get_parking_lot_by_id(booking.parking_lot_id)
        user = await self.repository.get_user_profile(user_id)

        # 30% Penalty logic, returning 70%
        refund_amount = booking.price * 0.70
        penalty_amount = booking.price * 0.30

        user.credit_balance += refund_amount
        
        if lot:
            lot.total_earnings += penalty_amount
            # Restore physical slot
            if booking.vehicle_type == "car":
                lot.car_slots += 1
            else:
                lot.bike_slots += 1
            await self.repository.update_parking_lot(lot)

        booking.status = "CANCELLED"
        await self.repository.update_user(user)
        
        self.repository.db.add(booking)
        await self.repository.db.commit()

        return {"message": "Booking Cancelled. A 30% penalty was applied to the return sum."}

    async def hardware_charge_card(self, payload: HardwareChargePayload):
        active_card = await self.repository.get_rfid_card_by_key(payload.card_key)
        if not active_card or not active_card.is_active: raise HTTPException(status_code=404, detail="Inactive Card")
        user = await self.repository.get_user_profile(active_card.user_id)
        if user.credit_balance < payload.amount: raise HTTPException(status_code=400, detail="Insufficient funds.")
        user.credit_balance -= payload.amount
        await self.repository.update_user(user)
        return {"message": "Authorized"}