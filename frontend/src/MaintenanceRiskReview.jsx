import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const MaintenanceRiskReview = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ============================================================
  // Detect whether this page is opened from the Admin route
  // ============================================================

  const isAdminRoute = window.location.pathname.startsWith(
    '/admin/'
  );

  const token = isAdminRoute
    ? localStorage.getItem('admin_token')
    : localStorage.getItem('user_token');

  const authHeaders = token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};

  // ============================================================
  // Load Task Risk Review
  // ============================================================

  useEffect(() => {
    const loadTaskReview = async () => {
      try {
        setLoading(true);
        setError('');

        let taskData = null;
        let priorityData = null;
        let conflictData = [];

        // ======================================================
        // ADMIN FLOW
        // ======================================================

        if (isAdminRoute) {
          const departmentResponse = await fetch(
            '/api/admin/department-data',
            {
              headers: authHeaders,
            }
          );

          if (!departmentResponse.ok) {
            if (
              departmentResponse.status === 401 ||
              departmentResponse.status === 403
            ) {
              throw new Error(
                'Admin authentication expired. Please login again.'
              );
            }

            throw new Error(
              'Maintenance task could not be loaded.'
            );
          }

          const departmentData =
            await departmentResponse.json();

          const allTasks = Array.isArray(departmentData)
            ? departmentData
            : [];

          const selectedTask = allTasks.find(
            (item) =>
              String(item.task_id ?? item.id) ===
              String(taskId)
          );

          if (!selectedTask) {
            throw new Error(
              'Maintenance task could not be loaded.'
            );
          }

          // Admin department-data already contains
          // maintenance + priority + ML risk information.
          taskData = selectedTask;

          priorityData = selectedTask;

          // Try to load conflicts with the admin token.
          // If the conflicts endpoint is user-only,
          // simply keep the task review usable.
          try {
            const conflictResponse = await fetch(
              `/api/maintenance/${taskId}/conflicts`,
              {
                headers: authHeaders,
              }
            );

            if (conflictResponse.ok) {
              const data =
                await conflictResponse.json();

              if (Array.isArray(data)) {
                conflictData = data;
              } else if (
                Array.isArray(data?.conflicts)
              ) {
                conflictData = data.conflicts;
              } else if (
                Array.isArray(data?.affected_trains)
              ) {
                conflictData = data.affected_trains;
              }
            }
          } catch (conflictError) {
            console.warn(
              'Admin conflict data unavailable:',
              conflictError
            );
          }
        }

        // ======================================================
        // USER FLOW
        // ======================================================

        else {
          const [
            taskResponse,
            priorityResponse,
            conflictResponse,
          ] = await Promise.all([
            fetch(`/api/maintenance/${taskId}`, {
              headers: authHeaders,
            }),

            fetch('/api/maintenance/priorities', {
              headers: authHeaders,
            }),

            fetch(
              `/api/maintenance/${taskId}/conflicts`,
              {
                headers: authHeaders,
              }
            ),
          ]);

          if (!taskResponse.ok) {
            if (
              taskResponse.status === 401 ||
              taskResponse.status === 403
            ) {
              throw new Error(
                'User authentication expired. Please login again.'
              );
            }

            throw new Error(
              'Maintenance task could not be loaded.'
            );
          }

          taskData = await taskResponse.json();

          if (priorityResponse.ok) {
            const allPriorities =
              await priorityResponse.json();

            priorityData = Array.isArray(
              allPriorities
            )
              ? allPriorities.find(
                  (item) =>
                    String(item.task_id) ===
                    String(taskId)
                )
              : null;
          }

          if (conflictResponse.ok) {
            const data =
              await conflictResponse.json();

            if (Array.isArray(data)) {
              conflictData = data;
            } else if (
              Array.isArray(data?.conflicts)
            ) {
              conflictData = data.conflicts;
            } else if (
              Array.isArray(data?.affected_trains)
            ) {
              conflictData = data.affected_trains;
            }
          }
        }

        // ======================================================
        // Final state
        // ======================================================

        setTask(taskData);
        setRiskData(priorityData);
        setConflicts(conflictData);
      } catch (err) {
        console.error(
          'Maintenance risk review error:',
          err
        );

        setError(
          err.message ||
            'Unable to load task risk review.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadTaskReview();
  }, [taskId, isAdminRoute]);

  // ============================================================
  // Calculated values
  // ============================================================

  const priorityScore = Number(
    riskData?.priority_score ??
      task?.priority_score ??
      0
  );

  const riskScore = Number(
    riskData?.ml_risk_score ?? 0
  );

  const trainImpact = Number(
    riskData?.train_impact ??
      task?.train_impact ??
      0
  );

  const overdueDays = Number(
    riskData?.overdue_days ?? 0
  );

  const riskLevel = useMemo(() => {
    const backendLevel = String(
      riskData?.ml_risk_level || ''
    ).toLowerCase();

    if (backendLevel.includes('high')) {
      return 'High';
    }

    if (
      backendLevel.includes('moderate') ||
      backendLevel.includes('medium')
    ) {
      return 'Moderate';
    }

    if (backendLevel.includes('low')) {
      return 'Low';
    }

    if (riskScore >= 70) return 'High';
    if (riskScore >= 40) return 'Moderate';

    return 'Low';
  }, [riskData, riskScore]);

  const priorityLevel =
    riskData?.priority_level ||
    task?.priority_level ||
    '—';

  const riskTheme = {
    High: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      bar: 'bg-red-500',
    },
    Moderate: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      bar: 'bg-amber-400',
    },
    Low: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      bar: 'bg-emerald-500',
    },
  }[riskLevel];

  const factorList = useMemo(() => {
    const factors = riskData?.priority_factors;

    if (!factors || typeof factors !== 'object') {
      return [];
    }

    return Object.entries(factors)
      .map(([name, value]) => ({
        name: name
          .replaceAll('_', ' ')
          .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
          ),
        value: Number(value) || 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [riskData]);

  const operationalAssessment = useMemo(() => {
    if (riskLevel === 'High') {
      return {
        title: 'Priority review recommended',
        text:
          'This task currently shows elevated maintenance risk and should receive closer operational review when planning the next available intervention window.',
      };
    }

    if (riskLevel === 'Moderate') {
      return {
        title: 'Monitor during planning',
        text:
          'The task shows a meaningful risk signal. Its operational exposure should be considered alongside available maintenance windows and competing work.',
      };
    }

    return {
      title: 'Routine monitoring',
      text:
        'Current indicators remain comparatively lower. Continue monitoring the task as operational conditions and maintenance urgency evolve.',
    };
  }, [riskLevel]);

  // ============================================================
  // Loading
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-8 font-sans">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
            Loading maintenance risk review...
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Error
  // ============================================================

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-8 font-sans">
        <div className="mx-auto max-w-7xl">
          <button
            onClick={() =>
              navigate(
                isAdminRoute
                  ? '/admin/predictive-maintenance'
                  : '/predictive-maintenance'
              )
            }
            className="mb-6 text-sm font-semibold text-[#fb7f1c] hover:underline"
          >
            ← Back to Predictive Maintenance
          </button>

          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error || 'Maintenance task not found.'}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 font-sans">
      <div className="mx-auto max-w-7xl">
        {/* TOP NAV */}
        <button
          onClick={() =>
            navigate(
              isAdminRoute
                ? '/admin/predictive-maintenance'
                : '/predictive-maintenance'
            )
          }
          className="mb-5 text-sm font-semibold text-gray-500 transition hover:text-[#fb7f1c]"
        >
          ← Back to Predictive Maintenance
        </button>

        {/* HEADER */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#fb7f1c]">
              MAINTENANCE RISK REVIEW
            </p>

            <h1 className="mt-1 text-3xl font-bold text-[#172b4d]">
              {task.title ||
                `Maintenance Task #${taskId}`}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Detailed operational assessment for maintenance
              task #{taskId}.
            </p>
          </div>

          <div
            className={`inline-flex items-center self-start rounded-full border px-4 py-2 text-sm font-bold ${riskTheme.bg} ${riskTheme.border} ${riskTheme.text}`}
          >
            {riskLevel} Risk
          </div>
        </div>

        {/* TASK PROFILE */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm mb-6">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-lg font-bold text-gray-900">
              Task Profile
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Current maintenance and operational attributes.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px bg-gray-200 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Section
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {task.section_from || '—'}
                <span className="mx-1 text-gray-300">
                  →
                </span>
                {task.section_to || '—'}
              </p>
            </div>

            <div className="bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Department
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {task.department || '—'}
              </p>
            </div>

            <div className="bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Duration
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {task.duration_minutes ?? '—'}
                {task.duration_minutes != null
                  ? ' min'
                  : ''}
              </p>
            </div>

            <div className="bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Planned Date
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {task.planned_date || 'Not planned'}
              </p>
            </div>

            <div className="bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Criticality
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {task.criticality || '—'}
              </p>
            </div>

            <div className="bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Severity
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {task.severity || '—'}
              </p>
            </div>

            <div className="bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Urgency
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {task.urgency || '—'}
              </p>
            </div>

            <div className="bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Status
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {task.status || 'Pending'}
              </p>
            </div>
          </div>
        </div>

        {/* RISK SUMMARY */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Risk Score
            </p>

            <div className="mt-3 flex items-end gap-2">
              <span className="text-4xl font-bold text-gray-900">
                {Math.round(riskScore)}
              </span>

              <span className="mb-1 text-sm text-gray-400">
                /100
              </span>
            </div>

            <div className="mt-5 h-2.5 rounded-full bg-gray-100">
              <div
                className={`h-2.5 rounded-full ${riskTheme.bar}`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, riskScore)
                  )}%`,
                }}
              />
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Current assessed maintenance risk.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Priority Score
            </p>

            <div className="mt-3 flex items-end gap-2">
              <span className="text-4xl font-bold text-gray-900">
                {Math.round(priorityScore)}
              </span>

              <span className="mb-1 text-sm text-gray-400">
                /100
              </span>
            </div>

            <p className="mt-3 text-sm font-semibold text-gray-700">
              Priority level: {priorityLevel}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Operational Exposure
            </p>

            <div className="mt-3 flex items-end gap-2">
              <span className="text-4xl font-bold text-gray-900">
                {trainImpact}
              </span>

              <span className="mb-1 text-sm text-gray-400">
                affected trains
              </span>
            </div>

            <p className="mt-3 text-sm text-gray-500">
              Overdue exposure: {overdueDays} day
              {overdueDays === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* ASSESSMENT */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
          <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">
              Risk Assessment
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Factors contributing to the current maintenance
              priority assessment.
            </p>

            {factorList.length > 0 ? (
              <div className="mt-6 space-y-5">
                {factorList.map((factor) => {
                  const width = Math.min(
                    100,
                    Math.max(0, factor.value)
                  );

                  return (
                    <div key={factor.name}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {factor.name}
                        </span>

                        <span className="text-sm font-bold text-gray-900">
                          {Math.round(factor.value)}
                        </span>
                      </div>

                      <div className="h-2 rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-[#172b4d]"
                          style={{
                            width: `${width}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 rounded-lg bg-gray-50 p-5 text-sm text-gray-500">
                Detailed factor information is not available
                for this task.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Current Assessment
            </p>

            <h3 className="mt-3 text-xl font-bold text-gray-900">
              {operationalAssessment.title}
            </h3>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              {operationalAssessment.text}
            </p>

            {riskData?.ml_anomaly && (
              <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Pattern Alert
                </p>

                <p className="mt-2 text-sm leading-5 text-amber-800">
                  This task shows an unusual pattern compared
                  with the current maintenance task population.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* DESCRIPTION */}
        {(task.description || riskData?.ml_message) && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              Review Notes
            </h2>

            {task.description && (
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Maintenance Description
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {task.description}
                </p>
              </div>
            )}

            {riskData?.ml_message && (
              <div className="mt-5 border-t border-gray-100 pt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Assessment Note
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {riskData.ml_message}
                </p>
              </div>
            )}
          </div>
        )}

        {/* CONFLICTS / OPERATIONAL IMPACT */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm mb-8">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-lg font-bold text-gray-900">
              Operational Impact
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Available conflict and affected-operation information
              for this maintenance task.
            </p>
          </div>

          {conflicts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {conflicts.slice(0, 8).map((conflict, index) => {
                const name =
                  conflict.train_name ||
                  conflict.train_number ||
                  conflict.name ||
                  conflict.train ||
                  `Affected operation ${index + 1}`;

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {name}
                      </p>

                      {conflict.departure_time && (
                        <p className="mt-1 text-xs text-gray-500">
                          Departure: {conflict.departure_time}
                        </p>
                      )}
                    </div>

                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                      Affected
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-8 text-sm text-gray-500">
              No additional conflict records are available for
              this task.
            </div>
          )}
        </div>

        {/* BOTTOM ACTION */}
        <div className="flex flex-col gap-4 rounded-xl bg-[#172b4d] p-6 text-white shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-300">
              Planning Context
            </p>

            <p className="mt-2 text-sm leading-6 text-blue-100">
              This review provides task-level risk and operational
              context for maintenance planning and block
              coordination.
            </p>
          </div>

          <button
            onClick={() =>
              navigate('/maintenance')
            }
            className="rounded-lg bg-[#fb7f1c] px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
          >
            Open Maintenance Tasks
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceRiskReview;