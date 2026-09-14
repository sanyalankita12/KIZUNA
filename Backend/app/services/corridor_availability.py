from sqlalchemy.orm import Session

from ..models import TrainStop


def time_to_minutes(value):
    """
    Convert a Python time value into minutes from midnight.

    Example:
    08:30 -> 510
    10:00 -> 600
    """
    if value is None:
        return None

    return value.hour * 60 + value.minute


def normalize_section(section_from, section_to):
    """
    Treat RTM-NAD and NAD-RTM as the same physical railway section.
    """

    return "-".join(sorted([section_from, section_to]))


def get_train_occupancy_windows(
    db: Session,
    section_from: str,
    section_to: str,
):
    """
    Get all train occupancy windows for one railway section.

    Each window represents the time during which a train
    is travelling between the two stations.
    """

    stops = (
        db.query(TrainStop)
        .order_by(
            TrainStop.train_no,
            TrainStop.stop_sequence,
        )
        .all()
    )

    requested_section = normalize_section(
        section_from,
        section_to,
    )

    windows = []

    train_routes = {}

    for stop in stops:
        train_routes.setdefault(
            stop.train_no,
            []
        ).append(stop)

    for train_no, train_stops in train_routes.items():

        previous_end = None

        for i in range(len(train_stops) - 1):

            current_stop = train_stops[i]
            next_stop = train_stops[i + 1]

            start = time_to_minutes(
                current_stop.departure_time
            )

            end = time_to_minutes(
                next_stop.arrival_time
            )

            if start is None or end is None:
                continue

            # Handle trains that cross midnight.
            if previous_end is not None:

                while start < previous_end:
                    start += 1440

            while end < start:
                end += 1440

            previous_end = end

            actual_section = normalize_section(
                current_stop.station_code,
                next_stop.station_code,
            )

            if actual_section != requested_section:
                continue

            # Keep only the portion inside today's
            # 00:00 -> 24:00 planning horizon.
            for shift in (-1440, 0, 1440):

                shifted_start = start + shift
                shifted_end = end + shift

                if shifted_end <= 0:
                    continue

                if shifted_start >= 1440:
                    continue

                clipped_start = max(
                    0,
                    shifted_start,
                )

                clipped_end = min(
                    1440,
                    shifted_end,
                )

                if clipped_start >= clipped_end:
                    continue

                windows.append(
                    {
                        "train_no": train_no,
                        "start_minute": clipped_start,
                        "end_minute": clipped_end,
                    }
                )

    windows.sort(
        key=lambda x: x["start_minute"]
    )

    return windows


def calculate_available_windows(
    db: Session,
    section_from: str,
    section_to: str,
):
    """
    Calculate maintenance-available windows by finding
    the gaps between train occupancy windows.
    """

    occupied_windows = get_train_occupancy_windows(
        db,
        section_from,
        section_to,
    )

    available_windows = []

    current_time = 0

    for window in occupied_windows:

        train_start = window["start_minute"]
        train_end = window["end_minute"]

        # If there is a gap before the train arrives,
        # that gap can potentially be used for maintenance.
        if train_start > current_time:

            available_windows.append(
                {
                    "section_from": section_from,
                    "section_to": section_to,
                    "available_from": current_time,
                    "available_to": train_start,
                    "block_type": "Auto",
                    "status": "Available",
                    "reason": (
                        "Derived from train timetable "
                        "between occupied train windows"
                    ),
                }
            )

        # Move the pointer forward.
        current_time = max(
            current_time,
            train_end,
        )

    # Any time remaining after the last train
    # is also potentially available.
    if current_time < 1440:

        available_windows.append(
            {
                "section_from": section_from,
                "section_to": section_to,
                "available_from": current_time,
                "available_to": 1440,
                "block_type": "Auto",
                "status": "Available",
                "reason": (
                    "Derived from train timetable "
                    "after the last occupied window"
                ),
            }
        )

    return available_windows