import React, { useEffect, useState } from 'react';

const blockOptions = [
  'RTM-NAD B1 (Down)', 'RTM-NAD B2 (Down)', 'RTM-NAD B3 (Down)',
  'NAD-UJN B1 (Down)', 'NAD-UJN B2 (Down)', 'NAD-UJN B3 (Down)',
  'UJN-DWX B1 (Down)', 'UJN-DWX B2 (Down)',
  'DWX-INDB B1 (Down)', 'DWX-INDB B2 (Down)',
  'RTM-BNG B1 (Down)', 'RTM-BNG B2 (Down)',
  'BNG-FTD B1 (Down)', 'BNG-FTD B2 (Down)',
  'FTD-INDB B1 (Down)', 'FTD-INDB B2 (Down)',
];

const BlockPlanning = () => {
  const [blocks, setBlocks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [modal, setModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    block: '',
    department: '',
    timeSlot: '',
    description: '',
  });

  const token =
    localStorage.getItem('user_token') ||
    localStorage.getItem('admin_token');

  const loadData = async () => {
    try {
      setLoading(true);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [reqRes, optRes] = await Promise.all([
        fetch('/api/maintenance', { headers }),
        fetch('/api/optimizer/run', {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
        }),
      ]);

      const reqData = await reqRes.json();
      const optData = await optRes.json();

      setRequests(Array.isArray(reqData) ? reqData : []);

      const joint = (optData.joint_blocks || []).map((b, i) => ({
        id: b.id || b.block_id || `JB-${String(i + 1).padStart(3, '0')}`,
        section:
          b.section ||
          `${b.section_from || ''}-${b.section_to || ''}`,

        time:
          b.scheduled_start && b.scheduled_end
            ? `${b.scheduled_start} - ${b.scheduled_end}`
            : b.time_slot ||
            b.slot ||
            'Optimized',

        department:
          b.departments?.join(' + ') ||
          b.department ||
          'Multiple Departments',
      }));

      setBlocks(joint);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const submitRequest = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const section = form.block.split(' ')[0];
      const [section_from, section_to] = section.split('-');

      const [start, end] = form.timeSlot
        .split('-')
        .map((x) => x.trim());

      const minutes = (time) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
      };

      const duration_minutes = minutes(end) - minutes(start);

      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title:form.block,
          description: form.description,
          section_from,
          section_to,
          department: form.department,
          criticality: 'High',
          severity: 'High',
          urgency: 'High',
          duration_minutes,
          
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      setForm({
        block: '',
        department: '',
        timeSlot: '',
        description: '',
      });

      setModal(false);

      await loadData();

      alert('Block request submitted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to submit block request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 font-sans">

      {/* HEADER */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#fb7f1c]">
            BLOCK MANAGEMENT
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[#172b4d]">
            Corridor Block Planning
          </h1>
        </div>

        <div className="flex gap-3">
          <button
            onClick={async () => {
              setRunning(true);
              await loadData();
              setRunning(false);
            }}
            disabled={running}
            className="rounded-lg bg-[#172b4d] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {running ? 'Optimizing...' : 'Run Optimization'}
          </button>

          <button
            onClick={() => setModal(true)}
            className="rounded-lg bg-[#fb7f1c] px-4 py-2 text-sm font-bold text-white"
          >
            Log New Request
          </button>
        </div>
      </div>

      {/* REQUESTS */}
      <h2 className="mb-3 text-lg font-bold text-[#172b4d]">
        Block Requests
      </h2>

      <div className="mb-8 grid gap-3">
        {requests.length === 0 ? (
          <div className="rounded-xl border bg-white p-5 text-sm text-gray-500">
            No block requests found.
          </div>
        ) : (
          requests.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-orange-200 bg-orange-50 p-5"
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-mono text-xs font-bold text-gray-500">
                    REQ-{String(r.id).padStart(3, '0')}
                  </p>

                  <h3 className="mt-1 font-bold text-[#172b4d]">
                    {r.title}
                  </h3>

                  <p className="mt-1 text-sm text-gray-600">
                    {r.description}
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    Section: <b>{r.section_from}-{r.section_to}</b>
                    {' • '}
                    Department: <b>{r.department}</b>
                    {' • '}
                    Duration: <b>{r.duration_minutes} min</b>
                  </p>
                </div>

                <span className="h-fit rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                  {r.status || 'Pending'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* OPTIMIZED BLOCKS */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#172b4d]">
          Optimized Joint Blocks
        </h2>

        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
          {blocks.length} Optimized
        </span>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-xl border bg-white p-6 text-center text-gray-500">
            Loading...
          </div>
        ) : blocks.length === 0 ? (
          <div className="rounded-xl border bg-white p-6 text-center text-gray-500">
            No optimized joint blocks found.
          </div>
        ) : (
          blocks.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex justify-between">
                <div>
                  <span className="font-mono font-bold">
                    {b.id}
                  </span>

                  <h3 className="mt-1 font-mono text-lg font-bold text-[#172b4d]">
                    {b.section}
                  </h3>
                </div>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  Optimized
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4 text-xs text-gray-500">
                <div>
                  Time Slot:{' '}
                  <b className="text-gray-800">{b.time}</b>
                </div>

                <div>
                  Department:{' '}
                  <b className="text-gray-800">
                    {b.department}
                  </b>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between">
              <h2 className="text-xl font-bold text-[#172b4d]">
                Log New Request
              </h2>

              <button
                onClick={() => setModal(false)}
                className="text-2xl text-gray-400"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={submitRequest}
              className="mt-5 space-y-4"
            >
              <select
                value={form.block}
                onChange={(e) =>
                  setForm({ ...form, block: e.target.value })
                }
                className="w-full rounded-lg border p-2.5 text-sm"
                required
              >
                <option value="">Select Target Block</option>

                {blockOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <select
                value={form.department}
                onChange={(e) =>
                  setForm({
                    ...form,
                    department: e.target.value,
                  })
                }
                className="w-full rounded-lg border p-2.5 text-sm"
                required
              >
                <option value="">Select Department</option>
                <option value="Track">Track</option>
                <option value="Signal">Signal</option>
                <option value="Electrical">Electrical</option>
              </select>

              <input
                value={form.timeSlot}
                onChange={(e) =>
                  setForm({
                    ...form,
                    timeSlot: e.target.value,
                  })
                }
                placeholder="e.g. 09:00 - 11:00"
                className="w-full rounded-lg border p-2.5 text-sm"
                required
              />

              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                rows="3"
                placeholder="Reason for the block..."
                className="w-full resize-none rounded-lg border p-2.5 text-sm"
                required
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-[#fb7f1c] py-2.5 font-bold text-white disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockPlanning;