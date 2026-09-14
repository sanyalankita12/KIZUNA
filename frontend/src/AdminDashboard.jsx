import React, { useEffect, useState } from 'react';

const AdminDashboard = () => {
  const [adminProfile, setAdminProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);

  const adminToken = localStorage.getItem('admin_token');

  const authHeaders = {
    Authorization: `Bearer ${adminToken}`,
  };

  const fetchAdminData = async () => {
    try {
      const [profileRes, usersRes] = await Promise.all([
        fetch('/api/admin/me', {
          headers: authHeaders,
        }),
        fetch('/api/admin/users', {
          headers: authHeaders,
        }),
      ]);

      if (!profileRes.ok || !usersRes.ok) {
        throw new Error('Failed to load admin data');
      }

      const profileData = await profileRes.json();
      const usersData = await usersRes.json();

      setAdminProfile(profileData);
      setUsers(usersData);
    } catch (error) {
      console.error('Admin data error:', error);
      alert('Failed to load admin data. Please login again.');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create user');
      }

      setUsers((prev) => [data, ...prev]);
      setNewUsername('');
      setNewPassword('');

      alert('User created successfully.');
    } catch (error) {
      console.error('Create user error:', error);
      alert(error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to delete user');
      }

      setUsers((prev) => prev.filter((user) => user.id !== userId));

      alert('User deleted successfully.');
    } catch (error) {
      console.error('Delete user error:', error);
      alert(error.message);
    }
  };

  const activeUsers = users.filter((user) => user.is_active).length;
  const inactiveUsers = users.length - activeUsers;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 font-sans">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-[#fb7f1c]">
          ADMINISTRATION
        </p>

        <h2 className="mt-1 text-3xl font-bold text-[#172b4d]">
          User Accounts Directory
        </h2>

        {adminProfile && (
          <p className="mt-2 text-gray-500">
            Logged in as{' '}
            <span className="font-semibold text-gray-700">
              {adminProfile.username}
            </span>{' '}
            &bull; Admin ID: {adminProfile.id}
          </p>
        )}
      </div>

      <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Registered Users
          </p>
          <p className="mt-2 text-3xl font-bold text-[#172b4d]">
            {loadingUsers ? '—' : users.length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Active Operators
          </p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {loadingUsers ? '—' : activeUsers}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Inactive Accounts
          </p>
          <p className="mt-2 text-3xl font-bold text-red-500">
            {loadingUsers ? '—' : inactiveUsers}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#fb7f1c]">
              Provision Account
            </p>

            <h3 className="mt-1 text-xl font-bold text-[#172b4d]">
              Create New User
            </h3>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-5 p-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Username
              </label>

              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
                minLength={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#fb7f1c]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Password
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#fb7f1c]"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-[#fb7f1c] py-3 text-sm font-bold text-white transition hover:bg-[#e16f15]"
            >
              Create User
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-gray-100 px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#fb7f1c]">
              Accounts
            </p>

            <h3 className="mt-1 text-xl font-bold text-[#172b4d]">
              User Directory
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-4">S.No</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {users.map((user, index) => (
                  <tr
                    key={user.id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-700">
                      #{index + 1}
                    </td>

                    <td className="px-6 py-4 font-medium text-[#172b4d]">
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
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {new Date(user.date_created).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {!loadingUsers && users.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;