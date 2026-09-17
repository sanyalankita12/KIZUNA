import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminPredictiveMaintenance = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('admin_token');

      const response = await fetch(
        '/api/admin/department-data',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          'Unable to load maintenance intelligence.'
        );
      }

      const data = await response.json();

      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.message ||
          'Unable to load maintenance intelligence.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const getRiskScore = (task) => {
    const value = Number(
      task.ml_risk_score ??
      task.risk_score ??
      task.priority_score ??
      0
    );

    return Number.isFinite(value) ? value : 0;
  };

  const getRiskLevel = (task) => {
    const level = String(
      task.ml_risk_level ??
      task.risk_level ??
      ''
    ).toLowerCase();

    if (level.includes('high')) {
      return 'High';
    }

    if (
      level.includes('moderate') ||
      level.includes('medium')
    ) {
      return 'Moderate';
    }

    if (level.includes('low')) {
      return 'Low';
    }

    const score = getRiskScore(task);

    if (score >= 70) return 'High';
    if (score >= 40) return 'Moderate';

    return 'Low';
  };

  const metrics = useMemo(() => {
    const high = tasks.filter(
      (task) => getRiskLevel(task) === 'High'
    ).length;

    const moderate = tasks.filter(
      (task) => getRiskLevel(task) === 'Moderate'
    ).length;

    const low = tasks.filter(
      (task) => getRiskLevel(task) === 'Low'
    ).length;

    const unusual = tasks.filter(
      (task) =>
        task.ml_anomaly === true ||
        task.anomaly === true
    ).length;

    const average =
      tasks.length > 0
        ? Math.round(
            tasks.reduce(
              (sum, task) =>
                sum + getRiskScore(task),
              0
            ) / tasks.length
          )
        : 0;

    return {
      total: tasks.length,
      high,
      moderate,
      low,
      unusual,
      average,
    };
  }, [tasks]);

  const departmentSummary = useMemo(() => {
    const map = {};

    tasks.forEach((task) => {
      const department =
        task.department || 'Unassigned';

      if (!map[department]) {
        map[department] = {
          department,
          count: 0,
          totalRisk: 0,
        };
      }

      map[department].count += 1;
      map[department].totalRisk +=
        getRiskScore(task);
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        averageRisk:
          item.count > 0
            ? Math.round(
                item.totalRisk / item.count
              )
            : 0,
      }))
      .sort(
        (a, b) =>
          b.averageRisk - a.averageRisk
      );
  }, [tasks]);

  const watchlist = useMemo(() => {
    return [...tasks]
      .sort(
        (a, b) =>
          getRiskScore(b) - getRiskScore(a)
      )
      .slice(0, 10);
  }, [tasks]);

  const riskStyle = (level) => {
    if (level === 'High') {
      return 'bg-red-50 text-red-700 border-red-200';
    }

    if (level === 'Moderate') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const handleTaskClick = (task) => {
    const id =
      task.task_id ??
      task.id;

    if (!id) return;

    navigate(
      `/admin/predictive-maintenance/${id}`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 font-sans">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#fb7f1c]">
              ADMINISTRATIVE RISK INTELLIGENCE
            </p>

            <h1 className="mt-1 text-3xl font-bold text-[#172b4d]">
              Predictive Maintenance
            </h1>

            <p className="mt-2 text-sm text-gray-500 max-w-3xl">
              Network-level visibility into maintenance risk,
              operational exposure and emerging task patterns.
            </p>
          </div>

          <button
            onClick={loadTasks}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[#fb7f1c] hover:text-[#fb7f1c]"
          >
            Refresh
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Tasks Under Review
            </p>

            <p className="mt-3 text-3xl font-bold text-gray-900">
              {loading ? '—' : metrics.total}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              High Risk
            </p>

            <p className="mt-3 text-3xl font-bold text-red-600">
              {loading ? '—' : metrics.high}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Unusual Patterns
            </p>

            <p className="mt-3 text-3xl font-bold text-amber-600">
              {loading ? '—' : metrics.unusual}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Overall Risk
            </p>

            <p className="mt-3 text-3xl font-bold text-[#172b4d]">
              {loading
                ? '—'
                : `${metrics.average}/100`}
            </p>
          </div>
        </div>

        {/* RISK DISTRIBUTION */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Network Risk Distribution
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Current distribution of maintenance tasks by
                assessed risk level.
              </p>
            </div>
          </div>

          <div className="mt-6 flex h-4 overflow-hidden rounded-full bg-gray-100">
            {metrics.total > 0 && (
              <>
                <div
                  className="bg-red-500"
                  style={{
                    width: `${(metrics.high / metrics.total) * 100}%`,
                  }}
                />

                <div
                  className="bg-amber-400"
                  style={{
                    width: `${(metrics.moderate / metrics.total) * 100}%`,
                  }}
                />

                <div
                  className="bg-emerald-500"
                  style={{
                    width: `${(metrics.low / metrics.total) * 100}%`,
                  }}
                />
              </>
            )}
          </div>

          <div className="mt-4 flex gap-7 text-sm">
            <span>
              <b className="text-red-600">
                {metrics.high}
              </b>{' '}
              High
            </span>

            <span>
              <b className="text-amber-600">
                {metrics.moderate}
              </b>{' '}
              Moderate
            </span>

            <span>
              <b className="text-emerald-600">
                {metrics.low}
              </b>{' '}
              Low
            </span>
          </div>
        </div>

        {/* DEPARTMENT VIEW */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              Department Risk View
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Maintenance risk exposure grouped by department.
            </p>
          </div>

          {departmentSummary.length === 0 ? (
            <p className="text-sm text-gray-500">
              No department-level data available.
            </p>
          ) : (
            <div className="space-y-5">
              {departmentSummary.map((item) => (
                <div key={item.department}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      {item.department}
                    </span>

                    <span className="text-sm font-bold text-gray-900">
                      {item.averageRisk}/100
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-[#172b4d]"
                      style={{
                        width: `${Math.min(
                          100,
                          item.averageRisk
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WATCHLIST */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-lg font-bold text-gray-900">
              Risk Watchlist
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select any task to open its detailed risk review.
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              Loading maintenance intelligence...
            </div>
          ) : watchlist.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              No maintenance tasks available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                      Maintenance
                    </th>

                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                      Section
                    </th>

                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                      Department
                    </th>

                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                      Priority
                    </th>

                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                      Risk
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {watchlist.map((task, index) => {
                    const riskLevel =
                      getRiskLevel(task);

                    const id =
                      task.task_id ??
                      task.id ??
                      index;

                    return (
                      <tr
                        key={id}
                        onClick={() =>
                          handleTaskClick(task)
                        }
                        className="cursor-pointer transition hover:bg-orange-50/40"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">
                            {task.title ||
                              `Maintenance Task #${id}`}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            Task ID: {id}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-600">
                          {task.section_from ||
                            '—'}

                          <span className="mx-1 text-gray-300">
                            →
                          </span>

                          {task.section_to ||
                            '—'}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-600">
                          {task.department ||
                            '—'}
                        </td>

                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                          {Math.round(
                            Number(
                              task.priority_score ??
                                0
                            )
                          )}
                          <span className="text-xs font-normal text-gray-400">
                            /100
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${riskStyle(
                              riskLevel
                            )}`}
                          >
                            {riskLevel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="mt-8 rounded-xl bg-[#172b4d] p-6 text-white shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-300">
            Administrative View
          </p>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-100">
            This view provides administrative visibility into
            maintenance risk across departments and railway
            sections, supporting coordinated review and planning.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPredictiveMaintenance;