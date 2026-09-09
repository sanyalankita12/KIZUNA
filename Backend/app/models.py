from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, ForeignKey, Time
from sqlalchemy.orm import relationship

from .database import Base


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    date_created = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    date_created = Column(DateTime, default=datetime.utcnow)

class Station(Base):
    __tablename__ = "stations"

    station_code = Column(String(20), primary_key=True, index=True)
    station_name = Column(String(150), nullable=False)


class Train(Base):
    __tablename__ = "trains"

    train_no = Column(String(20), primary_key=True, index=True)
    train_name = Column(String(150), nullable=False)
    train_type = Column(String(50), nullable=True)
    route_via = Column(String(255), nullable=True)
    direction = Column(String(50), nullable=True)
    distance_km = Column(Integer, nullable=True)


class TrainStop(Base):
    __tablename__ = "train_stops"

    id = Column(Integer, primary_key=True, index=True)
    train_no = Column(String(20), nullable=False, index=True)
    station_code = Column(String(20), nullable=False, index=True)
    arrival_time = Column(Time, nullable=True)
    departure_time = Column(Time, nullable=True)
    stop_sequence = Column(Integer, nullable=False)

class MaintenanceTask(Base):
    __tablename__ = "maintenance_tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(String, nullable=True)

    section_from = Column(String(20), nullable=False)
    section_to = Column(String(20), nullable=False)

    department = Column(String(50), nullable=False)

    severity = Column(String(20), nullable=False)
    urgency = Column(String(20), nullable=False)

    duration_minutes = Column(Integer, nullable=False)

    status = Column(
        String(20),
        nullable=False,
        default="Pending"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )