from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Defect, User
from ..services.priority_engine import calculate_defect_priority_score
from ..services.train_impact import calculate_train_impact


router = APIRouter(
    prefix="/api/defects",
    tags=["defects"]
)


class DefectCreate(BaseModel):

    asset_id: str = Field(
        min_length=1,
        max_length=50
    )

    asset_type: str = Field(
        min_length=1,
        max_length=50
    )

    section_from: str = Field(
        min_length=1,
        max_length=20
    )

    section_to: str = Field(
        min_length=1,
        max_length=20
    )

    description: str = Field(
        min_length=1
    )

    source_system: str = Field(
        min_length=1,
        max_length=20
    )

    severity: str = Field(
        min_length=1,
        max_length=20
    )

    criticality: str = Field(
        default="Medium",
        max_length=20
    )

    due_date: datetime | None = None


class DefectResponse(BaseModel):

    id: int

    asset_id: str
    asset_type: str

    section_from: str
    section_to: str

    description: str

    source_system: str

    severity: str
    criticality: str

    reported_at: datetime
    due_date: datetime | None

    status: str

    class Config:
        from_attributes = True


@router.post(
    "",
    response_model=DefectResponse,
    status_code=status.HTTP_201_CREATED
)
def create_defect(
    payload: DefectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    defect = Defect(

        asset_id=payload.asset_id,

        asset_type=payload.asset_type,

        section_from=payload.section_from,

        section_to=payload.section_to,

        description=payload.description,

        source_system=payload.source_system,

        severity=payload.severity,

        criticality=payload.criticality,

        due_date=payload.due_date,

        status="Open"
    )

    db.add(defect)

    db.commit()

    db.refresh(defect)

    return defect


@router.get(
    "",
    response_model=list[DefectResponse]
)
def get_defects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return (
        db.query(Defect)
        .order_by(Defect.id)
        .all()
    )


@router.get("/priorities")
def get_defect_priorities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    defects = (
        db.query(Defect)
        .filter(Defect.status == "Open")
        .all()
    )

    prioritized_defects = []

    now = datetime.utcnow()

    for defect in defects:

        # -----------------------------------------
        # Calculate overdue days
        # -----------------------------------------

        overdue_days = 0

        if defect.due_date is not None:

            if now > defect.due_date:

                overdue_seconds = (
                    now - defect.due_date
                ).total_seconds()

                overdue_days = int(
                    overdue_seconds / 86400
                )

        # -----------------------------------------
        # Calculate train impact
        # -----------------------------------------

        train_impact = calculate_train_impact(
            db,
            defect.section_from,
            defect.section_to
        )

        # -----------------------------------------
        # Calculate priority
        # -----------------------------------------

        priority_score = calculate_defect_priority_score(
            criticality=defect.criticality,
            severity=defect.severity,
            train_impact=train_impact,
            overdue_days=overdue_days,
        )

        prioritized_defects.append({

            "defect_id": defect.id,

            "asset_id": defect.asset_id,

            "asset_type": defect.asset_type,

            "section": (
                f"{defect.section_from}-"
                f"{defect.section_to}"
            ),

            "source_system": defect.source_system,

            "severity": defect.severity,

            "criticality": defect.criticality,

            "due_date": (
                defect.due_date.isoformat()
                if defect.due_date
                else None
            ),

            "overdue_days": overdue_days,

            "train_impact": train_impact,

            "priority_score": priority_score,

        })

    # Highest priority first

    prioritized_defects.sort(
        key=lambda x: x["priority_score"],
        reverse=True
    )

    return prioritized_defects

@router.get(
    "/{defect_id}",
    response_model=DefectResponse
)
def get_defect(
    defect_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    defect = (
        db.query(Defect)
        .filter(Defect.id == defect_id)
        .first()
    )

    if not defect:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Defect not found"
        )

    return defect