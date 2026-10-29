from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class ParkingSlotBase(BaseModel):
    slot_number: str
    floor_level: str = "Ground Floor"
    slot_category: str = "standard"  # standard, compact, suv, motorcycle, accessible, ev
    status: str = "available"  # available, occupied, reserved, maintenance, disabled
    has_ev_charger: bool = False
    is_accessible: bool = False
    max_vehicle_length: Optional[float] = None
    max_vehicle_height: Optional[float] = None
    is_active: bool = True

class ParkingSlotCreate(ParkingSlotBase):
    lot_id: int

class ParkingSlotUpdate(BaseModel):
    status: Optional[str] = None
    slot_category: Optional[str] = None
    floor_level: Optional[str] = None
    has_ev_charger: Optional[bool] = None
    is_accessible: Optional[bool] = None
    is_active: Optional[bool] = None

class ParkingSlotResponse(ParkingSlotBase):
    id: int
    lot_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PricingRuleBase(BaseModel):
    name: str
    vehicle_type: str = "all"
    base_hourly_rate: float = 50.0
    minimum_charge: float = 30.0
    billing_increment_minutes: int = 15
    daily_max_rate: float = 400.0
    peak_multiplier: float = 1.25
    peak_start_time: Optional[str] = "09:00"
    peak_end_time: Optional[str] = "18:00"
    cancellation_fee_percent: float = 10.0

class PricingRuleCreate(PricingRuleBase):
    lot_id: int

class PricingRuleResponse(PricingRuleBase):
    id: int
    lot_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ParkingLotBase(BaseModel):
    name: str
    code: str
    address: str
    city: str = "Hyderabad"
    area: str
    open_time: str = "00:00"
    close_time: str = "23:59"
    is_24_7: bool = True
    total_capacity: int = 50
    base_hourly_rate: float = 50.0
    contact_phone: Optional[str] = None
    facilities: Optional[str] = None  # JSON or comma-separated
    is_active: bool = True

class ParkingLotCreate(ParkingLotBase):
    pass

class ParkingLotUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    open_time: Optional[str] = None
    close_time: Optional[str] = None
    is_24_7: Optional[bool] = None
    total_capacity: Optional[int] = None
    base_hourly_rate: Optional[float] = None
    contact_phone: Optional[str] = None
    facilities: Optional[str] = None
    is_active: Optional[bool] = None

class ParkingLotResponse(ParkingLotBase):
    id: int
    available_slots: Optional[int] = None
    occupied_slots: Optional[int] = None
    reserved_slots: Optional[int] = None
    maintenance_slots: Optional[int] = None
    disabled_slots: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ParkingLotDetailResponse(ParkingLotResponse):
    slots: List[ParkingSlotResponse] = []
    pricing_rules: List[PricingRuleResponse] = []
