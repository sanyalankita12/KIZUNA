"""
Kizuna ML Risk Intelligence

Uses an unsupervised Isolation Forest model to identify maintenance
requests that look operationally unusual compared with the current
maintenance workload.

Important:
- This is NOT a failure-probability model.
- No historical failure labels are available in the prototype dataset.
- The output is an ML-based anomaly/risk signal that can support
  the existing explainable priority engine.
"""

from __future__ import annotations

from typing import Any, Dict, List

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


LEVEL_MAP = {
    "Low": 1,
    "Medium": 2,
    "High": 3,
    "Critical": 4,
}

DEPARTMENT_MAP = {
    "Track": 1,
    "Signal": 2,
    "Electrical": 3,
}


def _level_value(value: Any) -> int:
    return LEVEL_MAP.get(str(value or "Medium"), 2)


def _department_value(value: Any) -> int:
    return DEPARTMENT_MAP.get(str(value or "Track"), 1)


def build_features(
    task: Any,
    train_impact: int = 0,
    overdue_days: int = 0,
) -> List[float]:
    """
    Convert a maintenance task into numeric ML features.
    """

    return [
        float(_level_value(getattr(task, "criticality", "Medium"))),
        float(_level_value(getattr(task, "severity", "Medium"))),
        float(_level_value(getattr(task, "urgency", "Medium"))),
        float(max(0, train_impact)),
        float(max(0, overdue_days)),
        float(max(0, getattr(task, "duration_minutes", 0) or 0)),
        float(_department_value(getattr(task, "department", "Track"))),
    ]


def _risk_from_score(anomaly_score: float) -> tuple[str, int]:
    """
    Convert Isolation Forest anomaly score into a simple
    demo-friendly risk representation.

    Higher score = more unusual operational profile.
    """

    # IsolationForest decision_function:
    # larger = more normal
    # smaller = more anomalous

    normalized = max(0.0, min(1.0, (0.15 - anomaly_score) / 0.30))

    risk_score = int(round(normalized * 100))

    if risk_score >= 70:
        level = "High"
    elif risk_score >= 40:
        level = "Medium"
    else:
        level = "Low"

    return level, risk_score


def predict_ml_risk(
    task: Any,
    reference_tasks: List[Any],
    train_impact: int = 0,
    overdue_days: int = 0,
) -> Dict[str, Any]:
    """
    Train a lightweight Isolation Forest on the current maintenance
    workload and score the requested task.

    The model is intentionally small because this is a prototype and
    the available dataset is limited.
    """

    if not reference_tasks:
        return {
            "model": "Isolation Forest",
            "model_type": "unsupervised_anomaly_detection",
            "risk_level": "Medium",
            "risk_score": 50,
            "confidence": 50,
            "anomaly": False,
            "message": "Insufficient maintenance history for ML comparison.",
        }

    training_features = []

    for item in reference_tasks:
        training_features.append(
            build_features(
                item,
                train_impact=0,
                overdue_days=0,
            )
        )

    current_features = build_features(
        task,
        train_impact=train_impact,
        overdue_days=overdue_days,
    )

    X = np.asarray(training_features, dtype=float)
    current = np.asarray([current_features], dtype=float)

    # Standardize features before anomaly detection.
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    current_scaled = scaler.transform(current)

    # Small, deterministic model for prototype/demo usage.
    contamination = min(
        0.25,
        max(0.05, 1.0 / max(len(X), 5)),
    )

    model = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=42,
    )

    model.fit(X_scaled)

    raw_score = float(model.decision_function(current_scaled)[0])
    prediction = int(model.predict(current_scaled)[0])

    risk_level, risk_score = _risk_from_score(raw_score)

    # Make confidence a conservative presentation metric rather than
    # pretending this is a calibrated probability.
    confidence = min(
        95,
        max(
            55,
            int(round(55 + abs(risk_score - 50) * 0.8)),
        ),
    )

    return {
        "model": "Isolation Forest",
        "model_type": "unsupervised_anomaly_detection",
        "risk_level": risk_level,
        "risk_score": risk_score,
        "confidence": confidence,
        "anomaly": prediction == -1,
        "raw_anomaly_score": round(raw_score, 4),
        "features": {
            "criticality": getattr(task, "criticality", "Medium"),
            "severity": getattr(task, "severity", "Medium"),
            "urgency": getattr(task, "urgency", "Medium"),
            "train_impact": int(train_impact),
            "overdue_days": int(overdue_days),
            "duration_minutes": int(
                getattr(task, "duration_minutes", 0) or 0
            ),
            "department": getattr(task, "department", "Track"),
        },
        "message": (
            "ML detected an operational profile that is unusual "
            "relative to the current maintenance workload."
            if prediction == -1
            else
            "ML profile is within the normal range of the current "
            "maintenance workload."
        ),
    }