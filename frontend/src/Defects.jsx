import React, { useEffect, useState } from 'react';

const Defects = () => {
  const [defects, setDefects] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    asset_id: '',
    asset_type: '',
    section: '',
    description: '',
  });

  const token =
    localStorage.getItem('user_token') ||
    localStorage.getItem('admin_token');

  const loadData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [defectRes, priorityRes] = await Promise.all([
        fetch('/api/defects', { headers }),
        fetch('/api/defects/priorities', { headers }),
      ]);

      setDefects(await defectRes.json());
      setPriorities(await priorityRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const submitDefect = async () => {
    if (
      !form.asset_id ||
      !form.asset_type ||
      !form.section ||
      !form.description
    ) {
      alert('Please fill all fields.');
      return;
    }

    try {
      setSubmitting(true);

      const parts = form.section.split('-');

      if (parts.length !== 2) {
        alert('Section format should be like RTM-NAD');
        return;
      }

      const section_from = parts[0].trim();
      const section_to = parts[1].trim();

      const res = await fetch('/api/defects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          asset_id: form.asset_id,
          asset_type: form.asset_type,
          section_from,
          section_to,
          description: form.description,
          source_system: 'SMMS',
          severity: 'High',
          criticality: 'High',
          status: 'Open',
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      setForm({
        asset_id: '',
        asset_type: '',
        section: '',
        description: '',
      });

      setIsModalOpen(false);

      await loadData();

      alert('Defect logged successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to log defect. Check backend/API.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriority = (score) => {
    if (score >= 400) return 'High';
    if (score >= 300) return 'Medium';
    return 'Low';
  };

  const getPriorityData = (level) =>
    priorities.filter(
      (p) => getPriority(p.priority_score) === level
    );

  const priorityStyle = {
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Low: 'bg-green-100 text-green-700',
  };

  const severityStyle = (severity) => {
    if (severity === 'Critical' || severity === 'High') {
      return 'bg-red-100 text-red-700';
    }

    if (severity === 'Moderate' || severity === 'Medium') {
      return 'bg-yellow-100 text-yellow-700';
    }

    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">

      <div className="mb-8 flex justify-between items-end">
        <div>
          <p className="text-xs font-bold tracking-widest text-[#fb7f1c]">
            DEFECT REGISTRY
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Track Anomalies & Safety Flags
          </h1>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
        >
          Log New Defect
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {['High', 'Medium', 'Low'].map((level) => {
          const data = getPriorityData(level);

          return (
            <div
              key={level}
              className={`rounded-xl border p-5 ${
                level === 'High'
                  ? 'border-red-200 bg-red-50'
                  : level === 'Medium'
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-green-200 bg-green-50'
              }`}
            >
              <p className="text-xs font-bold uppercase">
                {level} Priority
              </p>

              <p
                className={`mt-2 text-3xl font-extrabold ${
                  level === 'High'
                    ? 'text-red-600'
                    : level === 'Medium'
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`}
              >
                {data.length}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                active defects
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4">
        {defects.map((defect) => {
          const p = priorities.find(
            (x) => x.defect_id === defect.id
          );

          const level = p
            ? getPriority(p.priority_score)
            : 'Low';

          return (
            <div
              key={defect.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-5">

                <div>
                  <div className="flex flex-wrap items-center gap-3">

                    <span className="font-mono font-bold text-gray-900">
                      DEF-{String(defect.id).padStart(3, '0')}
                    </span>

                    <span
                      className={`rounded px-2 py-1 text-xs font-bold ${severityStyle(
                        defect.severity
                      )}`}
                    >
                      {defect.severity}
                    </span>

                    <span
                      className={`rounded px-2 py-1 text-xs font-bold ${priorityStyle[level]}`}
                    >
                      {level}
                    </span>

                    <span className="text-xs text-gray-400">
                      {defect.source_system}
                    </span>

                  </div>

                  <p className="mt-2 font-semibold text-gray-800">
                    {defect.description}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">

                    <span>
                      Asset: <b>{defect.asset_id}</b>
                    </span>

                    <span>
                      Type: <b>{defect.asset_type}</b>
                    </span>

                    <span>
                      Section:{' '}
                      <b className="font-mono">
                        {defect.section_from}-{defect.section_to}
                      </b>
                    </span>

                    <span>
                      Criticality:{' '}
                      <b>{defect.criticality}</b>
                    </span>

                    {p && (
                      <span>
                        Score:{' '}
                        <b className="text-[#fb7f1c]">
                          {p.priority_score}
                        </b>
                      </span>
                    )}

                  </div>
                </div>

                <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                  {defect.status}
                </span>

              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex justify-between">
              <h2 className="text-xl font-bold text-[#172b4d]">
                Log New Defect
              </h2>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-2xl text-gray-400"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-4">

              <input
                className="w-full rounded-lg border p-2.5 text-sm"
                placeholder="Asset ID"
                value={form.asset_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    asset_id: e.target.value,
                  })
                }
              />

              <input
                className="w-full rounded-lg border p-2.5 text-sm"
                placeholder="Asset Type"
                value={form.asset_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    asset_type: e.target.value,
                  })
                }
              />

              <input
                className="w-full rounded-lg border p-2.5 text-sm"
                placeholder="Section e.g. RTM-NAD"
                value={form.section}
                onChange={(e) =>
                  setForm({
                    ...form,
                    section: e.target.value,
                  })
                }
              />

              <textarea
                rows="3"
                className="w-full rounded-lg border p-2.5 text-sm"
                placeholder="Defect description"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
              />

              <button
                onClick={submitDefect}
                disabled={submitting}
                className="w-full rounded-lg bg-red-600 py-2.5 font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {submitting
                  ? 'Submitting...'
                  : 'Submit Defect Report'}
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Defects;