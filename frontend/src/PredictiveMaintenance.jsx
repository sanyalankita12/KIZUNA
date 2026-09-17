import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PredictiveMaintenance = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRiskData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('user_token');

      const response = await fetch('/api/maintenance/priorities', {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      if (!response.ok) {
        throw new Error('Unable to load maintenance risk data.');
      }

      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to load risk data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiskData();
  }, []);

  const getRiskScore = (task) => {
    const value = Number(task.ml_risk_score);
    return Number.isFinite(value) ? value : 0;
  };

  const getRiskLevel = (task) => {
    const level = String(task.ml_risk_level || '').toLowerCase();

    if (level.includes('high')) return 'High';
    if (level.includes('moderate') || level.includes('medium')) {
      return 'Moderate';
    }

    if (level.includes('low')) return 'Low';

    const score = getRiskScore(task);

    if (score >= 70) return 'High';
    if (score >= 40) return 'Moderate';
    return 'Low';
  };

  const riskStyle = (level) => {
    if (level === 'High') {
      return 'bg-red-50 text-red-700 border-red-200';
    }

    if (level === 'Moderate') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const metrics = useMemo(() => {
    const total = tasks.length;

    const high = tasks.filter(
      (task) => getRiskLevel(task) === 'High'
    ).length;

    const moderate = tasks.filter(
      (task) => getRiskLevel(task) === 'Moderate'
    ).length;

    const low = tasks.filter(
      (task) => getRiskLevel(task) === 'Low'
    ).length;

    const anomalies = tasks.filter(
      (task) => task.ml_anomaly === true
    ).length;

    const average =
      total > 0
        ? Math.round(
            tasks.reduce(
              (sum, task) => sum + getRiskScore(task),
              0
            ) / total
          )
        : 0;

    return {
      total,
      high,
      moderate,
      low,
      anomalies,
      average,
    };
  }, [tasks]);

  const watchlist = useMemo(() => {
    return [...tasks]
      .sort((a, b) => {
        const riskDifference =
          getRiskScore(b) - getRiskScore(a);

        if (riskDifference !== 0) {
          return riskDifference;
        }

        return (
          Number(b.priority_score || 0) -
          Number(a.priority_score || 0)
        );
      })
      .slice(0, 8);
  }, [tasks]);

  const handleTaskClick = (task) => {
    navigate(`/predictive-maintenance/${task.task_id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 font-sans">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#fb7f1c]">
              MAINTENANCE INTELLIGENCE
            </p>

            <h1 className="mt-1 text-3xl font-bold text-[#172b4d]">
              Predictive Maintenance
            </h1>

            <p className="mt-2 text-sm text-gray-500 max-w-2xl">
              Identify emerging maintenance risk patterns and
              review asset-level operational exposure before
              intervention becomes critical.
            </p>
          </div>

          <button
            onClick={loadRiskData}
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

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 mb-8">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              High Risk
            </p>

            <div className="mt-3 flex items-end justify-between">
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '—' : metrics.high}
              </p>

              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                Immediate review
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Unusual Patterns
            </p>

            <div className="mt-3 flex items-end justify-between">
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '—' : metrics.anomalies}
              </p>

              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                Needs attention
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Overall Risk
            </p>

            <div className="mt-3 flex items-end justify-between">
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '—' : `${metrics.average}/100`}
              </p>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Current portfolio
              </span>
            </div>
          </div>
        </div>

        {/* RISK OVERVIEW */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Risk Overview
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Distribution of current maintenance tasks by
                assessed risk level.
              </p>
            </div>

            <div className="text-sm font-semibold text-gray-500">
              {metrics.total} active tasks
            </div>
          </div>

          <div className="mt-6">
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-100">
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

            <div className="mt-4 flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="text-gray-600">
                  High
                </span>
                <span className="font-bold text-gray-900">
                  {metrics.high}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="text-gray-600">
                  Moderate
                </span>
                <span className="font-bold text-gray-900">
                  {metrics.moderate}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-gray-600">
                  Low
                </span>
                <span className="font-bold text-gray-900">
                  {metrics.low}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* WATCHLIST */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-lg font-bold text-gray-900">
              Priority Watchlist
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select a maintenance task to open its detailed
              operational risk review.
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              Loading maintenance risk data...
            </div>
          ) : watchlist.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              No active maintenance tasks available.
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

                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                      Signal
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {watchlist.map((task) => {
                    const riskLevel = getRiskLevel(task);
                    const riskScore = getRiskScore(task);

                    return (
                      <tr
                        key={task.task_id}
                        onClick={() => handleTaskClick(task)}
                        className="cursor-pointer transition hover:bg-orange-50/40"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {task.title || `Task #${task.task_id}`}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              Task ID: {task.task_id}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-600">
                          {task.section_from || '—'}
                          <span className="mx-1 text-gray-300">
                            →
                          </span>
                          {task.section_to || '—'}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-600">
                          {task.department || '—'}
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900">
                            {Math.round(Number(task.priority_score || 0))}
                          </span>
                          <span className="text-xs text-gray-400">
                            /100
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-bold ${riskStyle(
                                riskLevel
                              )}`}
                            >
                              {riskLevel}
                            </span>

                            <span className="text-xs font-semibold text-gray-500">
                              {Math.round(riskScore)}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {task.ml_anomaly ? (
                            <span className="text-xs font-bold text-amber-700">
                              Unusual pattern
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">
                              Normal pattern
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FOOTER INSIGHT */}
        <div className="mt-8 rounded-xl bg-[#172b4d] p-6 text-white shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-300">
            Operational Insight
          </p>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-100">
            Risk assessment combines maintenance characteristics,
            operational exposure and observed task patterns to
            identify assets that may require earlier review.
            Selecting a task opens its complete risk assessment
            and operational context.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PredictiveMaintenance;