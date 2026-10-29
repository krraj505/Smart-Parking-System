from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.vehicle import Vehicle
from app.models.user import User
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

@router.get("", response_model=List[VehicleResponse])
def get_vehicles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in ["admin", "operator"]:
        return db.query(Vehicle).all()
    return db.query(Vehicle).filter(Vehicle.user_id == current_user.id).all()

@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    vehicle_in: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    clean_reg = vehicle_in.registration_number.strip().upper()
    existing = db.query(Vehicle).filter(
        Vehicle.user_id == current_user.id,
        Vehicle.registration_number == clean_reg
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have already registered a vehicle with registration {clean_reg}."
        )

    vehicle = Vehicle(
        user_id=current_user.id,
        registration_number=clean_reg,
        vehicle_type=vehicle_in.vehicle_type.lower(),
        make=vehicle_in.make.strip(),
        model=vehicle_in.model.strip(),
        color=vehicle_in.color.strip(),
        dimensions=vehicle_in.dimensions,
        is_ev=vehicle_in.is_ev or (vehicle_in.vehicle_type.lower() == "ev"),
        preferences=vehicle_in.preferences
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.patch("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int,
    vehicle_in: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")
    
    if vehicle.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    if vehicle_in.registration_number is not None:
        vehicle.registration_number = vehicle_in.registration_number.strip().upper()
    if vehicle_in.vehicle_type is not None:
        vehicle.vehicle_type = vehicle_in.vehicle_type.lower()
        if vehicle.vehicle_type == "ev":
            vehicle.is_ev = True
    if vehicle_in.make is not None:
        vehicle.make = vehicle_in.make.strip()
    if vehicle_in.model is not None:
        vehicle.model = vehicle_in.model.strip()
    if vehicle_in.color is not None:
        vehicle.color = vehicle_in.color.strip()
    if vehicle_in.dimensions is not None:
        vehicle.dimensions = vehicle_in.dimensions
    if vehicle_in.is_ev is not None:
        vehicle.is_ev = vehicle_in.is_ev
    if vehicle_in.preferences is not None:
        vehicle.preferences = vehicle_in.preferences

    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")
    
    if vehicle.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    db.delete(vehicle)
    db.commit()
    return None
