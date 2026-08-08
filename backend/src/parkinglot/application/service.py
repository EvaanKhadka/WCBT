from fastapi import HTTPException
from datetime import datetime, timezone
import math
from src.parkinglot.infrastructure.repository import ParkingLotRepository
from src.parkinglot.presentation.schemas import SlotsUpdate, LocationUpdate, StatusUpdate, PasswordUpdate, HardwareTapPayload, QRScanPayload
from src.core.security import verify_password, get_password_hash
from src.parkinglot.domain.entity import ParkingSession

class ParkingLotService:
    def __init__(self, repository: ParkingLotRepository):
        self.repository = repository

    async def get_my_profile(self, user_id: int):
        lot = await self.repository.get_parking_lot_by_user(user_id)
        if not lot: raise HTTPException(status_code=404, detail="Profile Not Found")
        
        return {
            "id": lot.id,
            "business_name": lot.business_name,
            "car_slots": lot.car_slots,
            "bike_slots": lot.bike_slots,
            "latitude": lot.latitude,
            "longitude": lot.longitude,
            "is_open": lot.is_open,
            "owner_name": lot.user.full_name,
            "owner_phone": lot.user.phone,
            "total_earnings": lot.total_earnings
        }

    async def update_slots(self, user_id: int, payload: SlotsUpdate):
        lot = await self.repository.get_parking_lot_by_user(user_id)
        lot.car_slots = payload.car_slots
        lot.bike_slots = payload.bike_slots
        await self.repository.update_parking_lot(lot)
        return {"message": "Slots updated successfully"}

    async def update_location(self, user_id: int, payload: LocationUpdate):
        lot = await self.repository.get_parking_lot_by_user(user_id)
        lot.latitude = payload.latitude
        lot.longitude = payload.longitude
        await self.repository.update_parking_lot(lot)
        return {"message": "Location updated successfully"}

    async def update_status(self, user_id: int, payload: StatusUpdate):
        lot = await self.repository.get_parking_lot_by_user(user_id)
        lot.is_open = payload.is_open
        await self.repository.update_parking_lot(lot)
        return {"message": f"Parking lot is now {'OPEN' if lot.is_open else 'CLOSED'}"}

    async def get_my_bookings(self, user_id: int):
        lot = await self.repository.get_parking_lot_by_user(user_id)
        bookings = await self.repository.get_active_bookings(lot.id)
        return [{"id": b.id, "user_id": b.user_id, "vehicle_type": b.vehicle_type, "hours": b.hours, "price": b.price, "status": b.status, "created_at": b.created_at, "customer_name": b.user.full_name, "customer_phone": b.user.phone} for b in bookings]

    async def update_password(self, user_id: int, payload: PasswordUpdate):
        user = await self.repository.get_user_by_id(user_id)
        if not verify_password(payload.old_password, user.hashed_password): raise HTTPException(status_code=400, detail="Incorrect current password")
        user.hashed_password = get_password_hash(payload.new_password)
        await self.repository.update_user(user)
        return {"message": "Password updated securely."}

    # --- ADVANCED HARDWARE & SOFTWARE LOGIC CORE ---
    async def _handle_gate_access(self, access_key: str, access_method: str, user, lot):
        active_session = await self.repository.get_active_session_by_key(access_key)

        if not active_session:
            # ENTRY LOGIC
            active_booking = await self.repository.get_active_booking_by_user_and_lot(user.id, lot.id)
            vehicle_type = "car"

            if active_booking:
                active_booking.status = "FULFILLED"
                user.credit_balance += active_booking.price
                vehicle_type = active_booking.vehicle_type
                self.repository.db.add(active_booking)
            else:
                if lot.car_slots > 0:
                    lot.car_slots -= 1
                    vehicle_type = "car"
                elif lot.bike_slots > 0:
                    lot.bike_slots -= 1
                    vehicle_type = "bike"
                else:
                    return {"action": "reject", "message": "Lot is Full"}

            new_session = ParkingSession(
                user_id=user.id,
                parking_lot_id=lot.id,
                access_key=access_key,
                access_method=access_method,
                vehicle_type=vehicle_type
            )
            await self.repository.create_parking_session(new_session)
            await self.repository.update_user(user)
            await self.repository.update_parking_lot(lot)
            return {"action": "open_gate", "message": f"{access_method} Entry Granted"}
        
        else:
            # EXIT LOGIC
            now = datetime.now(timezone.utc)
            duration_secs = (now - active_session.entry_time).total_seconds()
            hours = math.ceil(duration_secs / 3600)
            if hours <= 0: hours = 1 
            
            cost = hours * 10.0 

            if user.credit_balance < cost:
                return {"action": "reject", "message": "Insufficient Balance"}

            user.credit_balance -= cost
            lot.total_earnings += cost
            
            if active_session.vehicle_type == "car":
                lot.car_slots += 1
            else:
                lot.bike_slots += 1
            
            active_session.exit_time = now
            active_session.total_cost = cost
            active_session.status = "COMPLETED"

            await self.repository.update_user(user)
            await self.repository.update_parking_lot(lot)
            await self.repository.update_parking_session(active_session)

            return {"action": "open_gate", "message": f"Exit Granted. NPR {cost} Deducted."}

    # RFID Physical Read Support
    async def process_hardware_tap(self, payload: HardwareTapPayload):
        card = await self.repository.get_active_rfid_card(payload.card_key)
        if not card: return {"action": "reject", "message": "Unknown Card"}
        user = await self.repository.get_user_by_id(card.user_id)
        lot = await self.repository.get_parking_lot_by_id(payload.parking_lot_id)
        if not lot: return {"action": "reject", "message": "Unknown Lot"}
        return await self._handle_gate_access(payload.card_key, "RFID", user, lot)

    # QR Scan Support via App
    async def process_qr_scan(self, payload: QRScanPayload):
        qr = await self.repository.get_active_qr_code(payload.qr_key)
        if not qr: return {"action": "reject", "message": "Invalid or Expired QR Code"}
        user = await self.repository.get_user_by_id(qr.user_id)
        lot = await self.repository.get_parking_lot_by_id(payload.parking_lot_id)
        if not lot: return {"action": "reject", "message": "Unknown Lot"}
        return await self._handle_gate_access(payload.qr_key, "QR", user, lot)

    async def get_all_sessions(self, user_id: int):
        lot = await self.repository.get_parking_lot_by_user(user_id)
        sessions = await self.repository.get_all_sessions(lot.id)
        return [
            {
                "id": s.id, "user_id": s.user_id, "access_key": s.access_key, "access_method": s.access_method,
                "entry_time": s.entry_time, "exit_time": s.exit_time, 
                "total_cost": s.total_cost, "status": s.status, "customer_name": s.user.full_name
            } for s in sessions
        ]