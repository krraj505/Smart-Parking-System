from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.parking import ParkingLot, ParkingSlot, PricingRule
from app.models.reservation import Reservation
from app.schemas.parking import (
    ParkingLotResponse,
    ParkingLotDetailResponse,
    ParkingSlotResponse
)
from app.services.pricing_engine import PricingEngine

router = APIRouter(tags=["Parking Facilities"])

def enrich_lot_counts(lot: ParkingLot, db: Session) -> dict:
    slots = db.query(ParkingSlot).filter(ParkingSlot.lot_id == lot.id, ParkingSlot.is_active == True).all()
    available = sum(1 for s in slots if s.status == "available")
    occupied = sum(1 for s in slots if s.status == "occupied")
    reserved = sum(1 for s in slots if s.status == "reserved")
    maintenance = sum(1 for s in slots if s.status == "maintenance")
    disabled = sum(1 for s in slots if s.status == "disabled")
    
    lot_dict = {
        "id": lot.id,
        "name": lot.name,
        "code": lot.code,
        "address": lot.address,
        "city": lot.city,
        "area": lot.area,
        "open_time": lot.open_time,
        "close_time": lot.close_time,
        "is_24_7": lot.is_24_7,
        "total_capacity": lot.total_capacity,
        "base_hourly_rate": lot.base_hourly_rate,
        "contact_phone": lot.contact_phone,
        "facilities": lot.facilities,
        "is_active": lot.is_active,
        "available_slots": available,
        "occupied_slots": occupied,
        "reserved_slots": reserved,
        "maintenance_slots": maintenance,
        "disabled_slots": disabled,
        "created_at": lot.created_at,
        "updated_at": lot.updated_at
    }
    return lot_dict

@router.get("/parking-lots", response_model=List[ParkingLotResponse])
def get_parking_lots(
    query: Optional[str] = None,
    area: Optional[str] = None,
    max_price: Optional[float] = None,
    has_ev: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    q = db.query(ParkingLot).filter(ParkingLot.is_active == True)
    if query:
        q = q.filter(
            or_(
                ParkingLot.name.ilike(f"%{query}%"),
                ParkingLot.area.ilike(f"%{query}%"),
                ParkingLot.address.ilike(f"%{query}%")
            )
        )
    if area and area.lower() != "all":
        q = q.filter(ParkingLot.area.ilike(f"%{area}%"))
    if max_price:
        q = q.filter(ParkingLot.base_hourly_rate <= max_price)
    
    lots = q.all()
    results = []
    for lot in lots:
        data = enrich_lot_counts(lot, db)
        if has_ev:
            has_ev_slot = db.query(ParkingSlot).filter(
                ParkingSlot.lot_id == lot.id,
                ParkingSlot.has_ev_charger == True,
                ParkingSlot.is_active == True
            ).first()
            if not has_ev_slot:
                continue
        results.append(data)
    return results

@router.get("/parking-lots/{lot_id}", response_model=ParkingLotDetailResponse)
def get_parking_lot(lot_id: int, db: Session = Depends(get_db)):
    lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id, ParkingLot.is_active == True).first()
    if not lot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking facility not found.")
    
    data = enrich_lot_counts(lot, db)
    data["slots"] = lot.slots
    data["pricing_rules"] = lot.pricing_rules
    return data

@router.get("/parking-lots/{lot_id}/availability")
def get_lot_availability(lot_id: int, db: Session = Depends(get_db)):
    lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id, ParkingLot.is_active == True).first()
    if not lot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking facility not found.")
    return enrich_lot_counts(lot, db)

@router.get("/parking-lots/{lot_id}/slots", response_model=List[ParkingSlotResponse])
def get_lot_slots(
    lot_id: int,
    floor: Optional[str] = None,
    category: Optional[str] = None,
    slot_status: Optional[str] = None,
    has_ev: Optional[bool] = None,
    is_accessible: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(ParkingSlot).filter(ParkingSlot.lot_id == lot_id, ParkingSlot.is_active == True)
    
    if floor and floor.lower() != "all":
        q = q.filter(ParkingSlot.floor_level == floor)
    if category and category.lower() != "all":
        q = q.filter(ParkingSlot.slot_category == category.lower())
    if slot_status and slot_status.lower() != "all":
        q = q.filter(ParkingSlot.status == slot_status.lower())
    if has_ev is True:
        q = q.filter(ParkingSlot.has_ev_charger == True)
    if is_accessible is True:
        q = q.filter(ParkingSlot.is_accessible == True)
    if search:
        q = q.filter(ParkingSlot.slot_number.ilike(f"%{search}%"))

    return q.order_by(ParkingSlot.floor_level.asc(), ParkingSlot.slot_number.asc()).all()

@router.get("/parking/search")
def search_parking_facilities(
    query: Optional[str] = None,
    area: Optional[str] = None,
    vehicle_type: str = "car",
    arrival_time: Optional[datetime] = None,
    departure_time: Optional[datetime] = None,
    max_hourly_budget: Optional[float] = None,
    requires_ev: bool = False,
    requires_accessible: bool = False,
    sort_by: str = "availability",  # availability, price_asc, price_desc, capacity
    db: Session = Depends(get_db)
):
    """
    Map-free search endpoint delivering rich facility cards with price estimation and slot status.
    """
    lots_query = db.query(ParkingLot).filter(ParkingLot.is_active == True)
    if query:
        lots_query = lots_query.filter(
            or_(
                ParkingLot.name.ilike(f"%{query}%"),
                ParkingLot.area.ilike(f"%{query}%"),
                ParkingLot.address.ilike(f"%{query}%")
            )
        )
    if area and area.lower() != "all":
        lots_query = lots_query.filter(ParkingLot.area.ilike(f"%{area}%"))
    if max_hourly_budget:
        lots_query = lots_query.filter(ParkingLot.base_hourly_rate <= max_hourly_budget)

    lots = lots_query.all()
    results = []

    start_dt = arrival_time or datetime.now(timezone.utc).replace(tzinfo=None)
    end_dt = departure_time or (start_dt + (departure_time - start_dt if departure_time and departure_time > start_dt else datetime.resolution * 0 + (datetime.now() - datetime.now()) + (datetime.fromtimestamp(7200) - datetime.fromtimestamp(0))))
    
    # ensure duration default is 2 hours if not provided
    if not departure_time or departure_time <= start_dt:
        from datetime import timedelta
        end_dt = start_dt + timedelta(hours=2)

    for lot in lots:
        counts = enrich_lot_counts(lot, db)

        # Slots matching requirements
        sq = db.query(ParkingSlot).filter(
            ParkingSlot.lot_id == lot.id,
            ParkingSlot.is_active == True,
            ParkingSlot.status.notin_(["maintenance", "disabled"])
        )
        if requires_ev:
            sq = sq.filter(ParkingSlot.has_ev_charger == True)
        if requires_accessible:
            sq = sq.filter(ParkingSlot.is_accessible == True)

        compatible_slots = sq.all()
        if (requires_ev or requires_accessible) and len(compatible_slots) == 0:
            continue

        # Calculate estimated price
        rule = db.query(PricingRule).filter(PricingRule.lot_id == lot.id).first()
        est_price, base_amt, peak_amt = PricingEngine.calculate_price(
            start_dt, end_dt, lot, vehicle_type, rule
        )

        item = {
            **counts,
            "estimated_total_price": est_price,
            "duration_hours": round((end_dt - start_dt).total_seconds() / 3600.0, 1),
            "compatible_slots_count": len(compatible_slots),
            "supported_vehicles": ["car", "suv", "motorcycle", "van", "ev"]
        }
        results.append(item)

    # Sorting
    if sort_by == "price_asc":
        results.sort(key=lambda x: x["base_hourly_rate"])
    elif sort_by == "price_desc":
        results.sort(key=lambda x: x["base_hourly_rate"], reverse=True)
    elif sort_by == "capacity":
        results.sort(key=lambda x: x["total_capacity"], reverse=True)
    else:  # availability
        results.sort(key=lambda x: x["available_slots"], reverse=True)

    return results
