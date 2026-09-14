import React, { useState } from 'react';

const TrainMovements = () => {
  // Parsed directly from ratlam_indore_cleaned.csv & indore_ratlam_cleaned.csv
  const [trains] = useState([
    { id: "20498", name: "Firozpur-Rameswaram Hms", route: "RTM -> INDB (via Fatehabad)", departure: "03:25:00", arrival: "05:10:00", type: "Hms" },
    { id: "20958", name: "Hisar-Indore SF Exp", route: "RTM -> INDB (via Fatehabad)", departure: "04:15:00", arrival: "06:45:00", type: "SF" },
    { id: "19338", name: "Delhi Sarai Rohilla-Indore Exp", route: "RTM -> INDB (via Fatehabad)", departure: "05:40:00", arrival: "08:30:00", type: "Exp" },
    { id: "79310", name: "Ratlam-Dr. Ambedkar Nagar DEMU", route: "RTM -> INDB (via Fatehabad)", departure: "06:35:00", arrival: "09:10:00", type: "DEMU" },
    { id: "12961", name: "Avantika SF Exp", route: "RTM -> INDB (via Nagda-Ujjain)", departure: "05:55:00", arrival: "09:05:00", type: "SF" },
    { id: "12227", name: "Mumbai Central-Indore Duronto", route: "RTM -> INDB (via Nagda-Ujjain)", departure: "07:05:00", arrival: "10:20:00", type: "Drnt" },
    { id: "14802", name: "Indore-Jodhpur Exp", route: "INDB -> RTM (via Fatehabad)", departure: "04:20:00", arrival: "06:25:00", type: "Exp" },
    { id: "79317", name: "Dr. Ambedkar Nagar-Ratlam DEMU", route: "INDB -> RTM (via Fatehabad)", departure: "06:30:00", arrival: "09:20:00", type: "DEMU" },
    { id: "11126", name: "Gwalior-Ratlam InterCity Exp", route: "INDB -> RTM (via Fatehabad)", departure: "07:25:00", arrival: "10:00:00", type: "Exp" },
    { id: "12228", name: "Indore-Mumbai Central Duronto", route: "INDB -> RTM (via Ujjain-Nagda)", departure: "21:00:00", arrival: "23:30:00", type: "Drnt" },
    { id: "19320", name: "Indore-Veraval Mahamana Exp", route: "INDB -> RTM (via Ujjain-Nagda)", departure: "22:20:00", arrival: "01:30:00", type: "Exp" }
  ]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 font-sans">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#fb7f1c]">MOVEMENTS</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">Train Corridor Timetable</h1>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-6 py-4">Train No & Name</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Route Info</th>
              <th className="px-6 py-4">Departure</th>
              <th className="px-6 py-4">Arrival</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {trains.map((t) => (
              <tr key={t.id} className="transition hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="font-mono font-bold text-gray-900">{t.id}</span>
                  <span className="ml-2 text-gray-700">{t.name}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                    {t.type}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-600">{t.route}</td>
                <td className="px-6 py-4 text-gray-500 font-mono">{t.departure}</td>
                <td className="px-6 py-4 text-gray-500 font-mono">{t.arrival}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrainMovements;