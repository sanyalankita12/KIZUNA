from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Time,
    func
)


from app.database import Base
from sqlalchemy.orm import relationship




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

    # ==========================================
# STATION DATABASE MODEL
# ==========================================

class Station(Base):

    __tablename__ = "stations"

    station_code = Column(
        String(10),
        primary_key=True,
        index=True
    )

    station_name = Column(
        String(100)
    )


# ==========================================
# TRAIN DATABASE MODEL
# ==========================================

class Train(Base):

    __tablename__ = "trains"

    train_no = Column(
        Integer,
        primary_key=True,
        index=True
    )

    train_name = Column(
        String(100)
    )

    train_type = Column(
        String(10)
    )

    route_via = Column(
        String(50)
    )

    direction = Column(
        String(10)
    )

    distance_km = Column(
        Integer
    )

    stops = relationship(
        "TrainStop",
        back_populates="train"
    )


# ==========================================
# TRAIN STOP DATABASE MODEL
# ==========================================

class TrainStop(Base):

    __tablename__ = "train_stops"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    train_no = Column(
        Integer,
        ForeignKey("trains.train_no")
    )

    station_code = Column(
        String(10),
        ForeignKey("stations.station_code")
    )

    arrival_time = Column(
        Time
    )

    departure_time = Column(
        Time
    )

    stop_sequence = Column(
        Integer
    )

    train = relationship(
        "Train",
        back_populates="stops"
    )