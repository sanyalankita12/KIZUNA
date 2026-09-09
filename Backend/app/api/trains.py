from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import User, Station, Train, TrainStop



router = APIRouter(prefix="/api/trains", tags=["trains"])

# Mirrors the stations/tracks currently hardcoded inside MapDashboard.jsx.
# MapDashboard does not call this endpoint yet — it's here so the network
# layout can be moved server-side later without redesigning anything.
STATIONS = [
    {"id": "RTM", "name": "Ratlam", "cx": 100, "cy": 300},
    {"id": "NAD", "name": "Nagda", "cx": 250, "cy": 120},
    {"id": "UJN", "name": "Ujjain", "cx": 500, "cy": 120},
    {"id": "DWX", "name": "Dewas", "cx": 700, "cy": 200},
    {"id": "BNG", "name": "Badnagar", "cx": 350, "cy": 450},
    {"id": "FTD", "name": "Fatehabad", "cx": 600, "cy": 450},
    {"id": "INDB", "name": "Indore", "cx": 850, "cy": 300},
]

TRACKS = [
    {"id": "T1", "from": "RTM", "to": "NAD"},
    {"id": "T2", "from": "NAD", "to": "UJN"},
    {"id": "T3", "from": "UJN", "to": "DWX"},
    {"id": "T4", "from": "DWX", "to": "INDB"},
    {"id": "T5", "from": "RTM", "to": "BNG"},
    {"id": "T6", "from": "BNG", "to": "FTD"},
    {"id": "T7", "from": "FTD", "to": "INDB"},
]


@router.get("/network")
def get_network(current_user: User = Depends(get_current_user)):
    return {"stations": STATIONS, "tracks": TRACKS}

@router.get("/stations")
def get_stations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stations = db.query(Station).all()

    return [
        {
            "code": station.station_code,
            "name": station.station_name,
        }
        for station in stations
    ]


@router.get("/trains")
def get_trains(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trains = db.query(Train).all()

    return [
        {
            "train_no": train.train_no,
            "train_name": train.train_name,
            "train_type": train.train_type,
            "route_via": train.route_via,
            "direction": train.direction,
            "distance_km": train.distance_km,
        }
        for train in trains
    ]


@router.get("/train-stops")
def get_train_stops(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stops = (
        db.query(TrainStop)
        .order_by(TrainStop.train_no, TrainStop.stop_sequence)
        .all()
    )

    return [
        {
            "id": stop.id,
            "train_no": stop.train_no,
            "station_code": stop.station_code,
            "arrival_time": (
                stop.arrival_time.strftime("%H:%M:%S")
                if stop.arrival_time
                else None
            ),
            "departure_time": (
                stop.departure_time.strftime("%H:%M:%S")
                if stop.departure_time
                else None
            ),
            "stop_sequence": stop.stop_sequence,
        }
        for stop in stops
    ]