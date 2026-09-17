import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import Home from './Home';
import Login from './Login';
import DashboardLayout from './DashboardLayout';

import UserDashboard from './UserDashboard';
import MapDashboard from './MapDashboard';
import Maintenance from './Maintenance';
import PredictiveMaintenance from './PredictiveMaintenance';
import MaintenanceRiskReview from './MaintenanceRiskReview';
import Defects from './Defects';
import TrainMovements from './TrainMovements';
import BlockPlanning from './BlockPlanning';
import Optimization from './Optimization';
import PlanHistory from './PlanHistory';

import AdminOverview from './AdminOverview';
import AdminDashboard from './AdminDashboard';
import AdminDepartments from './AdminDepartments';
import AdminNetwork from './AdminNetwork';
import AdminPredictiveMaintenance from './AdminPredictiveMaintenance';
import AdminData from './AdminData';
import AdminSystemStatus from './AdminSystemStatus';

function AdminRoute({ children }) {
  return (
    <DashboardLayout
      role="admin"
      userId="Admin: Master Admin"
    >
      {children}
    </DashboardLayout>
  );
}

function UserRoute({ children }) {
  return (
    <DashboardLayout
      role="user"
      userId="ID: OP-84920"
      department="Dept: Operations"
    >
      {children}
    </DashboardLayout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* ================= USER ================= */}

        <Route
          path="/dashboard"
          element={
            <UserRoute>
              <UserDashboard />
            </UserRoute>
          }
        />

        <Route
          path="/network-control"
          element={
            <UserRoute>
              <MapDashboard />
            </UserRoute>
          }
        />

        <Route
          path="/maintenance"
          element={
            <UserRoute>
              <Maintenance />
            </UserRoute>
          }
        />

        <Route
          path="/predictive-maintenance"
          element={
            <UserRoute>
              <PredictiveMaintenance />
            </UserRoute>
          }
        />

        <Route
          path="/predictive-maintenance/:taskId"
          element={
            <UserRoute>
              <MaintenanceRiskReview />
            </UserRoute>
          }
        />

        <Route
          path="/defects"
          element={
            <UserRoute>
              <Defects />
            </UserRoute>
          }
        />

        <Route
          path="/train-movements"
          element={
            <UserRoute>
              <TrainMovements />
            </UserRoute>
          }
        />

        <Route
          path="/block-planning"
          element={
            <UserRoute>
              <BlockPlanning />
            </UserRoute>
          }
        />

        <Route
          path="/optimization"
          element={
            <UserRoute>
              <Optimization />
            </UserRoute>
          }
        />

        <Route
          path="/plan-history"
          element={
            <UserRoute>
              <PlanHistory />
            </UserRoute>
          }
        />

        {/* ================= ADMIN ================= */}

        <Route
          path="/admin/overview"
          element={
            <AdminRoute>
              <AdminOverview />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/live-map"
          element={
            <AdminRoute>
              <MapDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/departments"
          element={
            <AdminRoute>
              <AdminDepartments />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/network"
          element={
            <AdminRoute>
              <AdminNetwork />
            </AdminRoute>
          }
        />

        {/* ADMIN PREDICTIVE MAINTENANCE */}

        <Route
          path="/admin/predictive-maintenance"
          element={
            <AdminRoute>
              <AdminPredictiveMaintenance />
            </AdminRoute>
          }
        />

        {/* ADMIN PREDICTIVE MAINTENANCE DETAIL */}

        <Route
          path="/admin/predictive-maintenance/:taskId"
          element={
            <AdminRoute>
              <MaintenanceRiskReview />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/system-logs"
          element={
            <AdminRoute>
              <AdminSystemStatus />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/data"
          element={
            <AdminRoute>
              <AdminData />
            </AdminRoute>
          }
        />

        {/* ================= REDIRECTS ================= */}

        <Route
          path="/map"
          element={
            <Navigate
              to="/network-control"
              replace
            />
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <Navigate
              to="/admin/overview"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;