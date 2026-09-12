from ortools.sat.python import cp_model


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


def optimize_tasks(tasks, blocked_windows):
    """
    Schedule maintenance tasks while avoiding:

    1. Train occupancy windows
    2. Overlapping maintenance on the same railway section

    Optimization objectives:

    1. Schedule high-priority tasks earlier
    2. Prefer completing the complete maintenance plan earlier
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
            f"start_{task_id}"
        )

        # Decision variable:
        # When does this maintenance task finish?
        end = model.NewIntVar(
            duration,
            HORIZON,
            f"end_{task_id}"
        )

        # Duration must remain fixed.
        model.Add(
            end == start + duration
        )

        task_variables[task_id] = {
            "start": start,
            "end": end,
            "section": normalize_section(task["section"]),
        }

    # ---------------------------------------------------------
    # HARD CONSTRAINT 1:
    # Maintenance cannot overlap train movement.
    # ---------------------------------------------------------

    for task in tasks:

        task_id = task["id"]

        start = task_variables[task_id]["start"]
        end = task_variables[task_id]["end"]

        windows = blocked_windows.get(
            task_id,
            []
        )

        for index, window in enumerate(windows):

            # Option A:
            # Maintenance finishes before train arrives.
            before = model.NewBoolVar(
                f"before_{task_id}_{index}"
            )

            # Option B:
            # Maintenance starts after train leaves.
            after = model.NewBoolVar(
                f"after_{task_id}_{index}"
            )

            model.Add(
                end <= window["start_minute"]
            ).OnlyEnforceIf(before)

            model.Add(
                start >= window["end_minute"]
            ).OnlyEnforceIf(after)

            # At least one option must be true.
            #
            # Therefore:
            # maintenance BEFORE train
            # OR
            # maintenance AFTER train
            model.AddBoolOr(
                [before, after]
            )

    # ---------------------------------------------------------
    # HARD CONSTRAINT 2:
    # Tasks on the SAME railway section
    # cannot overlap.
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

            # Option A:
            # Task A finishes before Task B starts.
            a_before_b = model.NewBoolVar(
                f"a_before_b_{task_a['id']}_{task_b['id']}"
            )

            # Option B:
            # Task B finishes before Task A starts.
            b_before_a = model.NewBoolVar(
                f"b_before_a_{task_a['id']}_{task_b['id']}"
            )

            model.Add(
                end_a <= start_b
            ).OnlyEnforceIf(a_before_b)

            model.Add(
                end_b <= start_a
            ).OnlyEnforceIf(b_before_a)

            # At least one ordering must be true.
            #
            # Therefore two maintenance tasks on the
            # same railway section cannot overlap.
            model.AddBoolOr(
                [
                    a_before_b,
                    b_before_a
                ]
            )

    # ---------------------------------------------------------
    # OBJECTIVE
    # ---------------------------------------------------------

    # Makespan represents the time at which the
    # entire maintenance schedule finishes.
    makespan = model.NewIntVar(
        0,
        HORIZON,
        "makespan"
    )

    for task in tasks:

        task_id = task["id"]
        end = task_variables[task_id]["end"]

        # Makespan must be at least as late as
        # every maintenance task's end time.
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

        # Higher priority means a larger penalty
        # for starting late.
        objective_terms.append(
            start * priority
        )

    # ---------------------------------------------------------
    # FINAL OBJECTIVE
    # ---------------------------------------------------------

    # CP-SAT tries to minimize:
    #
    #     priority-weighted start times
    #              +
    #     overall schedule completion time
    #
    # This encourages:
    # 1. Important tasks to happen earlier
    # 2. The entire maintenance plan to finish sooner

    model.Minimize(
        sum(objective_terms)
        + makespan * 10
    )

    # ---------------------------------------------------------
    # SOLVE
    # ---------------------------------------------------------

    solver = cp_model.CpSolver()

    # Give CP-SAT up to 10 seconds to find
    # the best feasible solution.
    solver.parameters.max_time_in_seconds = 10

    status = solver.Solve(model)

    # If no feasible solution exists,
    # return None to the API layer.
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
            "duration_minutes": task["duration_minutes"],
            "priority_score": task["priority_score"],
        })

    # Sort the final plan chronologically.
    results.sort(
        key=lambda x: x["scheduled_start_minute"]
    )

    return results