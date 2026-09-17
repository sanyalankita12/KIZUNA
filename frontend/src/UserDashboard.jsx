import React from 'react';
import { Link } from 'react-router-dom';

const modules = [
  {
    title: 'Network Control',
    path: '/network-control',
    desc: 'Real-time train tracking, block segment simulations and signals',
  },
  {
    title: 'Maintenance Tasks',
    path: '/maintenance',
    desc: 'Schedule and inspect active track and overhead line works',
  },
  {
    title: 'Predictive Maintenance',
    path: '/predictive-maintenance',
    desc: 'Review emerging maintenance risks and task-level operational exposure',
  },
  {
    title: 'Defects',
    path: '/defects',
    desc: 'Reported track anomalies, ultrasonic test defects, and equipment flags',
  },
  {
    title: 'Train Movements',
    path: '/train-movements',
    desc: 'Speed profiles, schedules, section entries, and dwell timings',
  },
  {
    title: 'Block Planning',
    path: '/block-planning',
    desc: 'Line block applications, shadow blocks, and clearance approvals',
  },
  {
    title: 'Optimization',
    path: '/optimization',
    desc: 'Automated conflict resolution engine and track utilization slots',
  },
  {
    title: 'Plans & History',
    path: '/plan-history',
    desc: 'Historical maintenance logs, block records, and punctuality archive',
  },
];

const UserDashboard = () => {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8 font-sans">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#fb7f1c]">
          OPERATIONS DASHBOARD
        </p>

        <h1 className="mt-1 text-3xl font-bold text-[#172b4d]">
          Section Operations Overview
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Select an operational module to review telemetry, allocate blocks, or coordinate section controllers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m) => (
          <Link
            key={m.path}
            to={m.path}
            className="group p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-[#fb7f1c] transition-all flex flex-col justify-between"
          >
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#fb7f1c] transition-colors">
                {m.title}
              </h3>

              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {m.desc}
              </p>
            </div>

            <div className="mt-6 flex items-center text-xs font-semibold text-[#fb7f1c]">
              Launch Module &rarr;
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default UserDashboard;