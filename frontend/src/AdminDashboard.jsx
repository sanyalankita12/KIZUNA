import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [adminProfile, setAdminProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('admin_token');

  const fetchAdminProfile = async () => {
    try {
      const response = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAdminProfile(data);
      } else {
        localStorage.removeItem('admin_token');
        navigate('/login');
      }
    } catch (err) {
      setError('Failed to load profile');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      setError('Failed to load users');
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchAdminProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchUsers();
  }, [token, navigate]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to create user');
      }

      setNewUsername('');
      setNewPassword('');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete user');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between rounded-xl bg-[#172b4d] p-6 text-white shadow-lg">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            {adminProfile && (
              <p className="mt-2 text-blue-200">
                Welcome, {adminProfile.username} (ID: {adminProfile.id})
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="rounded bg-red-600 px-4 py-2 font-medium hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-md lg:col-span-1 h-fit">
            <h2 className="mb-6 text-xl font-bold text-gray-800">Create New User</h2>
            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full rounded-md border p-2 focus:border-[#fb7f1c] focus:outline-none focus:ring-1 focus:ring-[#fb7f1c]"
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-md border p-2 focus:border-[#fb7f1c] focus:outline-none focus:ring-1 focus:ring-[#fb7f1c]"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                className="mt-2 rounded-md bg-[#fb7f1c] py-2 font-bold text-white hover:bg-[#e16f15]"
              >
                Create User
              </button>
            </form>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-md lg:col-span-2">
            <h2 className="mb-6 text-xl font-bold text-gray-800">User Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Username</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Created</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{user.id}</td>
                      <td className="p-3">{user.username}</td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-bold ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3">{new Date(user.date_created).toLocaleDateString()}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-gray-500">
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;