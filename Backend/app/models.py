from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
    func
)

from app.database import Base


# ==========================================
# ADMIN DATABASE MODEL
# ==========================================

class Admin(Base):

    __tablename__ = "admins"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    username = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    date_created = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )


# ==========================================
# USER DATABASE MODEL
# ==========================================

class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    username = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    date_created = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )