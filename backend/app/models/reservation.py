from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_reference = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lot_id = Column(Integer, ForeignKey("parking_lots.id"), nullable=False, index=True)
    slot_id = Column(Integer, ForeignKey("parking_slots.id"), nullable=False, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False, index=True)
    
    # pending, confirmed, checked_in, completed, cancelled, no_show
    status = Column(String(50), nullable=False, default="confirmed", index=True)
    
    estimated_amount = Column(Float, nullable=False, default=0.0)
    final_amount = Column(Float, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    cancellation_fee = Column(Float, nullable=True, default=0.0)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="reservations")
    lot = relationship("ParkingLot", back_populates="reservations")
    slot = relationship("ParkingSlot", back_populates="reservations")
    vehicle = relationship("Vehicle", back_populates="reservations")
    payments = relationship("Payment", back_populates="reservation")
    session = relationship("ParkingSession", back_populates="reservation", uselist=False)
