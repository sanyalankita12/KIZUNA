SEVERITY_WEIGHT = {
    "Low": 1,
    "Medium": 2,
    "High": 3,
    "Critical": 4,
}

URGENCY_WEIGHT = {
    "Low": 1,
    "Medium": 2,
    "High": 3,
    "Critical": 4,
}

CRITICALITY_WEIGHT = {
    "Low": 1,
    "Medium": 2,
    "High": 3,
    "Critical": 4,
}

FACTOR_WEIGHTS = {
    "criticality": 18,
    "severity": 14,
    "urgency": 15,
    "train_impact": 16,
    "failure_risk": 12,
    "overdue_risk": 7,
    "traffic_density": 5,
    "window_scarcity": 5,
    "duration_impact": 3,
}


def _clamp(
    value: float,
    minimum: float = 0,
    maximum: float = 1,
) -> float:
    """
    Keep a value between minimum and maximum.
    """
    return max(minimum, min(value, maximum))


def _normalize_level(value: str) -> float:
    """
    Convert Low/Medium/High/Critical into a 0-1 range.
    """
    score = {
        "Low": 1,
        "Medium": 2,
        "High": 3,
        "Critical": 4,
    }.get(value, 1)

    return (score - 1) / 3


def _factor_score(
    value: float,
    weight: int,
) -> int:
    """
    Convert a normalized 0-1 factor into its weighted contribution.
    """
    return round(_clamp(value) * weight)


def calculate_failure_risk(
    criticality: str,
    severity: str,
) -> float:

    criticality_score = _normalize_level(criticality)
    severity_score = _normalize_level(severity)

    return (
        criticality_score * 0.6
        + severity_score * 0.4
    )


def calculate_overdue_risk(
    overdue_days: int = 0,
) -> float:

    overdue_days = max(overdue_days, 0)

    return _clamp(
        overdue_days / 10
    )


def calculate_traffic_density(
    train_impact: int,
    reference_trains: int = 25,
) -> float:

    train_impact = max(train_impact, 0)
    reference_trains = max(reference_trains, 1)

    return _clamp(
        train_impact / reference_trains
    )


def calculate_window_scarcity(
    available_windows: int = 1,
) -> float:
    """
    Calculate normalized window scarcity.

    Fewer available maintenance windows means
    higher scheduling scarcity.
    """

    if available_windows <= 0:
        return 1.0

    if available_windows == 1:
        return 0.75

    if available_windows == 2:
        return 0.50

    if available_windows == 3:
        return 0.25

    return 0.10


def calculate_window_adjustment(
    available_windows: int = 1,
) -> float:
    """
    Adjustable maintenance-window priority modifier.

    1 window  -> +20%
    2 windows -> +10%
    3+ windows -> +0%

    This is an operational scheduling adjustment,
    not an ML prediction.
    """

    if available_windows <= 1:
        return 0.20

    if available_windows == 2:
        return 0.10

    return 0.0


def calculate_duration_impact(
    duration_minutes: int,
    reference_duration: int = 120,
) -> float:

    duration_minutes = max(duration_minutes, 0)
    reference_duration = max(reference_duration, 1)

    return _clamp(
        duration_minutes / reference_duration
    )


def calculate_priority_breakdown(
    criticality: str,
    severity: str,
    urgency: str,
    train_impact: int,
    overdue_days: int = 0,
    failure_risk: float | None = None,
    traffic_density: float | None = None,
    available_windows: int = 1,
    duration_minutes: int = 60,
) -> dict:

    criticality_factor = _normalize_level(
        criticality
    )

    severity_factor = _normalize_level(
        severity
    )

    urgency_factor = _normalize_level(
        urgency
    )

    train_impact_factor = _clamp(
        max(train_impact, 0) / 25
    )

    if failure_risk is None:
        failure_risk = calculate_failure_risk(
            criticality=criticality,
            severity=severity,
        )

    failure_risk = _clamp(
        failure_risk
    )

    overdue_factor = calculate_overdue_risk(
        overdue_days
    )

    if traffic_density is None:
        traffic_density = calculate_traffic_density(
            train_impact=train_impact
        )

    traffic_density = _clamp(
        traffic_density
    )

    window_scarcity_factor = calculate_window_scarcity(
        available_windows=available_windows
    )

    duration_factor = calculate_duration_impact(
        duration_minutes=duration_minutes
    )

    criticality_score = _factor_score(
        criticality_factor,
        FACTOR_WEIGHTS["criticality"],
    )

    severity_score = _factor_score(
        severity_factor,
        FACTOR_WEIGHTS["severity"],
    )

    urgency_score = _factor_score(
        urgency_factor,
        FACTOR_WEIGHTS["urgency"],
    )

    train_impact_score = _factor_score(
        train_impact_factor,
        FACTOR_WEIGHTS["train_impact"],
    )

    failure_risk_score = _factor_score(
        failure_risk,
        FACTOR_WEIGHTS["failure_risk"],
    )

    overdue_risk_score = _factor_score(
        overdue_factor,
        FACTOR_WEIGHTS["overdue_risk"],
    )

    traffic_density_score = _factor_score(
        traffic_density,
        FACTOR_WEIGHTS["traffic_density"],
    )

    window_scarcity_score = _factor_score(
        window_scarcity_factor,
        FACTOR_WEIGHTS["window_scarcity"],
    )

    duration_impact_score = _factor_score(
        duration_factor,
        FACTOR_WEIGHTS["duration_impact"],
    )

    # ---------------------------------------------------------
    # Base Priority Score
    # ---------------------------------------------------------

    base_priority_score = (
        criticality_score
        + severity_score
        + urgency_score
        + train_impact_score
        + failure_risk_score
        + overdue_risk_score
        + traffic_density_score
        + window_scarcity_score
        + duration_impact_score
    )

    # ---------------------------------------------------------
    # Adjustable Window Priority
    #
    # 1 window  -> +20%
    # 2 windows -> +10%
    # 3+ windows -> +0%
    # ---------------------------------------------------------

    window_adjustment_factor = calculate_window_adjustment(
        available_windows=available_windows
    )

    window_adjustment_score = round(
        base_priority_score * window_adjustment_factor
    )

    priority_score = (
        base_priority_score
        + window_adjustment_score
    )

    # Guarantee 0-100 range.
    priority_score = max(
        0,
        min(priority_score, 100)
    )

    # ---------------------------------------------------------
    # Priority Level
    # ---------------------------------------------------------

    if priority_score >= 75:
        priority_level = "Critical"

    elif priority_score >= 50:
        priority_level = "High"

    elif priority_score >= 30:
        priority_level = "Medium"

    else:
        priority_level = "Low"

    # ---------------------------------------------------------
    # Explainable Factors
    # ---------------------------------------------------------

    factors = {
        "criticality": criticality_score,
        "severity": severity_score,
        "urgency": urgency_score,
        "train_impact": train_impact_score,
        "failure_risk": failure_risk_score,
        "overdue_risk": overdue_risk_score,
        "traffic_density": traffic_density_score,
        "window_scarcity": window_scarcity_score,
        "duration_impact": duration_impact_score,
    }

    return {
        "priority_score": priority_score,
        "priority_level": priority_level,

        # Existing explainable factors
        "factors": factors,

        # New innovation feature
        "base_priority_score": base_priority_score,
        "window_adjustment_percent": round(
            window_adjustment_factor * 100
        ),
        "window_adjustment_score": window_adjustment_score,
        "available_windows": max(
            available_windows,
            0,
        ),
    }


def calculate_priority_score(
    criticality: str,
    severity: str,
    urgency: str,
    train_impact: int,
    overdue_days: int = 0,
    failure_risk: float | None = None,
    traffic_density: float | None = None,
    available_windows: int = 1,
    duration_minutes: int = 60,
) -> int:

    result = calculate_priority_breakdown(
        criticality=criticality,
        severity=severity,
        urgency=urgency,
        train_impact=train_impact,
        overdue_days=overdue_days,
        failure_risk=failure_risk,
        traffic_density=traffic_density,
        available_windows=available_windows,
        duration_minutes=duration_minutes,
    )

    return result["priority_score"]


def calculate_priority_details(
    criticality: str,
    severity: str,
    urgency: str,
    train_impact: int,
    overdue_days: int = 0,
    failure_risk: float | None = None,
    traffic_density: float | None = None,
    available_windows: int = 1,
    duration_minutes: int = 60,
) -> dict:

    return calculate_priority_breakdown(
        criticality=criticality,
        severity=severity,
        urgency=urgency,
        train_impact=train_impact,
        overdue_days=overdue_days,
        failure_risk=failure_risk,
        traffic_density=traffic_density,
        available_windows=available_windows,
        duration_minutes=duration_minutes,
    )


def calculate_defect_priority_score(
    criticality: str,
    severity: str,
    train_impact: int,
    overdue_days: int,
) -> int:

    result = calculate_priority_breakdown(
        criticality=criticality,
        severity=severity,
        urgency=severity,
        train_impact=train_impact,
        overdue_days=overdue_days,
        duration_minutes=30,
    )

    return result["priority_score"]


def calculate_defect_priority_details(
    criticality: str,
    severity: str,
    train_impact: int,
    overdue_days: int,
) -> dict:
    """
    Detailed explainable defect priority response.
    """

    return calculate_priority_breakdown(
        criticality=criticality,
        severity=severity,
        urgency=severity,
        train_impact=train_impact,
        overdue_days=overdue_days,
        duration_minutes=30,
    )