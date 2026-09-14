import React, { useEffect, useState } from 'react';

const PlanHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(false);

  const [planModal, setPlanModal] = useState(false);
  const [planData, setPlanData] = useState(null);

  const token =
    localStorage.getItem('user_token') ||
    localStorage.getItem('admin_token');

  const loadHistory = async () => {
    try {
      setLoading(true);

      const res = await fetch('/api/planning/tasks', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load planning history');
      }

      const data = await res.json();

      const tasks = Array.isArray(data)
        ? data
        : data.tasks || [];

      const grouped = {};

      tasks.forEach((task) => {
        const date =
          task.planned_date ||
          task.date ||
          'Unknown';

        if (!grouped[date]) {
          grouped[date] = 0;
        }

        grouped[date] += 1;
      });

      const formattedHistory = Object.entries(grouped)
        .sort(([dateA], [dateB]) =>
          dateB.localeCompare(dateA)
        )
        .map(([date, count], index) => ({
          id: `PLAN-${String(789 - index).padStart(3, '0')}`,
          date,
          executedBy: 'Ratlam Division',
          blocks: count,
          punctualityIndex: '—',
        }));

      setHistory(formattedHistory);
    } catch (err) {
      console.error(err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const runPlanning = async (type) => {
    try {
      setPlanning(true);

      const res = await fetch(`/api/planning/${type}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();

      // Save generated plan for popup
      setPlanData(data);

      // Open popup
      setPlanModal(true);

      // Refresh history table
      await loadHistory();

    } catch (err) {
      console.error(err);
      alert('Failed to generate planning.');
    } finally {
      setPlanning(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 font-sans">

      {/* HEADER */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#fb7f1c]">
            ARCHIVE
          </p>

          <h1 className="mt-1 text-3xl font-bold text-[#172b4d]">
            Historical Operations & Blocks
          </h1>
        </div>

        <div className="flex gap-3">

          <button
            onClick={() => runPlanning('weekly')}
            disabled={planning}
            className="rounded-lg bg-[#172b4d] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {planning
              ? 'Planning...'
              : 'Generate Weekly Plan'}
          </button>

          <button
            onClick={() => runPlanning('monthly')}
            disabled={planning}
            className="rounded-lg bg-[#fb7f1c] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {planning
              ? 'Planning...'
              : 'Generate Monthly Plan'}
          </button>

        </div>
      </div>

      {/* HISTORY TABLE */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <table className="w-full text-left text-sm">

          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-6 py-4">
                Plan Run ID
              </th>

              <th className="px-6 py-4">
                Date
              </th>

              <th className="px-6 py-4">
                Execution Base
              </th>

              <th className="px-6 py-4">
                Executed Blocks
              </th>

              <th className="px-6 py-4">
                Punctuality Score
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">

            {loading ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-10 text-center text-gray-500"
                >
                  Loading planning history...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-10 text-center text-gray-500"
                >
                  No planning history found.
                </td>
              </tr>
            ) : (
              history.map((h) => (
                <tr
                  key={h.id}
                  className="transition hover:bg-gray-50"
                >

                  <td className="px-6 py-4 font-mono font-bold text-gray-900">
                    {h.id}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {h.date}
                  </td>

                  <td className="px-6 py-4 text-gray-800">
                    {h.executedBy}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {h.blocks}{' '}
                    {h.blocks === 1
                      ? 'block'
                      : 'blocks'}
                  </td>

                  <td className="px-6 py-4 font-semibold text-green-700">
                    {h.punctualityIndex}
                  </td>

                </tr>
              ))
            )}

          </tbody>
        </table>
      </div>

      {/* PLAN POPUP */}
      {planModal && planData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPlanModal(false)}
        >

          <div
            className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* POPUP HEADER */}
            <div className="flex items-center justify-between border-b px-6 py-5">

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#fb7f1c]">
                  {planData.horizon === 'monthly'
                    ? 'MONTHLY PLAN'
                    : 'WEEKLY PLAN'}
                </p>

                <h2 className="mt-1 text-2xl font-bold text-[#172b4d]">
                  {planData.horizon === 'monthly'
                    ? 'Monthly Maintenance Plan'
                    : 'Weekly Maintenance Plan'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {planData.start_date} → {planData.end_date}
                </p>
              </div>

              <button
                onClick={() => setPlanModal(false)}
                className="text-3xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>

            </div>

            {/* SUMMARY */}
            <div className="grid grid-cols-3 gap-4 border-b bg-gray-50 px-6 py-4">

              <div className="rounded-lg bg-white p-3">
                <p className="text-xs text-gray-500">
                  Horizon
                </p>

                <p className="mt-1 font-bold capitalize text-[#172b4d]">
                  {planData.horizon}
                </p>
              </div>

              <div className="rounded-lg bg-white p-3">
                <p className="text-xs text-gray-500">
                  Total Tasks
                </p>

                <p className="mt-1 font-bold text-[#172b4d]">
                  {planData.total_tasks}
                </p>
              </div>

              <div className="rounded-lg bg-white p-3">
                <p className="text-xs text-gray-500">
                  Planning Days
                </p>

                <p className="mt-1 font-bold text-[#172b4d]">
                  {planData.days?.length || 0}
                </p>
              </div>

            </div>

            {/* SCROLLABLE PLAN */}
            <div className="max-h-[65vh] overflow-y-auto px-6 py-5">

              {planData.days?.map((day, index) => (

                <div
                  key={day.date}
                  className="mb-5 rounded-xl border border-gray-200 bg-white shadow-sm"
                >

                  {/* DAY HEADER */}
                  <div className="flex items-center justify-between rounded-t-xl bg-gray-50 px-5 py-4">

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[#fb7f1c]">
                        Day {index + 1}
                      </p>

                      <h3 className="mt-1 text-lg font-bold text-[#172b4d]">
                        {day.date}
                      </h3>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        Tasks
                      </p>

                      <p className="font-bold text-[#172b4d]">
                        {day.total_tasks}
                      </p>
                    </div>

                  </div>

                  {/* DAY SUMMARY */}
                  <div className="border-b px-5 py-3 text-sm text-gray-500">
                    Total Duration:{' '}
                    <b className="text-gray-800">
                      {day.total_duration_minutes} min
                    </b>
                  </div>

                  {/* TASKS */}
                  <div className="p-4">

                    {day.tasks?.length === 0 ? (

                      <p className="py-3 text-center text-sm text-gray-400">
                        No maintenance tasks planned
                      </p>

                    ) : (

                      <div className="space-y-3">

                        {day.tasks.map((task) => (

                          <div
                            key={task.task_id}
                            className="rounded-lg border border-gray-200 p-4"
                          >

                            <div className="flex items-start justify-between gap-4">

                              <div>

                                <p className="font-mono text-xs font-bold text-gray-400">
                                  TASK-{String(task.task_id).padStart(3, '0')}
                                </p>

                                <h4 className="mt-1 font-bold text-[#172b4d]">
                                  {task.title}
                                </h4>

                              </div>

                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                Planned
                              </span>

                            </div>

                            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">

                              <div>
                                <p className="text-gray-400">
                                  Section
                                </p>

                                <p className="mt-1 font-semibold text-gray-800">
                                  {task.section}
                                </p>
                              </div>

                              <div>
                                <p className="text-gray-400">
                                  Department
                                </p>

                                <p className="mt-1 font-semibold text-gray-800">
                                  {task.department}
                                </p>
                              </div>

                              <div>
                                <p className="text-gray-400">
                                  Duration
                                </p>

                                <p className="mt-1 font-semibold text-gray-800">
                                  {task.duration_minutes} min
                                </p>
                              </div>

                            </div>

                          </div>

                        ))}

                      </div>

                    )}

                  </div>

                </div>

              ))}

            </div>

            {/* POPUP FOOTER */}
            <div className="flex justify-end border-t px-6 py-4">

              <button
                onClick={() => setPlanModal(false)}
                className="rounded-lg bg-[#172b4d] px-5 py-2 text-sm font-bold text-white"
              >
                Close Plan
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PlanHistory;