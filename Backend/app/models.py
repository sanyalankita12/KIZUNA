from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Integer,
    String,
    Time,
)

from .database import Base


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )

    hashed_password = Column(
        String(255),
        nullable=False,
    )

    date_created = Column(
        DateTime,
        default=datetime.utcnow,
    )


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )

    hashed_password = Column(
        String(255),
        nullable=False,
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    date_created = Column(
        DateTime,
        default=datetime.utcnow,
    )


class Station(Base):
    __tablename__ = "stations"

    station_code = Column(
        String(20),
        primary_key=True,
        index=True,
    )

    station_name = Column(
        String(150),
        nullable=False,
    )


class Train(Base):
    __tablename__ = "trains"

    train_no = Column(
        String(20),
        primary_key=True,
        index=True,
    )

    train_name = Column(
        String(150),
        nullable=False,
    )

    train_type = Column(
        String(50),
        nullable=True,
    )

    route_via = Column(
        String(255),
        nullable=True,
    )

    direction = Column(
        String(50),
        nullable=True,
    )

    distance_km = Column(
        Integer,
        nullable=True,
    )


class TrainStop(Base):
    __tablename__ = "train_stops"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    train_no = Column(
        String(20),
        nullable=False,
        index=True,
    )

    station_code = Column(
        String(20),
        nullable=False,
        index=True,
    )

    arrival_time = Column(
        Time,
        nullable=True,
    )

    departure_time = Column(
        Time,
        nullable=True,
    )

    stop_sequence = Column(
        Integer,
        nullable=False,
    )


class MaintenanceTask(Base):
    __tablename__ = "maintenance_tasks"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    title = Column(
        String(200),
        nullable=False,
    )

    description = Column(
        String,
        nullable=True,
    )

    section_from = Column(
        String(20),
        nullable=False,
    )

    section_to = Column(
        String(20),
        nullable=False,
    )

    department = Column(
        String(50),
        nullable=False,
    )

    criticality = Column(
        String(20),
        nullable=False,
        default="Medium",
    )

    severity = Column(
        String(20),
        nullable=False,
    )

    urgency = Column(
        String(20),
        nullable=False,
    )

    duration_minutes = Column(
        Integer,
        nullable=False,
    )

    status = Column(
        String(20),
        nullable=False,
        default="Pending",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    # Date assigned by weekly/monthly planning
    planned_date = Column(
        Date,
        nullable=True,
    )


class Defect(Base):
    __tablename__ = "defects"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Railway asset information
    asset_id = Column(
        String(50),
        nullable=False,
    )

    asset_type = Column(
        String(50),
        nullable=False,
    )

    # Railway section affected by the defect
    section_from = Column(
        String(20),
        nullable=False,
    )

    section_to = Column(
        String(20),
        nullable=False,
    )

    description = Column(
        String,
        nullable=False,
    )

    # Source system simulation
    # Example: TMS, SMMS, TDMS
    source_system = Column(
        String(20),
        nullable=False,
    )

    # Risk information
    severity = Column(
        String(20),
        nullable=False,
    )

    criticality = Column(
        String(20),
        nullable=False,
        default="Medium",
    )

    # Dates
    reported_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    due_date = Column(
        DateTime,
        nullable=True,
    )

    # Current state
    status = Column(
        String(20),
        nullable=False,
        default="Open",
    )


class CorridorAvailability(Base):
    __tablename__ = "corridor_availability"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    section_from = Column(
        String(20),
        nullable=False,
    )

    section_to = Column(
        String(20),
        nullable=False,
    )

    available_from = Column(
        Integer,
        nullable=False,
    )

    available_to = Column(
        Integer,
        nullable=False,
    )

    block_type = Column(
        String(30),
        nullable=False,
        default="Auto",
    )

    status = Column(
        String(20),
        nullable=False,
        default="Available",
    )

    reason = Column(
        String,
        nullable=True,
    )