from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import MaintenanceTask, User

from ..services.priority_engine import calculate_priority_score
from ..services.train_impact import (
    calculate_train_impact,
    get_affected_trains,
    get_section_occupancy_windows,
)
from ..services.optimizer import optimize_tasks


router = APIRouter(
    prefix="/api/optimizer",
    tags=["optimizer"],
)


def minutes_to_time_string(minutes: int):
    """Convert minutes after midnight to HH:MM."""

    hours = minutes // 60
    mins = minutes % 60

    return f"{hours:02d}:{mins:02d}"


@router.post("/run")
def run_optimizer(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Run Kizuna's CP-SAT block planning optimizer.
    """

    tasks = (
        db.query(MaintenanceTask)
        .filter(
            MaintenanceTask.status == "Pending"
        )
        .all()
    )

    if not tasks:
        raise HTTPException(
            status_code=400,
            detail="No pending maintenance tasks found.",
        )

    optimizer_tasks = []
    blocked_windows = {}

    task_details = {}

    for task in tasks:

        train_impact = calculate_train_impact(
            db,
            task.section_from,
            task.section_to,
        )

        priority_score = calculate_priority_score(
            criticality=task.criticality,
            severity=task.severity,
            urgency=task.urgency,
            train_impact=train_impact,
        )

        affected_trains = get_affected_trains(
            db,
            task.section_from,
            task.section_to,
        )

        occupancy = get_section_occupancy_windows(
            db,
            task.section_from,
            task.section_to,
        )

        optimizer_tasks.append({
        "id": task.id,
        "duration_minutes": task.duration_minutes,
        "priority_score": priority_score,
        "section": f"{task.section_from}-{task.section_to}",
        })

        blocked_windows[task.id] = occupancy

        task_details[task.id] = {
            "title": task.title,
            "section": (
                f"{task.section_from}-"
                f"{task.section_to}"
            ),
            "department": task.department,
            "priority_score": priority_score,
            "train_impact": train_impact,
            "affected_trains": affected_trains,
        }

    result = optimize_tasks(
        optimizer_tasks,
        blocked_windows,
    )

    if result is None:
        raise HTTPException(
            status_code=409,
            detail=(
                "No feasible block plan could be "
                "found for the current tasks."
            ),
        )

    final_plan = []

    for scheduled in result:

        task_id = scheduled["task_id"]
        details = task_details[task_id]

        start = scheduled[
            "scheduled_start_minute"
        ]

        end = scheduled[
            "scheduled_end_minute"
        ]

        final_plan.append({
            "task_id": task_id,
            "title": details["title"],
            "department": details["department"],
            "section": details["section"],
            "scheduled_start": minutes_to_time_string(
                start
            ),
            "scheduled_end": minutes_to_time_string(
                end
            ),
            "duration_minutes": (
                scheduled["duration_minutes"]
            ),
            "priority_score": (
                details["priority_score"]
            ),
            "train_impact": (
                details["train_impact"]
            ),
            "affected_trains": (
                details["affected_trains"]
            ),
            "reason": (
            f"Priority score {details['priority_score']} was calculated from "
            f"criticality, severity, urgency, and impact on "
            f"{details['train_impact']} trains. "
            f"CP-SAT scheduled this task at {minutes_to_time_string(start)} "
            f"to avoid train occupancy conflicts and conflicts with other "
            f"maintenance work on the same section."
            ),
        })

    return {
        "status": "optimized",
        "total_tasks": len(final_plan),
        "plan": final_plan,
    }