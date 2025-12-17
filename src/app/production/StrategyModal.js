'use client';
import { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiCheck, FiSave, FiLayers, FiShoppingCart, FiSettings } from 'react-icons/fi';
import api from '@/utils/api';

export default function StrategyModal({ plan, onClose, onSuccess, isGlobal, aggregatedPlans }) {
  const totalRequired = plan.totalQtyToMake;
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  
  // 🟢 SPLIT STATE (Array of Objects)
  // Default: Start with 1 row covering full quantity
  const [splits, setSplits] = useState([
    { 
      id: 1, 
      qty: totalRequired, 
      mode: 'Manufacturing', 
      // Default Routing
      routing: {
        cutting: { type: 'In-House', vendorName: '' },
        stitching: { type: 'Job Work', vendorName: '' },
        packing: { type: 'In-House', vendorName: '' }
      },
      // Default Trading
      trading: { vendorName: '', cost: 0 }
    }
  ]);

  // Fetch Vendors
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await api.get('/vendors'); 
        setVendors(res.data);
      } catch (e) { console.error(e); }
    };
    fetchVendors();
  }, []);

  // Filter Helpers
  const getVendors = (kws) => {
    if(!vendors.length) return [];
    return vendors.filter(v => kws.some(k => (v.type || v.category || "").toLowerCase().includes(k.toLowerCase())));
  };
  const jobWorkers = getVendors(['Job Worker']);
  const traders = getVendors(['Full Service', 'Trading']);

  // --- ACTIONS ---

  const addSplit = () => {
    const used = splits.reduce((acc, s) => acc + (Number(s.qty) || 0), 0);
    const remaining = totalRequired - used;
    if (remaining <= 0) return alert("Total quantity is already assigned.");

    setSplits([...splits, {
      id: Date.now(),
      qty: remaining,
      mode: 'Manufacturing',
      routing: {
        cutting: { type: 'In-House', vendorName: '' },
        stitching: { type: 'Job Work', vendorName: '' },
        packing: { type: 'In-House', vendorName: '' }
      },
      trading: { vendorName: '', cost: 0 }
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

  // Calculate Totals
  const totalAssigned = splits.reduce((acc, s) => acc + (Number(s.qty) || 0), 0);
  const isValid = totalAssigned === totalRequired;

  const handleSubmit = async () => {
    if(!isValid) return alert(`Total assigned (${totalAssigned}) must match Order Qty (${totalRequired})`);
    
    setLoading(true);
    try {
      // Clean up payload (remove UI IDs, format for Backend)
      // Inside StrategyModal.js -> handleSubmit
      const formattedSplits = splits.map(s => {
        const base = { 
            qty: s.qty, 
            mode: s.mode,
            
            // 🟢 ADD THIS LINE TO TRICK THE OLD SERVER:
            type: s.mode === 'Full-Buy' ? 'Full-Buy' : 'In-House' 
        };
        
        if (s.mode === 'Manufacturing') {
            base.routing = s.routing;
        } else {
            const v = vendors.find(vn => vn.name === s.trading.vendorName);
            base.vendorId = v ? v._id : null;
            base.cost = s.trading.cost;
        }
        return base;
      });

      const payload = { status: 'Scheduled', splits: formattedSplits };

      if (isGlobal && aggregatedPlans?.length) {
        await api.post('/production/confirm-strategy', { ...payload, planIds: aggregatedPlans.map(p => p._id) });
      } else {
        const validId = plan._id || plan.id || plan.planId;
        await api.post('/production/confirm-strategy', { ...payload, planId: validId });
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
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Production Split Strategy</h3>
            <p className="text-xs text-slate-500 mt-1">Split quantity across different vendors or methods.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full"><FiX size={20} /></button>
        </div>

        {/* Datalists */}
        <datalist id="dl-jobworkers">{jobWorkers.map(v => <option key={v._id} value={v.name} />)}</datalist>
        <datalist id="dl-traders">{traders.map(v => <option key={v._id} value={v.name} />)}</datalist>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-grow bg-slate-50/50">
            
            {/* Totals Header */}
            <div className="flex justify-between items-end mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Total Order</span>
                    <div className="text-3xl font-black text-slate-900">{totalRequired} <span className="text-sm font-medium text-slate-400">units</span></div>
                </div>
                <div className="text-right">
                     <span className="text-xs font-bold text-slate-400 uppercase">Unassigned</span>
                     <div className={`text-xl font-bold ${totalAssigned === totalRequired ? 'text-green-600' : 'text-red-500'}`}>
                        {totalRequired - totalAssigned}
                     </div>
                </div>
            </div>

            {/* SPLITS LIST */}
            <div className="space-y-4">
                {splits.map((split, index) => (
                    <div key={split.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-2">
                        {/* Split Header */}
                        <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap gap-3 items-center">
                            <span className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded">#{index + 1}</span>
                            
                            {/* QTY INPUT */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-500 uppercase">Qty:</span>
                                <input 
                                    type="number" className="w-20 p-1.5 text-center font-bold border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={split.qty}
                                    onChange={(e) => updateSplit(split.id, 'qty', Number(e.target.value))}
                                />
                            </div>

                            {/* MODE SELECT */}
                            <select 
                                className="p-1.5 text-sm font-bold border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                value={split.mode}
                                onChange={(e) => updateSplit(split.id, 'mode', e.target.value)}
                            >
                                <option value="Manufacturing">Manufacturing (Hybrid)</option>
                                <option value="Full-Buy">Full Buy (Trading)</option>
                            </select>

                            <button onClick={() => removeSplit(split.id)} className="ml-auto text-slate-400 hover:text-red-600"><FiTrash2 /></button>
                        </div>

                        {/* Split Details Body */}
                        <div className="p-4">
                            {split.mode === 'Full-Buy' ? (
                                // TRADING VIEW
                                <div className="flex gap-4 items-center">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Trader Name</label>
                                        <input list="dl-traders" className="w-full p-2 border border-purple-200 bg-purple-50 rounded text-sm font-medium" placeholder="Select Trader..." value={split.trading.vendorName} onChange={(e) => updateTrading(split.id, 'vendorName', e.target.value)} />
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cost/Unit</label>
                                        <input type="number" className="w-full p-2 border border-purple-200 bg-purple-50 rounded text-sm font-medium" placeholder="0.00" value={split.trading.cost} onChange={(e) => updateTrading(split.id, 'cost', e.target.value)} />
                                    </div>
                                </div>
                            ) : (
                                // MANUFACTURING VIEW (3-Row Mini Table)
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
                                                        <select 
                                                            className="w-full p-1 border rounded"
                                                            value={split.routing[stage].type}
                                                            onChange={(e) => updateRouting(split.id, stage, 'type', e.target.value)}
                                                        >
                                                            <option value="In-House">In-House</option>
                                                            <option value="Job Work">Job Work</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-2">
                                                        {split.routing[stage].type === 'Job Work' ? (
                                                            <input list="dl-jobworkers" className="w-full p-1 border border-amber-200 bg-amber-50 rounded placeholder:text-amber-300 text-amber-900" placeholder="Vendor..." value={split.routing[stage].vendorName} onChange={(e) => updateRouting(split.id, stage, 'vendorName', e.target.value)} />
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

                {/* Add Button */}
                <button 
                    onClick={addSplit}
                    disabled={totalAssigned >= totalRequired}
                    className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-400 font-bold rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FiPlus /> Add Another Split
                </button>
            </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-lg">Cancel</button>
          <button onClick={handleSubmit} disabled={!isValid || loading} className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-lg shadow-lg flex items-center gap-2 disabled:opacity-50">
            {loading ? 'Saving...' : <><FiSave /> Confirm All Splits</>}
          </button>
        </div>

      </div>
    </div>
  );
}