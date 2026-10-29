import math
from datetime import datetime, time
from typing import Tuple, Optional
from app.models.parking import PricingRule, ParkingLot

class PricingEngine:
    @staticmethod
    def is_peak_hour(dt: datetime, peak_start: str = "09:00", peak_end: str = "18:00") -> bool:
        if not peak_start or not peak_end:
            return False
        try:
            start_parts = [int(p) for p in peak_start.split(":")]
            end_parts = [int(p) for p in peak_end.split(":")]
            start_t = time(start_parts[0], start_parts[1])
            end_t = time(end_parts[0], end_parts[1])
            cur_t = dt.time()
            return start_t <= cur_t <= end_t
        except Exception:
            return False

    @classmethod
    def calculate_price(
        cls,
        start_time: datetime,
        end_time: datetime,
        lot: ParkingLot,
        vehicle_type: str = "car",
        rule: Optional[PricingRule] = None
    ) -> Tuple[float, float, float]:
        """
        Returns (total_price, base_amount, peak_surcharge)
        """
        duration_seconds = max((end_time - start_time).total_seconds(), 0)
        duration_hours = duration_seconds / 3600.0

        base_rate = lot.base_hourly_rate
        min_charge = 30.0
        daily_max = 400.0
        peak_multiplier = 1.2
        peak_start = "09:00"
        peak_end = "18:00"

        if rule:
            base_rate = rule.base_hourly_rate
            min_charge = rule.minimum_charge
            daily_max = rule.daily_max_rate
            peak_multiplier = rule.peak_multiplier
            peak_start = rule.peak_start_time or "09:00"
            peak_end = rule.peak_end_time or "18:00"

        # Apply vehicle type modifiers if no explicit rule
        if not rule:
            if vehicle_type == "motorcycle":
                base_rate *= 0.5
                min_charge *= 0.5
            elif vehicle_type in ["suv", "van"]:
                base_rate *= 1.3
                min_charge *= 1.2
            elif vehicle_type == "ev":
                base_rate *= 1.15  # Includes EV charging accessibility

        # Bill in 15-minute intervals, rounded up
        billable_hours = math.ceil(max(duration_hours, 0.25) * 4) / 4.0

        base_amount = billable_hours * base_rate
        peak_surcharge = 0.0

        # Check if parking overlaps peak hours
        if cls.is_peak_hour(start_time, peak_start, peak_end) or cls.is_peak_hour(end_time, peak_start, peak_end):
            peak_surcharge = base_amount * (peak_multiplier - 1.0)

        subtotal = base_amount + peak_surcharge
        
        # Enforce minimum charge
        total_amount = max(subtotal, min_charge)

        # Enforce daily maximum (prorated per 24 hours)
        days = math.ceil(duration_hours / 24.0) or 1
        max_allowed = daily_max * days
        total_amount = min(total_amount, max_allowed)

        return round(total_amount, 2), round(base_amount, 2), round(peak_surcharge, 2)

    @classmethod
    def calculate_cancellation_fee(
        cls,
        start_time: datetime,
        now_time: datetime,
        estimated_amount: float,
        cancellation_fee_percent: float = 10.0
    ) -> float:
        """
        Free cancellation if > 2 hours prior to start.
        Configured percentage if <= 2 hours.
        50% if cancelled after start time.
        """
        hours_before = (start_time - now_time).total_seconds() / 3600.0
        if hours_before >= 2.0:
            return 0.0
        elif hours_before > 0:
            fee = estimated_amount * (cancellation_fee_percent / 100.0)
            return round(fee, 2)
        else:
            return round(estimated_amount * 0.50, 2)
