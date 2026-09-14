import React, { useEffect, useState } from 'react';

const AdminDepartments = () => {
  const [tasks, setTasks] = useState([]);
  const [plannedTasks, setPlannedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const adminToken = localStorage.getItem('admin_token');

  const loadDepartmentData = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/admin/department-data', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load department data');
      }

      const data = await response.json();

      setTasks(data);
      setPlannedTasks(
        data.filter((task) => task.planned_date)
      );
    } catch (error) {
      console.error('Department data error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartmentData();
  }, []);

  const getDepartmentData = (department) => {
    const departmentTasks = tasks.filter(
      (task) => task.department === department
    );

    const departmentPlanned = plannedTasks.filter(
      (task) => task.department === department
    );

    return {
      tasks: departmentTasks,
      planned: departmentPlanned,
    };
  };

  const departments = [
    {
      id: 'TMS',
      name: 'Track Management System',
      department: 'Track',
      operator: 'Track Operations Desk',
      contact: 'Railway Track / P-Way',
      status: 'Active',
    },
    {
      id: 'SMMS',
      name: 'Signalling Maintenance & Mgmt',
      department: 'Signal',
      operator: 'Signal Operations Desk',
      contact: 'Signalling Control Desk',
      status: 'Active',
    },
    {
      id: 'TDMS',
      name: 'Traction Distribution Mgmt',
      department: 'Electrical',
      operator: 'Electrical Operations Desk',
      contact: 'Electrical Control Desk',
      status: 'Active',
    },
    {
      id: 'COA',
      name: 'Control Office Application',
      department: null,
      operator: 'Chief Controller',
      contact: 'Control Office',
      status: 'Monitoring',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 font-sans">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#fb7f1c]">
          DEPARTMENTS
        </p>

        <h1 className="mt-1 text-3xl font-bold text-[#172b4d]">
          Inter-Departmental Coordination
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Review active control desks, current operators, and cross-reference
          requested maintenance slots to avoid block collisions.
        </p>
      </div>

      {loading && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
          Loading live department data...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {departments.map((dept) => {
          const data = dept.department
            ? getDepartmentData(dept.department)
            : { tasks: [], planned: [] };

          const displayTasks =
            data.planned.length > 0
              ? data.planned
              : data.tasks;

          return (
            <div
              key={dept.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-[#172b4d]">
                      {dept.id}
                    </h3>

                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        dept.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {dept.status}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-gray-700 mt-1">
                    {dept.name}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-grow">
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">
                      Current Operator
                    </p>

                    <p className="font-medium text-gray-900 mt-0.5">
                      {dept.operator}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">
                      Contact Info
                    </p>

                    <p className="font-medium text-gray-900 mt-0.5">
                      {dept.contact}
                    </p>
                  </div>
                </div>

                {/* Requested Block Slots */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-bold text-[#fb7f1c] uppercase mb-2">
                    Requested Block Slots
                  </p>

                  {displayTasks.length > 0 ? (
                    <ul className="space-y-2">
                      {displayTasks.map((task, index) => (
                        <li
                          key={task.id || task.task_id || index}
                          className="flex justify-between items-center text-sm p-2 bg-orange-50 rounded border border-orange-100"
                        >
                          <div>
                            <span className="font-semibold text-gray-800">
                              {task.title}
                            </span>

                            <span className="block text-xs text-gray-500 mt-1">
                              {task.section ||
                                `${task.section_from}-${task.section_to}`}
                            </span>
                          </div>

                          <div className="text-right">
                            {task.planned_date ? (
                              <span className="block text-gray-600 font-mono text-xs">
                                {task.planned_date}
                              </span>
                            ) : (
                              <span className="block text-gray-400 font-mono text-xs">
                                Pending
                              </span>
                            )}

                            <span className="block text-[#172b4d] font-mono text-xs font-bold">
                              {task.duration_minutes} min
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 italic p-2">
                      No active maintenance requests.
                    </p>
                  )}
                </div>

                {/* COA */}
                {dept.id === 'COA' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold text-[#fb7f1c] uppercase mb-2">
                      Control Office Status
                    </p>

                    <div className="rounded border border-blue-100 bg-blue-50 p-3">
                      <p className="text-sm font-medium text-blue-800">
                        Monitoring maintenance plans and corridor scheduling.
                      </p>

                      <p className="mt-1 text-xs text-blue-600">
                        {plannedTasks.length} planned maintenance task(s)
                        currently available.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDepartments;