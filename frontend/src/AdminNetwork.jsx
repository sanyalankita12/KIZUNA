import React, { useEffect, useState } from 'react';

const AdminNetwork = () => {
  const [stations, setStations] = useState([]);
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');

    Promise.all([
      fetch('/api/trains/stations', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : []),

      fetch('/api/trains/trains', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : []),
    ])
      .then(([stationData, trainData]) => {
        setStations(Array.isArray(stationData) ? stationData : []);
        setTrains(Array.isArray(trainData) ? trainData : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sections = [
    ['SEC-1', 'Ratlam (RTM)', 'Nagda (NAD)'],
    ['SEC-2', 'Nagda (NAD)', 'Ujjain (UJN)'],
    ['SEC-3', 'Ujjain (UJN)', 'Dewas (DWX)'],
    ['SEC-4', 'Dewas (DWX)', 'Indore (INDB)'],
    ['SEC-5', 'Ratlam (RTM)', 'Badnagar (BNG)'],
    ['SEC-6', 'Badnagar (BNG)', 'Fatehabad (FTD)'],
    ['SEC-7', 'Fatehabad (FTD)', 'Indore (INDB)'],
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 font-sans">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#fb7f1c]">
          NETWORK INFRASTRUCTURE
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[#172b4d]">
          Track Corridors & Line Geometries
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-500">Stations</p>
          <p className="text-3xl font-bold">{loading ? '...' : stations.length}</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-500">Trains</p>
          <p className="text-3xl font-bold">{loading ? '...' : trains.length}</p>
        </div>
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs text-gray-500">Configured Corridors</p>
          <p className="text-3xl font-bold">{sections.length}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-6 py-4">Section ID</th>
              <th className="px-6 py-4">From - To</th>
              <th className="px-6 py-4">Track Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sections.map(([id, from, to]) => (
              <tr key={id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono font-bold">{id}</td>
                <td className="px-6 py-4 font-medium">{from} → {to}</td>
                <td className="px-6 py-4 text-gray-600">Double Electrified</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminNetwork;