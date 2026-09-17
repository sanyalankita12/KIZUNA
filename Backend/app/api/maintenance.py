from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import MaintenanceTask, User

from ..services.priority_engine import (
    calculate_priority_details,
)

from ..services.train_impact import (
    calculate_train_impact,
    get_affected_trains,
)

from ..services.ml_risk import predict_ml_risk


router = APIRouter(
    prefix="/api/maintenance",
    tags=["maintenance"],
)


# ============================================================
# REQUEST MODEL
# ============================================================

class MaintenanceTaskCreate(BaseModel):
    title: str = Field(
        min_length=3,
        max_length=200,
    )

    description: str | None = None

    section_from: str = Field(
        min_length=1,
        max_length=20,
    )

    section_to: str = Field(
        min_length=1,
        max_length=20,
    )

    department: str = Field(
        min_length=1,
        max_length=50,
    )

    criticality: str = Field(
        default="Medium",
        max_length=20,
    )

    severity: str = Field(
        min_length=1,
        max_length=20,
    )

    urgency: str = Field(
        min_length=1,
        max_length=20,
    )

    duration_minutes: int = Field(
        gt=0,
    )


# ============================================================
# RESPONSE MODEL
# ============================================================

class MaintenanceTaskResponse(BaseModel):
    id: int

    title: str
    description: str | None

    section_from: str
    section_to: str

    department: str

    criticality: str
    severity: str
    urgency: str

    duration_minutes: int

    status: str
    created_at: datetime
    planned_date: date | None

    class Config:
        from_attributes = True


# ============================================================
# CREATE MAINTENANCE TASK
# ============================================================

@router.post(
    "",
    response_model=MaintenanceTaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_maintenance_task(
    payload: MaintenanceTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = MaintenanceTask(
        title=payload.title,
        description=payload.description,

        section_from=payload.section_from,
        section_to=payload.section_to,

        department=payload.department,

        criticality=payload.criticality,
        severity=payload.severity,
        urgency=payload.urgency,

        duration_minutes=payload.duration_minutes,

        status="Pending",
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


# ============================================================
# GET ALL MAINTENANCE TASKS
# ============================================================

@router.get(
    "",
    response_model=list[MaintenanceTaskResponse],
)
def get_maintenance_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(MaintenanceTask)
        .order_by(MaintenanceTask.id)
        .all()
    )


# ============================================================
# PRIORITY + ML RISK INTELLIGENCE
# ============================================================

@router.get("/priorities")
def get_prioritized_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns pending maintenance tasks with:

    1. Train impact
    2. Overdue risk
    3. Explainable priority score
    4. ML-based maintenance pattern risk

    ML risk is an anomaly/pattern signal.
    It is NOT a calibrated failure probability.
    """

    tasks = (
        db.query(MaintenanceTask)
        .filter(
            MaintenanceTask.status == "Pending"
        )
        .all()
    )

    prioritized_tasks = []

    for task in tasks:

        # ====================================================
        # 1. TRAIN IMPACT
        # ====================================================

        train_impact = calculate_train_impact(
            db,
            task.section_from,
            task.section_to,
        )

        # ====================================================
        # 2. OVERDUE DAYS
        # ====================================================

        overdue_days = 0

        if task.planned_date:
            today = date.today()

            if task.planned_date < today:
                overdue_days = (
                    today - task.planned_date
                ).days

        # ====================================================
        # 3. EXISTING EXPLAINABLE PRIORITY ENGINE
        # ====================================================

        priority_details = calculate_priority_details(
            criticality=task.criticality,
            severity=task.severity,
            urgency=task.urgency,
            train_impact=train_impact,
            overdue_days=overdue_days,
            duration_minutes=task.duration_minutes,
        )

        priority_score = priority_details[
            "priority_score"
        ]

        priority_level = priority_details[
            "priority_level"
        ]

        factors = priority_details[
            "factors"
        ]

        # ====================================================
        # 4. ML RISK INTELLIGENCE
        # ====================================================

        try:
            ml_risk = predict_ml_risk(
                task=task,
                reference_tasks=tasks,
                train_impact=train_impact,
                overdue_days=overdue_days,
            )

        except Exception as exc:
            # ------------------------------------------------
            # ML must never break the existing priority API.
            # The explainable priority engine remains active.
            # ------------------------------------------------

            print(
                f"[ML Risk] Task {task.id} analysis failed: {exc}"
            )

            ml_risk = {
                "risk_level": "Unavailable",
                "risk_score": 0,
                "confidence": 0,
                "anomaly": False,
                "model": "IsolationForest",
                "message": (
                    "Pattern-based ML risk analysis is "
                    "currently unavailable. Existing "
                    "priority intelligence remains active."
                ),
            }

        # ====================================================
        # 5. FINAL RESPONSE
        # ====================================================

        prioritized_tasks.append({

            # ------------------------------------------------
            # TASK
            # ------------------------------------------------

            "task_id": task.id,

            "title": task.title,

            "section_from": task.section_from,
            "section_to": task.section_to,

            "department": task.department,

            "criticality": task.criticality,
            "severity": task.severity,
            "urgency": task.urgency,

            "duration_minutes": (
                task.duration_minutes
            ),

            # ------------------------------------------------
            # OPERATIONAL INTELLIGENCE
            # ------------------------------------------------

            "train_impact": train_impact,

            "overdue_days": overdue_days,

            # ------------------------------------------------
            # EXPLAINABLE PRIORITY
            # ------------------------------------------------

            "priority_score": priority_score,

            "priority_level": priority_level,

            "priority_factors": factors,

            # ------------------------------------------------
            # ML RISK INTELLIGENCE
            # ------------------------------------------------

            "ml_risk_score": ml_risk.get(
                "risk_score",
                0,
            ),

            "ml_risk_level": ml_risk.get(
                "risk_level",
                "Unavailable",
            ),

            "ml_confidence": ml_risk.get(
                "confidence",
                0,
            ),

            "ml_anomaly": ml_risk.get(
                "anomaly",
                False,
            ),

            # Kept in API for technical traceability.
            # Frontend does not need to display this.
            "ml_model": ml_risk.get(
                "model",
                "IsolationForest",
            ),

            "ml_message": ml_risk.get(
                "message",
                "Pattern-based ML risk signal generated.",
            ),
        })

    # ========================================================
    # SORT BY EXISTING PRIORITY SCORE
    # ========================================================

    prioritized_tasks.sort(
        key=lambda x: x["priority_score"],
        reverse=True,
    )

    return prioritized_tasks


# ============================================================
# TASK CONFLICTS
# ============================================================

@router.get("/{task_id}/conflicts")
def get_task_conflicts(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(MaintenanceTask)
        .filter(
            MaintenanceTask.id == task_id
        )
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance task not found",
        )

    affected_trains = get_affected_trains(
        db,
        task.section_from,
        task.section_to,
    )

    return {
        "task_id": task.id,

        "title": task.title,

        "section": (
            f"{task.section_from}-{task.section_to}"
        ),

        "affected_trains": affected_trains,

        "total_affected_trains": (
            len(affected_trains)
        ),
    }


# ============================================================
# GET SINGLE MAINTENANCE TASK
# ============================================================

@router.get(
    "/{task_id}",
    response_model=MaintenanceTaskResponse,
)
def get_maintenance_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(MaintenanceTask)
        .filter(
            MaintenanceTask.id == task_id
        )
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance task not found",
        )

    return task


# ============================================================
# UPDATE MAINTENANCE TASK
# ============================================================

@router.patch(
    "/{task_id}",
    response_model=MaintenanceTaskResponse,
)
def update_maintenance_task(
    task_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(MaintenanceTask)
        .filter(
            MaintenanceTask.id == task_id
        )
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance task not found",
        )

    if "status" in payload:

        allowed_statuses = {
            "Pending",
            "In Progress",
            "Completed",
        }

        if payload["status"] not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status",
            )

        task.status = payload["status"]

    db.commit()
    db.refresh(task)

    return task


# ============================================================
# DELETE MAINTENANCE TASK
# ============================================================

@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_maintenance_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(MaintenanceTask)
        .filter(
            MaintenanceTask.id == task_id
        )
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance task not found",
        )

    db.delete(task)
    db.commit()

    return None