import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Home from './Home';
import Login from './Login';
import AdminDashboard from './AdminDashboard';

function AdminRoute({ children }) {
  const token = localStorage.getItem('admin_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function UserRoute({ children }) {
  const token = localStorage.getItem('user_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />

        {/* Common Login */}
        <Route path="/login" element={<Login />} />

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* User Home */}
        <Route
          path="/home"
          element={
            <UserRoute>
              <Home />
            </UserRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;