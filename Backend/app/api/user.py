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
    get_current_user,
    verify_password
)

from app.database import get_db

from app.models import User


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# ==========================================
# REQUEST / RESPONSE SCHEMAS
# ==========================================

class UserLoginRequest(BaseModel):

    username: str = Field(
        min_length=1,
        max_length=100
    )

    password: str = Field(
        min_length=1,
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
# USER LOGIN
# ==========================================

@router.post("/login")
def user_login(

    data: UserLoginRequest,

    db: Session = Depends(
        get_db
    )

):

    user = (
        db.query(User)
        .filter(
            User.username == data.username
        )
        .first()
    )


    if user is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )


    password_is_correct = verify_password(
        data.password,
        user.password_hash
    )


    if not password_is_correct:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )


    if not user.is_active:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )


    access_token = create_access_token(
        username=user.username,
        role="user"
    )


    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": "user"
    }


# ==========================================
# CURRENT USER
# ==========================================

@router.get(
    "/me",
    response_model=UserResponse
)
def get_user_profile(

    current_user: User = Depends(
        get_current_user
    )

):

    return current_user 