def normalize_section(section: str) -> str:
    """
    Treat RTM-NAD and NAD-RTM as the same
    physical railway section.
    """

    parts = section.split("-")

    if len(parts) != 2:
        return section

    return "-".join(sorted(parts))


# Configurable compatibility matrix.
#
# This is prototype logic. In production, these rules can be
# configured according to railway safety SOPs.
COMPATIBLE_DEPARTMENTS = {
    frozenset({"Track", "Signal"}),
    frozenset({"Track", "Electrical"}),
    frozenset({"Signal", "Electrical"}),
}


def departments_are_compatible(department_a: str, department_b: str) -> bool:
    """
    Check whether two different departments are allowed
    to work during the same joint maintenance block.
    """

    if department_a == department_b:
        return False

    pair = frozenset({
        department_a,
        department_b,
    })

    return pair in COMPATIBLE_DEPARTMENTS


def tasks_can_share_joint_block(task_a: dict, task_b: dict) -> bool:
    """
    Two tasks can share a joint block when:

    1. They belong to the same physical section.
    2. They belong to compatible departments.
    """

    section_a = normalize_section(task_a["section"])
    section_b = normalize_section(task_b["section"])

    if section_a != section_b:
        return False

    return departments_are_compatible(
        task_a["department"],
        task_b["department"],
    )