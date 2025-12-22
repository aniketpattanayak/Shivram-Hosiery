// frontend/src/app/production/StrategyModal.js
'use client';
import { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import api from '@/utils/api';

export default function StrategyModal({ plan, onClose, onSuccess, isGlobal, aggregatedPlans }) {
  // 🟢 CALCULATE LIMITS FOR PARTIAL PLANNING
  const totalOrder = plan.totalQtyToMake;
  const alreadyPlanned = plan.plannedQty || 0;
  // If global, use aggregated unplanned, otherwise calc single
  const remainingToPlan = isGlobal ? plan.unplannedQty : (totalOrder - alreadyPlanned);

  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  
  // 🟢 INITIAL SPLIT QTY = REMAINING
  const [splits, setSplits] = useState([
    { 
      id: "init-1", 
      qty: remainingToPlan, // Default to remaining
      mode: 'Manufacturing', 
      routing: {
        cutting: { type: 'In-House', vendorName: '' },
        stitching: { type: 'Job Work', vendorName: '' },
        packing: { type: 'In-House', vendorName: '' }
      },
      trading: { vendorId: '', cost: 0 } 
    }
  ]);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await api.get('/vendors'); 
        setVendors(res.data);
      } catch (e) { console.error(e); }
    };
    fetchVendors();
  }, []);

  const jobWorkers = vendors.filter(v => v.category === 'Job Worker');
  const traders = vendors.filter(v => v.category === 'Full Service Factory' || v.category === 'Trading');

  const addSplit = () => {
    const used = splits.reduce((acc, s) => acc + (Number(s.qty) || 0), 0);
    const remaining = remainingToPlan - used;
    if (remaining <= 0) return alert("All remaining quantity is already assigned.");

    setSplits([...splits, {
      id: `split-${Date.now()}-${Math.random()}`, 
      qty: remaining,
      mode: 'Manufacturing',
      routing: {
        cutting: { type: 'In-House', vendorName: '' },
        stitching: { type: 'Job Work', vendorName: '' },
        packing: { type: 'In-House', vendorName: '' }
      },
      trading: { vendorId: '', cost: 0 } 
    }]);
  };

  const removeSplit = (id) => {
    if (splits.length === 1) return alert("At least one split is required.");
    setSplits(splits.filter(s => s.id !== id));
  };

  const updateSplit = (id, field, value) => {
    setSplits(splits.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const updateRouting = (id, stage, field, value) => {
    setSplits(splits.map(s => {
        if(s.id !== id) return s;
        return {
            ...s,
            routing: {
                ...s.routing,
                [stage]: { ...s.routing[stage], [field]: value }
            }
        };
    }));
  };

  const updateTrading = (id, field, value) => {
    setSplits(splits.map(s => s.id === id ? { ...s, trading: { ...s.trading, [field]: value } } : s));
  };

  // 🟢 VALIDATION: Must not exceed REMAINING, but CAN be less
  const totalAssigned = splits.reduce((acc, s) => acc + (Number(s.qty) || 0), 0);
  const isValid = totalAssigned > 0 && totalAssigned <= remainingToPlan;

  const handleSubmit = async () => {
    if(!isValid) return alert(`Total assigned (${totalAssigned}) cannot exceed Remaining (${remainingToPlan})`);
    
    setLoading(true);
    try {
      const formattedSplits = splits.map(s => {
        const base = { 
            qty: s.qty, 
            mode: s.mode,
            type: s.mode === 'Full-Buy' ? 'Full-Buy' : 'In-House' 
        };
        
        if (s.mode === 'Manufacturing') {
            base.routing = s.routing;
        } else {
            const t = s.trading || { vendorId: '', cost: 0 };
            base.vendorId = t.vendorId; 
            base.cost = t.cost;
        }
        return base;
      });

      const payload = { planId: plan._id, splits: formattedSplits };

      // Backend now handles partials automatically
      if (isGlobal && aggregatedPlans?.length) {
         // Note: Global partials are complex, backend will distribute or error.
         // For now we map to the first plan or send array if backend supports it.
         // Assuming single plan focus for this partial update based on previous context.
         // If global, we might just send the array of IDs.
         await api.post('/production/confirm-strategy', { ...payload, planIds: aggregatedPlans.map(p => p._id) });
      } else {
         await api.post('/production/confirm-strategy', payload);
      }
      onSuccess();
    } catch (error) {
      alert("Error: " + (error.response?.data?.msg || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Production Split Strategy</h3>
            <p className="text-xs text-slate-500 mt-1">Split quantity across different vendors or methods.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full"><FiX size={20} /></button>
        </div>

        {/* 🟢 STATS HEADER */}
        <div className="grid grid-cols-3 gap-4 p-6 bg-blue-50 border-b border-blue-100">
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Total Order</p>
                <p className="text-xl font-black text-slate-800">{totalOrder}</p>
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Already Planned</p>
                <p className="text-xl font-bold text-blue-600">{alreadyPlanned}</p>
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Remaining to Plan</p>
                <p className="text-xl font-black text-red-600">{remainingToPlan}</p>
            </div>
        </div>

        <div className="p-6 overflow-y-auto flex-grow bg-slate-50/50">
            <div className="space-y-4">
                {splits.map((split, index) => (
                    <div key={split.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-2">
                        <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap gap-3 items-center">
                            <span className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded">#{index + 1}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-500 uppercase">Qty:</span>
                                <input type="number" className="w-20 p-1.5 text-center font-bold border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={split.qty} onChange={(e) => updateSplit(split.id, 'qty', Number(e.target.value))} />
                            </div>
                            <select className="p-1.5 text-sm font-bold border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={split.mode} onChange={(e) => updateSplit(split.id, 'mode', e.target.value)}>
                                <option value="Manufacturing">Manufacturing (Hybrid)</option>
                                <option value="Full-Buy">Full Buy (Trading)</option>
                            </select>
                            <button onClick={() => removeSplit(split.id)} className="ml-auto text-slate-400 hover:text-red-600"><FiTrash2 /></button>
                        </div>

                        <div className="p-4">
                            {split.mode === 'Full-Buy' ? (
                                <div className="flex gap-4 items-center">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Trader / Factory</label>
                                        <div className="relative">
                                            <select 
                                                className="w-full p-2 border border-purple-200 bg-purple-50 rounded text-sm font-medium appearance-none outline-none focus:ring-2 focus:ring-purple-200"
                                                value={split.trading?.vendorId || ''} 
                                                onChange={(e) => updateTrading(split.id, 'vendorId', e.target.value)}
                                            >
                                                <option value="">-- Choose Vendor --</option>
                                                {traders.map(v => (
                                                    <option key={v._id} value={v._id}>{v.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-3 text-purple-400 pointer-events-none text-xs">▼</div>
                                        </div>
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cost/Unit</label>
                                        <input type="number" className="w-full p-2 border border-purple-200 bg-purple-50 rounded text-sm font-medium" placeholder="0.00" value={split.trading?.cost || 0} onChange={(e) => updateTrading(split.id, 'cost', e.target.value)} />
                                    </div>
                                </div>
                            ) : (
                                <div className="border border-slate-100 rounded-lg overflow-hidden">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 font-bold text-slate-500">
                                            <tr><th className="p-2">Stage</th><th className="p-2">Source</th><th className="p-2">Vendor</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {['cutting', 'stitching', 'packing'].map(stage => (
                                                <tr key={stage}>
                                                    <td className="p-2 font-bold capitalize text-slate-700">{stage}</td>
                                                    <td className="p-2">
                                                        <select className="w-full p-1 border rounded" value={split.routing[stage].type} onChange={(e) => updateRouting(split.id, stage, 'type', e.target.value)}>
                                                            <option value="In-House">In-House</option>
                                                            <option value="Job Work">Job Work</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-2">
                                                        {split.routing[stage].type === 'Job Work' ? (
                                                            <div className="relative">
                                                                <select 
                                                                    className="w-full p-1 border border-amber-200 bg-amber-50 rounded text-amber-900" 
                                                                    value={split.routing[stage].vendorName} 
                                                                    onChange={(e) => updateRouting(split.id, stage, 'vendorName', e.target.value)}
                                                                >
                                                                    <option value="">Select JW</option>
                                                                    {jobWorkers.map(jw => <option key={jw._id} value={jw.name}>{jw.name}</option>)}
                                                                </select>
                                                            </div>
                                                        ) : <span className="text-slate-300 italic">-</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <button onClick={addSplit} disabled={totalAssigned >= remainingToPlan} className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-400 font-bold rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><FiPlus /> Add Another Split</button>
            </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-lg">Cancel</button>
          <button onClick={handleSubmit} disabled={!isValid || loading} className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-lg shadow-lg flex items-center gap-2 disabled:opacity-50">{loading ? 'Saving...' : <><FiSave /> Confirm Splits</>}</button>
        </div>
      </div>
    </div>
  );
}