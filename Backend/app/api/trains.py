from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from pydantic import (
    BaseModel,
    ConfigDict
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.models import (
    Train,
    Station,
    TrainStop
)


router = APIRouter(
    prefix="/trains",
    tags=["Trains"]
)


# ==========================================
# RESPONSE SCHEMAS
# ==========================================

class TrainResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    train_no: int
    train_name: str
    train_type: str
    route_via: str
    direction: str
    distance_km: int


class StationResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    station_code: str
    station_name: str


class TrainStopResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    station_code: str
    arrival_time: str | None
    departure_time: str | None
    stop_sequence: int


# ==========================================
# GET ALL TRAINS
# ==========================================

@router.get(
    "",
    response_model=list[TrainResponse]
)
def get_all_trains(

    db: Session = Depends(
        get_db
    )

):

    trains = None  

    return trains


# ==========================================
# GET SINGLE TRAIN
# ==========================================

@router.get(
    "/{train_no}",
    response_model=TrainResponse
)
def get_train(

    train_no: int,

    db: Session = Depends(
        get_db
    )

):

    train = None  

    if train is None:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Train not found"
        )

    return train


# ==========================================
# GET STOPS FOR A TRAIN
# ==========================================

@router.get(
    "/{train_no}/stops",
    response_model=list[TrainStopResponse]
)
def get_train_stops(

    train_no: int,

    db: Session = Depends(
        get_db
    )

):

    stops = None  

    return stops


# ==========================================
# GET ALL STATIONS
# ==========================================

@router.get(
    "/stations/all",
    response_model=list[StationResponse]
)
def get_all_stations(

    db: Session = Depends(
        get_db
    )

):

    stations = None 

    return stations