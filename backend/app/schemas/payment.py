from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class PaymentSimulateRequest(BaseModel):
    reservation_id: Optional[int] = None
    session_id: Optional[int] = None
    amount: float
    payment_method: str = "simulated_upi"  # simulated_upi, simulated_card, simulated_netbanking
    currency: str = "INR"

class PaymentResponse(BaseModel):
    id: int
    transaction_reference: str
    reservation_id: Optional[int] = None
    session_id: Optional[int] = None
    user_id: int
    amount: float
    currency: str
    status: str
    payment_method: str
    payment_gateway: str
    paid_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
