from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from pydantic import (
    BaseModel,
    ConfigDict,
    Field
)

from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    get_current_admin,
    hash_password,
    verify_password
)

from app.database import get_db

from app.models import (
    Admin,
    User
)


router = APIRouter(
    prefix="/admin",
    tags=["Administrator"]
)


# ==========================================
# REQUEST / RESPONSE SCHEMAS
# ==========================================

class AdminLoginRequest(BaseModel):

    username: str = Field(
        min_length=1,
        max_length=100
    )

    password: str = Field(
        min_length=1,
        max_length=200
    )


class AdminResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    username: str
    date_created: datetime


class CreateUserRequest(BaseModel):

    username: str = Field(
        min_length=3,
        max_length=100
    )

    password: str = Field(
        min_length=6,
        max_length=200
    )


class UserResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    username: str
    is_active: bool
    date_created: datetime


# ==========================================
# ADMIN LOGIN
# ==========================================

@router.post("/login")
def admin_login(

    data: AdminLoginRequest,

    db: Session = Depends(
        get_db
    )

):

    admin = (
        db.query(Admin)
        .filter(
            Admin.username == data.username
        )
        .first()
    )


    if admin is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrator credentials"
        )


    password_is_correct = verify_password(
        data.password,
        admin.password_hash
    )


    if not password_is_correct:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrator credentials"
        )


    access_token = create_access_token(
        username=admin.username,
        role="admin"
    )


    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": "admin"
    }


# ==========================================
# CURRENT ADMIN
# ==========================================

@router.get(
    "/me",
    response_model=AdminResponse
)
def get_admin_profile(

    current_admin: Admin = Depends(
        get_current_admin
    )

):

    return current_admin


# ==========================================
# GET ALL USERS
# ==========================================

@router.get(
    "/users",
    response_model=list[UserResponse]
)
def get_all_users(

    current_admin: Admin = Depends(
        get_current_admin
    ),

    db: Session = Depends(
        get_db
    )

):

    users = (
        db.query(User)
        .order_by(User.id)
        .all()
    )

    return users


# ==========================================
# CREATE USER
# ==========================================

@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def create_user(

    data: CreateUserRequest,

    current_admin: Admin = Depends(
        get_current_admin
    ),

    db: Session = Depends(
        get_db
    )

):

    existing_user = (
        db.query(User)
        .filter(
            User.username == data.username
        )
        .first()
    )


    if existing_user is not None:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )


    new_user = User(

        username=data.username,

        password_hash=hash_password(
            data.password
        ),

        is_active=True
    )


    db.add(
        new_user
    )

    db.commit()

    db.refresh(
        new_user
    )


    return new_user


# ==========================================
# DELETE USER
# ==========================================

@router.delete(
    "/users/{user_id}"
)
def delete_user(

    user_id: int,

    current_admin: Admin = Depends(
        get_current_admin
    ),

    db: Session = Depends(
        get_db
    )

):

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )


    if user is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )


    db.delete(
        user
    )

    db.commit()


    return {
        "message": "User deleted successfully"
    }