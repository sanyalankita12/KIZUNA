import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6 text-center">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Portal Home</h1>
      <div className="flex gap-4">
        <Link 
          to="/login" 
          className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white shadow-md hover:bg-blue-700"
        >
          Login
        </Link>
      </div>
    </div>
  );
};

export default Home;