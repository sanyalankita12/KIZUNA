from datetime import date, timedelta

from sqlalchemy.orm import Session

from ..models import MaintenanceTask
from .priority_engine import calculate_priority_score
from .train_impact import calculate_train_impact
from .joint_blocks import tasks_can_share_joint_block


def generate_planning_dates(
    start_date: date,
    number_of_days: int,
):
    """
    Generate consecutive dates for the planning horizon.
    """

    return [
        start_date + timedelta(days=i)
        for i in range(number_of_days)
    ]


def get_task_score(db: Session, task: MaintenanceTask):
    """
    Calculate the priority score and train impact
    for a maintenance task.
    """

    train_impact = calculate_train_impact(
        db,
        task.section_from,
        task.section_to,
    )

    priority_score = calculate_priority_score(
        criticality=task.criticality,
        severity=task.severity,
        urgency=task.urgency,
        train_impact=train_impact,
    )

    return priority_score, train_impact


def build_joint_groups(
    scored_tasks: list,
):
    """
    Group compatible maintenance tasks that can
    potentially be handled inside the same joint block.

    Rules:
    - Same physical section
    - Different compatible departments
    - Only one task from a department can be
      included in the same joint group
    """

    groups = []
    used_task_ids = set()

    for item in scored_tasks:

        task = item["task"]

        if task.id in used_task_ids:
            continue

        group = [item]

        used_task_ids.add(task.id)

        departments_in_group = {
            task.department
        }

        for other in scored_tasks:

            other_task = other["task"]

            if other_task.id in used_task_ids:
                continue

            # Do not put two tasks from the same
            # department into the same joint group.
            if other_task.department in departments_in_group:
                continue

            task_a = {
                "section": (
                    f"{task.section_from}-"
                    f"{task.section_to}"
                ),
                "department": task.department,
            }

            task_b = {
                "section": (
                    f"{other_task.section_from}-"
                    f"{other_task.section_to}"
                ),
                "department": other_task.department,
            }

            if not tasks_can_share_joint_block(
                task_a,
                task_b,
            ):
                continue

            # Make sure the new task is compatible
            # with EVERY existing task in the group.
            compatible_with_group = True

            for existing_item in group:

                existing_task = existing_item["task"]

                existing_for_check = {
                    "section": (
                        f"{existing_task.section_from}-"
                        f"{existing_task.section_to}"
                    ),
                    "department": (
                        existing_task.department
                    ),
                }

                if not tasks_can_share_joint_block(
                    existing_for_check,
                    task_b,
                ):
                    compatible_with_group = False
                    break

            if not compatible_with_group:
                continue

            group.append(other)
            used_task_ids.add(other_task.id)
            departments_in_group.add(
                other_task.department
            )

        groups.append(group)

    return groups


def distribute_tasks(
    db: Session,
    start_date: date,
    number_of_days: int,
):
    """
    Distribute pending maintenance tasks across
    the requested planning horizon.

    Compatible multi-department tasks are kept
    together so they can become joint blocks.
    """

    tasks = (
        db.query(MaintenanceTask)
        .filter(
            MaintenanceTask.status == "Pending"
        )
        .all()
    )

    if not tasks:
        return []

    scored_tasks = []

    for task in tasks:

        priority_score, train_impact = get_task_score(
            db,
            task,
        )

        scored_tasks.append({
            "task": task,
            "priority_score": priority_score,
            "train_impact": train_impact,
        })

    # Highest priority first
    scored_tasks.sort(
        key=lambda item: item["priority_score"],
        reverse=True,
    )

    planning_dates = generate_planning_dates(
        start_date,
        number_of_days,
    )

    # Build compatible task groups.
    joint_groups = build_joint_groups(
        scored_tasks
    )

    # Track total maintenance workload per day.
    daily_load = {
        planning_date: 0
        for planning_date in planning_dates
    }

    for group in joint_groups:

        # Total duration of all activities
        # in this potential joint group.
        group_duration = sum(
            item["task"].duration_minutes
            for item in group
        )

        # Choose the day with the lowest workload.
        selected_date = min(
            planning_dates,
            key=lambda planning_date: daily_load[
                planning_date
            ],
        )

        for item in group:

            task = item["task"]

            task.planned_date = selected_date

        daily_load[selected_date] += group_duration

    db.commit()

    return [
        {
            "task_id": item["task"].id,
            "title": item["task"].title,
            "department": item["task"].department,
            "section": (
                f"{item['task'].section_from}-"
                f"{item['task'].section_to}"
            ),
            "duration_minutes": (
                item["task"].duration_minutes
            ),
            "priority_score": item["priority_score"],
            "train_impact": item["train_impact"],
            "planned_date": (
                item["task"].planned_date.isoformat()
            ),
        }
        for item in scored_tasks
    ]