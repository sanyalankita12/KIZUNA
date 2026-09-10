from sqlalchemy.orm import Session

from ..models import Train, TrainStop


def get_affected_trains(
    db: Session,
    section_from: str,
    section_to: str,
):
    stops = (
        db.query(TrainStop)
        .order_by(
            TrainStop.train_no,
            TrainStop.stop_sequence
        )
        .all()
    )

    train_routes = {}

    for stop in stops:
        train_routes.setdefault(
            stop.train_no,
            []
        ).append(stop)

    affected_train_numbers = set()

    for train_no, train_stops in train_routes.items():

        for i in range(len(train_stops) - 1):

            current_stop = train_stops[i]
            next_stop = train_stops[i + 1]

            if (
                current_stop.station_code == section_from
                and next_stop.station_code == section_to
            ):
                affected_train_numbers.add(train_no)

    if not affected_train_numbers:
        return []

    trains = (
        db.query(Train)
        .filter(
            Train.train_no.in_(affected_train_numbers)
        )
        .all()
    )

    train_map = {
        train.train_no: train
        for train in trains
    }

    result = []

    for train_no in sorted(affected_train_numbers):

        train = train_map.get(train_no)

        result.append({
            "train_no": train_no,
            "train_name": (
                train.train_name
                if train
                else "Unknown"
            ),
        })

    return result


def calculate_train_impact(
    db: Session,
    section_from: str,
    section_to: str,
) -> int:

    affected_trains = get_affected_trains(
        db,
        section_from,
        section_to,
    )

    return len(affected_trains)