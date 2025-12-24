'use client';
import { useState, useEffect, useMemo } from 'react';
import { 
  FiScissors, FiCheckCircle, FiTrash2, FiClock, 
  FiLayers, FiList, FiBox, FiTruck, FiActivity 
} from 'react-icons/fi';
import StrategyModal from './StrategyModal';
import api from '@/utils/api';
import AuthGuard from '@/components/AuthGuard';

export default function ProductionPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null); 
  const [viewMode, setViewMode] = useState('normal'); 

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

  // --- LOGIC: Group Plans by Product (Global View) ---
  const globalPlans = useMemo(() => {
    if (viewMode !== 'global') return [];

    const groups = {};
    
    plans.forEach(plan => {
      const prodId = plan.product?._id || 'unknown';
      
      if (!groups[prodId]) {
        groups[prodId] = {
          _id: `GLOBAL-${prodId}`, 
          isGlobal: true,          
          product: plan.product,   
          totalQtyToMake: 0,
          plannedQty: 0,
          dispatchedQty: 0, 
          unplannedQty: 0, 
          count: 0,
          aggregatedPlans: [],
          linkedJobIds: [] 
        };
      }
      
      const total = plan.totalQtyToMake;
      const planned = plan.plannedQty || 0;
      const dispatched = plan.dispatchedQty || 0;
      const unplanned = total - planned - dispatched;

      groups[prodId].totalQtyToMake += total;
      groups[prodId].plannedQty += planned;
      groups[prodId].dispatchedQty += dispatched;
      groups[prodId].unplannedQty += unplanned;
      groups[prodId].count += 1;
      groups[prodId].aggregatedPlans.push(plan);
      
      if(plan.linkedJobIds && plan.linkedJobIds.length > 0) {
        groups[prodId].linkedJobIds.push(...plan.linkedJobIds);
      }
    });

    return Object.values(groups);
  }, [plans, viewMode]);

  const handleGlobalSuccess = async () => {
     setSelectedPlan(null);
     alert("Batch Strategy Applied Successfully! ✅");
     fetchPlans(); 
  };

  const activeData = viewMode === 'normal' ? plans : globalPlans;

  // 🟢 HELPER: Health Color Logic
  const getHealthColor = (status) => {
      switch(status) {
          case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200';
          case 'MEDIUM': return 'bg-orange-100 text-orange-700 border-orange-200';
          case 'OPTIMAL': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
          case 'EXCESS': return 'bg-blue-100 text-blue-700 border-blue-200';
          default: return 'bg-slate-100 text-slate-600 border-slate-200';
      }
  };

  return (
    <AuthGuard requiredPermission="production">
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1800px] mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Production Planning</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Review sales demand and assign execution strategies.</p>
        </div>
        
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
             <FiLayers /> Global Batch
           </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium">Loading Plans...</div>
      ) : plans.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-100 shadow-sm text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
            <FiCheckCircle size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">All Caught Up!</h3>
          <p className="text-slate-500 mt-2">No pending orders require planning.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                        <th className="p-4 border-b w-48">Ref / Order</th>
                        <th className="p-4 border-b">Product Info</th>
                        
                        {/* 🟢 NEW: HEALTH MONITORING COLUMNS */}
                        <th className="p-4 border-b text-center w-32 bg-slate-100/50">Inv. Health</th>
                        <th className="p-4 border-b text-center w-24 bg-slate-100/50">Stock</th>
                        
                        <th className="p-4 border-b text-right">Order Qty</th>
                        <th className="p-4 border-b text-right text-orange-600">Dispatched</th>
                        <th className="p-4 border-b text-right text-red-600 bg-red-50/10">Order Pending</th>
                        
                        {/* 🟢 NEW: OPTIMAL SUGGESTION */}
                        <th className="p-4 border-b text-center text-purple-700 bg-purple-50/30 w-32">Refill Needed</th>
                        <th className="p-4 border-b text-center w-40">Suggested Plan</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                    {activeData.map(plan => {
                        const total = plan.totalQtyToMake;
                        const planned = plan.plannedQty || 0;
                        const dispatched = plan.dispatchedQty || 0;
                        const orderPending = plan.isGlobal ? plan.unplannedQty : (total - planned - dispatched);
                        
                        // 🟢 STOCK MATH
                        const currentStock = plan.product?.stock?.warehouse || 0;
                        const targetStock = plan.product?.stockAtLeast || 0; // From your Product Model
                        const healthStatus = plan.product?.status || 'UNKNOWN';

                        // 🟢 LOGIC: How much to make to reach optimal?
                        // If we are below target, we need (Target - Current). If above, 0.
                        const refillNeeded = Math.max(0, targetStock - currentStock);
                        
                        // 🟢 LOGIC: Total Suggestion = Order Needs + Refill Needs
                        const totalSuggested = orderPending + refillNeeded;

                        return (
                            <tr key={plan._id} className={`hover:bg-slate-50 transition-colors ${plan.isGlobal ? 'bg-blue-50/10' : ''}`}>
                                <td className="p-4 align-top">
                                    {plan.isGlobal ? (
                                        <div className="flex flex-col gap-2">
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] uppercase tracking-wide font-bold w-fit">
                                                BATCH ({plan.count})
                                            </span>
                                            <div className="flex flex-wrap gap-1">
                                                {plan.aggregatedPlans.map(sub => (
                                                    <span key={sub._id} className="text-[10px] font-mono border border-slate-200 bg-white px-1.5 py-0.5 rounded text-slate-500">
                                                        #{sub.orderId?.orderId || 'N/A'}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="font-mono font-bold text-slate-600">
                                            #{plan.orderId?.orderId || 'N/A'}
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 align-top">
                                    <div className="font-bold text-slate-800">{plan.product?.name || 'Unknown Product'}</div>
                                    <div className="text-[10px] text-slate-400 font-normal">{plan.product?.sku}</div>
                                </td>

                                {/* 🟢 HEALTH STATUS */}
                                <td className="p-4 align-top text-center bg-slate-50/30">
                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${getHealthColor(healthStatus)}`}>
                                        {healthStatus}
                                    </span>
                                    <div className="text-[9px] text-slate-400 mt-1">Target: {targetStock}</div>
                                </td>

                                {/* 🟢 CURRENT STOCK */}
                                <td className="p-4 align-top text-center bg-slate-50/30">
                                    <span className="font-bold text-slate-700">{currentStock}</span>
                                </td>

                                <td className="p-4 align-top text-right font-bold text-slate-400">
                                    {total}
                                </td>

                                <td className="p-4 align-top text-right font-bold text-orange-600">
                                    {dispatched > 0 ? dispatched : "-"}
                                </td>

                                <td className="p-4 align-top text-right font-black text-red-600 bg-red-50/10">
                                    {orderPending}
                                </td>

                                {/* 🟢 REFILL CALCULATION */}
                                <td className="p-4 align-top text-center bg-purple-50/10">
                                    {refillNeeded > 0 ? (
                                        <div className="flex flex-col items-center">
                                            <span className="text-purple-700 font-bold text-xs">+{refillNeeded}</span>
                                            <span className="text-[9px] text-purple-400">to Optimal</span>
                                        </div>
                                    ) : (
                                        <span className="text-emerald-500 text-xs font-bold">OK</span>
                                    )}
                                </td>

                                {/* 🟢 TOTAL SUGGESTED ACTION */}
                                <td className="p-4 align-top text-center">
                                    {orderPending > 0 ? (
                                        <button 
                                            onClick={() => setSelectedPlan(plan)}
                                            className={`w-full px-3 py-2 text-white text-xs font-bold rounded-lg flex flex-col items-center shadow-md transition-all 
                                                ${plan.isGlobal ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                                        >
                                            <div className="flex items-center gap-1">
                                                <FiScissors /> Plan {totalSuggested}
                                            </div>
                                            {refillNeeded > 0 && (
                                                <span className="text-[9px] opacity-80">(Incl. {refillNeeded} refill)</span>
                                            )}
                                        </button>
                                    ) : (
                                        <span className="text-emerald-600 font-bold text-xs flex justify-center items-center gap-1">
                                            <FiCheckCircle/> Done
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      )}

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
          isGlobal={selectedPlan.isGlobal}
          aggregatedPlans={selectedPlan.aggregatedPlans}
        />
      )}
    </div>
    </AuthGuard>
  );
}