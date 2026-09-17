import React, { useEffect, useState } from 'react';

const Optimization = () => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const token =
    localStorage.getItem('user_token') ||
    localStorage.getItem('admin_token');

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const runOptimization = async () => {
    try {
      setRunning(true);
      setError('');

      const res = await fetch('/api/optimizer/run', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Optimization failed');
      }

      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not run optimization');
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    runOptimization();
  }, []);

  // The optimizer API returns scheduled tasks inside `plan`.
  const tasks =
    result?.plan ||
    result?.tasks ||
    result?.scheduled_tasks ||
    [];
  const jointBlocks =
    result?.joint_blocks ||
    result?.jointBlocks ||
    result?.blocks?.filter((b) => b.joint) ||
    [];

  const totalTasks =
    result?.total_tasks ??
    result?.totalTasks ??
    tasks.length;

  const totalJointBlocks =
    result?.total_joint_blocks ??
    result?.totalJointBlocks ??
    jointBlocks.length;

  const solverStatus =
    result?.solver_status ||
    result?.status ||
    (result ? 'OPTIMIZED' : '—');

  const normalizedStatus = String(solverStatus).toUpperCase();

  const departments = [
    ...new Set(
      jointBlocks.flatMap((block) =>
        block.departments ||
        block.department_names ||
        block.department
          ? Array.isArray(block.departments)
            ? block.departments
            : String(
                block.department_names ||
                  block.department ||
                  ''
              )
                  .split('+')
                  .map((x) => x.trim())
                  .filter(Boolean)
          : []
      )
    ),
  ];

  const sections = [
    ...new Set(
      jointBlocks
        .map(
          (block) =>
            block.section ||
            block.section_name ||
            block.corridor
        )
        .filter(Boolean)
    ),
  ];

  const insights = [];

  if (totalJointBlocks > 0) {
    insights.push(
      `${totalJointBlocks} joint maintenance block${
        totalJointBlocks > 1 ? 's were' : ' was'
      } created by coordinating compatible departmental work.`
    );

    const jointReason = jointBlocks[0]?.reason;
    if (jointReason) {
      insights.push(jointReason);
    }
  } else {
    insights.push(
      'No joint maintenance block was created in this optimization run.'
    );
  }

  if (totalTasks > 0) {
    insights.push(
      `${totalTasks} maintenance task${
        totalTasks > 1 ? 's were' : ' was'
      } processed against the available scheduling constraints.`
    );
  }

  if (sections.length > 0) {
    insights.push(
      `Joint work was consolidated on ${sections.join(', ')}.`
    );
  }

  const highestPriorityTask = [...tasks].sort(
    (a, b) =>
      Number(b.priority_score ?? 0) - Number(a.priority_score ?? 0)
  )[0];

  if (highestPriorityTask?.reason) {
    insights.push(
      `Priority-driven scheduling: ${highestPriorityTask.reason}`
    );
  }

  if (departments.length > 0) {
    insights.push(
      `Coordinated departments: ${departments.join(', ')}.`
    );
  }

  insights.push(
    'The optimizer considers task priority, train impact, corridor availability, duration and section conflicts.'
  );

  const getBlockTitle = (block, index) =>
    block.joint_block_id ||
    block.block_id ||
    block.id ||
    block.block ||
    `JB-${String(index + 1).padStart(3, '0')}`;

  const getBlockSection = (block) =>
    block.section ||
    block.section_name ||
    block.corridor ||
    (
      block.section_from && block.section_to
        ? `${block.section_from}-${block.section_to}`
        : '—'
    );

  const getBlockDepartments = (block) => {
    if (Array.isArray(block.departments)) {
      return block.departments.join(' + ');
    }

    return (
      block.department_names ||
      block.department ||
      block.departments ||
      'Joint work'
    );
  };

  const getBlockTime = (block) => {
    if (block.block_start && block.block_end) {
      return `${block.block_start} - ${block.block_end}`;
    }

    if (block.scheduled_start && block.scheduled_end) {
      return `${block.scheduled_start} - ${block.scheduled_end}`;
    }

    if (block.start_time && block.end_time) {
      return `${block.start_time} - ${block.end_time}`;
    }

    return block.time_slot || block.slot || 'Optimized';
  };

  const getTaskSection = (task) =>
    task.section ||
    (
      task.section_from && task.section_to
        ? `${task.section_from}-${task.section_to}`
        : '—'
    );

  const getTaskTime = (task) =>
    task.scheduled_start && task.scheduled_end
      ? `${task.scheduled_start} - ${task.scheduled_end}`
      : task.time_slot || task.slot || 'Optimized';

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 font-sans">
      {/* HEADER */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-[#fb7f1c]">
            AUTOMATION
          </p>

          <h1 className="mt-1 text-3xl font-bold text-[#172b4d]">
            Conflict Resolution
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Constraint-based block planning and coordinated maintenance optimization
          </p>
        </div>

        <button
          onClick={runOptimization}
          disabled={running}
          className="rounded-lg bg-[#172b4d] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#203a67] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? 'Running Solver...' : 'Run Optimization'}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* KPI CARDS */}
      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Maintenance Tasks
          </p>

          <p className="mt-2 text-3xl font-extrabold text-[#172b4d]">
            {totalTasks}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            processed by solver
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Joint Blocks Found
          </p>

          <p className="mt-2 text-3xl font-extrabold text-[#fb7f1c]">
            {totalJointBlocks}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            coordinated maintenance blocks
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Solver Status
          </p>

          <p className="mt-2 text-3xl font-extrabold text-green-600">
            {normalizedStatus}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            constraint optimization result
          </p>
        </div>
      </div>

      {/* SMART INSIGHTS */}
      {result && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#fb7f1c]">
                SMART INSIGHTS
              </p>

              <h2 className="mt-1 text-lg font-bold text-gray-900">
                Why this plan?
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Explainable summary of the optimization result
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 px-4 py-3 text-right">
              <p className="text-xs text-gray-500">
                Optimization engine
              </p>

              <p className="text-sm font-bold text-[#172b4d]">
                OR-Tools CP-SAT
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="flex gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <span className="mt-0.5 text-sm font-bold text-[#fb7f1c]">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <p className="text-sm font-medium leading-6 text-gray-700">
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* JOINT BLOCKS */}
      <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-widest text-[#fb7f1c]">
            COORDINATED WORK
          </p>

          <h2 className="mt-1 text-lg font-bold text-gray-900">
            Joint Maintenance Blocks
          </h2>
        </div>

        {jointBlocks.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {jointBlocks.map((block, index) => (
              <div
                key={`${getBlockTitle(block, index)}-${index}`}
                className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                      {getBlockTitle(block, index)}
                    </span>

                    <span className="font-mono text-sm font-semibold text-gray-800">
                      {getBlockSection(block)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-gray-700">
                    {getBlockDepartments(block)}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 px-4 py-3 text-left md:text-right">
                  <p className="text-xs text-gray-500">
                    Scheduled window
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#172b4d]">
                    {getBlockTime(block)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            Run optimization to generate coordinated blocks.
          </div>
        )}
      </div>

      {/* OPTIMIZED TASKS */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-widest text-[#fb7f1c]">
            SOLVER OUTPUT
          </p>

          <h2 className="mt-1 text-lg font-bold text-gray-900">
            Optimized Task Schedule
          </h2>
        </div>

        {tasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">Task</th>
                  <th className="px-6 py-4">Section</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Train Impact</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {tasks.map((task, index) => (
                  <tr
                    key={task.task_id || task.id || index}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {task.title || task.task || `Task ${index + 1}`}
                    </td>

                    <td className="px-6 py-4 font-mono text-gray-600">
                      {getTaskSection(task)}
                    </td>

                    <td className="px-6 py-4 text-gray-700">
                      {task.department || '—'}
                    </td>

                    <td className="px-6 py-4 font-semibold text-[#172b4d]">
                      {getTaskTime(task)}
                    </td>

                    <td className="px-6 py-4 text-gray-700">
                      {task.duration_minutes ?? '—'} min
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                        {task.priority_score ??
                          task.score ??
                          '—'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-700">
                      {task.train_impact ??
                        task.affected_trains ??
                        '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            No optimized tasks available yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default Optimization;
