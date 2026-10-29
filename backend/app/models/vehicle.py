from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    registration_number = Column(String(50), nullable=False, index=True)
    vehicle_type = Column(String(50), nullable=False, default="car")  # car, motorcycle, suv, van, ev
    make = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    color = Column(String(50), nullable=False)
    dimensions = Column(String(100), nullable=True)  # e.g. "4.5m x 1.8m x 1.5m"
    is_ev = Column(Boolean, default=False)
    preferences = Column(Text, nullable=True)  # JSON or comma-separated preferences
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="vehicles")
    reservations = relationship("Reservation", back_populates="vehicle")
