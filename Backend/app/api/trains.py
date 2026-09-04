from fastapi import APIRouter, Depends

from ..auth import get_current_user
from ..models import User

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