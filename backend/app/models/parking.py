from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class ParkingLot(Base):
    __tablename__ = "parking_lots"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(200), nullable=False, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False, default="Hyderabad")
    area = Column(String(100), nullable=False)
    open_time = Column(String(20), nullable=False, default="00:00")  # "HH:MM"
    close_time = Column(String(20), nullable=False, default="23:59")
    is_24_7 = Column(Boolean, default=True)
    total_capacity = Column(Integer, nullable=False, default=50)
    base_hourly_rate = Column(Float, nullable=False, default=50.0)
    contact_phone = Column(String(50), nullable=True)
    facilities = Column(Text, nullable=True)  # JSON string array: ["EV Charging", "CCTV Surveillance", "Covered Parking", "Wheelchair Accessible", "Valet Assistance"]
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    slots = relationship("ParkingSlot", back_populates="lot", cascade="all, delete-orphan")
    pricing_rules = relationship("PricingRule", back_populates="lot", cascade="all, delete-orphan")
    reservations = relationship("Reservation", back_populates="lot")
    sessions = relationship("ParkingSession", back_populates="lot")
    events = relationship("ParkingEvent", back_populates="lot")


class ParkingSlot(Base):
    __tablename__ = "parking_slots"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    lot_id = Column(Integer, ForeignKey("parking_lots.id", ondelete="CASCADE"), nullable=False, index=True)
    slot_number = Column(String(50), nullable=False, index=True)  # e.g., "A-101", "B-204"
    floor_level = Column(String(50), nullable=False, default="Ground Floor")
    slot_category = Column(String(50), nullable=False, default="standard")  # standard, compact, suv, motorcycle, accessible, ev
    status = Column(String(50), nullable=False, default="available")  # available, occupied, reserved, maintenance, disabled
    has_ev_charger = Column(Boolean, default=False)
    is_accessible = Column(Boolean, default=False)
    max_vehicle_length = Column(Float, nullable=True)  # in meters
    max_vehicle_height = Column(Float, nullable=True)  # in meters
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    lot = relationship("ParkingLot", back_populates="slots")
    reservations = relationship("Reservation", back_populates="slot")
    sessions = relationship("ParkingSession", back_populates="slot")
    events = relationship("ParkingEvent", back_populates="slot")


class PricingRule(Base):
    __tablename__ = "pricing_rules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    lot_id = Column(Integer, ForeignKey("parking_lots.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    vehicle_type = Column(String(50), nullable=False, default="all")  # all, car, motorcycle, suv, van, ev
    base_hourly_rate = Column(Float, nullable=False, default=50.0)
    minimum_charge = Column(Float, nullable=False, default=30.0)
    billing_increment_minutes = Column(Integer, nullable=False, default=15)
    daily_max_rate = Column(Float, nullable=False, default=400.0)
    peak_multiplier = Column(Float, nullable=False, default=1.25)
    peak_start_time = Column(String(10), nullable=True, default="09:00")
    peak_end_time = Column(String(10), nullable=True, default="18:00")
    cancellation_fee_percent = Column(Float, nullable=False, default=10.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    lot = relationship("ParkingLot", back_populates="pricing_rules")
