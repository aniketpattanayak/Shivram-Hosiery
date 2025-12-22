"use client";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import AuthGuard from '@/components/AuthGuard';
import {
  FiBox, FiScissors, FiLayers, FiPackage, FiCheckCircle, 
  FiArrowRight, FiClock, FiSearch, FiFilter, FiX, FiActivity, 
  FiMapPin, FiAlertTriangle, FiUser, FiChevronsRight, FiList, FiCheckSquare
} from "react-icons/fi";

const WORKFLOW_STEPS = [
    { id: "Material_Pending", label: "Material", icon: FiBox, color: "blue", routeKey: "cutting" },
    { id: "Cutting_Started", label: "Cutting", icon: FiScissors, color: "amber", routeKey: "cutting" },
    { id: "Sewing_Started", label: "Stitching", icon: FiLayers, color: "indigo", routeKey: "stitching" },
    { id: "Packaging_Started", label: "Packing", icon: FiPackage, color: "purple", routeKey: "packaging" },
    { id: "QC_Pending", label: "QC Check", icon: FiCheckCircle, color: "emerald", routeKey: null },
];

export default function ShopFloorPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState("ALL");
  
  // 🟢 Stores the "Just Issued" picking list from backend response
  const [pickingFeedback, setPickingFeedback] = useState({}); 
  
  const [selectedJob, setSelectedJob] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/shopfloor");
      setJobs(res.data);
      setLoading(false);
    } catch (e) { console.error(e); }
  };

  // --- ACTIONS ---
  const triggerIssueMaterial = (jobId) => {
    const job = jobs.find((j) => j.jobId === jobId);
    const route = job.routing?.cutting;
    const isJobWork = route?.type === "Job Work";
    
    setConfirmDialog({
        isOpen: true,
        title: "Issue Material",
        message: isJobWork 
            ? `Issue fabric to Vendor: "${route.vendorName}" for Job Work?` 
            : "Issue fabric for In-House cutting?",
        onConfirm: async () => {
            try {
                const res = await api.post("/shopfloor/issue", { jobId });
                
                // 🟢 CAPTURE PICKING LIST
                if (res.data.pickingList) {
                    setPickingFeedback(prev => ({ ...prev, [jobId]: res.data.pickingList }));
                }
                
                fetchData();
            } catch (e) { alert("Error: " + e.message); }
            setConfirmDialog({ isOpen: false });
        }
    });
  };

  const triggerAdvanceStage = (jobId, nextStage, label) => {
      setConfirmDialog({
          isOpen: true,
          title: `Complete ${label}`,
          message: `Confirm that ${label} is finished. Move Job ${jobId} to the next stage?`,
          onConfirm: async () => {
              try {
                await api.post("/shopfloor/receive", { jobId, nextStage });
                fetchData();
              } catch (e) { alert("Error updating stage"); }
              setConfirmDialog({ isOpen: false });
          }
      });
  };

  const getStepStatus = (currentStepId, stepId) => {
    const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === currentStepId);
    const stepIndex = WORKFLOW_STEPS.findIndex(s => s.id === stepId);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const getNextStepLabel = (currentStepId) => {
    const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === currentStepId);
    if (currentIndex === -1 || currentIndex === WORKFLOW_STEPS.length - 1) return "Finish";
    return WORKFLOW_STEPS[currentIndex + 1].label;
  };

  const getActionConfig = (currentStep, jobId) => {
      switch(currentStep) {
          case 'Material_Pending': return { text: "Issue Fabric", action: () => triggerIssueMaterial(jobId), color: "bg-slate-900" };
          case 'Cutting_Started': return { text: "Cutting Done", action: () => triggerAdvanceStage(jobId, 'Sewing_Started', 'Cutting'), color: "bg-amber-600" };
          case 'Sewing_Started': return { text: "Stitching Done", action: () => triggerAdvanceStage(jobId, 'Packaging_Started', 'Stitching'), color: "bg-blue-600" };
          case 'Packaging_Started': return { text: "Packing Done", action: () => triggerAdvanceStage(jobId, 'QC_Pending', 'Packing'), color: "bg-purple-600" };
          default: return null;
      }
  };

  const filteredJobs = jobs.filter(job => {
      if (job.type === "Full-Buy") return false; 
      const matchesSearch = job.jobId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStage = filterStage === "ALL" || job.currentStep === filterStage;
      return matchesSearch && matchesStage;
  });

  return (
    <AuthGuard requiredPermission="shop-floor">
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-white">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Shop Floor Sheet</h1>
          <p className="text-slate-500 text-sm">Full production data and real-time tracking.</p>
        </div>
        <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-slate-400" />
            <input 
                type="text" placeholder="Search Job ID..." 
                className="pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-sm font-bold outline-none w-64"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
      </div>

      {/* Visual Filter Cards */}
      <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide">
        <button onClick={() => setFilterStage("ALL")} className={`flex-shrink-0 px-5 py-3 rounded-2xl border-2 transition-all flex items-center gap-3 ${filterStage === 'ALL' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}>
            <span className="font-black text-lg">{jobs.filter(j => j.type !== "Full-Buy").length}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">All Active</span>
        </button>
        {WORKFLOW_STEPS.map((step) => (
            <button key={step.id} onClick={() => setFilterStage(step.id)} className={`flex-shrink-0 px-5 py-3 rounded-2xl border-2 transition-all flex items-center gap-3 ${filterStage === step.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}>
                <step.icon size={16} />
                <div className="text-left">
                    <div className="font-black text-sm leading-none">{jobs.filter(j => j.currentStep === step.id).length}</div>
                    <div className="text-[9px] font-bold uppercase mt-1">{step.label}</div>
                </div>
            </button>
        ))}
      </div>

      {/* Main Detailed Sheet Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[1000px]">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                    <th className="p-4 w-56">Job & Product Info</th>
                    <th className="p-4 text-center">Process Pipeline</th> 
                    <th className="p-4">Location / Next Step</th>
                    <th className="p-4 text-right">Action / Picking List</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job) => {
                    const action = getActionConfig(job.currentStep, job.jobId);
                    
                    // 🟢 PRIORITY 1: Immediate Feedback (Just clicked Issue)
                    const feedback = pickingFeedback[job.jobId];
                    
                    // 🟢 PRIORITY 2: Saved History (Page Reloaded)
                    // If no immediate feedback, check if job has recorded issued materials
                    const hasHistory = !feedback && job.issuedMaterials && job.issuedMaterials.length > 0;

                    const nextStepLabel = getNextStepLabel(job.currentStep);

                    let currentLocation = "Store";
                    let isJobWork = false;
                    const stepObj = WORKFLOW_STEPS.find(s => s.id === job.currentStep);
                    const route = stepObj?.routeKey ? job.routing?.[stepObj.routeKey] : null;
                    
                    if(route) {
                        isJobWork = route.type === "Job Work";
                        currentLocation = isJobWork ? `Vendor: ${route.vendorName}` : "In-House";
                    }

                    const displayLot = job.lotNumber || job.batchNumber || job.planId?.batchNumber;

                    return (
                        <tr key={job._id} className="hover:bg-slate-50/50 transition-colors">
                            {/* 1. Job Info */}
                            <td className="p-4 align-top">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="font-mono text-blue-600 font-bold text-[10px] bg-blue-50 px-2 py-0.5 rounded">{job.jobId}</span>
                                    {displayLot && (
                                        <span className="font-mono text-purple-600 font-bold text-[10px] bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                                            LOT: {displayLot}
                                        </span>
                                    )}
                                </div>
                                <div className="font-bold text-slate-800 text-sm mt-1">{job.productId?.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{job.productId?.sku || "NO-SKU"}</div>
                                <div className="text-[10px] text-slate-500 font-bold mt-2 uppercase">Qty: {job.totalQty} | <span className="text-slate-400 font-medium">Client: {job.planId?.clientName || "Internal"}</span></div>
                                <button onClick={() => setSelectedJob(job)} className="text-[10px] text-blue-500 font-bold flex items-center gap-1 mt-3 hover:underline tracking-tight"><FiClock/> VIEW HISTORY LOG</button>
                            </td>

                            {/* 2. Pipeline */}
                            <td className="p-4 align-middle">
                                <div className="flex items-center justify-center w-full max-w-lg mx-auto relative px-4">
                                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10"></div>
                                    {WORKFLOW_STEPS.map((step) => {
                                        const status = getStepStatus(job.currentStep, step.id);
                                        const timeLog = job.timeline?.find(t => t.stage === step.id);
                                        return (
                                            <div key={step.id} className="flex-1 flex flex-col items-center">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] transition-all
                                                    ${status === 'completed' ? 'bg-emerald-500 text-white' : status === 'active' ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-white border border-slate-200 text-slate-200'}`}>
                                                    <step.icon size={12} />
                                                </div>
                                                <span className={`text-[8px] mt-1 font-bold uppercase ${status === 'active' ? 'text-blue-600' : 'text-slate-300'}`}>{step.label}</span>
                                                {timeLog && <span className="text-[7px] text-slate-400 mt-1 font-mono">{new Date(timeLog.timestamp).toLocaleDateString([], {day:'2-digit', month:'2-digit'})}</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </td>

                            {/* 3. Location */}
                            <td className="p-4 align-top">
                                <div className={`flex flex-col gap-1 text-xs font-bold ${isJobWork ? "text-amber-600" : "text-slate-600"}`}>
                                    <div className="flex items-center gap-2">
                                        <FiMapPin className="mt-0.5" />
                                        <span>{currentLocation}</span>
                                    </div>
                                    {isJobWork && <div className="text-[9px] bg-amber-50 px-1 py-0.5 rounded border border-amber-100 uppercase tracking-tighter w-fit ml-6">Job Work Active</div>}
                                    <div className="flex items-center gap-1 text-slate-400 mt-1 ml-6 text-[10px]">
                                        <FiChevronsRight /> Next: <span className="text-slate-600 font-bold uppercase">{nextStepLabel}</span>
                                    </div>
                                </div>
                            </td>

                            {/* 4. Action & Picking List */}
                            <td className="p-4 text-right align-top w-80">
                                {action ? (
                                    <button onClick={action.action} className={`px-4 py-2 text-white text-[11px] font-black rounded-lg shadow-sm active:scale-95 transition-all ${action.color} mb-2`}>
                                        {action.text} <FiArrowRight className="inline ml-1"/>
                                    </button>
                                ) : <span className="text-xs italic text-slate-300">In Process</span>}

                                {/* 🟢 1. DISPLAY IMMEDIATE FEEDBACK (If available) */}
                                {feedback && Array.isArray(feedback) && (
                                    <div className="text-left mt-2 bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-[10px] shadow-sm animate-in slide-in-from-top-1">
                                        <div className="font-bold text-emerald-800 mb-2 flex items-center gap-1 border-b border-emerald-200 pb-1">
                                            <FiList size={10} /> PICKING LIST
                                        </div>
                                        <div className="space-y-3">
                                            {feedback.map((item, idx) => (
                                                <div key={idx}>
                                                    <div className="flex justify-between font-bold text-slate-700 mb-0.5">
                                                        <span className="flex items-center gap-1"><FiCheckSquare size={10} className="text-emerald-500"/> {item.materialName}</span>
                                                        <span className="bg-white px-1 rounded border border-slate-200">Qty: {item.totalQty}</span>
                                                    </div>
                                                    {item.batches && item.batches.length > 0 ? (
                                                        <div className="pl-2 space-y-0.5 border-l-2 border-emerald-300 ml-1">
                                                            {item.batches.map((batch, bIdx) => (
                                                                <div key={bIdx} className="flex justify-between text-slate-500 font-mono text-[9px] bg-white/50 px-1 rounded">
                                                                    <span>↳ Lot {batch.lotNumber}</span>
                                                                    <span className="font-bold text-emerald-600">{batch.qty}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-amber-500 italic pl-4 text-[9px]">Check Stock (Auto)</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 🟢 2. DISPLAY SAVED HISTORY (If no immediate feedback) */}
                                {hasHistory && (
                                    <div className="text-left mt-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-[10px] shadow-sm">
                                        <div className="font-bold text-slate-600 mb-2 flex items-center gap-1 border-b border-slate-200 pb-1">
                                            <FiCheckCircle size={10} /> ISSUED MATERIAL
                                        </div>
                                        <div className="space-y-1">
                                            {job.issuedMaterials.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-slate-500 font-mono text-[9px] bg-white px-2 py-1 rounded border border-slate-100">
                                                    <span>{item.materialName}</span>
                                                    <span>
                                                        Lot <span className="font-bold text-slate-700">{item.lotNumber}</span>: <span className="font-bold text-blue-600">{item.qtyIssued}</span>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>

      {/* CONFIRMATION DIALOG & MODALS (Kept same as before) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-8 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><FiAlertTriangle size={32} /></div>
            <h3 className="text-xl font-black text-slate-900 mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-slate-500 font-medium mb-8">{confirmDialog.message}</p>
            <div className="flex gap-3">
                <button onClick={() => setConfirmDialog({...confirmDialog, isOpen: false})} className="flex-1 py-3 bg-slate-50 text-slate-600 font-bold rounded-xl">Cancel</button>
                <button onClick={confirmDialog.onConfirm} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">Yes, Confirm</button>
            </div>
          </div>
        </div>
      )}

      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 tracking-tight">Production Log: {selectedJob.jobId}</h3>
              <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-slate-200 rounded-full"><FiX/></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              {selectedJob.timeline?.map((log, i) => (
                <div key={i} className="flex gap-4 border-l-2 border-blue-100 pl-4 py-2">
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400 font-bold">{new Date(log.timestamp).toLocaleString()}</p>
                    <p className="text-sm font-bold text-slate-800">{log.action || log.stage}</p>
                    <p className="text-xs text-slate-500 mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-line">{log.details}</p>
                    {log.performedBy && <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1"><FiUser size={10}/> Done by: {log.performedBy}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </AuthGuard>
  );
}