import React, { useEffect, useState } from 'react';

const Maintenance = () => {
  const [tasks, setTasks] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const getPriority = (score) => {
    if (score >= 400) return 'High';
    if (score >= 300) return 'Medium';
    return 'Low';
  };

  const getPriorityData = (level) =>
    priorities.filter(
      (p) => getPriority(p.priority_score) === level
    );

  const priorityColors = {
    High: 'bg-red-50 border-red-200 text-red-600',
    Medium: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    Low: 'bg-green-50 border-green-200 text-green-600',
  };

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
    } catch (err) {
      console.error(err);
      alert('Could not mark work as completed');
    }
  };

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
    } catch (err) {
      console.error(err);
      alert('Could not delete maintenance request');
    }
  };

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
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-[#fb7f1c] px-4 py-2 text-sm font-bold text-white hover:bg-[#e16f15]"
        >
          Request Work Slot
        </button>
      </div>

      {/* PRIORITY CARDS */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {['High', 'Medium', 'Low'].map((level) => {
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
                ? getPriority(p.priority_score)
                : 'Low';

              const completed =
                task.status?.toLowerCase() === 'completed';

              return (
                <tr
                  key={task.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedTask(task)}
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
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        level === 'High'
                          ? 'bg-red-100 text-red-700'
                          : level === 'Medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {level} · {p?.priority_score ?? '-'}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {p?.train_impact ?? '-'} trains
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

      {/* TASK DETAILS MODAL */}
      {selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#172b4d]">
                Maintenance Details
              </h2>

              <button
                onClick={() => setSelectedTask(null)}
                className="text-2xl text-gray-400"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Task</p>
                <p className="font-semibold">
                  {selectedTask.title}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Section</p>
                <p className="font-mono">
                  {selectedTask.section_from}-{selectedTask.section_to}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p>{selectedTask.department}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Description</p>
                <p>{selectedTask.description}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="font-semibold">
                  {selectedTask.status}
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
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
      )}

      {/* REQUEST MODAL */}
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