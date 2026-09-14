from datetime import datetime,date

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import MaintenanceTask, User

from ..services.priority_engine import calculate_priority_score
from ..services.train_impact import calculate_train_impact
from ..services.train_impact import get_affected_trains

router = APIRouter(
    prefix="/api/maintenance",
    tags=["maintenance"]
)


class MaintenanceTaskCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str | None = None

    section_from: str = Field(min_length=1, max_length=20)
    section_to: str = Field(min_length=1, max_length=20)

    department: str = Field(min_length=1, max_length=50)

    criticality: str = Field(
    default="Medium",
    max_length=20
    )

    severity: str = Field(min_length=1, max_length=20)
    urgency: str = Field(min_length=1, max_length=20)

    duration_minutes: int = Field(gt=0)


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


@router.post(
    "",
    response_model=MaintenanceTaskResponse,
    status_code=status.HTTP_201_CREATED
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


@router.get(
    "",
    response_model=list[MaintenanceTaskResponse]
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




@router.get("/priorities")
def get_prioritized_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tasks = (
        db.query(MaintenanceTask)
        .filter(MaintenanceTask.status == "Pending")
        .all()
    )

    prioritized_tasks = []

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

        prioritized_tasks.append({
            "task_id": task.id,
            "title": task.title,
            "section_from": task.section_from,
            "section_to": task.section_to,
            "department": task.department,
            "criticality": task.criticality,
            "severity": task.severity,
            "urgency": task.urgency,
            "duration_minutes": task.duration_minutes,
            "train_impact": train_impact,
            "priority_score": priority_score,
        })

    prioritized_tasks.sort(
        key=lambda x: x["priority_score"],
        reverse=True
    )

    return prioritized_tasks

@router.get("/{task_id}/conflicts")
def get_task_conflicts(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(MaintenanceTask)
        .filter(MaintenanceTask.id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance task not found"
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
        "total_affected_trains": len(affected_trains),
    }

@router.get(
    "/{task_id}",
    response_model=MaintenanceTaskResponse
)
def get_maintenance_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(MaintenanceTask)
        .filter(MaintenanceTask.id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance task not found"
        )

    return task

@router.patch(
    "/{task_id}",
    response_model=MaintenanceTaskResponse
)
def update_maintenance_task(
    task_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(MaintenanceTask)
        .filter(MaintenanceTask.id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance task not found"
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
                detail="Invalid status"
            )

        task.status = payload["status"]

    db.commit()
    db.refresh(task)

    return task


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_maintenance_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(MaintenanceTask)
        .filter(MaintenanceTask.id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance task not found"
        )

    db.delete(task)
    db.commit()

    return None