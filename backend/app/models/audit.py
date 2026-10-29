from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)  # LOGIN, CREATE_RESERVATION, CANCEL_RESERVATION, CHECK_IN, CHECK_OUT, UPDATE_SLOT, etc.
    entity_type = Column(String(50), nullable=True)  # Reservation, ParkingSlot, ParkingLot, Payment, User
    entity_id = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", back_populates="audit_logs")


class ParkingEvent(Base):
    __tablename__ = "parking_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    lot_id = Column(Integer, ForeignKey("parking_lots.id", ondelete="CASCADE"), nullable=False, index=True)
    slot_id = Column(Integer, ForeignKey("parking_slots.id", ondelete="CASCADE"), nullable=True, index=True)
    event_type = Column(String(50), nullable=False)  # slot_state_changed, gate_entry, gate_exit, barrier_opened, sensor_detected
    is_simulated = Column(Boolean, default=True)
    payload = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    lot = relationship("ParkingLot", back_populates="events")
    slot = relationship("ParkingSlot", back_populates="events")
