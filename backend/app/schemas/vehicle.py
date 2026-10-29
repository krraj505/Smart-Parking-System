from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class VehicleBase(BaseModel):
    registration_number: str
    vehicle_type: str = "car"  # car, motorcycle, suv, van, ev
    make: str
    model: str
    color: str
    dimensions: Optional[str] = None
    is_ev: bool = False
    preferences: Optional[str] = None

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    registration_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    color: Optional[str] = None
    dimensions: Optional[str] = None
    is_ev: Optional[bool] = None
    preferences: Optional[str] = None

class VehicleResponse(VehicleBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
