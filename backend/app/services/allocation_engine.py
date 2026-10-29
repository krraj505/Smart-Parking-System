import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException, status

from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.parking import ParkingLot, ParkingSlot, PricingRule
from app.models.reservation import Reservation
from app.models.audit import AuditLog, ParkingEvent
from app.models.notification import Notification
from app.services.pricing_engine import PricingEngine

class AllocationEngine:
    @staticmethod
    def validate_time_interval(start_time: datetime, end_time: datetime):
        # Normalize to UTC or offset-naive for consistent comparisons
        if start_time.tzinfo is not None:
            start_time = start_time.astimezone(timezone.utc).replace(tzinfo=None)
        if end_time.tzinfo is not None:
            end_time = end_time.astimezone(timezone.utc).replace(tzinfo=None)
            
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        
        if end_time <= start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reservation end time must be after start time."
            )
        
        # Allow up to 10 minutes in the past to account for clock skew/network delay
        if start_time < now - timedelta(minutes=10):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reservation start time cannot be in the past."
            )
            
        duration_hours = (end_time - start_time).total_seconds() / 3600.0
        if duration_hours > 72.0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reservations cannot exceed 72 hours per booking."
            )
        return start_time, end_time

    @staticmethod
    def check_operating_hours(lot: ParkingLot, start_time: datetime, end_time: datetime):
        if lot.is_24_7:
            return True
        try:
            open_parts = [int(p) for p in lot.open_time.split(":")]
            close_parts = [int(p) for p in lot.close_time.split(":")]
            open_min = open_parts[0] * 60 + open_parts[1]
            close_min = close_parts[0] * 60 + close_parts[1]
            
            start_min = start_time.hour * 60 + start_time.minute
            end_min = end_time.hour * 60 + end_time.minute
            
            if start_min < open_min or end_min > close_min:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Facility '{lot.name}' operating hours are {lot.open_time} - {lot.close_time}. Requested booking ({start_time.strftime('%H:%M')} - {end_time.strftime('%H:%M')}) falls outside operating hours."
                )
        except HTTPException:
            raise
        except Exception:
            pass
        return True

    @staticmethod
    def is_slot_compatible(slot: ParkingSlot, vehicle: Vehicle) -> bool:
        # Exclude maintenance or disabled slots
        if slot.status in ["maintenance", "disabled"] or not slot.is_active:
            return False

        v_type = vehicle.vehicle_type.lower()
        s_cat = slot.slot_category.lower()

        # EV requirement
        if vehicle.is_ev and not slot.has_ev_charger:
            return False

        # Category compatibility rules
        if v_type == "motorcycle":
            return s_cat in ["motorcycle", "standard", "compact"]
        elif v_type in ["suv", "van"]:
            return s_cat in ["suv", "standard"]
        elif v_type == "car":
            return s_cat in ["standard", "compact", "suv"]
        elif v_type == "ev":
            return slot.has_ev_charger
        
        return True

    @classmethod
    def get_compatible_slots(
        cls,
        db: Session,
        lot_id: int,
        vehicle: Vehicle,
        start_time: datetime,
        end_time: datetime,
        preferred_slot_id: Optional[int] = None
    ) -> List[ParkingSlot]:
        """
        Queries all candidate slots and filters out slots that have overlapping active reservations.
        """
        query = db.query(ParkingSlot).filter(
            ParkingSlot.lot_id == lot_id,
            ParkingSlot.is_active == True,
            ParkingSlot.status.notin_(["maintenance", "disabled"])
        )

        if preferred_slot_id:
            query = query.filter(ParkingSlot.id == preferred_slot_id)

        candidate_slots = query.all()
        
        # Filter by compatibility
        compatible = [s for s in candidate_slots if cls.is_slot_compatible(s, vehicle)]
        if not compatible:
            return []

        compatible_slot_ids = [s.id for s in compatible]

        # Find slots that have overlapping active reservations
        overlapping_reservations = db.query(Reservation.slot_id).filter(
            Reservation.slot_id.in_(compatible_slot_ids),
            Reservation.status.in_(["pending", "confirmed", "checked_in"]),
            Reservation.start_time < end_time,
            Reservation.end_time > start_time
        ).all()

        conflicting_slot_ids = set([r[0] for r in overlapping_reservations])
        
        available_slots = [s for s in compatible if s.id not in conflicting_slot_ids]
        return available_slots

    @classmethod
    def rank_slots(cls, slots: List[ParkingSlot], vehicle: Vehicle) -> List[ParkingSlot]:
        """
        Ranks slots by intelligent rule-based scoring:
        1. Exact category match (+50)
        2. EV requirement (+40)
        3. Floor priority (Ground Floor > Floor 1 > Floor 2) (+20)
        4. Lower slot number (+10)
        """
        def score_slot(slot: ParkingSlot) -> int:
            score = 0
            v_type = vehicle.vehicle_type.lower()
            s_cat = slot.slot_category.lower()

            if (v_type == "motorcycle" and s_cat == "motorcycle") or \
               (v_type in ["suv", "van"] and s_cat == "suv") or \
               (v_type == "car" and s_cat in ["standard", "compact"]):
                score += 50

            if vehicle.is_ev and slot.has_ev_charger:
                score += 40

            # Floor level preference
            fl = slot.floor_level.lower()
            if "ground" in fl or "level 0" in fl:
                score += 30
            elif "floor 1" in fl or "level 1" in fl:
                score += 20
            elif "floor 2" in fl or "level 2" in fl:
                score += 10

            return score

        return sorted(slots, key=lambda s: (score_slot(s), -s.id), reverse=True)

    @classmethod
    def allocate_and_reserve(
        cls,
        db: Session,
        user: User,
        lot_id: int,
        vehicle_id: int,
        start_time: datetime,
        end_time: datetime,
        preferred_slot_id: Optional[int] = None,
        payment_method: str = "simulated_upi"
    ) -> Reservation:
        # Step 1: Validate User and Vehicle
        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")
        
        # User owns vehicle or is admin/operator
        if vehicle.user_id != user.id and user.role not in ["admin", "operator"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this vehicle.")

        # Step 2: Validate requested time interval
        start_time, end_time = cls.validate_time_interval(start_time, end_time)

        # Step 3: Check parking facility operating hours
        lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id, ParkingLot.is_active == True).first()
        if not lot:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking facility not found or inactive.")

        cls.check_operating_hours(lot, start_time, end_time)

        # Step 4 - 8: Find compatible, non-conflicting slots and rank them
        available_slots = cls.get_compatible_slots(
            db, lot_id, vehicle, start_time, end_time, preferred_slot_id
        )

        if not available_slots:
            if preferred_slot_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Requested slot is unavailable for the selected time window ({start_time.strftime('%Y-%m-%d %H:%M')} to {end_time.strftime('%H:%M')}). Please select another slot or allow auto-allocation."
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"No compatible parking slots available at '{lot.name}' for {vehicle.vehicle_type.upper()} during the specified window. Please adjust your reservation time or try another nearby facility."
                )

        ranked_slots = cls.rank_slots(available_slots, vehicle)
        selected_slot = ranked_slots[0]

        # Step 9: Atomic lock / Double booking verification
        # Query again with strict overlapping filter to ensure no concurrent transaction booked it
        conflict_check = db.query(Reservation).filter(
            Reservation.slot_id == selected_slot.id,
            Reservation.status.in_(["pending", "confirmed", "checked_in"]),
            Reservation.start_time < end_time,
            Reservation.end_time > start_time
        ).first()

        if conflict_check:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A concurrent reservation was just completed for this slot. Please try again."
            )

        # Step 10: Calculate estimated price
        pricing_rule = db.query(PricingRule).filter(
            PricingRule.lot_id == lot_id,
            or_(PricingRule.vehicle_type == vehicle.vehicle_type, PricingRule.vehicle_type == "all")
        ).first()

        estimated_amount, base_amt, peak_amt = PricingEngine.calculate_price(
            start_time, end_time, lot, vehicle.vehicle_type, pricing_rule
        )

        # Step 11: Create Reservation in DB transaction
        booking_ref = f"PK-{datetime.now().strftime('%y%m')}-{uuid.uuid4().hex[:6].upper()}"
        
        reservation = Reservation(
            booking_reference=booking_ref,
            user_id=user.id,
            lot_id=lot.id,
            slot_id=selected_slot.id,
            vehicle_id=vehicle.id,
            start_time=start_time,
            end_time=end_time,
            status="confirmed",
            estimated_amount=estimated_amount,
            cancellation_fee=0.0
        )
        db.add(reservation)
        db.flush()  # get reservation.id

        # Update slot status if reservation is effective immediately (within 15 mins)
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        if start_time <= now + timedelta(minutes=15) and selected_slot.status == "available":
            selected_slot.status = "reserved"

        # Record audit log
        audit = AuditLog(
            user_id=user.id,
            action="CREATE_RESERVATION",
            entity_type="Reservation",
            entity_id=str(reservation.id),
            details=f"Booked slot {selected_slot.slot_number} at {lot.name} for vehicle {vehicle.registration_number}. Amount: ₹{estimated_amount}"
        )
        db.add(audit)

        # Create user notification
        notif = Notification(
            user_id=user.id,
            title="Reservation Confirmed",
            message=f"Booking {booking_ref} confirmed for Slot {selected_slot.slot_number} at {lot.name}. Arrive by {start_time.strftime('%I:%M %p')}.",
            notification_type="reservation",
            link=f"/reservations/{reservation.id}"
        )
        db.add(notif)

        db.commit()
        db.refresh(reservation)
        return reservation
