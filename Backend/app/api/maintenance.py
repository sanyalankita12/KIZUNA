from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import MaintenanceTask, User


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
    severity: str
    urgency: str
    duration_minutes: int
    status: str
    created_at: datetime

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