import React, { useState } from 'react';

const Optimization = () => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const runOptimization = async () => {
    setRunning(true);
    setError('');
    setResult(null);

    try {
      const token =
        localStorage.getItem('access_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('user_token') ||
        localStorage.getItem('admin_token');

      if (!token) {
        throw new Error('Please login again. Authentication token not found.');
      }

      const response = await fetch('/api/optimizer/run', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Optimization failed.');
      }

      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 font-sans">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#fb7f1c]">
          AUTOMATION
        </p>

        <h1 className="mt-1 text-3xl font-bold text-[#172b4d]">
          Conflict Resolution
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Autonomous Schedule Rebalancing Engine
            </h2>
          </div>

          <button
            onClick={runOptimization}
            disabled={running}
            className="px-5 py-2.5 bg-[#172b4d] text-white font-semibold text-sm rounded-lg hover:bg-[#203a67] transition-all disabled:opacity-50"
          >
            {running ? 'Running Solver...' : 'Run Optimization'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-700">
            Optimization Error
          </p>

          <p className="text-sm text-red-600 mt-1">
            {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-white rounded-xl border border-gray-200">
          <span className="text-xs text-gray-400 font-bold uppercase">
            Maintenance Tasks
          </span>

          <p className="text-3xl font-extrabold text-green-600 mt-2">
            {result ? result.total_tasks : '-'}
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-gray-200">
          <span className="text-xs text-gray-400 font-bold uppercase">
            Joint Blocks Found
          </span>

          <p className="text-3xl font-extrabold text-[#fb7f1c] mt-2">
            {result ? result.total_joint_blocks : '-'}
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-gray-200">
          <span className="text-xs text-gray-400 font-bold uppercase">
            Solver Status
          </span>

          <p className="text-3xl font-extrabold text-blue-600 mt-2">
            {result ? 'OPTIMIZED' : '-'}
          </p>
        </div>
      </div>

      {result && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#fb7f1c]">
              CP-SAT RESULT
            </p>

            <h2 className="text-xl font-bold text-[#172b4d] mt-1">
              Optimized Block Plan
            </h2>
          </div>

          <div className="space-y-4">
            {result.plan.map((task) => (
              <div
                key={task.task_id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-bold text-gray-800">
                      {task.title}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      {task.department} · {task.section}
                    </p>
                  </div>

                  <span className="font-mono font-bold text-[#172b4d]">
                    {task.scheduled_start} → {task.scheduled_end}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                  <span>
                    Priority: <b>{task.priority_score}</b>
                  </span>

                  <span>
                    Train Impact: <b>{task.train_impact}</b> trains
                  </span>

                  <span>
                    Duration: <b>{task.duration_minutes}</b> min
                  </span>
                </div>
              </div>
            ))}
          </div>

          {result.joint_blocks &&
            result.joint_blocks.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#fb7f1c]">
                  MULTI-DEPARTMENT COORDINATION
                </p>

                {result.joint_blocks.map((block) => (
                  <div
                    key={block.joint_block_id}
                    className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-4"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-[#172b4d]">
                          {block.joint_block_id}
                        </p>

                        <p className="text-sm text-gray-600">
                          {block.section}
                        </p>
                      </div>

                      <p className="font-mono font-bold text-[#fb7f1c]">
                        {block.block_start} → {block.block_end}
                      </p>
                    </div>

                    <div className="mt-3 flex gap-2 flex-wrap">
                      {block.departments.map((department) => (
                        <span
                          key={department}
                          className="px-3 py-1 rounded-full bg-white border border-orange-200 text-xs font-bold text-gray-700"
                        >
                          {department}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Optimization;