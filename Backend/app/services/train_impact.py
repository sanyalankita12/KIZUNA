from sqlalchemy.orm import Session

from ..models import Train, TrainStop


def time_to_minutes(value):
    """Convert a Python time object to minutes after midnight."""
    if value is None:
        return None

    return value.hour * 60 + value.minute


def get_section_occupancy_windows(
    db: Session,
    section_from: str,
    section_to: str,
):
    """
    Find the time periods when trains occupy a railway section.

    The section is treated as undirected:
    RTM-NAD is the same physical section as NAD-RTM.

    Overnight train timings are handled automatically.
    """

    stops = (
        db.query(TrainStop)
        .order_by(
            TrainStop.train_no,
            TrainStop.stop_sequence,
        )
        .all()
    )

    train_routes = {}

    for stop in stops:
        train_routes.setdefault(
            stop.train_no,
            []
        ).append(stop)

    windows = []

    requested_section = {
        section_from,
        section_to,
    }

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

            # Handle midnight.
            if previous_end is not None:
                while start < previous_end:
                    start += 1440

            while end < start:
                end += 1440

            previous_end = end

            actual_section = {
                current_stop.station_code,
                next_stop.station_code,
            }

            # Does this train use our requested section?
            if actual_section != requested_section:
                continue

            train = (
                db.query(Train)
                .filter(
                    Train.train_no == train_no
                )
                .first()
            )

            train_name = (
                train.train_name
                if train
                else "Unknown"
            )

            # Check around midnight as well.
            for shift in (-1440, 0, 1440):

                shifted_start = start + shift
                shifted_end = end + shift

                if shifted_end <= 0:
                    continue

                if shifted_start >= 1440:
                    continue

                clipped_start = max(
                    0,
                    shifted_start
                )

                clipped_end = min(
                    1440,
                    shifted_end
                )

                if clipped_start >= clipped_end:
                    continue

                windows.append({
                    "train_no": train_no,
                    "train_name": train_name,
                    "section_from": current_stop.station_code,
                    "section_to": next_stop.station_code,
                    "start_minute": clipped_start,
                    "end_minute": clipped_end,
                })

    return windows


def get_affected_trains(
    db: Session,
    section_from: str,
    section_to: str,
):
    """
    Return all trains using a railway section.
    """

    windows = get_section_occupancy_windows(
        db,
        section_from,
        section_to,
    )

    unique_trains = {}

    for window in windows:

        train_no = window["train_no"]

        unique_trains[train_no] = {
            "train_no": train_no,
            "train_name": window["train_name"],
        }

    return [
        unique_trains[train_no]
        for train_no in sorted(unique_trains)
    ]


def calculate_train_impact(
    db: Session,
    section_from: str,
    section_to: str,
):
    """
    Calculate how many trains are affected
    by a railway section.
    """

    return len(
        get_affected_trains(
            db,
            section_from,
            section_to,
        )
    )