from ortools.sat.python import cp_model

from .joint_blocks import tasks_can_share_joint_block


def time_to_minutes(value):
    """Convert a Python time object to minutes after midnight."""

    if value is None:
        return None

    return value.hour * 60 + value.minute


def normalize_section(section):
    """
    Normalize a railway section so both directions are treated
    as the same physical section.

    Example:
        RTM-NAD -> NAD-RTM
        NAD-RTM -> NAD-RTM
    """

    parts = section.split("-")

    if len(parts) != 2:
        return section

    return "-".join(sorted(parts))


def optimize_tasks(
    tasks,
    blocked_windows,
    available_windows,
):
    """
    Schedule maintenance tasks while considering:

    1. Train occupancy windows
    2. Corridor availability windows
    3. Conflicts between incompatible maintenance tasks
    4. Joint multi-department maintenance blocks

    Optimization objectives:

    1. Schedule high-priority tasks earlier
    2. Prefer completing the complete maintenance plan earlier
    3. Encourage compatible departments to work together
    """

    model = cp_model.CpModel()

    # 24-hour scheduling horizon.
    HORIZON = 24 * 60

    task_variables = {}

    # ---------------------------------------------------------
    # CREATE VARIABLES
    # ---------------------------------------------------------

    for task in tasks:

        task_id = task["id"]
        duration = task["duration_minutes"]

        # Decision variable:
        # When does this maintenance task start?
        start = model.NewIntVar(
            0,
            HORIZON - duration,
            f"start_{task_id}",
        )

        # Decision variable:
        # When does this maintenance task finish?
        end = model.NewIntVar(
            duration,
            HORIZON,
            f"end_{task_id}",
        )

        # Duration must remain fixed.
        model.Add(
            end == start + duration
        )

        task_variables[task_id] = {
            "start": start,
            "end": end,
            "section": normalize_section(
                task["section"]
            ),
        }

    # ---------------------------------------------------------
    # HARD CONSTRAINT 1:
    # MAINTENANCE CANNOT OVERLAP TRAIN MOVEMENT
    # ---------------------------------------------------------

    for task in tasks:

        task_id = task["id"]

        start = task_variables[task_id]["start"]
        end = task_variables[task_id]["end"]

        windows = blocked_windows.get(
            task_id,
            [],
        )

        for index, window in enumerate(windows):

            # Maintenance must either finish before
            # train occupancy starts...
            before = model.NewBoolVar(
                f"before_{task_id}_{index}"
            )

            # ...or start after train occupancy ends.
            after = model.NewBoolVar(
                f"after_{task_id}_{index}"
            )

            model.Add(
                end <= window["start_minute"]
            ).OnlyEnforceIf(before)

            model.Add(
                start >= window["end_minute"]
            ).OnlyEnforceIf(after)

            model.AddBoolOr(
                [before, after]
            )

    # ---------------------------------------------------------
    # HARD CONSTRAINT 2:
    # TASK MUST FIT INSIDE A VALID
    # CORRIDOR AVAILABILITY WINDOW
    # ---------------------------------------------------------

    for task in tasks:

        task_id = task["id"]

        start = task_variables[task_id]["start"]
        end = task_variables[task_id]["end"]

        corridor_windows = available_windows.get(
            task_id,
            [],
        )

        # No available corridor window means the task
        # cannot be scheduled.
        if not corridor_windows:

            model.Add(
                start >= HORIZON + 1
            )

        else:

            fits_in_window = []

            for index, window in enumerate(
                corridor_windows
            ):

                fits = model.NewBoolVar(
                    f"fits_corridor_{task_id}_{index}"
                )

                # Task starts after the available window begins.
                model.Add(
                    start >= window["available_from"]
                ).OnlyEnforceIf(fits)

                # Task finishes before the available window ends.
                model.Add(
                    end <= window["available_to"]
                ).OnlyEnforceIf(fits)

                fits_in_window.append(fits)

            # The task must fit completely inside
            # at least one available corridor window.
            model.AddBoolOr(
                fits_in_window
            )

    # ---------------------------------------------------------
    # HARD CONSTRAINT 3:
    # INCOMPATIBLE TASKS ON THE SAME PHYSICAL SECTION
    # CANNOT OVERLAP.
    #
    # COMPATIBLE MULTI-DEPARTMENT TASKS ARE ALLOWED
    # TO SHARE A JOINT BLOCK.
    # ---------------------------------------------------------

    for i in range(len(tasks)):

        for j in range(i + 1, len(tasks)):

            task_a = tasks[i]
            task_b = tasks[j]

            section_a = task_variables[
                task_a["id"]
            ]["section"]

            section_b = task_variables[
                task_b["id"]
            ]["section"]

            # Different physical sections can operate
            # simultaneously.
            if section_a != section_b:
                continue

            # Compatible departments may share
            # the same corridor block.
            if tasks_can_share_joint_block(
                task_a,
                task_b,
            ):
                continue

            start_a = task_variables[
                task_a["id"]
            ]["start"]

            end_a = task_variables[
                task_a["id"]
            ]["end"]

            start_b = task_variables[
                task_b["id"]
            ]["start"]

            end_b = task_variables[
                task_b["id"]
            ]["end"]

            # Either Task A finishes before Task B...
            a_before_b = model.NewBoolVar(
                f"a_before_b_{task_a['id']}_{task_b['id']}"
            )

            # ...or Task B finishes before Task A.
            b_before_a = model.NewBoolVar(
                f"b_before_a_{task_a['id']}_{task_b['id']}"
            )

            model.Add(
                end_a <= start_b
            ).OnlyEnforceIf(a_before_b)

            model.Add(
                end_b <= start_a
            ).OnlyEnforceIf(b_before_a)

            model.AddBoolOr(
                [
                    a_before_b,
                    b_before_a,
                ]
            )

    # ---------------------------------------------------------
    # OBJECTIVE
    # ---------------------------------------------------------

    # Makespan represents when the entire maintenance
    # schedule finishes.
    makespan = model.NewIntVar(
        0,
        HORIZON,
        "makespan",
    )

    for task in tasks:

        task_id = task["id"]

        end = task_variables[
            task_id
        ]["end"]

        model.Add(
            makespan >= end
        )

    # ---------------------------------------------------------
    # PRIORITY OBJECTIVE
    # ---------------------------------------------------------

    objective_terms = []

    for task in tasks:

        task_id = task["id"]
        priority = task["priority_score"]

        start = task_variables[
            task_id
        ]["start"]

        # Higher priority = larger penalty for
        # being scheduled late.
        objective_terms.append(
            start * priority
        )

    # ---------------------------------------------------------
    # JOINT BLOCK OBJECTIVE
    # ---------------------------------------------------------

    # For compatible tasks on the same section,
    # minimize the distance between their start times.
    #
    # This does not force them to start together,
    # but encourages CP-SAT to place them within
    # the same maintenance block whenever possible.

    joint_block_terms = []

    for i in range(len(tasks)):

        for j in range(i + 1, len(tasks)):

            task_a = tasks[i]
            task_b = tasks[j]

            if not tasks_can_share_joint_block(
                task_a,
                task_b,
            ):
                continue

            start_a = task_variables[
                task_a["id"]
            ]["start"]

            start_b = task_variables[
                task_b["id"]
            ]["start"]

            start_difference = model.NewIntVar(
                0,
                HORIZON,
                f"joint_difference_{task_a['id']}_{task_b['id']}",
            )

            model.AddAbsEquality(
                start_difference,
                start_a - start_b,
            )

            joint_block_terms.append(
                start_difference
            )

    # ---------------------------------------------------------
    # FINAL OBJECTIVE
    # ---------------------------------------------------------

    # CP-SAT minimizes:
    #
    # 1. Priority-weighted start times
    # 2. Overall completion time
    # 3. Distance between compatible task start times
    #
    # Therefore Kizuna tries to:
    #
    # - Schedule urgent/high-priority work earlier
    # - Finish the overall plan earlier
    # - Coordinate compatible departments into
    #   joint maintenance blocks

    model.Minimize(
        sum(objective_terms)
        + makespan * 10
        + sum(joint_block_terms) * 5
    )

    # ---------------------------------------------------------
    # SOLVE
    # ---------------------------------------------------------

    solver = cp_model.CpSolver()

    # Give CP-SAT up to 10 seconds to find
    # the best feasible solution.
    solver.parameters.max_time_in_seconds = 10

    status = solver.Solve(model)

    # No feasible solution.
    if status not in (
        cp_model.OPTIMAL,
        cp_model.FEASIBLE,
    ):
        return None

    # ---------------------------------------------------------
    # BUILD RESULTS
    # ---------------------------------------------------------

    results = []

    for task in tasks:

        task_id = task["id"]

        start = solver.Value(
            task_variables[task_id]["start"]
        )

        end = solver.Value(
            task_variables[task_id]["end"]
        )

        results.append({
            "task_id": task_id,
            "scheduled_start_minute": start,
            "scheduled_end_minute": end,
            "duration_minutes": (
                task["duration_minutes"]
            ),
            "priority_score": (
                task["priority_score"]
            ),
        })

    # Sort final plan chronologically.
    results.sort(
        key=lambda x: x["scheduled_start_minute"]
    )

    return results