from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import User, MaintenanceTask
from ..services.planning import distribute_tasks


router = APIRouter(
    prefix="/api/planning",
    tags=["planning"],
)


class PlanningRequest(BaseModel):
    start_date: date | None = None


def build_plan(
    db: Session,
    start_date: date,
    number_of_days: int,
    horizon: str,
):
    """
    Generate a weekly or monthly maintenance plan.
    """

    planned_tasks = distribute_tasks(
        db=db,
        start_date=start_date,
        number_of_days=number_of_days,
    )

    if not planned_tasks:
        raise HTTPException(
            status_code=400,
            detail="No pending maintenance tasks found.",
        )

    days = []

    for i in range(number_of_days):
        planning_date = (
            start_date.fromordinal(
                start_date.toordinal() + i
            )
        )

        day_tasks = [
            task
            for task in planned_tasks
            if task["planned_date"]
            == planning_date.isoformat()
        ]

        total_duration = sum(
            task["duration_minutes"]
            for task in day_tasks
        )

        days.append({
            "date": planning_date.isoformat(),
            "total_tasks": len(day_tasks),
            "total_duration_minutes": total_duration,
            "tasks": day_tasks,
        })

    return {
        "status": "planned",
        "horizon": horizon,
        "start_date": start_date.isoformat(),
        "end_date": days[-1]["date"],
        "total_tasks": len(planned_tasks),
        "days": days,
    }


@router.post("/weekly")
def create_weekly_plan(
    payload: PlanningRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a 7-day maintenance plan.
    """

    start_date = payload.start_date or date.today()

    return build_plan(
        db=db,
        start_date=start_date,
        number_of_days=7,
        horizon="weekly",
    )


@router.post("/monthly")
def create_monthly_plan(
    payload: PlanningRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a 30-day maintenance plan.
    """

    start_date = payload.start_date or date.today()

    return build_plan(
        db=db,
        start_date=start_date,
        number_of_days=30,
        horizon="monthly",
    )


@router.get("/tasks")
def get_planned_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all maintenance tasks that have
    been assigned a planning date.
    """

    tasks = (
        db.query(MaintenanceTask)
        .filter(
            MaintenanceTask.planned_date.isnot(None)
        )
        .order_by(
            MaintenanceTask.planned_date,
            MaintenanceTask.id,
        )
        .all()
    )

    return [
        {
            "task_id": task.id,
            "title": task.title,
            "department": task.department,
            "section": (
                f"{task.section_from}-"
                f"{task.section_to}"
            ),
            "duration_minutes": task.duration_minutes,
            "status": task.status,
            "planned_date": (
                task.planned_date.isoformat()
                if task.planned_date
                else None
            ),
        }
        for task in tasks
    ]