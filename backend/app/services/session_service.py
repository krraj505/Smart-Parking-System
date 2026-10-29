import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status

from app.models.reservation import Reservation
from app.models.parking import ParkingLot, ParkingSlot, PricingRule
from app.models.session import ParkingSession
from app.models.payment import Payment
from app.models.audit import AuditLog, ParkingEvent
from app.models.notification import Notification
from app.services.pricing_engine import PricingEngine

class SessionService:
    @classmethod
    def check_in(
        cls,
        db: Session,
        booking_reference: Optional[str] = None,
        vehicle_registration: Optional[str] = None,
        operator_user_id: Optional[int] = None,
        notes: Optional[str] = None
    ) -> ParkingSession:
        if not booking_reference and not vehicle_registration:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either booking reference or vehicle registration number must be provided."
            )

        query = db.query(Reservation).filter(Reservation.status == "confirmed")
        if booking_reference:
            query = query.filter(Reservation.booking_reference.ilike(booking_reference.strip()))
        elif vehicle_registration:
            query = query.join(Reservation.vehicle).filter(
                Reservation.vehicle.has(registration_number=vehicle_registration.strip().upper())
            )

        reservation = query.order_by(Reservation.start_time.asc()).first()
        if not reservation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No confirmed reservation found matching the provided reference or registration."
            )

        # Check if already checked in
        existing_session = db.query(ParkingSession).filter(
            ParkingSession.reservation_id == reservation.id,
            ParkingSession.status == "active"
        ).first()
        if existing_session:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vehicle is already checked in for this reservation."
            )

        now = datetime.now(timezone.utc).replace(tzinfo=None)

        # Update reservation status
        reservation.status = "checked_in"

        # Update slot status
        slot = reservation.slot
        slot.status = "occupied"

        # Create session
        session = ParkingSession(
            reservation_id=reservation.id,
            lot_id=reservation.lot_id,
            slot_id=reservation.slot_id,
            vehicle_registration=reservation.vehicle.registration_number,
            entry_time=now,
            status="active",
            calculated_charge=0.0
        )
        db.add(session)
        db.flush()

        # Record gate event
        gate_event = ParkingEvent(
            lot_id=reservation.lot_id,
            slot_id=reservation.slot_id,
            event_type="gate_entry",
            is_simulated=True,
            payload=f"Barrier raised. Vehicle {reservation.vehicle.registration_number} checked into Slot {slot.slot_number}."
        )
        db.add(gate_event)

        # Audit log
        audit = AuditLog(
            user_id=operator_user_id,
            action="CHECK_IN",
            entity_type="ParkingSession",
            entity_id=str(session.id),
            details=f"Checked in {reservation.vehicle.registration_number} at {reservation.lot.name}, Slot {slot.slot_number}."
        )
        db.add(audit)

        # Notification to user
        notif = Notification(
            user_id=reservation.user_id,
            title="Vehicle Checked In",
            message=f"Your vehicle {reservation.vehicle.registration_number} has successfully entered {reservation.lot.name}. Park at Slot {slot.slot_number}.",
            notification_type="check_in",
            link=f"/reservations/{reservation.id}"
        )
        db.add(notif)

        db.commit()
        db.refresh(session)
        return session

    @classmethod
    def check_out(
        cls,
        db: Session,
        session_id: Optional[int] = None,
        booking_reference: Optional[str] = None,
        vehicle_registration: Optional[str] = None,
        operator_user_id: Optional[int] = None,
        payment_method: str = "simulated_upi"
    ) -> ParkingSession:
        query = db.query(ParkingSession).filter(ParkingSession.status == "active")
        if session_id:
            query = query.filter(ParkingSession.id == session_id)
        elif booking_reference:
            query = query.join(ParkingSession.reservation).filter(
                Reservation.booking_reference.ilike(booking_reference.strip())
            )
        elif vehicle_registration:
            query = query.filter(ParkingSession.vehicle_registration.ilike(vehicle_registration.strip()))

        session = query.first()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active parking session found matching criteria."
            )

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        session.exit_time = now
        duration_minutes = max(int((now - session.entry_time).total_seconds() / 60), 1)
        session.duration_minutes = duration_minutes

        # Calculate charge using pricing engine
        lot = session.lot
        rule = db.query(PricingRule).filter(
            PricingRule.lot_id == lot.id
        ).first()

        vehicle_type = "car"
        if session.reservation and session.reservation.vehicle:
            vehicle_type = session.reservation.vehicle.vehicle_type

        final_charge, base_charge, peak_surcharge = PricingEngine.calculate_price(
            session.entry_time, now, lot, vehicle_type, rule
        )
        session.calculated_charge = final_charge
        session.status = "completed"

        # Update reservation
        if session.reservation:
            session.reservation.status = "completed"
            session.reservation.final_amount = final_charge

        # Release slot
        slot = session.slot
        slot.status = "available"

        # Create simulated payment record
        user_id = session.reservation.user_id if session.reservation else 1
        txn_ref = f"TXN-{datetime.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        payment = Payment(
            transaction_reference=txn_ref,
            reservation_id=session.reservation_id,
            session_id=session.id,
            user_id=user_id,
            amount=final_charge,
            currency="INR",
            status="successful",
            payment_method=payment_method,
            payment_gateway="SIMULATED_GATEWAY",
            gateway_payload="Simulated automated settlement upon vehicle gate exit.",
            paid_at=now
        )
        db.add(payment)

        # Gate exit event
        gate_event = ParkingEvent(
            lot_id=session.lot_id,
            slot_id=session.slot_id,
            event_type="gate_exit",
            is_simulated=True,
            payload=f"Exit barrier raised. Vehicle {session.vehicle_registration} departed. Duration: {duration_minutes}m. Amount: ₹{final_charge}."
        )
        db.add(gate_event)

        # Audit
        audit = AuditLog(
            user_id=operator_user_id,
            action="CHECK_OUT",
            entity_type="ParkingSession",
            entity_id=str(session.id),
            details=f"Checked out {session.vehicle_registration}. Duration: {duration_minutes} mins, Charge: ₹{final_charge}."
        )
        db.add(audit)

        # Notification
        hours = duration_minutes // 60
        mins = duration_minutes % 60
        duration_str = f"{hours}h {mins}m" if hours > 0 else f"{mins} mins"

        notif = Notification(
            user_id=user_id,
            title="Parking Session Completed",
            message=f"Checked out from {lot.name}. Duration: {duration_str}. Total paid: ₹{final_charge}. Safe journey!",
            notification_type="check_out",
            link=f"/reservations/{session.reservation_id}" if session.reservation_id else "/payments"
        )
        db.add(notif)

        db.commit()
        db.refresh(session)
        return session
