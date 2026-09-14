import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Home from './Home';
import Login from './Login';
import DashboardLayout from './DashboardLayout';

import UserDashboard from './UserDashboard';
import MapDashboard from './MapDashboard';
import Maintenance from './Maintenance';
import Defects from './Defects';
import TrainMovements from './TrainMovements';
import BlockPlanning from './BlockPlanning';
import Optimization from './Optimization';
import PlanHistory from './PlanHistory';

import AdminOverview from './AdminOverview';
import AdminDashboard from './AdminDashboard';
import AdminDepartments from './AdminDepartments';
import AdminNetwork from './AdminNetwork';
import AdminData from './AdminData';
import AdminSystemStatus from './AdminSystemStatus';

function AdminRoute({ children }) {
  // BACKEND CHECKS DISABLED:
  return <DashboardLayout role="admin" userId="Admin: Master Admin">{children}</DashboardLayout>;
}

function UserRoute({ children }) {
  // BACKEND CHECKS DISABLED:
  return <DashboardLayout role="user" userId="ID: OP-84920" department="Dept: Operations">{children}</DashboardLayout>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* User Routes */}
        <Route path="/dashboard" element={<UserRoute><UserDashboard /></UserRoute>} />
        <Route path="/network-control" element={<UserRoute><MapDashboard /></UserRoute>} />
        <Route path="/maintenance" element={<UserRoute><Maintenance /></UserRoute>} />
        <Route path="/defects" element={<UserRoute><Defects /></UserRoute>} />
        <Route path="/train-movements" element={<UserRoute><TrainMovements /></UserRoute>} />
        <Route path="/block-planning" element={<UserRoute><BlockPlanning /></UserRoute>} />
        <Route path="/optimization" element={<UserRoute><Optimization /></UserRoute>} />
        <Route path="/plan-history" element={<UserRoute><PlanHistory /></UserRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/overview" element={<AdminRoute><AdminOverview /></AdminRoute>} />
        <Route path="/admin/live-map" element={<AdminRoute><MapDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/departments" element={<AdminRoute><AdminDepartments /></AdminRoute>} />
        <Route path="/admin/network" element={<AdminRoute><AdminNetwork /></AdminRoute>} />
        <Route path="/admin/system-logs" element={<AdminRoute><AdminSystemStatus /></AdminRoute>} />
        <Route path="/admin/data" element={<AdminRoute><AdminData /></AdminRoute>} />

        {/* Redirects */}
        <Route path="/map" element={<Navigate to="/network-control" replace />} />
        <Route path="/admin/dashboard" element={<Navigate to="/admin/overview" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;