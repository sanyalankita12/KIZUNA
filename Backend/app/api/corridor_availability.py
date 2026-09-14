from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.corridor_availability import (
    calculate_available_windows,
)


router = APIRouter(
    prefix="/api/corridor-availability",
    tags=["Corridor Availability"],
)


@router.get("/{section_from}/{section_to}")
def get_corridor_availability(
    section_from: str,
    section_to: str,
    db: Session = Depends(get_db),
):
    """
    Calculate available maintenance windows for a railway section
    using train timetable occupancy.
    """

    windows = calculate_available_windows(
        db,
        section_from,
        section_to,
    )

    return {
        "section": f"{section_from}-{section_to}",
        "total_windows": len(windows),
        "windows": windows,
    }