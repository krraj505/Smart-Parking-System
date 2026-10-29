import json
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.parking import ParkingLot, ParkingSlot, PricingRule
from app.models.reservation import Reservation
from app.models.session import ParkingSession
from app.models.payment import Payment
from app.models.notification import Notification
from app.models.audit import AuditLog, ParkingEvent

def seed_database(db_session: Session = None):
    db = db_session or SessionLocal()
    target_engine = db.get_bind() or engine
    Base.metadata.create_all(bind=target_engine)
    close_when_done = db_session is None

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("[Seed] Database already contains records. Skipping seed.")
            return

        print("[Seed] Seeding initial database records...")
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        # 1. Create Users
        admin = User(
            email="admin@smartparking.com",
            hashed_password=get_password_hash("Admin@12345"),
            full_name="Rajesh Sharma (Admin)",
            phone="+91 98765 43210",
            role="admin",
            is_active=True
        )
        operator = User(
            email="operator@smartparking.com",
            hashed_password=get_password_hash("Operator@12345"),
            full_name="Kiran Reddy (Gate Operator)",
            phone="+91 98765 43211",
            role="operator",
            is_active=True
        )
        customer1 = User(
            email="customer@smartparking.com",
            hashed_password=get_password_hash("Customer@12345"),
            full_name="Vikram Verma",
            phone="+91 98765 43212",
            role="customer",
            is_active=True
        )
        customer2 = User(
            email="priya@smartparking.com",
            hashed_password=get_password_hash("Customer@12345"),
            full_name="Priya Patel",
            phone="+91 98765 43213",
            role="customer",
            is_active=True
        )
        db.add_all([admin, operator, customer1, customer2])
        db.flush()

        # 2. Create Customer Vehicles
        v1 = Vehicle(
            user_id=customer1.id,
            registration_number="TS-09-EA-2024",
            vehicle_type="ev",
            make="Tesla",
            model="Model 3",
            color="Midnight Silver",
            dimensions="4.7m x 1.85m x 1.44m",
            is_ev=True,
            preferences="Requires fast EV charger (CCS2)"
        )
        v2 = Vehicle(
            user_id=customer1.id,
            registration_number="TS-07-JK-4412",
            vehicle_type="suv",
            make="Hyundai",
            model="Creta SX",
            color="Polar White",
            dimensions="4.3m x 1.79m x 1.63m",
            is_ev=False
        )
        v3 = Vehicle(
            user_id=customer2.id,
            registration_number="TS-08-MN-9811",
            vehicle_type="motorcycle",
            make="Royal Enfield",
            model="Classic 350",
            color="Stealth Black",
            is_ev=False
        )
        v4 = Vehicle(
            user_id=customer2.id,
            registration_number="TS-10-XY-3301",
            vehicle_type="car",
            make="Honda",
            model="City ZX",
            color="Platinum White",
            dimensions="4.55m x 1.75m x 1.49m",
            is_ev=False
        )
        db.add_all([v1, v2, v3, v4])
        db.flush()

        # 3. Create Parking Lots
        lot1 = ParkingLot(
            name="Cyber Gateway Multi-Level Smart Parking",
            code="CG-HYD-01",
            address="Plot 12, Mindspace Tech Park, HITEC City",
            city="Hyderabad",
            area="HITEC City",
            open_time="00:00",
            close_time="23:59",
            is_24_7=True,
            total_capacity=30,
            base_hourly_rate=50.0,
            contact_phone="+91 40 2345 6789",
            facilities=json.dumps(["EV Fast Charging", "CCTV Surveillance 24/7", "Multi-Level Covered", "Wheelchair Accessible", "Valet Assistance", "Touchless RFID Gate"])
        )
        lot2 = ParkingLot(
            name="Central Metro Grand Parking Plaza",
            code="CM-HYD-02",
            address="Road No. 2, Metro Station Exit 3, Banjara Hills",
            city="Hyderabad",
            area="Banjara Hills",
            open_time="05:30",
            close_time="23:30",
            is_24_7=False,
            total_capacity=24,
            base_hourly_rate=40.0,
            contact_phone="+91 40 2345 6790",
            facilities=json.dumps(["EV Charging", "Underground Covered", "Security Attendant", "Wheelchair Accessible", "CCTV 24/7"])
        )
        lot3 = ParkingLot(
            name="Airport Terminal 2 Express Lot",
            code="AP-HYD-03",
            address="Terminal 2 Departures Ramp, RGIA Airport",
            city="Hyderabad",
            area="Shamshabad",
            open_time="00:00",
            close_time="23:59",
            is_24_7=True,
            total_capacity=28,
            base_hourly_rate=100.0,
            contact_phone="+91 40 2345 6791",
            facilities=json.dumps(["Superfast 120kW EV Hub", "Valet Express Check-in", "Covered Canopy", "Luggage Assistance", "CCTV", "Wheelchair Accessible"])
        )
        lot4 = ParkingLot(
            name="Jubilee Square Commercial Complex",
            code="JS-HYD-04",
            address="Road No. 36, Opp. Peddamma Temple, Jubilee Hills",
            city="Hyderabad",
            area="Jubilee Hills",
            open_time="08:00",
            close_time="23:00",
            is_24_7=False,
            total_capacity=20,
            base_hourly_rate=35.0,
            contact_phone="+91 40 2345 6792",
            facilities=json.dumps(["CCTV Surveillance", "Covered Parking", "Security Guard", "EV Charging"])
        )
        db.add_all([lot1, lot2, lot3, lot4])
        db.flush()

        # 4. Create Pricing Rules
        rules = [
            PricingRule(lot_id=lot1.id, name="Peak Hour Standard", vehicle_type="all", base_hourly_rate=50.0, minimum_charge=30.0, billing_increment_minutes=15, daily_max_rate=400.0, peak_multiplier=1.25, peak_start_time="09:00", peak_end_time="18:00", cancellation_fee_percent=10.0),
            PricingRule(lot_id=lot2.id, name="Metro Commuter Rate", vehicle_type="all", base_hourly_rate=40.0, minimum_charge=25.0, billing_increment_minutes=15, daily_max_rate=300.0, peak_multiplier=1.2, peak_start_time="08:00", peak_end_time="11:00", cancellation_fee_percent=10.0),
            PricingRule(lot_id=lot3.id, name="Airport Premium Tier", vehicle_type="all", base_hourly_rate=100.0, minimum_charge=80.0, billing_increment_minutes=30, daily_max_rate=800.0, peak_multiplier=1.1, peak_start_time="06:00", peak_end_time="22:00", cancellation_fee_percent=15.0),
            PricingRule(lot_id=lot4.id, name="Shopping District Rate", vehicle_type="all", base_hourly_rate=35.0, minimum_charge=20.0, billing_increment_minutes=15, daily_max_rate=250.0, peak_multiplier=1.3, peak_start_time="17:00", peak_end_time="22:00", cancellation_fee_percent=10.0),
        ]
        db.add_all(rules)
        db.flush()

        # 5. Create Parking Slots for each lot
        lots = [lot1, lot2, lot3, lot4]
        created_slots = []
        for lot in lots:
            floors = ["Ground Floor", "Floor 1", "Floor 2"] if lot.total_capacity >= 24 else ["Ground Floor", "Floor 1"]
            slots_per_floor = lot.total_capacity // len(floors)
            
            categories = ["standard", "standard", "compact", "suv", "ev", "accessible", "motorcycle"]
            
            for f_idx, floor in enumerate(floors):
                prefix = chr(65 + f_idx)
                for s in range(1, slots_per_floor + 1):
                    cat = categories[(f_idx * 5 + s) % len(categories)]
                    has_ev = (cat == "ev" or (s % 6 == 0))
                    is_acc = (cat == "accessible" or (s == 1 and f_idx == 0))

                    # Diverse statuses for rich UI demonstration
                    # A few occupied, reserved, maintenance, disabled, and mostly available
                    status = "available"
                    if s == 3 and f_idx == 0:
                        status = "occupied"
                    elif s == 4 and f_idx == 0:
                        status = "reserved"
                    elif s == 7 and f_idx == 1:
                        status = "maintenance"
                    elif s == 8 and f_idx == 1:
                        status = "disabled"
                    elif s == 2 and f_idx == 1:
                        status = "occupied"

                    slot = ParkingSlot(
                        lot_id=lot.id,
                        slot_number=f"{prefix}-{s:02d}",
                        floor_level=floor,
                        slot_category=cat,
                        status=status,
                        has_ev_charger=has_ev,
                        is_accessible=is_acc,
                        max_vehicle_length=5.2 if cat in ["suv", "standard"] else 4.2,
                        max_vehicle_height=2.1 if cat in ["suv", "standard"] else 1.8,
                        is_active=True
                    )
                    db.add(slot)
                    created_slots.append(slot)
        db.flush()

        # 6. Create Seed Reservations
        # Confirmed upcoming reservation
        res1 = Reservation(
            booking_reference="PK-2610-88A102",
            user_id=customer1.id,
            lot_id=lot1.id,
            slot_id=created_slots[1].id,
            vehicle_id=v1.id,
            start_time=now + timedelta(hours=1),
            end_time=now + timedelta(hours=4),
            status="confirmed",
            estimated_amount=150.0
        )
        # Checked in reservation
        res2 = Reservation(
            booking_reference="PK-2610-77B204",
            user_id=customer1.id,
            lot_id=lot1.id,
            slot_id=created_slots[2].id,
            vehicle_id=v2.id,
            start_time=now - timedelta(hours=1),
            end_time=now + timedelta(hours=2),
            status="checked_in",
            estimated_amount=195.0
        )
        # Completed past reservation
        res3 = Reservation(
            booking_reference="PK-2610-66C301",
            user_id=customer2.id,
            lot_id=lot2.id,
            slot_id=created_slots[15].id,
            vehicle_id=v4.id,
            start_time=now - timedelta(days=1, hours=3),
            end_time=now - timedelta(days=1),
            status="completed",
            estimated_amount=120.0,
            final_amount=120.0
        )
        # Cancelled reservation
        res4 = Reservation(
            booking_reference="PK-2610-55D409",
            user_id=customer2.id,
            lot_id=lot3.id,
            slot_id=created_slots[22].id,
            vehicle_id=v3.id,
            start_time=now - timedelta(days=2),
            end_time=now - timedelta(days=2, hours=-2),
            status="cancelled",
            estimated_amount=100.0,
            cancellation_fee=15.0,
            cancellation_reason="Flight schedule rescheduled"
        )
        db.add_all([res1, res2, res3, res4])
        db.flush()

        # 7. Create Active Parking Session for res2
        sess1 = ParkingSession(
            reservation_id=res2.id,
            lot_id=lot1.id,
            slot_id=res2.slot_id,
            vehicle_registration=v2.registration_number,
            entry_time=now - timedelta(minutes=45),
            status="active",
            calculated_charge=0.0
        )
        # Completed session for res3
        sess2 = ParkingSession(
            reservation_id=res3.id,
            lot_id=lot2.id,
            slot_id=res3.slot_id,
            vehicle_registration=v4.registration_number,
            entry_time=now - timedelta(days=1, hours=3),
            exit_time=now - timedelta(days=1),
            duration_minutes=180,
            status="completed",
            calculated_charge=120.0
        )
        db.add_all([sess1, sess2])
        db.flush()

        # 8. Create Payments
        p1 = Payment(
            transaction_reference="TXN-261028-A99B1",
            reservation_id=res3.id,
            session_id=sess2.id,
            user_id=customer2.id,
            amount=120.0,
            currency="INR",
            status="successful",
            payment_method="simulated_upi",
            payment_gateway="SIMULATED_GATEWAY",
            paid_at=now - timedelta(days=1)
        )
        p2 = Payment(
            transaction_reference="TXN-261027-C88D2",
            reservation_id=res4.id,
            user_id=customer2.id,
            amount=15.0,
            currency="INR",
            status="successful",
            payment_method="simulated_card",
            payment_gateway="SIMULATED_GATEWAY",
            paid_at=now - timedelta(days=2)
        )
        p3 = Payment(
            transaction_reference="TXN-261029-E77F3",
            reservation_id=res1.id,
            user_id=customer1.id,
            amount=150.0,
            currency="INR",
            status="successful",
            payment_method="simulated_upi",
            payment_gateway="SIMULATED_GATEWAY",
            paid_at=now
        )
        db.add_all([p1, p2, p3])
        db.flush()

        # 9. Create Notifications
        n1 = Notification(
            user_id=customer1.id,
            title="Reservation Confirmed",
            message=f"Your booking {res1.booking_reference} at Cyber Gateway Smart Parking is confirmed. Slot {created_slots[1].slot_number} reserved.",
            notification_type="reservation",
            link=f"/reservations/{res1.id}",
            created_at=now - timedelta(hours=1)
        )
        n2 = Notification(
            user_id=customer1.id,
            title="Gate Entry Verified",
            message=f"Vehicle TS-07-JK-4412 checked in at Cyber Gateway. Enjoy your stay!",
            notification_type="check_in",
            link=f"/reservations/{res2.id}",
            created_at=now - timedelta(minutes=45)
        )
        n3 = Notification(
            user_id=customer2.id,
            title="Payment Receipt",
            message=f"Payment of ₹120.00 received for booking {res3.booking_reference}.",
            notification_type="payment",
            link="/payments",
            created_at=now - timedelta(days=1)
        )
        db.add_all([n1, n2, n3])

        # 10. Audit Logs
        audits = [
            AuditLog(user_id=admin.id, action="CREATE_PARKING_LOT", entity_type="ParkingLot", entity_id=str(lot1.id), details="Created Cyber Gateway Smart Parking with 30 slots.", created_at=now - timedelta(days=3)),
            AuditLog(user_id=customer1.id, action="CREATE_RESERVATION", entity_type="Reservation", entity_id=str(res1.id), details=f"Created reservation {res1.booking_reference} for EV TS-09-EA-2024.", created_at=now - timedelta(hours=1)),
            AuditLog(user_id=operator.id, action="CHECK_IN", entity_type="ParkingSession", entity_id=str(sess1.id), details=f"Operator checked in TS-07-JK-4412 at Cyber Gateway.", created_at=now - timedelta(minutes=45)),
        ]
        db.add_all(audits)

        db.commit()
        print("[Seed] Seed data successfully committed.")
    except Exception as e:
        db.rollback()
        print(f"[Seed] Error seeding data: {e}")
        raise
    finally:
        if close_when_done:
            db.close()

if __name__ == "__main__":
    seed_database()
