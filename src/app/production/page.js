'use client';
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  FiScissors, FiCheckCircle, FiTrash2, FiClock, 
  FiLayers, FiList, FiBox
} from 'react-icons/fi';
import StrategyModal from './StrategyModal';
import api from '@/utils/api';
import AuthGuard from '@/components/AuthGuard';

export default function ProductionPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null); 
  
  // --- VIEW MODE: 'normal' (Individual) or 'global' (Aggregated) ---
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
          unplannedQty: 0, 
          count: 0,
          aggregatedPlans: [],
          linkedJobIds: [] 
        };
      }
      
      const total = plan.totalQtyToMake;
      const planned = plan.plannedQty || 0;
      const unplanned = total - planned;

      groups[prodId].totalQtyToMake += total;
      groups[prodId].plannedQty += planned;
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

  // 🟢 DETERMINE DATA SOURCE
  const activeData = viewMode === 'normal' ? plans : globalPlans;

  return (
    <AuthGuard requiredPermission="production">
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Production Planning</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Review sales demand and assign execution strategies.</p>
        </div>
        
        {/* --- VIEW MODE SWITCHER --- */}
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

      {/* Content */}
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
            {/* --- UNIFIED TABLE VIEW --- */}
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                        <th className="p-4 border-b w-64">Ref / Order</th>
                        <th className="p-4 border-b">Product</th>
                        
                        {/* 🟢 NEW COLUMN: Available Stock */}
                        <th className="p-4 border-b text-center w-24">In Stock</th>

                        <th className="p-4 border-b text-right">Total Order</th>
                        <th className="p-4 border-b text-right text-blue-600">Planned</th>
                        <th className="p-4 border-b text-right text-red-600">Unplanned</th>
                        <th className="p-4 border-b">Linked Jobs</th>
                        <th className="p-4 border-b text-center">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                    {activeData.map(plan => {
                        const total = plan.totalQtyToMake;
                        const planned = plan.plannedQty || 0;
                        const unplanned = plan.isGlobal ? plan.unplannedQty : (total - planned);
                        
                        // 🟢 GET STOCK FROM PRODUCT OBJECT
                        const currentStock = plan.product?.stock?.warehouse || 0;

                        return (
                            <tr key={plan._id} className={`hover:bg-slate-50 transition-colors ${plan.isGlobal ? 'bg-blue-50/10' : ''}`}>
                                <td className="p-4 align-top">
                                    {plan.isGlobal ? (
                                        <div className="flex flex-col gap-2">
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] uppercase tracking-wide font-bold w-fit">
                                                BATCH ({plan.count})
                                            </span>
                                            {/* SHOW ORDER NUMBERS IN GLOBAL VIEW */}
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
                                <td className="p-4 align-top font-bold text-slate-800">
                                    {plan.product?.name || 'Unknown Product'}
                                    <div className="text-[10px] text-slate-400 font-normal">{plan.product?.sku}</div>
                                </td>

                                {/* 🟢 STOCK COLUMN DATA */}
                                <td className="p-4 align-top text-center">
                                    <div className={`inline-flex flex-col items-center px-2 py-1 rounded-lg border ${currentStock > 0 ? 'bg-purple-50 border-purple-100' : 'bg-slate-50 border-slate-100'}`}>
                                        <span className={`font-black text-sm ${currentStock > 0 ? 'text-purple-700' : 'text-slate-400'}`}>
                                            {currentStock}
                                        </span>
                                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">Avail</span>
                                    </div>
                                </td>

                                <td className="p-4 align-top text-right font-black text-slate-900">
                                    {total}
                                </td>
                                <td className="p-4 align-top text-right font-bold text-blue-600 bg-blue-50/30">
                                    {planned}
                                </td>
                                <td className="p-4 align-top text-right font-black text-red-600 bg-red-50/30">
                                    {unplanned}
                                </td>
                                
                                <td className="p-4 align-top max-w-xs">
                                    <div className="flex flex-wrap gap-1">
                                        {plan.linkedJobIds?.length > 0 ? (
                                            plan.linkedJobIds.slice(0, 5).map(job => (
                                                <span key={job} className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                                                    {job}
                                                </span>
                                            ))
                                        ) : <span className="text-slate-300 italic text-xs">-</span>}
                                        {plan.linkedJobIds?.length > 5 && (
                                            <span className="text-[10px] text-slate-400 pl-1">+{plan.linkedJobIds.length - 5} more</span>
                                        )}
                                    </div>
                                </td>

                                <td className="p-4 align-top text-center">
                                    <div className="flex justify-center items-center gap-2">
                                        {!plan.isGlobal && (
                                            <button 
                                                onClick={() => deletePlan(plan._id)}
                                                className="p-2 text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Plan"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        )}
                                        
                                        {unplanned > 0 ? (
                                            <button 
                                                onClick={() => setSelectedPlan(plan)}
                                                className={`px-4 py-2 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-md transition-all 
                                                    ${plan.isGlobal ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-slate-900 hover:bg-slate-800'}`}
                                            >
                                                <FiScissors /> {plan.isGlobal ? 'Batch Strategy' : `Plan ${unplanned}`}
                                            </button>
                                        ) : (
                                            <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                                                <FiCheckCircle/> Done
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            
            {activeData.length === 0 && !loading && (
                <div className="p-12 text-center text-slate-400 font-medium">No plans available in this view.</div>
            )}
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