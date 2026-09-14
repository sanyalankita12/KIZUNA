from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import MaintenanceTask, User

from ..services.priority_engine import calculate_priority_score

from ..services.train_impact import (
    calculate_train_impact,
    get_affected_trains,
    get_section_occupancy_windows,
)

from ..services.corridor_availability import (
    calculate_available_windows,
)

from ..services.optimizer import optimize_tasks

from ..services.joint_blocks import (
    tasks_can_share_joint_block,
)


router = APIRouter(
    prefix="/api/optimizer",
    tags=["optimizer"],
)


def minutes_to_time_string(minutes: int):
    """Convert minutes after midnight to HH:MM."""

    hours = minutes // 60
    mins = minutes % 60

    return f"{hours:02d}:{mins:02d}"


def time_string_to_minutes(value: str):
    """Convert HH:MM into minutes after midnight."""

    hours, minutes = value.split(":")

    return int(hours) * 60 + int(minutes)


@router.post("/run")
def run_optimizer(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Run Kizuna's CP-SAT block planning optimizer.

    The optimizer considers:

    1. Maintenance priority
    2. Train impact
    3. Train occupancy
    4. Corridor availability
    5. Conflicts with other maintenance work
    6. Compatible multi-department joint blocks
    """

    # ---------------------------------------------------------
    # GET PENDING MAINTENANCE TASKS
    # ---------------------------------------------------------

    tasks = (
        db.query(MaintenanceTask)
        .filter(
            MaintenanceTask.status == "Pending"
        )
        .all()
    )

    if not tasks:
        raise HTTPException(
            status_code=400,
            detail="No pending maintenance tasks found.",
        )

    # ---------------------------------------------------------
    # DATA STRUCTURES FOR OPTIMIZER
    # ---------------------------------------------------------

    optimizer_tasks = []

    blocked_windows = {}

    available_windows = {}

    task_details = {}

    # ---------------------------------------------------------
    # PREPARE EVERY MAINTENANCE TASK
    # ---------------------------------------------------------

    for task in tasks:

        # -----------------------------------------------------
        # CALCULATE TRAIN IMPACT
        # -----------------------------------------------------

        train_impact = calculate_train_impact(
            db,
            task.section_from,
            task.section_to,
        )

        # -----------------------------------------------------
        # CALCULATE PRIORITY SCORE
        # -----------------------------------------------------

        priority_score = calculate_priority_score(
            criticality=task.criticality,
            severity=task.severity,
            urgency=task.urgency,
            train_impact=train_impact,
        )

        # -----------------------------------------------------
        # GET AFFECTED TRAINS
        # -----------------------------------------------------

        affected_trains = get_affected_trains(
            db,
            task.section_from,
            task.section_to,
        )

        # -----------------------------------------------------
        # GET TRAIN OCCUPANCY WINDOWS
        # -----------------------------------------------------

        occupancy = get_section_occupancy_windows(
            db,
            task.section_from,
            task.section_to,
        )

        # -----------------------------------------------------
        # CALCULATE CORRIDOR AVAILABILITY
        # -----------------------------------------------------

        corridor_windows = calculate_available_windows(
            db,
            task.section_from,
            task.section_to,
        )

        # -----------------------------------------------------
        # SEND TASK TO CP-SAT
        # -----------------------------------------------------

        optimizer_tasks.append({
            "id": task.id,

            "duration_minutes": (
                task.duration_minutes
            ),

            "priority_score": (
                priority_score
            ),

            "section": (
                f"{task.section_from}-"
                f"{task.section_to}"
            ),

            "department": task.department,
        })

        # -----------------------------------------------------
        # STORE TRAIN OCCUPANCY
        # -----------------------------------------------------

        blocked_windows[task.id] = occupancy

        # -----------------------------------------------------
        # STORE CORRIDOR AVAILABILITY
        # -----------------------------------------------------

        available_windows[task.id] = corridor_windows

        # -----------------------------------------------------
        # STORE EXTRA INFORMATION
        # FOR FINAL API RESPONSE
        # -----------------------------------------------------

        task_details[task.id] = {
            "title": task.title,

            "section": (
                f"{task.section_from}-"
                f"{task.section_to}"
            ),

            "department": task.department,

            "priority_score": (
                priority_score
            ),

            "train_impact": train_impact,

            "affected_trains": (
                affected_trains
            ),

            "corridor_windows": (
                corridor_windows
            ),
        }

    # ---------------------------------------------------------
    # RUN CP-SAT OPTIMIZER
    # ---------------------------------------------------------

    result = optimize_tasks(
        optimizer_tasks,
        blocked_windows,
        available_windows,
    )

    # ---------------------------------------------------------
    # HANDLE INFEASIBLE PLAN
    # ---------------------------------------------------------

    if result is None:
        raise HTTPException(
            status_code=409,
            detail=(
                "No feasible block plan could be "
                "found for the current tasks."
            ),
        )

    # ---------------------------------------------------------
    # BUILD FINAL PLAN
    # ---------------------------------------------------------

    final_plan = []

    for scheduled in result:

        task_id = scheduled["task_id"]

        details = task_details[task_id]

        start = scheduled[
            "scheduled_start_minute"
        ]

        end = scheduled[
            "scheduled_end_minute"
        ]

        # -----------------------------------------------------
        # FINAL RESPONSE OBJECT
        # -----------------------------------------------------

        final_plan.append({
            "task_id": task_id,

            "title": details["title"],

            "department": details["department"],

            "section": details["section"],

            "scheduled_start": (
                minutes_to_time_string(start)
            ),

            "scheduled_end": (
                minutes_to_time_string(end)
            ),

            "duration_minutes": (
                scheduled["duration_minutes"]
            ),

            "priority_score": (
                details["priority_score"]
            ),

            "train_impact": (
                details["train_impact"]
            ),

            "affected_trains": (
                details["affected_trains"]
            ),

            "reason": (
                f"Priority score "
                f"{details['priority_score']} was calculated "
                f"from criticality, severity, urgency, and "
                f"impact on {details['train_impact']} trains. "

                f"CP-SAT scheduled this task at "
                f"{minutes_to_time_string(start)} to "
                f"{minutes_to_time_string(end)} "

                f"inside a valid corridor availability window, "
                f"while avoiding train occupancy conflicts "
                f"and conflicts with other maintenance work "
                f"on the same section."
            ),
        })

    # ---------------------------------------------------------
    # BUILD JOINT BLOCKS
    # ---------------------------------------------------------

    joint_blocks = []

    joint_block_counter = 1

    for i in range(len(final_plan)):

        task_a = final_plan[i]

        for j in range(i + 1, len(final_plan)):

            task_b = final_plan[j]

            # -------------------------------------------------
            # CHECK DEPARTMENT + SECTION COMPATIBILITY
            # -------------------------------------------------

            task_a_for_check = {
                "section": task_a["section"],
                "department": task_a["department"],
            }

            task_b_for_check = {
                "section": task_b["section"],
                "department": task_b["department"],
            }

            if not tasks_can_share_joint_block(
                task_a_for_check,
                task_b_for_check,
            ):
                continue

            # -------------------------------------------------
            # CONVERT SCHEDULED TIMES TO MINUTES
            # -------------------------------------------------

            start_a = time_string_to_minutes(
                task_a["scheduled_start"]
            )

            end_a = time_string_to_minutes(
                task_a["scheduled_end"]
            )

            start_b = time_string_to_minutes(
                task_b["scheduled_start"]
            )

            end_b = time_string_to_minutes(
                task_b["scheduled_end"]
            )

            # -------------------------------------------------
            # CALCULATE ACTUAL OVERLAP
            # -------------------------------------------------

            overlap_start = max(
                start_a,
                start_b,
            )

            overlap_end = min(
                end_a,
                end_b,
            )

            # -------------------------------------------------
            # NO ACTUAL OVERLAP
            # -------------------------------------------------

            if overlap_start >= overlap_end:
                continue

            # -------------------------------------------------
            # CREATE JOINT BLOCK
            # -------------------------------------------------

            joint_block_id = (
                f"JB-{joint_block_counter:03d}"
            )

            joint_blocks.append({
                "joint_block_id": (
                    joint_block_id
                ),

                "section": (
                    task_a["section"]
                ),

                "block_start": (
                    minutes_to_time_string(
                        overlap_start
                    )
                ),

                "block_end": (
                    minutes_to_time_string(
                        overlap_end
                    )
                ),

                "departments": sorted([
                    task_a["department"],
                    task_b["department"],
                ]),

                "tasks": [
                    {
                        "task_id": (
                            task_a["task_id"]
                        ),

                        "title": (
                            task_a["title"]
                        ),

                        "department": (
                            task_a["department"]
                        ),
                    },

                    {
                        "task_id": (
                            task_b["task_id"]
                        ),

                        "title": (
                            task_b["title"]
                        ),

                        "department": (
                            task_b["department"]
                        ),
                    },
                ],

                "reason": (
                    "Compatible maintenance activities "
                    "from multiple departments were "
                    "scheduled over the same corridor "
                    "window and consolidated into a "
                    "joint block."
                ),
            })

            joint_block_counter += 1

    # ---------------------------------------------------------
    # FINAL API RESPONSE
    # ---------------------------------------------------------

    return {
        "status": "optimized",

        "total_tasks": len(final_plan),

        "total_joint_blocks": (
            len(joint_blocks)
        ),

        "joint_blocks": joint_blocks,

        "plan": final_plan,
    }