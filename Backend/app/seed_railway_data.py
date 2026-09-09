import csv
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is missing in .env")

engine = create_engine(DATABASE_URL)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

STATIONS_FILE = os.path.join(BASE_DIR, "stations_import.csv")
TRAINS_FILE = os.path.join(BASE_DIR, "trains_import.csv")
TRAIN_STOPS_FILE = os.path.join(BASE_DIR, "train_stops_import.csv")


def seed_stations():
    with engine.begin() as conn:
        with open(STATIONS_FILE, newline="", encoding="utf-8-sig") as file:
            reader = csv.DictReader(file)

            for row in reader:
                station_code = row["station_code"].strip()
                station_name = (row["station_name"] or "").strip()

                if not station_code:
                    continue

                conn.execute(
                    text("""
                        INSERT INTO stations (station_code, station_name)
                        VALUES (:code, :name)
                        ON CONFLICT (station_code)
                        DO UPDATE SET station_name = EXCLUDED.station_name
                    """),
                    {
                        "code": station_code,
                        "name": station_name or station_code,
                    },
                )


def seed_trains():
    with engine.begin() as conn:
        with open(TRAINS_FILE, newline="", encoding="utf-8-sig") as file:
            reader = csv.DictReader(file)

            for row in reader:
                train_no = str(row["train_no"]).strip()

                if not train_no:
                    continue

                conn.execute(
                    text("""
                        INSERT INTO trains
                        (train_no, train_name, train_type, route_via, direction, distance_km)
                        VALUES
                        (:train_no, :train_name, :train_type, :route_via,
                         :direction, :distance_km)
                        ON CONFLICT (train_no)
                        DO UPDATE SET
                            train_name = EXCLUDED.train_name,
                            train_type = EXCLUDED.train_type,
                            route_via = EXCLUDED.route_via,
                            direction = EXCLUDED.direction,
                            distance_km = EXCLUDED.distance_km
                    """),
                    {
                        "train_no": train_no,
                        "train_name": row["train_name"].strip(),
                        "train_type": row["train_type"].strip(),
                        "route_via": row["route_via"].strip(),
                        "direction": row["direction"].strip(),
                        "distance_km": row["distance_km"] or None,
                    },
                )


def seed_train_stops():
    with engine.begin() as conn:
        with open(TRAIN_STOPS_FILE, newline="", encoding="utf-8-sig") as file:
            reader = csv.DictReader(file)

            for row in reader:
                conn.execute(
                    text("""
                        INSERT INTO train_stops
                        (train_no, station_code, arrival_time,
                         departure_time, stop_sequence)
                        VALUES
                        (:train_no, :station_code, :arrival_time,
                         :departure_time, :stop_sequence)
                    """),
                    {
                        "train_no": str(row["train_no"]).strip(),
                        "station_code": row["station_code"].strip(),
                        "arrival_time": row["arrival_time"] or None,
                        "departure_time": row["departure_time"] or None,
                        "stop_sequence": int(row["stop_sequence"]),
                    },
                )
if __name__ == "__main__":
    print("🚆 Loading railway data...")

    seed_stations()
    print("✅ Stations imported")

    seed_trains()
    print("✅ Trains imported")

    seed_train_stops()
    print("✅ Train stops imported")

    print("🎉 Railway data import complete!")