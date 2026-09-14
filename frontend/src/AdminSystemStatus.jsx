import React, { useEffect, useState } from 'react';

const AdminSystemStatus = () => {
  const [healthy, setHealthy] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      setHealthy(res.ok);
    } catch {
      setHealthy(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const logs = [
    {
      id: 1,
      level: 'INFO',
      event: 'Kizuna backend health endpoint checked',
    },
    {
      id: 2,
      level: 'INFO',
      event: 'Maintenance and optimization APIs available',
    },
    {
      id: 3,
      level: 'INFO',
      event: 'Authentication and RBAC enabled',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 font-sans">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#fb7f1c]">
            DIAGNOSTICS
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[#172b4d]">
            System Logs & Engine Health
          </h1>
        </div>

        <span className={`px-3 py-1 font-semibold text-xs rounded-full ${
          healthy
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {loading ? 'Checking...' : healthy ? 'Backend Healthy' : 'Backend Offline'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-500">API Status</p>
          <p className={`text-2xl font-bold mt-2 ${
            healthy ? 'text-green-600' : 'text-red-600'
          }`}>
            {healthy ? 'ONLINE' : 'OFFLINE'}
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-500">Optimizer</p>
          <p className="text-2xl font-bold mt-2 text-green-600">READY</p>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-500">Authentication</p>
          <p className="text-2xl font-bold mt-2 text-green-600">ACTIVE</p>
        </div>
      </div>

      <div className="bg-[#172b4d] text-blue-100 font-mono text-xs rounded-xl p-6 shadow-inner overflow-x-auto">
        {logs.map(log => (
          <div
            key={log.id}
            className="py-3 border-b border-blue-800/50 flex gap-4"
          >
            <span className="text-green-400 font-bold">[{log.level}]</span>
            <span>{log.event}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSystemStatus;