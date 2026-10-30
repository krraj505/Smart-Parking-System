from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.analytics import DashboardAnalyticsResponse
from app.services.analytics_service import AnalyticsService
from app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics & Reports"])

@router.get("/dashboard", response_model=DashboardAnalyticsResponse)
def get_dashboard_analytics(
    lot_id: Optional[int] = None,
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    day_count = days if isinstance(days, int) else 7
    return AnalyticsService.get_dashboard_metrics(db=db, lot_id=lot_id, days=day_count)

@router.get("/export-csv")
def export_analytics_csv(
    report_type: str = Query("reservations", pattern="^(reservations|sessions|revenue|facilities)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rep_type = report_type if isinstance(report_type, str) and not hasattr(report_type, "default") else "reservations"
    csv_content = AnalyticsService.generate_csv_report(db=db, report_type=rep_type)
    filename = f"smart_parking_{rep_type}_report.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
