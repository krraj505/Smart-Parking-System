from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.parking import ParkingSlot, ParkingLot
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.parking import ParkingSlotResponse, ParkingSlotUpdate
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/slots", tags=["Parking Slots"])

@router.get("", response_model=List[ParkingSlotResponse])
def list_slots(
    lot_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(ParkingSlot).filter(ParkingSlot.is_active == True)
    if lot_id:
        q = q.filter(ParkingSlot.lot_id == lot_id)
    if status_filter and status_filter.lower() != "all":
        q = q.filter(ParkingSlot.status == status_filter.lower())
    if category and category.lower() != "all":
        q = q.filter(ParkingSlot.slot_category == category.lower())
    return q.all()

@router.get("/{slot_id}", response_model=ParkingSlotResponse)
def get_slot(slot_id: int, db: Session = Depends(get_db)):
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking slot not found.")
    return slot

@router.patch("/{slot_id}", response_model=ParkingSlotResponse)
def update_slot(
    slot_id: int,
    slot_in: ParkingSlotUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["operator", "admin"]))
):
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking slot not found.")

    old_status = slot.status
    if slot_in.status is not None:
        valid_statuses = ["available", "occupied", "reserved", "maintenance", "disabled"]
        if slot_in.status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid slot status. Must be one of: {', '.join(valid_statuses)}"
            )
        slot.status = slot_in.status

    if slot_in.slot_category is not None:
        slot.slot_category = slot_in.slot_category
    if slot_in.floor_level is not None:
        slot.floor_level = slot_in.floor_level
    if slot_in.has_ev_charger is not None:
        slot.has_ev_charger = slot_in.has_ev_charger
    if slot_in.is_accessible is not None:
        slot.is_accessible = slot_in.is_accessible
    if slot_in.is_active is not None:
        slot.is_active = slot_in.is_active

    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE_SLOT",
        entity_type="ParkingSlot",
        entity_id=str(slot.id),
        details=f"Slot {slot.slot_number} status changed from {old_status} to {slot.status} by {current_user.full_name}."
    )
    db.add(audit)
    db.commit()
    db.refresh(slot)
    return slot
