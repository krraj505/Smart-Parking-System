from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.session import ParkingSession
from app.models.user import User
from app.schemas.session import (
    SessionCheckInRequest,
    SessionCheckOutRequest,
    SessionResponse
)
from app.services.session_service import SessionService
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/sessions", tags=["Entry & Exit Sessions"])

@router.get("", response_model=List[SessionResponse])
def list_sessions(
    status_filter: Optional[str] = None,
    lot_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(ParkingSession)
    if current_user.role == "customer":
        # Customer can only view sessions associated with their reservations
        from app.models.reservation import Reservation
        q = q.join(ParkingSession.reservation).filter(Reservation.user_id == current_user.id)
    
    if status_filter and status_filter.lower() != "all":
        q = q.filter(ParkingSession.status == status_filter.lower())
    if lot_id:
        q = q.filter(ParkingSession.lot_id == lot_id)

    return q.order_by(ParkingSession.entry_time.desc()).all()

@router.get("/active", response_model=List[SessionResponse])
def list_active_sessions(
    lot_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["operator", "admin"]))
):
    q = db.query(ParkingSession).filter(ParkingSession.status == "active")
    if lot_id:
        q = q.filter(ParkingSession.lot_id == lot_id)
    return q.order_by(ParkingSession.entry_time.desc()).all()

@router.post("/check-in", response_model=SessionResponse)
def check_in_vehicle(
    req: SessionCheckInRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["operator", "admin"]))
):
    session = SessionService.check_in(
        db=db,
        booking_reference=req.booking_reference,
        vehicle_registration=req.vehicle_registration,
        operator_user_id=current_user.id,
        notes=req.notes
    )
    return session

@router.post("/check-out", response_model=SessionResponse)
def check_out_vehicle(
    req: SessionCheckOutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["operator", "admin"]))
):
    session = SessionService.check_out(
        db=db,
        session_id=req.session_id,
        booking_reference=req.booking_reference,
        vehicle_registration=req.vehicle_registration,
        operator_user_id=current_user.id,
        payment_method=req.payment_method or "simulated_upi"
    )
    return session

@router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(ParkingSession).filter(ParkingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")
    return session
