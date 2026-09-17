from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..auth import (
    create_access_token,
    get_current_admin,
    hash_password,
    verify_password,
)
from ..database import get_db
from ..models import Admin, User, MaintenanceTask

from ..services.priority_engine import calculate_priority_details
from ..services.train_impact import calculate_train_impact
from ..services.ml_risk import predict_ml_risk


router = APIRouter(prefix="/api/admin", tags=["admin"])


# ============================================================
# Schemas
# ============================================================

class AdminLoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminProfileResponse(BaseModel):
    id: int
    username: str
    date_created: datetime

    class Config:
        from_attributes = True


class UserCreateRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6)


class UserResponse(BaseModel):
    id: int
    username: str
    is_active: bool
    date_created: datetime

    class Config:
        from_attributes = True


# ============================================================
# Admin Login
# ============================================================

@router.post("/login", response_model=TokenResponse)
def admin_login(
    payload: AdminLoginRequest,
    db: Session = Depends(get_db),
):
    admin = (
        db.query(Admin)
        .filter(Admin.username == payload.username)
        .first()
    )

    if not admin or not verify_password(
        payload.password,
        admin.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_access_token(
        subject=admin.username,
        role="admin",
        user_id=admin.id,
    )

    return TokenResponse(
        access_token=token
    )


# ============================================================
# Admin Profile
# ============================================================

@router.get("/me", response_model=AdminProfileResponse)
def get_admin_profile(
    current_admin: Admin = Depends(get_current_admin),
):
    return current_admin


# ============================================================
# User Management
# ============================================================

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return (
        db.query(User)
        .order_by(User.id.desc())
        .all()
    )


@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    payload: UserCreateRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    existing = (
        db.query(User)
        .filter(User.username == payload.username)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )

    new_user = User(
        username=payload.username,
        hashed_password=hash_password(
            payload.password
        ),
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    db.delete(user)
    db.commit()

    return None


# ============================================================
# Department / Maintenance Data
# ============================================================

@router.get("/department-data")
def get_department_data(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    tasks = (
        db.query(MaintenanceTask)
        .order_by(MaintenanceTask.id.desc())
        .all()
    )

    results = []

    for task in tasks:

        # ----------------------------------------------------
        # Train impact
        # ----------------------------------------------------

        try:
            train_impact = calculate_train_impact(
                db,
                task.section_from,
                task.section_to,
            )
        except Exception as exc:
            print(
                f"[Admin] Train impact error for task "
                f"{task.id}: {exc}"
            )
            train_impact = 0

        # ----------------------------------------------------
        # Overdue days
        # ----------------------------------------------------

        overdue_days = 0

        if task.planned_date:
            try:
                overdue_days = max(
                    0,
                    (
                        datetime.utcnow().date()
                        - task.planned_date
                    ).days,
                )
            except Exception as exc:
                print(
                    f"[Admin] Overdue calculation error "
                    f"for task {task.id}: {exc}"
                )
                overdue_days = 0

        # ----------------------------------------------------
        # Existing priority engine
        #
        # IMPORTANT:
        # calculate_priority_details() expects individual
        # task parameters, not task=task.
        # ----------------------------------------------------

        try:
            priority_details = calculate_priority_details(
                criticality=task.criticality or "Low",
                severity=task.severity or "Low",
                urgency=task.urgency or "Low",
                train_impact=train_impact,
                overdue_days=overdue_days,
                duration_minutes=(
                    task.duration_minutes or 60
                ),
            )

        except Exception as exc:
            print(
                f"[Admin] Priority calculation error "
                f"for task {task.id}: {exc}"
            )

            priority_details = {
                "priority_score": 0,
                "priority_level": "Low",
                "factors": {},
                "base_priority_score": 0,
                "window_adjustment_percent": 0,
                "window_adjustment_score": 0,
                "available_windows": 0,
            }

        # ----------------------------------------------------
        # ML risk intelligence
        # ----------------------------------------------------

        try:
            ml_result = predict_ml_risk(
                task=task,
                reference_tasks=tasks,
                train_impact=train_impact,
                overdue_days=overdue_days,
            )

        except Exception as exc:
            print(
                f"[Admin] ML risk calculation error "
                f"for task {task.id}: {exc}"
            )

            ml_result = {
                "ml_risk_score": 0,
                "ml_risk_level": "Low",
                "ml_confidence": 0,
                "ml_anomaly": False,
                "ml_model": "Unavailable",
                "ml_message": (
                    "Risk assessment unavailable."
                ),
            }

        # ----------------------------------------------------
        # Normalize priority response
        # ----------------------------------------------------

        if not isinstance(
            priority_details,
            dict,
        ):
            priority_details = {}

        priority_score = priority_details.get(
            "priority_score",
            0,
        )

        priority_level = priority_details.get(
            "priority_level",
            "Low",
        )

        priority_factors = priority_details.get(
            "factors",
            {},
        )

        base_priority_score = priority_details.get(
            "base_priority_score",
            priority_score,
        )

        window_adjustment_percent = (
            priority_details.get(
                "window_adjustment_percent",
                0,
            )
        )

        window_adjustment_score = (
            priority_details.get(
                "window_adjustment_score",
                0,
            )
        )

        available_windows = (
            priority_details.get(
                "available_windows",
                1,
            )
        )

        # ----------------------------------------------------
        # Normalize ML response
        # ----------------------------------------------------

        if not isinstance(
            ml_result,
            dict,
        ):
            ml_result = {}

        ml_risk_score = ml_result.get(
            "ml_risk_score",
            ml_result.get(
                "risk_score",
                0,
            ),
        )

        ml_risk_level = ml_result.get(
            "ml_risk_level",
            ml_result.get(
                "risk_level",
                "Low",
            ),
        )

        ml_confidence = ml_result.get(
            "ml_confidence",
            ml_result.get(
                "confidence",
                0,
            ),
        )

        ml_anomaly = ml_result.get(
            "ml_anomaly",
            ml_result.get(
                "anomaly",
                False,
            ),
        )

        ml_model = ml_result.get(
            "ml_model",
            "",
        )

        ml_message = ml_result.get(
            "ml_message",
            "Risk assessment available.",
        )

        # ----------------------------------------------------
        # Final response object
        # ----------------------------------------------------

        results.append(
            {
                # Basic task information
                "id": task.id,
                "task_id": task.id,
                "title": task.title,
                "description": task.description,
                "department": task.department,

                # Section
                "section": (
                    f"{task.section_from}-"
                    f"{task.section_to}"
                ),
                "section_from": task.section_from,
                "section_to": task.section_to,

                # Maintenance characteristics
                "criticality": task.criticality,
                "severity": task.severity,
                "urgency": task.urgency,
                "duration_minutes": (
                    task.duration_minutes
                ),
                "status": task.status,

                # Planning
                "planned_date": (
                    task.planned_date.isoformat()
                    if task.planned_date
                    else None
                ),
                "overdue_days": overdue_days,

                # Operational impact
                "train_impact": train_impact,

                # Priority engine
                "priority_score": priority_score,
                "priority_level": priority_level,
                "priority_factors": priority_factors,

                # Adjustable window information
                "base_priority_score": (
                    base_priority_score
                ),
                "window_adjustment_percent": (
                    window_adjustment_percent
                ),
                "window_adjustment_score": (
                    window_adjustment_score
                ),
                "available_windows": (
                    available_windows
                ),

                # ML risk intelligence
                "ml_risk_score": ml_risk_score,
                "ml_risk_level": ml_risk_level,
                "ml_confidence": ml_confidence,
                "ml_anomaly": ml_anomaly,
                "ml_model": ml_model,
                "ml_message": ml_message,
            }
        )

    return results