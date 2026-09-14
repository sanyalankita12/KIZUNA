import React from 'react';
import UserSidebar from './UserSidebar';
import AdminSidebar from './AdminSidebar';

const DashboardLayout = ({ children, role = 'user', userId, department }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 font-sans">
      {role === 'admin' ? (
        <AdminSidebar adminId={userId} />
      ) : (
        <UserSidebar userId={userId} department={department} />
      )}
      <div className="flex-1 h-screen overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;