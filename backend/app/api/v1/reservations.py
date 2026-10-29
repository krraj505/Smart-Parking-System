from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.reservation import Reservation
from app.models.parking import ParkingLot, ParkingSlot, PricingRule
from app.models.vehicle import Vehicle
from app.models.user import User
from app.models.audit import AuditLog
from app.models.notification import Notification
from app.schemas.reservation import (
    ReservationCreate,
    ReservationResponse,
    ReservationPreviewRequest,
    ReservationPreviewResponse,
    ReservationCancelRequest
)
from app.services.allocation_engine import AllocationEngine
from app.services.pricing_engine import PricingEngine
from app.api.deps import get_current_user

router = APIRouter(prefix="/reservations", tags=["Reservations"])

@router.post("/preview", response_model=ReservationPreviewResponse)
def preview_reservation(
    req: ReservationPreviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lot = db.query(ParkingLot).filter(ParkingLot.id == req.lot_id, ParkingLot.is_active == True).first()
    if not lot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking facility not found.")

    vehicle = db.query(Vehicle).filter(Vehicle.id == req.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")

    start_dt, end_dt = AllocationEngine.validate_time_interval(req.start_time, req.end_time)
    AllocationEngine.check_operating_hours(lot, start_dt, end_dt)

    compatible_slots = AllocationEngine.get_compatible_slots(db, lot.id, vehicle, start_dt, end_dt)
    is_available = len(compatible_slots) > 0

    recommended_slot = None
    if is_available:
        ranked = AllocationEngine.rank_slots(compatible_slots, vehicle)
        recommended_slot = ranked[0]

    rule = db.query(PricingRule).filter(PricingRule.lot_id == lot.id).first()
    est_amount, base_amt, peak_surcharge = PricingEngine.calculate_price(
        start_dt, end_dt, lot, vehicle.vehicle_type, rule
    )
    duration_hours = round((end_dt - start_dt).total_seconds() / 3600.0, 2)

    return ReservationPreviewResponse(
        lot_id=lot.id,
        lot_name=lot.name,
        recommended_slot=recommended_slot,
        compatible_slots_count=len(compatible_slots),
        duration_hours=duration_hours,
        base_rate=lot.base_hourly_rate,
        estimated_amount=est_amount,
        peak_surcharge=peak_surcharge,
        cancellation_policy="Free cancellation up to 2 hours before scheduled arrival. 10% cancellation fee within 2 hours.",
        is_available=is_available,
        message="Slot available for reservation" if is_available else "No compatible slots available for this time window."
    )

@router.post("", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
def create_reservation(
    res_in: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reservation = AllocationEngine.allocate_and_reserve(
        db=db,
        user=current_user,
        lot_id=res_in.lot_id,
        vehicle_id=res_in.vehicle_id,
        start_time=res_in.start_time,
        end_time=res_in.end_time,
        preferred_slot_id=res_in.slot_id,
        payment_method=res_in.payment_method or "simulated_upi"
    )
    return reservation

@router.get("", response_model=List[ReservationResponse])
def list_reservations(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Reservation)
    if current_user.role == "customer":
        q = q.filter(Reservation.user_id == current_user.id)
    
    if status_filter and status_filter.lower() != "all":
        q = q.filter(Reservation.status == status_filter.lower())

    return q.order_by(Reservation.start_time.desc()).all()

@router.get("/{reservation_id}", response_model=ReservationResponse)
def get_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found.")
    
    if current_user.role == "customer" and res.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    
    return res

@router.post("/{reservation_id}/cancel", response_model=ReservationResponse)
def cancel_reservation(
    reservation_id: int,
    cancel_in: ReservationCancelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found.")
    
    if current_user.role == "customer" and res.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    if res.status in ["cancelled", "completed", "checked_in"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel reservation in '{res.status}' status."
        )

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    rule = db.query(PricingRule).filter(PricingRule.lot_id == res.lot_id).first()
    cancellation_fee_percent = rule.cancellation_fee_percent if rule else 10.0

    fee = PricingEngine.calculate_cancellation_fee(
        res.start_time, now, res.estimated_amount, cancellation_fee_percent
    )

    res.status = "cancelled"
    res.cancellation_reason = cancel_in.cancellation_reason or "Cancelled by user"
    res.cancellation_fee = fee

    # Release slot back to available if it was marked reserved
    slot = res.slot
    if slot and slot.status == "reserved":
        slot.status = "available"

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="CANCEL_RESERVATION",
        entity_type="Reservation",
        entity_id=str(res.id),
        details=f"Reservation {res.booking_reference} cancelled. Cancellation fee: ₹{fee}."
    )
    db.add(audit)

    # Notification
    notif = Notification(
        user_id=res.user_id,
        title="Reservation Cancelled",
        message=f"Booking {res.booking_reference} has been cancelled. Cancellation fee: ₹{fee}.",
        notification_type="reservation",
        link=f"/reservations/{res.id}"
    )
    db.add(notif)

    db.commit()
    db.refresh(res)
    return res
