import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import irctcLogo from './assets/irctc_logo.png';

const Login = () => {
  const [loginType, setLoginType] = useState('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const endpoint =
        loginType === 'admin'
          ? '/api/admin/login'
          : '/api/users/login';

      console.log('Login endpoint:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      console.log('Login response:', response.status, data);

      if (!response.ok) {
        throw new Error(
          data.detail || 'Invalid username or password'
        );
      }

      if (!data.access_token) {
        throw new Error(
          'Login successful, but access token was not received.'
        );
      }

      // Clear old tokens first
      localStorage.removeItem('admin_token');
      localStorage.removeItem('user_token');

      if (loginType === 'admin') {
        localStorage.setItem('admin_token', data.access_token);
        navigate('/admin/dashboard', { replace: true });
      } else {
        localStorage.setItem('user_token', data.access_token);
        navigate('/map', { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 font-sans">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">

        <div className="grid w-full overflow-hidden rounded-2xl bg-white shadow-xl lg:grid-cols-2">

          {/* LEFT SIDE */}
          <div className="hidden flex-col justify-center bg-[#172b4d] p-12 text-white lg:flex">
            <img
              src={irctcLogo}
              alt="Indian Railways"
              className="mb-8 h-28 w-28 object-contain"
            />

            <h1 className="text-4xl font-extrabold">
              Indian Railways
            </h1>

            <p className="mt-4 max-w-md text-lg leading-relaxed text-blue-100">
              Centralized Network Management Portal
            </p>

            <div className="mt-10 space-y-4 text-sm text-blue-100">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#fb7f1c]" />
                Network monitoring
              </div>

              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#fb7f1c]" />
                User management
              </div>

              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#fb7f1c]" />
                Railway operations
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center justify-center p-8 sm:p-12">

            <div className="w-full max-w-md">

              <div className="mb-8 flex justify-center lg:hidden">
                <img
                  src={irctcLogo}
                  alt="Indian Railways"
                  className="h-20 w-20 object-contain"
                />
              </div>

              <h2 className="text-3xl font-bold text-gray-900">
                Sign in
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                Please enter your details to access your account.
              </p>

              {/* LOGIN TYPE */}
              <div className="mt-7">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Login as
                </label>

                <div className="grid grid-cols-2 rounded-lg border border-gray-300 bg-gray-50 p-1">

                  <button
                    type="button"
                    onClick={() => {
                      setLoginType('user');
                      setError('');
                    }}
                    className={`rounded-md py-2.5 text-sm font-semibold transition ${
                      loginType === 'user'
                        ? 'bg-white text-[#172b4d] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    User
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginType('admin');
                      setError('');
                    }}
                    className={`rounded-md py-2.5 text-sm font-semibold transition ${
                      loginType === 'admin'
                        ? 'bg-white text-[#172b4d] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Admin
                  </button>

                </div>
              </div>

              {/* ERROR */}
              {error && (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleLogin}
                className="mt-7 space-y-5"
              >

                {/* USERNAME */}
                <div>
                  <label
                    htmlFor="username"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Username
                  </label>

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={
                      loginType === 'admin'
                        ? 'Enter admin username'
                        : 'Enter username'
                    }
                    required
                    autoComplete="username"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#fb7f1c] focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* PASSWORD */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#fb7f1c] focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-[#fb7f1c] py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#e16f15] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>

              </form>

              <p className="mt-6 text-center text-xs text-gray-400">
                Indian Railways Network Management Portal
              </p>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;