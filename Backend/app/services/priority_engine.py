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


def calculate_priority_score(
    criticality: str,
    severity: str,
    urgency: str,
    train_impact: int,
) -> int:

    criticality_score = CRITICALITY_WEIGHT.get(
        criticality, 1
    )

    severity_score = SEVERITY_WEIGHT.get(
        severity, 1
    )

    urgency_score = URGENCY_WEIGHT.get(
        urgency, 1
    )

    # At least 1 so that zero trains
    # don't completely eliminate task priority.
    impact_score = max(train_impact, 1)

    score = (
        criticality_score
        * severity_score
        * urgency_score
        * impact_score
    )

    return score