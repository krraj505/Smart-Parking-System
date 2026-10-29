import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.payment import Payment
from app.models.reservation import Reservation
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.payment import PaymentResponse, PaymentSimulateRequest
from app.api.deps import get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.get("", response_model=List[PaymentResponse])
def list_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Payment)
    if current_user.role == "customer":
        q = q.filter(Payment.user_id == current_user.id)
    return q.order_by(Payment.paid_at.desc()).all()

@router.post("/simulate", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def simulate_payment(
    req: PaymentSimulateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Simulated payment processing for local development and demonstration.
    """
    if req.amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment amount must be greater than zero.")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    txn_ref = f"SIM-TXN-{now.strftime('%y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

    payment = Payment(
        transaction_reference=txn_ref,
        reservation_id=req.reservation_id,
        session_id=req.session_id,
        user_id=current_user.id,
        amount=round(req.amount, 2),
        currency=req.currency or "INR",
        status="successful",
        payment_method=req.payment_method,
        payment_gateway="SIMULATED_GATEWAY",
        gateway_payload=f"Simulated transaction authorized via {req.payment_method.replace('_', ' ').upper()}.",
        paid_at=now
    )
    db.add(payment)

    # If linked to reservation, update reservation status or payment record
    if req.reservation_id:
        res = db.query(Reservation).filter(Reservation.id == req.reservation_id).first()
        if res and res.status == "pending":
            res.status = "confirmed"

    audit = AuditLog(
        user_id=current_user.id,
        action="SIMULATE_PAYMENT",
        entity_type="Payment",
        entity_id=txn_ref,
        details=f"Simulated payment of ₹{req.amount} processed successfully via {req.payment_method}."
    )
    db.add(audit)

    db.commit()
    db.refresh(payment)
    return payment
