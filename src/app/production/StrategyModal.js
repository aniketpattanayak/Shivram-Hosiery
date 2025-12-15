'use client';
import { useState } from 'react';
import axios from 'axios';
import { FiX, FiCheck } from 'react-icons/fi';

export default function StrategyModal({ plan, onClose, onSuccess, isGlobal, aggregatedPlans }) {
  const totalRequired = plan.totalQtyToMake;
  const [loading, setLoading] = useState(false);
  
  const [splits, setSplits] = useState({
    In_House: 0,
    Job_Work: 0,
    Trading_Buy: 0
  });

  // Math Logic
  const currentTotal = Object.values(splits).reduce((a, b) => a + b, 0);
  const remaining = totalRequired - currentTotal;
  const isValid = remaining === 0;

  const handleSubmit = async () => {
    if (!isValid) return;

    // --- CRITICAL FIX: Robust ID Check ---
    // If Global, we use aggregatedPlans. For normal, we check planId.
    const validPlanId = plan._id || plan.id || plan.planId;

    if (!isGlobal && !validPlanId) {
        alert("Critical Error: Plan ID is missing. Cannot save strategy.");
        return;
    }

    setLoading(true);

    // Prepare the split array for the backend (Base Split)
    // Mapping UI keys to Backend Enums: ['In-House', 'Job-Work', 'Full-Buy']
    const baseSplitArray = Object.entries(splits)
      .filter(([_, qty]) => qty > 0)
      .map(([method, qty]) => {
        let type = '';
        if (method === 'In_House') type = 'In-House';
        if (method === 'Job_Work') type = 'Job-Work';
        if (method === 'Trading_Buy') type = 'Full-Buy';
        return { type, qty };
      });

    try {
      if (isGlobal && aggregatedPlans && aggregatedPlans.length > 0) {
        // --- NEW BATCH MODE ---
        // We do NOT loop. We send ALL IDs to the backend to create ONE merged job.
        
        const allPlanIds = aggregatedPlans.map(p => p._id);
        
        await axios.post('http://localhost:2121/api/production/confirm-strategy', {
            planIds: allPlanIds, // <--- Sending Array of IDs
            splits: baseSplitArray
        });

      } else {
        // --- NORMAL MODE ---
        // Send Single ID
        await axios.post('http://localhost:2121/api/production/confirm-strategy', {
          planId: validPlanId, // <--- Sending String ID
          splits: baseSplitArray
        });
      }
      
      onSuccess(); // Close and Refresh
    } catch (error) {
      console.error(error);
      alert('Error: ' + (error.response?.data?.msg || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {isGlobal ? "Batch Production Strategy" : "Production Strategy"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isGlobal ? `Merging ${aggregatedPlans?.length} orders into one Batch execution` : "Split the order execution methods"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Progress Bar Header */}
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Demand</p>
              <p className="text-4xl font-black text-slate-900">{totalRequired}<span className="text-lg font-medium text-slate-400 ml-1">units</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider mb-1">Unassigned</p>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${remaining === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {remaining} left
              </span>
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            
            {/* 1. In House */}
            <div className={`p-4 rounded-xl border transition-colors ${splits.In_House > 0 ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-100 hover:border-blue-200'}`}>
              <div className="flex justify-between mb-2">
                <label className="font-bold text-blue-900">🏭 In-House (Internal)</label>
                <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wide">Consumes Fabric</span>
              </div>
              <input 
                type="number" 
                min="0" 
                max={totalRequired}
                value={splits.In_House || ''}
                onChange={(e) => setSplits({...splits, In_House: Number(e.target.value)})}
                className="w-full bg-white border-blue-200 rounded-lg text-lg font-bold text-blue-900 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            {/* 2. Job Work */}
            <div className={`p-4 rounded-xl border transition-colors ${splits.Job_Work > 0 ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-100 hover:border-amber-200'}`}>
              <div className="flex justify-between mb-2">
                <label className="font-bold text-amber-900">✂️ Outsource (Job Work)</label>
                <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wide">Consumes Fabric</span>
              </div>
              <input 
                type="number" 
                min="0" 
                max={totalRequired}
                value={splits.Job_Work || ''}
                onChange={(e) => setSplits({...splits, Job_Work: Number(e.target.value)})}
                className="w-full bg-white border-amber-200 rounded-lg text-lg font-bold text-amber-900 focus:ring-amber-500 focus:border-amber-500"
                placeholder="0"
              />
            </div>

            {/* 3. Trading */}
            <div className={`p-4 rounded-xl border transition-colors ${splits.Trading_Buy > 0 ? 'bg-purple-50 border-purple-300' : 'bg-slate-50 border-slate-100 hover:border-purple-200'}`}>
              <div className="flex justify-between mb-2">
                <label className="font-bold text-purple-900">📦 Full Buy (Trading)</label>
                <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wide">Zero Fabric Usage</span>
              </div>
              <input 
                type="number" 
                min="0" 
                max={totalRequired}
                value={splits.Trading_Buy || ''}
                onChange={(e) => setSplits({...splits, Trading_Buy: Number(e.target.value)})}
                className="w-full bg-white border-purple-200 rounded-lg text-lg font-bold text-purple-900 focus:ring-purple-500 focus:border-purple-500"
                placeholder="0"
              />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className={`px-6 py-2.5 text-white font-bold rounded-lg shadow-md flex items-center gap-2 transition-all transform active:scale-95
              ${isValid 
                ? 'bg-green-600 hover:bg-green-700 shadow-green-200' 
                : 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'}`
            }
          >
            {loading ? 'Processing...' : <><FiCheck /> Confirm Strategy</>}
          </button>
        </div>

      </div>
    </div>
  );
}