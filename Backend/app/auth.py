import os

from datetime import datetime, timedelta, timezone

import bcrypt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer
)
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Admin, User


load_dotenv()


SECRET_KEY = os.getenv("SECRET_KEY")


if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY is missing in .env"
    )


ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_HOURS = 24


bearer_scheme = HTTPBearer()


# ==========================================
# PASSWORD HASHING
# ==========================================

def hash_password(password: str) -> str:

    password_bytes = password.encode("utf-8")

    # bcrypt only supports passwords up to 72 bytes
    if len(password_bytes) > 72:
        raise ValueError(
            "Password cannot be longer than 72 bytes"
        )

    salt = bcrypt.gensalt()

    hashed_password = bcrypt.hashpw(
        password_bytes,
        salt
    )

    return hashed_password.decode("utf-8")


# ==========================================
# PASSWORD VERIFICATION
# ==========================================

def verify_password(
    plain_password: str,
    password_hash: str
) -> bool:

    password_bytes = plain_password.encode(
        "utf-8"
    )

    if len(password_bytes) > 72:
        return False

    return bcrypt.checkpw(
        password_bytes,
        password_hash.encode("utf-8")
    )


# ==========================================
# CREATE JWT TOKEN
# ==========================================

def create_access_token(
    username: str,
    role: str
) -> str:

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            hours=ACCESS_TOKEN_EXPIRE_HOURS
        )
    )

    payload = {
        "sub": username,
        "role": role,
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# ==========================================
# GET CURRENT ADMIN
# ==========================================

def get_current_admin(

    credentials: HTTPAuthorizationCredentials = Depends(
        bearer_scheme
    ),

    db: Session = Depends(
        get_db
    )

) -> Admin:

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        username = payload.get("sub")
        role = payload.get("role")

        if not username:

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

        if role != "admin":

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Administrator access required"
            )

    except JWTError:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    admin = (
        db.query(Admin)
        .filter(
            Admin.username == username
        )
        .first()
    )

    if admin is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Administrator not found"
        )

    return admin


# ==========================================
# GET CURRENT USER
# ==========================================

def get_current_user(

    credentials: HTTPAuthorizationCredentials = Depends(
        bearer_scheme
    ),

    db: Session = Depends(
        get_db
    )

) -> User:

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        username = payload.get("sub")
        role = payload.get("role")

        if not username:

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

        if role != "user":

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User access required"
            )

    except JWTError:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user = (
        db.query(User)
        .filter(
            User.username == username
        )
        .first()
    )

    if user is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    if not user.is_active:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    return user