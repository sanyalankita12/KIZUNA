import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const adminModules = [
  { title: 'Live Map', path: '/admin/live-map', desc: 'Real-time monitoring of train block simulations, signals, and corridor telemetry' },
  { title: 'User Management', path: '/admin/users', desc: 'Create, authorize and delete operator and controller accounts' },
  { title: 'Departments', path: '/admin/departments', desc: 'Manage Engineering, S&T, Operating, and Electrical divisions' },
  { title: 'Railway Network', path: '/admin/network', desc: 'Track lines, station nodes, loop tracks, and block signal distances' },
  { title: 'System Logs', path: '/admin/system-logs', desc: 'API requests, authentication events, and engine health' },
  { title: 'Data Management', path: '/admin/data', desc: 'Review maintenance, defect and railway timetable data' },
];

const AdminOverview = () => {
  const [stats, setStats] = useState({
    users: 0,
    maintenance: 0,
    planned: 0,
    defects: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');

    Promise.all([
      fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : []),

      fetch('/api/admin/department-data', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : []),
    ])
      .then(([users, tasks]) => {
        setStats({
          users: users.length,
          maintenance: tasks.length,
          planned: tasks.filter(t => t.planned_date).length,
          defects: 0,
        });
      })
      .catch(console.error);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 font-sans">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#fb7f1c]">ADMIN PORTAL</p>
        <h1 className="mt-1 text-3xl font-extrabold text-[#172b4d]">System Administration Hub</h1>
        <p className="mt-2 text-sm text-gray-500">Configure users, monitor railway data and review system operations.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-500">Users</p>
          <p className="text-3xl font-bold text-[#172b4d]">{stats.users}</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-500">Maintenance Tasks</p>
          <p className="text-3xl font-bold text-[#172b4d]">{stats.maintenance}</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-500">Planned Tasks</p>
          <p className="text-3xl font-bold text-[#172b4d]">{stats.planned}</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-500">System</p>
          <p className="text-lg font-bold text-green-600 mt-2">ONLINE</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminModules.map((m) => (
          <Link
            key={m.path}
            to={m.path}
            className="group p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-[#fb7f1c] transition-all"
          >
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#fb7f1c]">
              {m.title}
            </h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">{m.desc}</p>
            <div className="mt-6 text-xs font-semibold text-[#fb7f1c]">
              Open Admin Module →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminOverview;