import React, { useEffect, useState } from 'react';

const AdminData = () => {
  const [tasks, setTasks] = useState([]);
  const [synced, setSynced] = useState(false);

  const loadData = async () => {
    const token = localStorage.getItem('admin_token');

    try {
      const res = await fetch('/api/admin/department-data', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setTasks(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 font-sans">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#fb7f1c]">
          DATABASE
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[#172b4d]">
          Data Ingestion & Timetable CSV Imports
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-500">Maintenance Records</p>
          <p className="text-3xl font-bold">{tasks.length}</p>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-500">Planned Records</p>
          <p className="text-3xl font-bold">
            {tasks.filter(t => t.planned_date).length}
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-500">Track</p>
          <p className="text-3xl font-bold">
            {tasks.filter(t => t.department === 'Track').length}
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-500">Signal</p>
          <p className="text-3xl font-bold">
            {tasks.filter(t => t.department === 'Signal').length}
          </p>
        </div>
      </div>

      <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-lg text-gray-900">Database Records</h3>
            <p className="text-sm text-gray-500">
              Live maintenance data from backend
            </p>
          </div>

          <button
            onClick={() => {
              loadData();
              setSynced(true);
              setTimeout(() => setSynced(false), 2000);
            }}
            className="px-4 py-2 bg-[#172b4d] text-white text-sm font-semibold rounded-lg"
          >
            {synced ? 'Sync Complete' : 'Refresh Data'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Title</th>
                <th className="p-3">Department</th>
                <th className="p-3">Section</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tasks.map(task => (
                <tr key={task.id}>
                  <td className="p-3 font-mono">{task.id}</td>
                  <td className="p-3">{task.title}</td>
                  <td className="p-3">{task.department}</td>
                  <td className="p-3">{task.section}</td>
                  <td className="p-3">{task.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminData;