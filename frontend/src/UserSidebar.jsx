import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const UserSidebar = ({ userId = 'ID: OP-84920', department = 'Dept: Operations' }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    navigate('/login', { replace: true });
  };

  const navItems = [
    { name: 'Overview', path: '/dashboard' },
    { name: 'Network Control', path: '/network-control' },
    { name: 'Maintenance Tasks', path: '/maintenance' },
    { name: 'Defects', path: '/defects' },
    { name: 'Train Movements', path: '/train-movements' },
    { name: 'Block Planning', path: '/block-planning' },
    { name: 'Optimization', path: '/optimization' },
    { name: 'Plans & History', path: '/plan-history' },
  ];

  return (
    <aside className="w-64 h-screen bg-[#172b4d] text-white flex flex-col justify-between p-6 shadow-xl shrink-0">
      <div className="flex flex-col">
        <div className="pb-6 mb-4 border-b border-blue-800/50">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-300">
            Indian Railways
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-wide">
            KIZUNA
          </h2>
        </div>

        <nav className="flex flex-col space-y-2 mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  isActive ? 'bg-[#fb7f1c] text-white shadow-md' : 'text-blue-100 hover:bg-blue-900/50'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-blue-800/50 pt-5 flex flex-col space-y-3 text-sm">
        <div className="bg-blue-950/40 px-4 py-2.5 rounded-lg text-blue-100 font-medium border border-blue-800/30">
          {userId}
        </div>
        <div className="bg-blue-950/40 px-4 py-2.5 rounded-lg text-blue-100 font-medium border border-blue-800/30">
          {department}
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

export default UserSidebar;