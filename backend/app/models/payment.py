from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    transaction_reference = Column(String(100), unique=True, index=True, nullable=False)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=True, index=True)
    session_id = Column(Integer, ForeignKey("parking_sessions.id"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    
    # pending, successful, failed, refunded
    status = Column(String(50), nullable=False, default="successful", index=True)
    
    payment_method = Column(String(50), nullable=False, default="simulated_upi")  # simulated_upi, simulated_card, simulated_netbanking
    payment_gateway = Column(String(50), default="SIMULATED_GATEWAY")
    gateway_payload = Column(Text, nullable=True)
    
    paid_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="payments")
    reservation = relationship("Reservation", back_populates="payments")
    session = relationship("ParkingSession", back_populates="payments")
