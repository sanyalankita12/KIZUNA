from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import MaintenanceTask, User
from ..services.priority_engine import calculate_priority_details
from ..services.train_impact import calculate_train_impact


router = APIRouter(
    prefix="/api/scenario",
    tags=["scenario"]
)


class ScenarioRequest(BaseModel):
    task_id: int

    train_traffic_multiplier: float = Field(
        default=1.0,
        ge=0.5,
        le=2.0
    )

    additional_overdue_days: int = Field(
        default=0,
        ge=0,
        le=30
    )

    available_windows: int = Field(
        default=3,
        ge=0,
        le=10
    )


@router.post("/simulate")
def simulate_scenario(
    payload: ScenarioRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(MaintenanceTask)
        .filter(MaintenanceTask.id == payload.task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Maintenance task not found"
        )

    # ---------------------------------------------------------
    # CURRENT REAL CONDITIONS
    # ---------------------------------------------------------

    current_train_impact = calculate_train_impact(
        db,
        task.section_from,
        task.section_to,
    )

    current_priority = calculate_priority_details(
        criticality=task.criticality,
        severity=task.severity,
        urgency=task.urgency,
        train_impact=current_train_impact,
        overdue_days=0,
        available_windows=3,
        duration_minutes=task.duration_minutes,
    )

    # ---------------------------------------------------------
    # SIMULATED CONDITIONS
    # ---------------------------------------------------------

    simulated_train_impact = round(
        current_train_impact
        * payload.train_traffic_multiplier
    )

    simulated_priority = calculate_priority_details(
        criticality=task.criticality,
        severity=task.severity,
        urgency=task.urgency,
        train_impact=simulated_train_impact,
        overdue_days=payload.additional_overdue_days,
        available_windows=payload.available_windows,
        duration_minutes=task.duration_minutes,
    )

    current_score = current_priority["priority_score"]
    simulated_score = simulated_priority["priority_score"]

    score_change = simulated_score - current_score

    # ---------------------------------------------------------
    # EXPLANATION
    # ---------------------------------------------------------

    reasons = []

    if payload.train_traffic_multiplier > 1:
        reasons.append(
            "Higher train traffic increases operational impact."
        )

    if payload.additional_overdue_days > 0:
        reasons.append(
            "Additional overdue days increase maintenance risk."
        )

    if payload.available_windows < 3:
        reasons.append(
            "Fewer available windows increase scheduling scarcity."
        )

    if not reasons:
        reasons.append(
            "No major operational condition was changed."
        )

    # ---------------------------------------------------------
    # FRONTEND-COMPATIBLE RESULT
    # ---------------------------------------------------------

    return {
        "task_id": task.id,
        "title": task.title,
        "section": f"{task.section_from}-{task.section_to}",

        # -----------------------------------------------------
        # FLAT VALUES
        # Frontend reads these values directly.
        # -----------------------------------------------------

        "current_priority": current_score,
        "current_score": current_score,
        "baseline_priority": current_score,

        "simulated_priority": simulated_score,
        "simulated_score": simulated_score,
        "scenario_priority": simulated_score,

        "priority_change": score_change,
        "change": score_change,

        # -----------------------------------------------------
        # PRIORITY LEVELS
        # -----------------------------------------------------

        "current_priority_level": current_priority["priority_level"],
        "simulated_priority_level": simulated_priority["priority_level"],

        # -----------------------------------------------------
        # TRAIN IMPACT
        # -----------------------------------------------------

        "current_train_impact": current_train_impact,
        "simulated_train_impact": simulated_train_impact,

        # -----------------------------------------------------
        # ORIGINAL STRUCTURED RESPONSE
        # Preserved for future use / compatibility.
        # -----------------------------------------------------

        "baseline": {
            "priority_score": current_score,
            "priority_level": current_priority["priority_level"],
            "train_impact": current_train_impact,
            "factors": current_priority["factors"],
        },

        "scenario": {
            "train_traffic_multiplier": (
                payload.train_traffic_multiplier
            ),
            "additional_overdue_days": (
                payload.additional_overdue_days
            ),
            "available_windows": (
                payload.available_windows
            ),
        },

        "simulated": {
            "priority_score": simulated_score,
            "priority_level": simulated_priority["priority_level"],
            "train_impact": simulated_train_impact,
            "factors": simulated_priority["factors"],
        },

        # -----------------------------------------------------
        # CHANGE
        # -----------------------------------------------------

        "score_change": score_change,

        # -----------------------------------------------------
        # EXPLANATION
        # -----------------------------------------------------

        "explanation": reasons,
    }