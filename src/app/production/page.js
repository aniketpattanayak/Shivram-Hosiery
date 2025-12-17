// frontend/src/app/production/page.js
'use client';
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FiScissors, FiCheckCircle, FiTrash2, FiClock, FiLayers, FiList } from 'react-icons/fi';
import StrategyModal from './StrategyModal';
import api from '@/utils/api';
import AuthGuard from '@/components/AuthGuard';

export default function ProductionPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null); 
  
  // --- NEW STATE: View Mode ---
  const [viewMode, setViewMode] = useState('normal'); // 'normal' | 'global'

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/production/pending');
      setPlans(res.data);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (id) => {
    if (!confirm("Delete this plan?")) return;
    try {
      await api.delete(`/production/${id}`);
      fetchPlans();
    } catch (error) {
      alert("Could not delete. Hiding locally.");
      setPlans(plans.filter(p => p._id !== id));
    }
  };

  // --- NEW LOGIC: Group Plans by Product ---
  const globalPlans = useMemo(() => {
    if (viewMode === 'normal') return plans;

    // Grouping Logic
    const groups = {};
    
    plans.forEach(plan => {
      // Use Product ID as key
      const prodId = plan.product?._id || 'unknown';
      
      if (!groups[prodId]) {
        // Initialize the Group
        groups[prodId] = {
          _id: `GLOBAL-${prodId}`, // Virtual ID
          isGlobal: true,          // Flag to identify
          product: plan.product,   // Keep product details
          totalQtyToMake: 0,
          aggregatedPlans: []      // Store the original plans here
        };
      }
      
      // Accumulate
      groups[prodId].totalQtyToMake += plan.totalQtyToMake;
      groups[prodId].aggregatedPlans.push(plan);
    });

    return Object.values(groups);
  }, [plans, viewMode]);


  // --- BATCH STRATEGY HANDLER ---
  // If we confirm strategy on a "Global" card, we apply it to all children
  const handleGlobalSuccess = async () => {
     setSelectedPlan(null);
     alert("Batch Strategy Applied Successfully! ✅");
     fetchPlans(); // Refresh to clear the processed items
  };

  return (
    <AuthGuard requiredPermission="production">
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Production Planning</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Review sales demand and assign execution strategies.</p>
        </div>
        
        {/* --- NEW: Radio Buttons for View Mode --- */}
        <div className="bg-slate-100 p-1 rounded-xl flex font-bold text-sm">
           <button 
             onClick={() => setViewMode('normal')}
             className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'normal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <FiList /> Normal View
           </button>
           <button 
             onClick={() => setViewMode('global')}
             className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'global' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <FiLayers /> Global View
           </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium">Loading Plans...</div>
      ) : globalPlans.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-100 shadow-sm text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
            <FiCheckCircle size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">All Caught Up!</h3>
          <p className="text-slate-500 mt-2">No pending orders require planning.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {globalPlans.map((plan) => (
            <div key={plan._id} className={`p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-center gap-6 group 
                ${plan.isGlobal ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-slate-200'}`}>
              
              {/* Plan Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider 
                      ${plan.isGlobal ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'}`}>
                    {plan.product?.name || 'Unknown Product'}
                  </span>
                  
                  {/* Show Order ID (Normal) OR Count (Global) */}
                  {plan.isGlobal ? (
                     <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                       <FiLayers /> Aggregating {plan.aggregatedPlans.length} Orders
                     </span>
                  ) : (
                     <span className="text-xs text-slate-400 font-mono">
                       Order {plan.orderId ? `#${plan.orderId.orderId}` : 'Unknown'}
                     </span>
                  )}
                </div>

                <h3 className="text-2xl font-black text-slate-900">
                  Make {plan.totalQtyToMake} Units
                </h3>
                
                {/* Global View: Show Details of included orders */}
                {plan.isGlobal && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {plan.aggregatedPlans.map(sub => (
                            <span key={sub._id} className="text-[10px] font-mono bg-white border border-blue-100 text-blue-500 px-1.5 py-0.5 rounded">
                                #{sub.orderId?.orderId || 'N/A'} ({sub.totalQtyToMake})
                            </span>
                        ))}
                    </div>
                )}

                {!plan.isGlobal && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <FiClock /> Created: {new Date(plan.createdAt).toLocaleDateString()}
                    </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {!plan.isGlobal && (
                    <button 
                      onClick={() => deletePlan(plan._id)}
                      className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <FiTrash2 />
                    </button>
                )}

                <button 
                  onClick={() => setSelectedPlan(plan)} 
                  className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg 
                      ${plan.isGlobal 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' 
                        : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200'}`}
                >
                  <FiScissors /> {plan.isGlobal ? 'Batch Strategy' : 'Plan Strategy'}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Render Modal */}
      {selectedPlan && (
        <StrategyModal 
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onSuccess={() => {
             if (selectedPlan.isGlobal) {
                 handleGlobalSuccess();
             } else {
                 setSelectedPlan(null);
                 fetchPlans();
             }
          }}
          // If it's global, we pass the sub-plans to the modal so it can loop through them
          isGlobal={selectedPlan.isGlobal}
          aggregatedPlans={selectedPlan.aggregatedPlans}
        />
      )}
    </div>
    </AuthGuard>
  );
}