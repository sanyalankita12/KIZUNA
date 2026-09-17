import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const AdminSidebar = ({ adminId = 'Admin: SysAdmin' }) => {
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('kizuna_theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark-theme',
      darkMode
    );

    localStorage.setItem(
      'kizuna_theme',
      darkMode ? 'dark' : 'light'
    );
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/login', { replace: true });
  };

  const navItems = [
    { name: 'Overview', path: '/admin/overview' },
    { name: 'Live Map', path: '/admin/live-map' },
    { name: 'Users', path: '/admin/users' },
    { name: 'Departments', path: '/admin/departments' },
    { name: 'Railway Network', path: '/admin/network' },

    {
      name: 'Predictive Maintenance',
      path: '/admin/predictive-maintenance',
    },

    { name: 'System Logs', path: '/admin/system-logs' },
    { name: 'Data Management', path: '/admin/data' },
  ];

  return (
    <aside className="w-64 h-screen bg-[#172b4d] text-white flex flex-col justify-between p-6 shadow-xl shrink-0">
      <div className="flex flex-col">
        {/* BRAND */}
        <div className="pb-6 mb-4 border-b border-blue-800/50">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-300">
            Administration
          </p>

          <h2 className="mt-1 text-2xl font-bold tracking-wide">
            KIZUNA
          </h2>
        </div>

        {/* NAVIGATION */}
        <nav className="flex flex-col space-y-2 mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  isActive
                    ? 'bg-[#fb7f1c] text-white shadow-md'
                    : 'text-blue-100 hover:bg-blue-900/50'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* BOTTOM */}
      <div className="border-t border-blue-800/50 pt-5 flex flex-col space-y-3 text-sm">
        <div className="bg-blue-950/40 px-4 py-2.5 rounded-lg text-blue-100 font-medium border border-blue-800/30">
          {adminId}
        </div>

        {/* THEME TOGGLE */}
        <div className="pt-2">
          <div className="flex items-center justify-between rounded-lg border border-blue-800/30 bg-blue-950/40 px-4 py-2.5">
            <span className="text-xs font-semibold text-blue-100">
              Appearance
            </span>

            <button
              type="button"
              onClick={() => setDarkMode((current) => !current)}
              aria-label={
                darkMode
                  ? 'Switch to light theme'
                  : 'Switch to dark theme'
              }
              className="relative flex h-7 w-14 items-center rounded-full bg-blue-900/80 p-1 transition-colors"
            >
              <span
                className={`absolute flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs shadow-md transition-transform duration-200 ${
                  darkMode
                    ? 'translate-x-7'
                    : 'translate-x-0'
                }`}
              >
                {darkMode ? '🌙' : '☀'}
              </span>
            </button>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="mt-2 text-left px-4 py-2.5 text-red-300 hover:text-red-100 hover:bg-red-900/30 rounded-lg transition-colors font-bold"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;