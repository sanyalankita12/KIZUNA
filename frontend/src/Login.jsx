import React, { useState } from 'react';
import irctcLogo from './assets/irctc_logo.png';

const LoginMain = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:8000/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      alert('Login successful!');

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
            Connecting India. Book your seamless journey across our vast network with ease and comfort.
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
              <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                     Username
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1.5 block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#fb7f1c] focus:outline-none focus:ring-1 focus:ring-[#fb7f1c] sm:text-sm"
                    placeholder="e.g. username"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5 block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#fb7f1c] focus:outline-none focus:ring-1 focus:ring-[#fb7f1c] sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#172b4d] focus:ring-[#172b4d]"
                  />
                  <label htmlFor="remember-me" className="ml-2.5 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <a href="#" className="text-sm font-medium text-[#172b4d] hover:text-blue-800">
                  Forgot Password?
                </a>
              </div>

              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md border border-transparent bg-[#fb7f1c] px-6 py-3 text-lg font-semibold text-white shadow-md hover:bg-[#e16f15] focus:outline-none focus:ring-2 focus:ring-[#fb7f1c] focus:ring-offset-2 transition-all"
                >
                  Sign in
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginMain;