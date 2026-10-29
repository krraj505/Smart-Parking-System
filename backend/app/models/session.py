from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class ParkingSession(Base):
    __tablename__ = "parking_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=True, index=True)
    lot_id = Column(Integer, ForeignKey("parking_lots.id"), nullable=False, index=True)
    slot_id = Column(Integer, ForeignKey("parking_slots.id"), nullable=False, index=True)
    vehicle_registration = Column(String(50), nullable=False, index=True)
    
    entry_time = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    exit_time = Column(DateTime, nullable=True)
    
    # active, completed
    status = Column(String(50), nullable=False, default="active", index=True)
    
    duration_minutes = Column(Integer, nullable=True)
    calculated_charge = Column(Float, nullable=False, default=0.0)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    reservation = relationship("Reservation", back_populates="session")
    lot = relationship("ParkingLot", back_populates="sessions")
    slot = relationship("ParkingSlot", back_populates="sessions")
    payments = relationship("Payment", back_populates="session")
