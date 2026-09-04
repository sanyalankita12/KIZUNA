import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import irctcLogo from './assets/irctc_logo.png';

const LoginMain = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        'http://localhost:8000/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'Login failed'
        );
      }

      /*
        Expected backend response:

        {
          access_token: "...",
          role: "admin"
        }

        OR

        {
          access_token: "...",
          user: {
            role: "admin"
          }
        }
      */

      const role =
        data.role ||
        data.user?.role;

      const token =
        data.access_token ||
        data.token;

      if (!token) {
        throw new Error(
          'Token not received from server'
        );
      }

      // ADMIN LOGIN
      if (role === 'admin') {
        localStorage.removeItem('user_token');

        localStorage.setItem(
          'admin_token',
          token
        );

        navigate('/admin');
      }

      // NORMAL USER LOGIN
      else if (role === 'user') {
        localStorage.removeItem('admin_token');

        localStorage.setItem(
          'user_token',
          token
        );

        navigate('/home');
      }

      else {
        throw new Error(
          'Invalid user role'
        );
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans">

      <div className="flex w-full max-w-7xl overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* LEFT SECTION */}
        <div className="hidden flex-col items-center justify-center bg-[#172b4d] p-16 lg:flex lg:w-3/5">

          <img
            src={irctcLogo}
            alt="Indian Railways Logo"
            className="w-80"
          />

          <h1 className="mt-12 text-5xl font-extrabold text-white">
            Indian Railways
          </h1>

          <p className="mt-8 max-w-lg text-center text-xl leading-relaxed text-blue-100">
            Connecting India. Smarter Maintenance.
            Better Coordination.
          </p>

        </div>

        {/* LOGIN SECTION */}
        <div className="flex w-full flex-col justify-center p-10 md:p-20 lg:w-2/5">

          <div className="mx-auto w-full max-w-md">

            <div className="mb-8 flex justify-center lg:hidden">

              <img
                src={irctcLogo}
                alt="Indian Railways Logo"
                className="w-24"
              />

            </div>

            <h2 className="text-4xl font-bold text-gray-900">
              Sign in
            </h2>

            <p className="mt-3 text-lg text-gray-600">
              Please enter your details to access your account.
            </p>

            {error && (
              <div className="mt-5 rounded-md bg-red-100 p-3 text-red-700">
                {error}
              </div>
            )}

            <form
              onSubmit={handleLogin}
              className="mt-10 space-y-6"
            >

              <div>

                <label
                  htmlFor="username"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Username
                </label>

                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  className="mt-1.5 block w-full rounded-md border border-gray-300 px-4 py-3"
                  placeholder="Enter username"
                />

              </div>

              <div>

                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  className="mt-1.5 block w-full rounded-md border border-gray-300 px-4 py-3"
                  placeholder="••••••••"
                />

              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-[#fb7f1c] px-6 py-3 text-lg font-semibold text-white hover:bg-[#e16f15]"
              >
                {loading
                  ? 'Signing in...'
                  : 'Sign in'
                }
              </button>

            </form>

          </div>

        </div>

      </div>

    </div>
  );
};

export default LoginMain;