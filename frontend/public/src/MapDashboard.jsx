import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const ftdDownData = [
  { id: '20498', name: 'Fmz-Rmm Hms' }, { id: '20958', name: 'Hisar-INDB SF' },
  { id: '19338', name: 'DLI-INDB Exp' }, { id: '19334', name: 'BKN-INDB Exp' },
  { id: '79310', name: 'RTM-DADN DMU' }, { id: '79314', name: 'RTM-DADN DMU' },
  { id: '79306', name: 'RTM-DADN DMU' }, { id: '11125', name: 'RTM-GWL Exp' },
  { id: '21125', name: 'RTM-Bhind Exp' }, { id: '79318', name: 'RTM-DADN DMU' },
  { id: '14801', name: 'JU-INDB Exp' }
].map(t => ({ ...t, path: ['RTM', 'BNG', 'FTD', 'INDB'] }));

const ujnDownData = [
  { id: '19309', name: 'Shanti Exp' }, { id: '19316', name: 'Veer Bhumi' },
  { id: '22943', name: 'Daund-INDB SF' }, { id: '20935', name: 'GIMB-INDB SF' },
  { id: '12961', name: 'Avantika SF' }, { id: '12227', name: 'MMCT-INDB' },
  { id: '19319', name: 'Veraval-INDB' }, { id: '20915', name: 'Charlapalli' },
  { id: '9323', name: 'Khadki-INDB' }
].map(t => ({ ...t, path: ['RTM', 'NAD', 'UJN', 'DWX', 'INDB'] }));

const ftdUpData = [
  { id: '14802', name: 'INDB-JU Exp' }, { id: '79317', name: 'DADN-RTM DMU' },
  { id: '11126', name: 'GWL-RTM Exp' }, { id: '21126', name: 'Bhind-RTM Exp' },
  { id: '79305', name: 'DADN-RTM DMU' }, { id: '20497', name: 'RMM-FZR Hms' },
  { id: '19333', name: 'INDB-BKN Exp' }, { id: '79313', name: 'DADN-RTM DMU' },
  { id: '20957', name: 'INDB-Hisar SF' }, { id: '19337', name: 'INDB-DLI Exp' },
  { id: '79309', name: 'DADN-RTM DMU' }
].map(t => ({ ...t, path: ['INDB', 'FTD', 'BNG', 'RTM'] }));

const ujnUpData = [
  { id: '20916', name: 'INDB-Charlapalli' }, { id: '9324', name: 'INDB-Khadki' },
  { id: '22944', name: 'INDB-Daund SF' }, { id: '12962', name: 'Avantika SF' },
  { id: '19315', name: 'Veer Bhumi' }, { id: '12228', name: 'INDB-MMCT' },
  { id: '20932', name: 'INDB-KCVL SF' }, { id: '19320', name: 'INDB-Veraval' },
  { id: '19310', name: 'Shanti Exp' }
].map(t => ({ ...t, path: ['INDB', 'DWX', 'UJN', 'NAD', 'RTM'] }));

const allTrainData = [...ftdDownData, ...ujnDownData, ...ftdUpData, ...ujnUpData];

const MapDashboard = () => {
  const [stations] = useState([
    { id: 'RTM', name: 'Ratlam', cx: 100, cy: 300 },
    { id: 'NAD', name: 'Nagda', cx: 250, cy: 120 },
    { id: 'UJN', name: 'Ujjain', cx: 500, cy: 120 },
    { id: 'DWX', name: 'Dewas', cx: 700, cy: 200 },
    { id: 'BNG', name: 'Badnagar', cx: 350, cy: 450 },
    { id: 'FTD', name: 'Fatehabad', cx: 600, cy: 450 },
    { id: 'INDB', name: 'Indore', cx: 850, cy: 300 },
  ]);

  const [tracks] = useState([
    { id: 'T1', from: 'RTM', to: 'NAD' },
    { id: 'T2', from: 'NAD', to: 'UJN' },
    { id: 'T3', from: 'UJN', to: 'DWX' },
    { id: 'T4', from: 'DWX', to: 'INDB' },
    { id: 'T5', from: 'RTM', to: 'BNG' },
    { id: 'T6', from: 'BNG', to: 'FTD' },
    { id: 'T7', from: 'FTD', to: 'INDB' },
  ]);

  const getBlocksForSegment = (from, to) => {
    const map = {
      'RTM-NAD': 4, 'NAD-UJN': 6, 'UJN-DWX': 4, 'DWX-INDB': 4,
      'RTM-BNG': 5, 'BNG-FTD': 3, 'FTD-INDB': 4
    };
    return map[`${from}-${to}`] || map[`${to}-${from}`] || 1;
  };

  const [trains, setTrains] = useState([]);
  const [messages, setMessages] = useState(["[SYSTEM] Division Sector Grid Initialized."]);
  const prevOccupiedBlocksRef = useRef(new Set());
  const terminalEndRef = useRef(null);

  const getOffsetCoordinates = (x1, y1, x2, y2, offset) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len; 
    const ny = dx / len;  
    return {
      x1: x1 + nx * offset, y1: y1 + ny * offset,
      x2: x2 + nx * offset, y2: y2 + ny * offset
    };
  };

  useEffect(() => {
    const initialTrains = allTrainData.map(t => {
      const segmentIndex = Math.floor(Math.random() * (t.path.length - 1));
      const progress = Math.random();
      const blocksCount = getBlocksForSegment(t.path[segmentIndex], t.path[segmentIndex + 1]);
      const blockNum = Math.min(Math.floor(progress * blocksCount) + 1, blocksCount);
      const currentBlockId = `${t.path[segmentIndex]}-${t.path[segmentIndex + 1]} B${blockNum}`;

      return {
        ...t, segmentIndex, progress,
        state: 'MOVING', stopTimer: 0, currentBlockId
      };
    });
    setTrains(initialTrains);
    prevOccupiedBlocksRef.current = new Set(initialTrains.map(t => t.currentBlockId));
  }, []);

  useEffect(() => {
    if (trains.length === 0) return;

    const interval = setInterval(() => {
      setTrains(prevTrains => {
        let newEvents = [];
        const currentOccupiedBlocks = new Set();
        
        const updatedTrains = prevTrains.map(train => {
          let updatedTrain = { ...train };

          if (train.state === 'STOPPED') {
            if (train.stopTimer > 0) {
              updatedTrain.stopTimer -= 1; 
            } else {
              let nextSegment = train.segmentIndex + 1;
              if (nextSegment >= train.path.length - 1) {
                nextSegment = 0; 
              }
              
              const stationLeft = stations.find(s => s.id === train.path[updatedTrain.segmentIndex])?.name;
              if (train.segmentIndex > 0 || nextSegment === 0) {
                 newEvents.push(`${train.id} ${train.name} departed ${stationLeft}`);
              }

              updatedTrain.segmentIndex = nextSegment;
              updatedTrain.progress = 0;
              updatedTrain.state = 'MOVING';
              
              const nextStationId = train.path[nextSegment + 1];
              updatedTrain.currentBlockId = `${train.path[nextSegment]}-${nextStationId} B1`;
              newEvents.push(`${train.id} ${train.name} entered block ${updatedTrain.currentBlockId}`);
            }
          } else {
            let p = train.progress + 0.0005; // Speed drastically reduced
            
            if (p >= 1.0) {
              const destStationId = train.path[train.segmentIndex + 1];
              const destStation = stations.find(s => s.id === destStationId)?.name;
              newEvents.push(`${train.id} ${train.name} arrived at ${destStation}`);
              
              updatedTrain.progress = 1.0;
              updatedTrain.state = 'STOPPED';
              updatedTrain.stopTimer = 80; 
              updatedTrain.currentBlockId = null; 
            } else {
              updatedTrain.progress = p;
              const blocksCount = getBlocksForSegment(train.path[train.segmentIndex], train.path[train.segmentIndex + 1]);
              const blockNum = Math.min(Math.floor(p * blocksCount) + 1, blocksCount);
              const newBlockId = `${train.path[train.segmentIndex]}-${train.path[train.segmentIndex + 1]} B${blockNum}`;
              
              if (train.currentBlockId !== newBlockId) {
                newEvents.push(`${train.id} ${train.name} entered block ${newBlockId}`);
                updatedTrain.currentBlockId = newBlockId;
              }
            }
          }
          
          if (updatedTrain.currentBlockId) {
            currentOccupiedBlocks.add(updatedTrain.currentBlockId);
          }
          
          return updatedTrain;
        });

        prevOccupiedBlocksRef.current.forEach(blockId => {
          if (!currentOccupiedBlocks.has(blockId)) {
            newEvents.push(`[CLEAR] Block ${blockId} is now EMPTY`);
          }
        });
        prevOccupiedBlocksRef.current = currentOccupiedBlocks;

        if (newEvents.length > 0) {
          setMessages(prev => {
            const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
            const formattedEvents = newEvents.map(e => `[${timestamp}] ${e}`);
            const updated = [...prev, ...formattedEvents];
            return updated.length > 75 ? updated.slice(updated.length - 75) : updated;
          });
        }

        return updatedTrains;
      });
    }, 50); 

    return () => clearInterval(interval);
  }, [trains.length, stations]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getStationCoordinates = (stationId) => {
    const station = stations.find(s => s.id === stationId);
    return station ? { x: station.cx, y: station.cy } : { x: 0, y: 0 };
  };

  const getTrainPosition = (train) => {
    const start = getStationCoordinates(train.path[train.segmentIndex]);
    const end = getStationCoordinates(train.path[train.segmentIndex + 1]);
    
    if (!start || !end) return { x: 0, y: 0 };
    const offsetLine = getOffsetCoordinates(start.x, start.y, end.x, end.y, -6);
    const currentX = offsetLine.x1 + (offsetLine.x2 - offsetLine.x1) * train.progress;
    const currentY = offsetLine.y1 + (offsetLine.y2 - offsetLine.y1) * train.progress;
    
    return { x: currentX, y: currentY };
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 p-4 font-sans gap-4">
      <div className="flex w-3/4 flex-col overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-200">
        <div className="flex items-center justify-between bg-[#172b4d] px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-extrabold text-white tracking-wide">NETWORK CONTROL</h1>
            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-400 border border-blue-500/30">
              BLOCK SIMULATION
            </span>
          </div>
          <Link 
            to="/" 
            className="rounded-md bg-[#fb7f1c] px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#e16f15]"
          >
            Sign Out
          </Link>
        </div>
        
        <div className="relative flex-grow bg-[#0a1120] overflow-hidden">
          <div 
            className="absolute inset-0 opacity-20" 
            style={{ 
              backgroundImage: 'linear-gradient(#1e3a8a 1px, transparent 1px), linear-gradient(90deg, #1e3a8a 1px, transparent 1px)', 
              backgroundSize: '40px 40px' 
            }}
          />
          
          <svg className="absolute h-full w-full" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet">
            {tracks.map((track) => {
              const start = getStationCoordinates(track.from);
              const end = getStationCoordinates(track.to);
              const blocks = getBlocksForSegment(track.from, track.to);
              const upper = getOffsetCoordinates(start.x, start.y, end.x, end.y, -6);
              const lower = getOffsetCoordinates(start.x, start.y, end.x, end.y, 6);
              const ticks = [];
              for (let i = 1; i < blocks; i++) {
                const p = i / blocks;
                const cx = start.x + (end.x - start.x) * p;
                const cy = start.y + (end.y - start.y) * p;
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const nx = -dy / len;
                const ny = dx / len;
                
                ticks.push(
                  <line 
                    key={`tick-${track.id}-${i}`}
                    x1={cx + nx * -12} y1={cy + ny * -12} 
                    x2={cx + nx * 12} y2={cy + ny * 12}
                    stroke="#475569" strokeWidth="2" strokeOpacity="0.8"
                  />
                );
              }

              return (
                <g key={track.id}>
                  <line x1={upper.x1} y1={upper.y1} x2={upper.x2} y2={upper.y2} stroke="#1e3a8a" strokeWidth="2" />
                  <line x1={lower.x1} y1={lower.y1} x2={lower.x2} y2={lower.y2} stroke="#1e3a8a" strokeWidth="2" />
                  {ticks}
                </g>
              );
            })}

            {stations.map((station) => (
              <g key={station.id}>
                <circle cx={station.cx} cy={station.cy} r="14" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
                <circle cx={station.cx} cy={station.cy} r="6" fill="#ffffff" />
                <text x={station.cx} y={station.cy - 22} fill="#94a3b8" fontSize="14" fontWeight="600" textAnchor="middle">
                  {station.name}
                </text>
                <text x={station.cx} y={station.cy + 24} fill="#3b82f6" fontSize="11" fontWeight="bold" textAnchor="middle">
                  {station.id}
                </text>
              </g>
            ))}

            {trains.map((train) => {
              const pos = getTrainPosition(train);
              return (
                <g key={train.id} style={{ transition: 'none' }}>
                  <circle cx={pos.x} cy={pos.y} r="5" fill={train.state === 'STOPPED' ? '#ef4444' : '#fb7f1c'} />
                  <rect x={pos.x + 8} y={pos.y - 8} width="40" height="16" fill="#172b4d" rx="3" stroke={train.state === 'STOPPED' ? '#ef4444' : '#fb7f1c'} strokeWidth="1" />
                  <text x={pos.x + 28} y={pos.y + 3} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                    {train.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="flex w-1/4 flex-col overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-200">
        <div className="bg-[#172b4d] px-6 py-4">
          <h2 className="text-lg font-bold text-white tracking-wide">SECTOR TERMINAL</h2>
        </div>
        <div className="flex-grow overflow-y-auto bg-gray-900 p-4 font-mono text-xs leading-relaxed text-[#00ff41]">
          {messages.map((msg, index) => (
            <div key={index} className={`mb-2 break-words border-b border-gray-800 pb-1 ${msg.includes('EMPTY') ? 'text-gray-400' : 'text-[#00ff41]'}`}>
              {msg}
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};

export default MapDashboard;