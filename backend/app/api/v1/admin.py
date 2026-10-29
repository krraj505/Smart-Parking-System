from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.parking import ParkingLot, ParkingSlot, PricingRule
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.parking import (
    ParkingLotCreate,
    ParkingLotUpdate,
    ParkingLotResponse,
    PricingRuleCreate,
    PricingRuleResponse
)
from app.schemas.user import UserResponse, UserRoleUpdate
from app.schemas.audit import AuditLogResponse
from app.api.deps import require_role

router = APIRouter(prefix="/admin", tags=["Administration"])

@router.post("/parking-lots", response_model=ParkingLotResponse, status_code=status.HTTP_201_CREATED)
def create_parking_lot(
    lot_in: ParkingLotCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    existing = db.query(ParkingLot).filter(ParkingLot.code == lot_in.code.upper()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Facility with code '{lot_in.code}' already exists."
        )

    lot = ParkingLot(
        name=lot_in.name,
        code=lot_in.code.upper(),
        address=lot_in.address,
        city=lot_in.city,
        area=lot_in.area,
        open_time=lot_in.open_time,
        close_time=lot_in.close_time,
        is_24_7=lot_in.is_24_7,
        total_capacity=lot_in.total_capacity,
        base_hourly_rate=lot_in.base_hourly_rate,
        contact_phone=lot_in.contact_phone,
        facilities=lot_in.facilities or '["EV Charging", "CCTV Surveillance", "Covered Parking", "Wheelchair Accessible"]',
        is_active=lot_in.is_active
    )
    db.add(lot)
    db.commit()
    db.refresh(lot)

    # Automatically generate default pricing rule
    rule = PricingRule(
        lot_id=lot.id,
        name=f"Standard Rate - {lot.name}",
        vehicle_type="all",
        base_hourly_rate=lot.base_hourly_rate,
        minimum_charge=round(lot.base_hourly_rate * 0.6, 2),
        billing_increment_minutes=15,
        daily_max_rate=lot.base_hourly_rate * 8,
        peak_multiplier=1.2,
        peak_start_time="09:00",
        peak_end_time="18:00",
        cancellation_fee_percent=10.0
    )
    db.add(rule)

    audit = AuditLog(
        user_id=admin_user.id,
        action="CREATE_PARKING_LOT",
        entity_type="ParkingLot",
        entity_id=str(lot.id),
        details=f"Admin {admin_user.full_name} created parking lot '{lot.name}' ({lot.code})."
    )
    db.add(audit)
    db.commit()
    db.refresh(lot)
    return lot

@router.patch("/parking-lots/{lot_id}", response_model=ParkingLotResponse)
def update_parking_lot(
    lot_id: int,
    lot_in: ParkingLotUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking facility not found.")

    for field, val in lot_in.model_dump(exclude_unset=True).items():
        setattr(lot, field, val)

    audit = AuditLog(
        user_id=admin_user.id,
        action="UPDATE_PARKING_LOT",
        entity_type="ParkingLot",
        entity_id=str(lot.id),
        details=f"Admin {admin_user.full_name} updated parking lot '{lot.name}'."
    )
    db.add(audit)
    db.commit()
    db.refresh(lot)
    return lot

@router.post("/parking-lots/{lot_id}/generate-slots")
def generate_facility_slots(
    lot_id: int,
    count: int = Query(20, ge=5, le=100),
    floors: int = Query(2, ge=1, le=5),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking facility not found.")

    existing_count = db.query(ParkingSlot).filter(ParkingSlot.lot_id == lot.id).count()
    slots_created = []
    
    categories = ["standard", "compact", "suv", "ev", "accessible", "motorcycle"]
    per_floor = count // floors

    for f in range(floors):
        floor_name = "Ground Floor" if f == 0 else f"Floor {f}"
        for s in range(1, per_floor + 1):
            slot_idx = existing_count + len(slots_created) + 1
            cat = categories[slot_idx % len(categories)]
            has_ev = (cat == "ev" or slot_idx % 7 == 0)
            is_acc = (cat == "accessible" or slot_idx % 11 == 0)

            slot = ParkingSlot(
                lot_id=lot.id,
                slot_number=f"{chr(65 + f)}-{s:02d}",
                floor_level=floor_name,
                slot_category=cat,
                status="available",
                has_ev_charger=has_ev,
                is_accessible=is_acc,
                is_active=True
            )
            db.add(slot)
            slots_created.append(slot)

    lot.total_capacity = existing_count + len(slots_created)
    
    audit = AuditLog(
        user_id=admin_user.id,
        action="GENERATE_SLOTS",
        entity_type="ParkingLot",
        entity_id=str(lot.id),
        details=f"Generated {len(slots_created)} slots across {floors} floors for {lot.name}."
    )
    db.add(audit)
    db.commit()
    return {"message": f"Successfully generated {len(slots_created)} parking slots for {lot.name}."}

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    return db.query(User).order_by(User.created_at.desc()).all()

@router.patch("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    role_in: UserRoleUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    
    if role_in.role not in ["customer", "operator", "admin"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role specified.")

    old_role = user.role
    user.role = role_in.role

    audit = AuditLog(
        user_id=admin_user.id,
        action="UPDATE_USER_ROLE",
        entity_type="User",
        entity_id=str(user.id),
        details=f"Admin changed user {user.email} role from {old_role} to {user.role}."
    )
    db.add(audit)
    db.commit()
    db.refresh(user)
    return user

@router.get("/pricing-rules", response_model=List[PricingRuleResponse])
def get_pricing_rules(
    lot_id: Optional[int] = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin", "operator"]))
):
    q = db.query(PricingRule)
    if lot_id:
        q = q.filter(PricingRule.lot_id == lot_id)
    return q.all()

@router.post("/pricing-rules", response_model=PricingRuleResponse)
def create_pricing_rule(
    rule_in: PricingRuleCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    lot = db.query(ParkingLot).filter(ParkingLot.id == rule_in.lot_id).first()
    if not lot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking facility not found.")

    rule = PricingRule(
        lot_id=rule_in.lot_id,
        name=rule_in.name,
        vehicle_type=rule_in.vehicle_type,
        base_hourly_rate=rule_in.base_hourly_rate,
        minimum_charge=rule_in.minimum_charge,
        billing_increment_minutes=rule_in.billing_increment_minutes,
        daily_max_rate=rule_in.daily_max_rate,
        peak_multiplier=rule_in.peak_multiplier,
        peak_start_time=rule_in.peak_start_time,
        peak_end_time=rule_in.peak_end_time,
        cancellation_fee_percent=rule_in.cancellation_fee_percent
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
