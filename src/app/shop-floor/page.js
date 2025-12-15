'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiBox, FiScissors, FiLayers, FiCheckCircle, FiTruck, FiArrowRight, FiX } from 'react-icons/fi';

export default function ShopFloorPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- NEW: Store Picking Lists here (Key: JobID, Value: List Array) ---
  const [pickingFeedback, setPickingFeedback] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        const res = await axios.get('http://localhost:2121/api/shopfloor');
        setJobs(res.data);
        setLoading(false);
    } catch (e) { console.error(e); }
  };

  // --- ACTIONS ---
  const issueMaterial = async (jobId) => {
    // 1. Confirmation
    if(!confirm("Confirm Issue Material? System will auto-allocate oldest stock (FIFO).")) return;
    
    try {
        const res = await axios.post('http://localhost:2121/api/shopfloor/issue', { jobId });
        
        // 2. Save the Picking List to State (Instead of Alert)
        if (res.data.pickingList) {
            setPickingFeedback(prev => ({
                ...prev,
                [jobId]: res.data.pickingList // Save list for this specific Job
            }));
        }

        // 3. Refresh Board (Card will move to Cutting)
        fetchData();
        
    } catch (error) {
        alert("Error: " + (error.response?.data?.msg || error.message));
    }
  };

  const receiveCutting = async (jobId) => {
    try {
        await axios.post('http://localhost:2121/api/shopfloor/receive', { jobId, nextStage: 'Sewing_Started' });
        fetchData();
    } catch (error) { alert("Error receiving"); }
  };

  const receiveSewing = async (jobId) => {
    try {
        await axios.post('http://localhost:2121/api/shopfloor/receive', { jobId, nextStage: 'QC_Pending' });
        fetchData();
    } catch (error) { alert("Error receiving"); }
  };

  // Helper to clear feedback
  const dismissFeedback = (jobId) => {
      setPickingFeedback(prev => {
          const newState = { ...prev };
          delete newState[jobId];
          return newState;
      });
  };

  // --- KANBAN COLUMNS ---
  const stages = [
      { id: 'Material_Pending', title: '🔴 Material Pending', icon: FiBox, action: issueMaterial, btnText: 'Issue Fabric' },
      { id: 'Cutting_Started', title: '✂️ Cutting (In Progress)', icon: FiScissors, action: receiveCutting, btnText: 'Receive Cut Panels' },
      { id: 'Sewing_Started', title: '🧵 Stitching (In Progress)', icon: FiLayers, action: receiveSewing, btnText: 'Receive Garments' },
      { id: 'QC_Pending', title: '🔍 Ready for QC', icon: FiCheckCircle, action: null, btnText: 'Go to QC Module' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">Shop Floor Execution</h1>
        <p className="text-slate-500 mt-2">Manage Job Cards, Issue Materials, and Track Production Stages.</p>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8">
        {stages.map(stage => (
            <div key={stage.id} className="min-w-[320px] bg-slate-100 rounded-2xl p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-4 text-slate-700 font-bold px-2">
                    <stage.icon /> {stage.title}
                </div>
                
                <div className="space-y-3 flex-1">
                    {jobs.filter(j => j.currentStep === stage.id).map(job => {
                        // Check if this job has a picking list feedback
                        const feedback = pickingFeedback[job.jobId];

                        return (
                            <div key={job._id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">
                                        {job.jobId}
                                    </span>
                                    
                                    {job.isBatch ? (
                                        <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200">
                                            BATCH ({job.batchPlans?.length || 0})
                                        </span>
                                    ) : (
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${job.type === 'In-House' ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'}`}>
                                            {job.type}
                                        </span>
                                    )}
                                </div>
                                
                                <h4 className="font-bold text-slate-800 text-sm">
                                    {job.productId?.name || job.planId?.product?.name || 'Unknown Item'}
                                </h4>
                                
                                <div className="text-xs text-slate-500 mt-1 mb-4">
                                    Total Qty: <span className="font-bold text-slate-900 text-lg">
                                        {job.totalQty || '0'} 
                                    </span> 
                                    <span className="text-slate-400 ml-1 text-[10px]">units</span>
                                </div>

                                {/* --- NEW: DISPLAY PICKING LIST ON CARD --- */}
                                {feedback && (
                                    <div className="mb-4 bg-emerald-50 border border-emerald-100 rounded-lg p-3 relative animate-in zoom-in-95 duration-200">
                                        <button 
                                            onClick={() => dismissFeedback(job.jobId)}
                                            className="absolute top-1 right-1 text-emerald-400 hover:text-emerald-700"
                                        >
                                            <FiX size={14} />
                                        </button>
                                        <p className="text-[10px] font-bold uppercase text-emerald-600 mb-1">✅ Material Issued:</p>
                                        <ul className="space-y-1">
                                            {feedback.map((item, idx) => (
                                                <li key={idx} className="text-[10px] text-slate-700 flex justify-between">
                                                    <span>{item.material}:</span>
                                                    <span className="font-mono font-bold">
                                                        {item.qty} from {item.lotNumber}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {stage.action ? (
                                    <button 
                                        onClick={() => stage.action(job.jobId)}
                                        className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors flex justify-center items-center gap-2"
                                    >
                                        {stage.btnText} <FiArrowRight />
                                    </button>
                                ) : (
                                    <div className="text-center text-xs font-bold text-emerald-600 bg-emerald-50 py-2 rounded-lg border border-emerald-100">
                                        Waiting for Inspection
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {jobs.filter(j => j.currentStep === stage.id).length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-xs font-bold italic opacity-50">
                            No jobs in this stage
                        </div>
                    )}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}