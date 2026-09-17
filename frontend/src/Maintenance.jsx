import React, { useEffect, useState } from 'react';

const Maintenance = () => {
  const [tasks, setTasks] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(false);

  // ============================================================
  // WHAT-IF SCENARIO STATE
  // ============================================================

  const [scenarioTraffic, setScenarioTraffic] = useState(1.2);
  const [scenarioOverdue, setScenarioOverdue] = useState(2);
  const [scenarioWindows, setScenarioWindows] = useState(1);
  const [scenarioResult, setScenarioResult] = useState(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);

  const [section, setSection] = useState('');
  const [department, setDepartment] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [criticality, setCriticality] = useState('Medium');
  const [severity, setSeverity] = useState('Medium');
  const [urgency, setUrgency] = useState('Medium');

  const token =
    localStorage.getItem('user_token') ||
    localStorage.getItem('admin_token');

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // ============================================================
  // LOAD DATA
  // ============================================================

  const loadData = async () => {
    try {
      const [taskRes, priorityRes] = await Promise.all([
        fetch('/api/maintenance', { headers }),
        fetch('/api/maintenance/priorities', { headers }),
      ]);

      if (!taskRes.ok || !priorityRes.ok) {
        throw new Error('Failed to load maintenance data');
      }

      setTasks(await taskRes.json());
      setPriorities(await priorityRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // ============================================================
  // PRIORITY HELPERS
  // ============================================================

  const getPriority = (priority) => {
    if (!priority) return 'Low';

    if (typeof priority === 'string') {
      return priority;
    }

    if (priority >= 75) return 'Critical';
    if (priority >= 50) return 'High';
    if (priority >= 30) return 'Medium';

    return 'Low';
  };

  const getPriorityData = (level) =>
    priorities.filter(
      (p) => getPriority(p.priority_level || p.priority_score) === level
    );

  const priorityColors = {
    Critical: 'bg-red-50 border-red-200 text-red-700',
    High: 'bg-orange-50 border-orange-200 text-orange-700',
    Medium: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    Low: 'bg-green-50 border-green-200 text-green-700',
  };

  const priorityBadge = (level) => {
    if (level === 'Critical') {
      return 'bg-red-100 text-red-700';
    }

    if (level === 'High') {
      return 'bg-orange-100 text-orange-700';
    }

    if (level === 'Medium') {
      return 'bg-yellow-100 text-yellow-700';
    }

    return 'bg-green-100 text-green-700';
  };

  // ============================================================
  // FACTOR HELPERS
  // ============================================================

  const formatFactorName = (name) => {
    const names = {
      criticality: 'Criticality',
      severity: 'Severity',
      urgency: 'Urgency',
      train_impact: 'Train Impact',
      failure_risk: 'Failure Risk',
      overdue_risk: 'Overdue Risk',
      traffic_density: 'Traffic Density',
      window_scarcity: 'Window Scarcity',
      duration_impact: 'Duration Impact',
    };

    return names[name] || name;
  };

  const getFactorMax = (name) => {
    const maxValues = {
      criticality: 18,
      severity: 14,
      urgency: 15,
      train_impact: 16,
      failure_risk: 12,
      overdue_risk: 7,
      traffic_density: 5,
      window_scarcity: 5,
      duration_impact: 3,
    };

    return maxValues[name] || 10;
  };

  // ============================================================
  // WINDOW ADJUSTMENT DISPLAY
  // ============================================================

  const getWindowAdjustment = (windows) => {
    if (Number(windows) <= 1) return 20;
    if (Number(windows) === 2) return 10;

    return 0;
  };

  // ============================================================
  // WHAT-IF SCENARIO
  // ============================================================

  const runScenario = async () => {
    if (!selectedTask) return;

    try {
      setScenarioLoading(true);
      setScenarioResult(null);

      const res = await fetch('/api/scenario/simulate', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: selectedTask.id,
          train_traffic_multiplier: Number(scenarioTraffic),
          additional_overdue_days: Number(scenarioOverdue),
          available_windows: Number(scenarioWindows),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to simulate scenario');
      }

      const data = await res.json();

      setScenarioResult(data);
    } catch (err) {
      console.error(err);
      alert('Could not simulate scenario');
    } finally {
      setScenarioLoading(false);
    }
  };

  // ============================================================
  // RESET SCENARIO
  // ============================================================

  const resetScenario = () => {
    setScenarioTraffic(1.2);
    setScenarioOverdue(2);
    setScenarioWindows(1);
    setScenarioResult(null);
  };

  // ============================================================
  // SUBMIT REQUEST
  // ============================================================

  const submitRequest = async () => {
    const [section_from, section_to] = section
      .trim()
      .split('-')
      .map((x) => x.trim());

    if (
      !section_from ||
      !section_to ||
      !department ||
      !duration ||
      !description
    ) {
      alert('Please fill all fields');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: section,
          description,
          section_from,
          section_to,
          department,
          criticality,
          severity,
          urgency,
          duration_minutes: Number(duration),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit request');
      }

      await loadData();

      setSection('');
      setDepartment('');
      setDuration('');
      setDescription('');
      setCriticality('Medium');
      setSeverity('Medium');
      setUrgency('Medium');
      setIsModalOpen(false);

      alert('Work slot request submitted successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // MARK WORK DONE
  // ============================================================

  const markWorkDone = async (taskId) => {
    try {
      const res = await fetch(`/api/maintenance/${taskId}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Completed',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update task');
      }

      await loadData();
      setSelectedTask(null);
      resetScenario();
    } catch (err) {
      console.error(err);
      alert('Could not mark work as completed');
    }
  };

  // ============================================================
  // DELETE TASK
  // ============================================================

  const deleteTask = async (taskId) => {
    const confirmDelete = window.confirm(
      'Delete this maintenance request? This action cannot be undone.'
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/maintenance/${taskId}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        throw new Error('Failed to delete task');
      }

      await loadData();
      setSelectedTask(null);
      resetScenario();
    } catch (err) {
      console.error(err);
      alert('Could not delete maintenance request');
    }
  };

  // ============================================================
  // OPEN TASK
  // ============================================================

  const openTask = (task) => {
    setSelectedTask(task);
    resetScenario();
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">

      {/* HEADER */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-[#fb7f1c]">
            MAINTENANCE
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Track & Infrastructure Tasks
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Risk-aware maintenance prioritization and operational impact analysis
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-[#fb7f1c] px-4 py-2 text-sm font-bold text-white hover:bg-[#e16f15]"
        >
          Request Work Slot
        </button>
      </div>

      {/* PRIORITY CARDS */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        {['Critical', 'High', 'Medium', 'Low'].map((level) => {
          const data = getPriorityData(level);

          return (
            <div
              key={level}
              className={`rounded-xl border p-5 ${priorityColors[level]}`}
            >
              <p className="text-xs font-bold uppercase">
                {level} Priority
              </p>

              <p className="mt-2 text-3xl font-extrabold">
                {data.length}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                maintenance tasks
              </p>
            </div>
          );
        })}
      </div>

      {/* PRIORITY INTELLIGENCE BANNER */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#fb7f1c]">
              PRIORITY INTELLIGENCE
            </p>

            <h2 className="mt-1 text-lg font-bold text-gray-900">
              Multi-factor maintenance risk assessment
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Priority combines asset risk, operational impact, urgency,
              traffic density, overdue risk and maintenance duration.
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 px-4 py-3 text-right">
            <p className="text-xs text-gray-500">
              Active pending tasks
            </p>

            <p className="text-2xl font-bold text-gray-900">
              {priorities.length}
            </p>
          </div>
        </div>
      </div>

      {/* TASK TABLE */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-4">Task</th>
              <th className="px-6 py-4">Section</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Impact</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {tasks.map((task) => {
              const p = priorities.find(
                (x) => x.task_id === task.id
              );

              const level = p
                ? getPriority(
                    p.priority_level || p.priority_score
                  )
                : 'Low';

              const completed =
                task.status?.toLowerCase() === 'completed';

              return (
                <tr
                  key={task.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => openTask(task)}
                >
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {task.title}
                  </td>

                  <td className="px-6 py-4 font-mono text-gray-600">
                    {task.section_from}-{task.section_to}
                  </td>

                  <td className="px-6 py-4">
                    {task.department}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${priorityBadge(
                        level
                      )}`}
                    >
                      {level} · {p?.priority_score ?? '-'}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-700">
                        {p?.train_impact ?? '-'} trains
                      </p>

                      {p?.overdue_days > 0 && (
                        <p className="mt-1 text-xs font-semibold text-red-600">
                          {p.overdue_days}d overdue
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        completed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {completed ? 'Work Done' : task.status}
                    </span>
                  </td>

                  <td
                    className="px-6 py-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex gap-2">
                      {!completed && (
                        <button
                          onClick={() => markWorkDone(task.id)}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700"
                        >
                          Work Done
                        </button>
                      )}

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {tasks.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-10 text-center text-sm text-gray-500"
                >
                  No maintenance tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ============================================================
          TASK DETAILS MODAL
      ============================================================ */}

      {selectedTask && (() => {
        const selectedPriority = priorities.find(
          (p) => p.task_id === selectedTask.id
        );

        const selectedLevel = selectedPriority
          ? getPriority(
              selectedPriority.priority_level ||
                selectedPriority.priority_score
            )
          : 'Low';

        const windowAdjustment =
          getWindowAdjustment(scenarioWindows);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-6"
            onClick={() => {
              setSelectedTask(null);
              resetScenario();
            }}
          >
            <div
              className="w-full max-w-5xl rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >

              {/* MODAL HEADER */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#fb7f1c]">
                    PRIORITY INTELLIGENCE
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-[#172b4d]">
                    Maintenance Details
                  </h2>
                </div>

                <button
                  onClick={() => {
                    setSelectedTask(null);
                    resetScenario();
                  }}
                  className="text-2xl text-gray-400 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              {/* TASK INFORMATION */}
              <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 md:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-500">Task</p>
                  <p className="truncate font-semibold text-gray-900">
                    {selectedTask.title}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Section</p>
                  <p className="font-mono text-gray-900">
                    {selectedTask.section_from}-{selectedTask.section_to}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="text-gray-900">
                    {selectedTask.department}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-gray-900">
                    {selectedTask.duration_minutes} minutes
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Criticality</p>
                  <p className="font-semibold text-gray-900">
                    {selectedTask.criticality}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Severity</p>
                  <p className="font-semibold text-gray-900">
                    {selectedTask.severity}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Urgency</p>
                  <p className="font-semibold text-gray-900">
                    {selectedTask.urgency}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-semibold text-gray-900">
                    {selectedTask.status}
                  </p>
                </div>

                <div className="col-span-2 md:col-span-4">
                  <p className="text-xs text-gray-500">Description</p>
                  <p className="text-sm text-gray-700">
                    {selectedTask.description}
                  </p>
                </div>
              </div>

              {/* ======================================================
                  EXISTING PRIORITY INTELLIGENCE
              ====================================================== */}

              {selectedPriority && (
                <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-5">

                  {/* OVERALL PRIORITY */}
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        Overall Priority
                      </p>

                      <div className="mt-2 flex items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${priorityBadge(
                            selectedLevel
                          )}`}
                        >
                          {selectedLevel}
                        </span>

                        <span className="text-3xl font-extrabold text-gray-900">
                          {selectedPriority.priority_score}
                          <span className="text-base font-semibold text-gray-400">
                            /100
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="rounded-lg bg-white px-4 py-3 text-right shadow-sm">
                      <p className="text-xs text-gray-500">
                        Train Impact
                      </p>

                      <p className="text-xl font-bold text-gray-900">
                        {selectedPriority.train_impact}
                      </p>

                      <p className="text-xs text-gray-500">
                        affected trains
                      </p>
                    </div>
                  </div>

                  {/* OVERDUE */}
                  {selectedPriority.overdue_days > 0 && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                      <p className="text-sm font-bold text-red-700">
                        Maintenance Overdue
                      </p>

                      <p className="mt-1 text-xs text-red-600">
                        This task is {selectedPriority.overdue_days} day
                        {selectedPriority.overdue_days > 1 ? 's' : ''} overdue,
                        increasing its operational priority.
                      </p>
                    </div>
                  )}

                  {/* ====================================================
                      EXISTING FACTOR BREAKDOWN
                  ==================================================== */}

                  {selectedPriority.priority_factors && (
                    <div className="mt-5">

                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          Why this priority?
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Explainable contribution of each operational factor
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
                        {Object.entries(
                          selectedPriority.priority_factors
                        ).map(([factor, value]) => {
                          const maxValue = getFactorMax(factor);

                          const percentage = Math.min(
                            100,
                            Math.round(
                              (Number(value) / maxValue) * 100
                            )
                          );

                          return (
                            <div key={factor}>
                              <div className="mb-1 flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-700">
                                  {formatFactorName(factor)}
                                </span>

                                <span className="text-xs font-bold text-gray-900">
                                  +{value}
                                </span>
                              </div>

                              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                                <div
                                  className="h-full rounded-full bg-[#fb7f1c]"
                                  style={{
                                    width: `${percentage}%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* PRIORITY MODEL */}
                      <div className="mt-4 rounded-lg bg-white px-4 py-3">
                        <p className="text-xs text-gray-500">
                          Priority model
                        </p>

                        <p className="mt-1 text-xs font-semibold text-gray-700">
                          Criticality + Severity + Urgency + Train Impact +
                          Failure Risk + Overdue Risk + Traffic Density +
                          Window Scarcity + Duration Impact
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ====================================================
                      WHAT-IF SCENARIO
                  ==================================================== */}

                  <div className="mt-5 rounded-xl border border-gray-200 bg-white p-5">

                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-[#fb7f1c]">
                          WHAT-IF SCENARIO
                        </p>

                        <h3 className="mt-1 text-sm font-bold text-gray-900">
                          Test changing operational conditions
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          Simulate how traffic, overdue days and available
                          maintenance windows can change operational priority.
                        </p>
                      </div>

                      <button
                        onClick={resetScenario}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-900"
                      >
                        Reset
                      </button>
                    </div>

                    {/* SCENARIO CONTROLS */}
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">

                      {/* TRAFFIC */}
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                          Train Traffic
                        </label>

                        <select
                          value={scenarioTraffic}
                          onChange={(e) =>
                            setScenarioTraffic(Number(e.target.value))
                          }
                          className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 outline-none"
                        >
                          <option value={1}>Current</option>
                          <option value={1.1}>+10%</option>
                          <option value={1.2}>+20%</option>
                          <option value={1.3}>+30%</option>
                        </select>
                      </div>

                      {/* OVERDUE */}
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                          Extra Overdue
                        </label>

                        <select
                          value={scenarioOverdue}
                          onChange={(e) =>
                            setScenarioOverdue(Number(e.target.value))
                          }
                          className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 outline-none"
                        >
                          <option value={0}>0 days</option>
                          <option value={1}>+1 day</option>
                          <option value={2}>+2 days</option>
                          <option value={3}>+3 days</option>
                          <option value={5}>+5 days</option>
                        </select>
                      </div>

                      {/* WINDOWS */}
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            Available Windows
                          </label>

                          {windowAdjustment > 0 && (
                            <span className="text-[10px] font-bold text-[#fb7f1c]">
                              +{windowAdjustment}% adjustment
                            </span>
                          )}
                        </div>

                        <select
                          value={scenarioWindows}
                          onChange={(e) =>
                            setScenarioWindows(Number(e.target.value))
                          }
                          className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 outline-none"
                        >
                          <option value={1}>1 window</option>
                          <option value={2}>2 windows</option>
                          <option value={3}>3 windows</option>
                          <option value={4}>4 windows</option>
                          <option value={5}>5 windows</option>
                        </select>
                      </div>
                    </div>

                    {/* WINDOW LOGIC EXPLANATION */}
                    <div className="mt-3 rounded-lg bg-orange-50 px-4 py-3">
                      <div className="flex flex-col justify-between gap-1 md:flex-row md:items-center">
                        <p className="text-xs font-semibold text-orange-800">
                          Window availability adjustment
                        </p>

                        <p className="text-xs font-bold text-orange-700">
                          {scenarioWindows <= 1
                            ? 'Limited availability · +20%'
                            : scenarioWindows === 2
                            ? 'Moderate availability · +10%'
                            : 'Sufficient availability · +0%'}
                        </p>
                      </div>

                      <p className="mt-1 text-[10px] leading-relaxed text-orange-700">
                        Fewer available maintenance windows increase scheduling
                        urgency because the opportunity to execute the work is
                        more constrained.
                      </p>
                    </div>

                    {/* SIMULATE BUTTON */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={runScenario}
                        disabled={scenarioLoading}
                        className="rounded-lg bg-[#172b4d] px-5 py-2 text-xs font-bold text-white hover:bg-[#0f2038] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {scenarioLoading
                          ? 'Simulating...'
                          : 'Simulate Scenario'}
                      </button>
                    </div>

                    {/* ==================================================
                        SCENARIO RESULT
                    ================================================== */}

                    {scenarioResult && (
                      <div className="mt-4">

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

                          {/* CURRENT */}
                          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                              Current
                            </p>

                            <p className="mt-1 text-2xl font-extrabold text-gray-900">
                              {scenarioResult.current_priority ??
                                scenarioResult.baseline_priority ??
                                scenarioResult.current_score ??
                                '—'}
                            </p>

                            <p className="text-[10px] text-gray-500">
                              priority score
                            </p>
                          </div>

                          {/* SIMULATED */}
                          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-orange-600">
                              Simulated
                            </p>

                            <p className="mt-1 text-2xl font-extrabold text-gray-900">
                              {scenarioResult.simulated_priority ??
                                scenarioResult.scenario_priority ??
                                scenarioResult.simulated_score ??
                                '—'}
                            </p>

                            <p className="text-[10px] text-gray-500">
                              priority score
                            </p>
                          </div>

                          {/* CHANGE */}
                          <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                              Priority Change
                            </p>

                            <p className="mt-1 text-2xl font-extrabold text-[#fb7f1c]">
                              {scenarioResult.priority_change !== undefined
                                ? `${scenarioResult.priority_change > 0 ? '+' : ''}${scenarioResult.priority_change}`
                                : scenarioResult.change !== undefined
                                ? `${scenarioResult.change > 0 ? '+' : ''}${scenarioResult.change}`
                                : '—'}
                            </p>

                            <p className="text-[10px] text-gray-500">
                              scenario impact
                            </p>
                          </div>
                        </div>

                        {/* SCENARIO DETAILS */}
                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">

                          <div className="rounded-lg bg-gray-50 px-4 py-3">
                            <p className="text-[10px] text-gray-400">
                              Train traffic
                            </p>

                            <p className="mt-1 text-sm font-bold text-gray-800">
                              {Math.round(
                                Number(scenarioTraffic) * 100
                              ) - 100 > 0
                                ? `+${Math.round(
                                    Number(scenarioTraffic) * 100
                                  ) - 100}%`
                                : 'Current'}
                            </p>
                          </div>

                          <div className="rounded-lg bg-gray-50 px-4 py-3">
                            <p className="text-[10px] text-gray-400">
                              Additional overdue
                            </p>

                            <p className="mt-1 text-sm font-bold text-gray-800">
                              +{scenarioOverdue} day
                              {scenarioOverdue !== 1 ? 's' : ''}
                            </p>
                          </div>

                          <div className="rounded-lg bg-gray-50 px-4 py-3">
                            <p className="text-[10px] text-gray-400">
                              Available windows
                            </p>

                            <p className="mt-1 text-sm font-bold text-gray-800">
                              {scenarioWindows}
                              {scenarioWindows === 1
                                ? ' window'
                                : ' windows'}
                            </p>
                          </div>
                        </div>

                        {/* EXPLANATION */}
                        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                          <p className="text-xs font-bold text-blue-800">
                            Scenario interpretation
                          </p>

                          <div className="mt-2 space-y-1 text-[10px] leading-relaxed text-blue-700">
                            {Number(scenarioTraffic) > 1 && (
                              <p>
                                • Higher train traffic increases operational
                                impact.
                              </p>
                            )}

                            {Number(scenarioOverdue) > 0 && (
                              <p>
                                • Additional overdue days increase maintenance
                                urgency.
                              </p>
                            )}

                            {Number(scenarioWindows) <= 2 && (
                              <p>
                                • Fewer available windows increase scheduling
                                scarcity.
                              </p>
                            )}

                            {Number(scenarioWindows) >= 3 &&
                              Number(scenarioTraffic) === 1 &&
                              Number(scenarioOverdue) === 0 && (
                                <p>
                                  • Current conditions indicate comparatively
                                  higher scheduling flexibility.
                                </p>
                              )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ACTIONS */}
              <div className="mt-5 flex gap-3">
                {selectedTask.status?.toLowerCase() !== 'completed' && (
                  <button
                    onClick={() => markWorkDone(selectedTask.id)}
                    className="flex-1 rounded-lg bg-green-600 py-2.5 font-bold text-white hover:bg-green-700"
                  >
                    Mark Work Done
                  </button>
                )}

                <button
                  onClick={() => deleteTask(selectedTask.id)}
                  className="flex-1 rounded-lg bg-red-100 py-2.5 font-bold text-red-700 hover:bg-red-200"
                >
                  Delete Request
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================
          REQUEST MODAL
      ============================================================ */}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between">
              <h2 className="text-xl font-bold text-[#172b4d]">
                Request Work Slot
              </h2>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-2xl text-gray-400"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-4">

              <input
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full rounded-lg border p-2.5 text-sm"
                placeholder="Block Section e.g. RTM-NAD"
              />

              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border p-2.5 text-sm"
              >
                <option value="">Select Department</option>
                <option>Track</option>
                <option>Signal</option>
                <option>Electrical</option>
              </select>

              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-lg border p-2.5 text-sm"
                placeholder="Duration in minutes"
                type="number"
              />

              <select
                value={criticality}
                onChange={(e) => setCriticality(e.target.value)}
                className="w-full rounded-lg border p-2.5 text-sm"
              >
                <option value="Low">Criticality: Low</option>
                <option value="Medium">Criticality: Medium</option>
                <option value="High">Criticality: High</option>
                <option value="Critical">Criticality: Critical</option>
              </select>

              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full rounded-lg border p-2.5 text-sm"
              >
                <option value="Low">Severity: Low</option>
                <option value="Medium">Severity: Medium</option>
                <option value="High">Severity: High</option>
                <option value="Critical">Severity: Critical</option>
              </select>

              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full rounded-lg border p-2.5 text-sm"
              >
                <option value="Low">Urgency: Low</option>
                <option value="Medium">Urgency: Medium</option>
                <option value="High">Urgency: High</option>
                <option value="Critical">Urgency: Critical</option>
              </select>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                className="w-full rounded-lg border p-2.5 text-sm"
                placeholder="Work description"
              />

              <button
                onClick={submitRequest}
                disabled={loading}
                className="w-full rounded-lg bg-[#fb7f1c] py-2.5 font-bold text-white disabled:opacity-60"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;