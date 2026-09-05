import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [adminProfile, setAdminProfile] = useState(null);
  const [users, setUsers] = useState([]);

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [creatingUser, setCreatingUser] = useState(false);

  const navigate = useNavigate();

  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    fetchAdminProfile();
    fetchUsers();
  }, [token]);

  const fetchAdminProfile = async () => {
    try {
      setLoadingProfile(true);

      const response = await fetch('/api/admin/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('admin_token');
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load admin profile');
      }

      const data = await response.json();
      setAdminProfile(data);
    } catch (err) {
      console.error('Profile error:', err);
      setError(err.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);

      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('admin_token');
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data = await response.json();

      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Users error:', err);
      setError(err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setCreatingUser(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'Failed to create user'
        );
      }

      setNewUsername('');
      setNewPassword('');

      setSuccess('User created successfully.');

      await fetchUsers();
    } catch (err) {
      console.error('Create user error:', err);
      setError(err.message);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this user?'
    );

    if (!confirmed) return;

    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `/api/admin/users/${userId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          data.detail || 'Failed to delete user'
        );
      }

      setSuccess('User deleted successfully.');

      await fetchUsers();
    } catch (err) {
      console.error('Delete user error:', err);
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/login', { replace: true });
  };

  const activeUsers = users.filter(
    (user) => user.is_active
  ).length;

  const inactiveUsers = users.length - activeUsers;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* TOP NAVBAR */}
      <header className="bg-[#172b4d] text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-6 py-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-300">
                Indian Railways
              </p>

              <h1 className="mt-1 text-2xl font-bold">
                Network Management Portal
              </h1>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-red-400/40 bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Logout
            </button>

          </div>

        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-7xl px-6 py-8">

        {/* WELCOME */}
        <div className="mb-8">

          <p className="text-sm font-semibold text-[#fb7f1c]">
            ADMINISTRATION
          </p>

          <h2 className="mt-1 text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h2>

          {adminProfile && (
            <p className="mt-2 text-gray-500">
              Welcome back,{' '}
              <span className="font-semibold text-gray-700">
                {adminProfile.username}
              </span>
              {' '}• Administrator ID: {adminProfile.id}
            </p>
          )}

        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-5 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              onClick={() => setError('')}
              className="font-bold"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <span>{success}</span>

            <button
              onClick={() => setSuccess('')}
              className="font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* STAT CARDS */}
        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Users
            </p>

            <p className="mt-2 text-3xl font-bold text-[#172b4d]">
              {loadingUsers ? '—' : users.length}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Registered accounts
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Active Users
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {loadingUsers ? '—' : activeUsers}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Currently active
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Inactive Users
            </p>

            <p className="mt-2 text-3xl font-bold text-red-500">
              {loadingUsers ? '—' : inactiveUsers}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Inactive accounts
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Admin Status
            </p>

            <p className="mt-2 text-lg font-bold text-green-600">
              ● Online
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Secure session active
            </p>
          </div>

        </div>

        {/* CONTENT GRID */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* CREATE USER */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-100 px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#fb7f1c]">
                User Management
              </p>

              <h3 className="mt-1 text-xl font-bold text-gray-900">
                Create New User
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Add a new account to the portal.
              </p>
            </div>

            <form
              onSubmit={handleCreateUser}
              className="space-y-5 p-6"
            >

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Username
                </label>

                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) =>
                    setNewUsername(e.target.value)
                  }
                  placeholder="Enter username"
                  required
                  minLength={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#fb7f1c] focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Password
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#fb7f1c] focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <button
                type="submit"
                disabled={creatingUser}
                className="w-full rounded-lg bg-[#fb7f1c] py-3 text-sm font-bold text-white transition hover:bg-[#e16f15] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingUser
                  ? 'Creating User...'
                  : 'Create User'}
              </button>

            </form>
          </section>

          {/* USERS TABLE */}
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#fb7f1c]">
                  Accounts
                </p>

                <h3 className="mt-1 text-xl font-bold text-gray-900">
                  User Directory
                </h3>
              </div>

              <button
                onClick={fetchUsers}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Refresh
              </button>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full text-left text-sm">

                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {loadingUsers ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-10 text-center text-gray-400"
                      >
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-10 text-center text-gray-400"
                      >
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className="transition hover:bg-gray-50"
                      >

                        <td className="px-6 py-4 font-semibold text-gray-700">
                          #{user.id}
                        </td>

                        <td className="px-6 py-4 font-medium text-gray-900">
                          {user.username}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                              user.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {user.is_active
                              ? 'Active'
                              : 'Inactive'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-gray-500">
                          {user.date_created
                            ? new Date(
                                user.date_created
                              ).toLocaleDateString()
                            : '—'}
                        </td>

                        <td className="px-6 py-4 text-right">

                          <button
                            onClick={() =>
                              handleDeleteUser(user.id)
                            }
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
                          >
                            Delete
                          </button>

                        </td>

                      </tr>
                    ))
                  )}

                </tbody>

              </table>

            </div>
          </section>

        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;