import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import irctcLogo from './assets/irctc_logo.png';

const LoginMain = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid username or password');
      }

      const data = await response.json();

      if (data.role === 'admin') {
        localStorage.setItem('admin_token', data.access_token);
        navigate('/admin/dashboard');
      } else {
        localStorage.setItem('user_token', data.access_token);
        navigate('/map');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="flex w-full max-w-7xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="hidden flex-col items-center justify-center bg-[#172b4d] p-16 lg:flex lg:w-3/5">
          <img src={irctcLogo} alt="Indian Railways Logo" className="w-80" />
          <h1 className="mt-12 text-5xl font-extrabold text-white">Indian Railways</h1>
          <p className="mt-8 text-center text-xl text-blue-100 max-w-lg leading-relaxed">
            Centralized Network Management Portal
          </p>
        </div>
        <div className="flex w-full flex-col justify-center p-10 md:p-20 lg:w-2/5">
          <div className="mx-auto w-full max-w-md">
            <div className="flex justify-center mb-8 lg:hidden">
              <img src={irctcLogo} alt="Indian Railways Logo" className="w-24" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900">Sign in</h2>
            <p className="mt-3 text-lg text-gray-600">
              Please enter your details to access your account.
            </p>
            {error && (
              <div className="mt-4 rounded bg-red-100 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <form onSubmit={handleLogin} className="mt-10 space-y-6">
              <div className="space-y-5">
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-700">Username</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="mt-1.5 block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#fb7f1c] focus:outline-none focus:ring-1 focus:ring-[#fb7f1c] sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1.5 block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#fb7f1c] focus:outline-none focus:ring-1 focus:ring-[#fb7f1c] sm:text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-[#fb7f1c] px-6 py-3 text-lg font-semibold text-white shadow-md hover:bg-[#e16f15] transition-all"
              >
                Sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginMain;