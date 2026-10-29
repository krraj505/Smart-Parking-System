from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ParkingEventResponse(BaseModel):
    id: int
    lot_id: int
    slot_id: Optional[int] = None
    event_type: str
    is_simulated: bool
    payload: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
