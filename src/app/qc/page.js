"use client";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import { 
  FiCheckCircle, FiActivity, FiUserCheck, FiBox, FiAlertTriangle, FiShield
} from "react-icons/fi";

export default function QualityPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inspectorName, setInspectorName] = useState("Loading...");

  // Modal State
  const [selectedJob, setSelectedJob] = useState(null);
  const [formData, setFormData] = useState({
    sampleSize: "",
    qtyRejected: "",
    notes: ""
  });
  
  const [stats, setStats] = useState({
    defectRate: "0.00",
    projectedPass: 0,
    status: "Pending",
    isHold: false // 🟢 New state for UI warning
  });

  useEffect(() => {
    fetchPendingJobs();
    const user = JSON.parse(localStorage.getItem("userInfo"));
    if (user) setInspectorName(user.name);
  }, []);

  const fetchPendingJobs = async () => {
    try {
      const res = await api.get("/quality/pending");
      setJobs(res.data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedJob) return;

    const total = selectedJob.totalQty || selectedJob.targetQuantity || selectedJob.quantity || 0;
    const sample = Number(formData.sampleSize) || 0;
    const rejected = Number(formData.qtyRejected) || 0;

    let rate = 0;
    if (sample > 0) rate = (rejected / sample) * 100;

    let passed = total - rejected;
    if (passed < 0) passed = 0;

    // 🟢 UI WARNING LOGIC
    const isHighFailure = rate >= 20;

    setStats({
        defectRate: rate.toFixed(2),
        projectedPass: passed,
        isHold: isHighFailure
    });

  }, [formData.sampleSize, formData.qtyRejected, selectedJob]);

const handleSubmit = async () => {
  const sample = Number(formData.sampleSize);
  const rejected = Number(formData.qtyRejected);

  if (!sample || sample <= 0) return alert("Please enter a valid Sample Size");
  
  // 🟢 ENFORCE RULE: Determine Status based on Threshold
  const finalStatus = stats.isHold ? "QC_HOLD" : "Pass";
  const verifiedQty = stats.isHold ? 0 : stats.projectedPass;

  let confirmMsg = `Confirm QC Results?\n\n• Inspector: ${inspectorName}`;
  if (stats.isHold) {
      confirmMsg += `\n\n⚠️ CRITICAL: DEFECT RATE IS ${stats.defectRate}% (>= 20%).\nThis batch will be put on QC HOLD and NO STOCK will be added to Warehouse.`;
  } else {
      confirmMsg += `\n• Approved Stock to Add: ${verifiedQty} units`;
  }

  if(!confirm(confirmMsg)) return;

  try {
    // 🟢 SENIOR FIX: Hit /quality/submit instead of /shopfloor/receive-v2
    // This allows the qualityController to decide if this is SFG or Warehouse stock.
    const res = await api.post("/quality/submit", {
      jobId: selectedJob.jobId,
      sampleSize: sample,
      qtyRejected: rejected,
      notes: formData.notes
    });

    alert(res.data.msg);
    setSelectedJob(null);
    setFormData({ sampleSize: "", qtyRejected: "", notes: "" });
    fetchPendingJobs();
  } catch (error) {
    alert("Error: " + (error.response?.data?.msg || error.message));
  }
};

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-white">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Quality Control Log</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Gateway for Assembly (SFG) and Final (FG) Inspections.</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 flex items-center gap-2 shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-slate-600">Inspector: {inspectorName}</span>
            </div>
        </div>
      </div>

      {/* Table View */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-200">
                <tr>
                    <th className="p-4 w-32">Job ID</th>
                    <th className="p-4 w-32">Date</th>
                    <th className="p-4">Product Details</th>
                    <th className="p-4 text-center">Type</th>
                    <th className="p-4 text-center bg-blue-50/50">Batch Size</th>
                    <th className="p-4">Client</th>
                    <th className="p-4 text-right">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {loading ? (
                    <tr><td colSpan="7" className="p-12 text-center text-slate-400 font-bold">Verifying production queue...</td></tr>
                ) : jobs.length === 0 ? (
                    <tr><td colSpan="7" className="p-12 text-center text-slate-400 font-medium italic">No batches currently awaiting inspection.</td></tr>
                ) : (
                    jobs.map((job) => {
                        // 🟢 Check if it's the first or second gate for the label
                        const isGate1 = job.currentStep !== 'Packaging_Started';
                        
                        return (
                          <tr key={job._id} className="hover:bg-slate-50 transition-colors group">
                              <td className="p-4 font-mono text-blue-600 font-bold">{job.jobId}</td>
                              <td className="p-4 text-slate-500">{new Date(job.createdAt).toLocaleDateString()}</td>
                              <td className="p-4">
                                  <span className="font-bold text-slate-800 block text-sm">
                                      {job.productId?.name || job.planId?.product?.name || "Unknown Item"}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">{job.productId?.sku || "N/A"}</span>
                              </td>
                              <td className="p-4 text-center">
                                  {isGate1 ? (
                                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[9px] font-black uppercase border border-blue-100 flex items-center justify-center gap-1">
                                          <FiShield size={10}/> Assembly
                                      </span>
                                  ) : (
                                      <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[9px] font-black uppercase border border-emerald-100 flex items-center justify-center gap-1">
                                          <FiCheckCircle size={10}/> Final
                                      </span>
                                  )}
                              </td>
                              
                              <td className="p-4 text-center bg-blue-50/20 border-x border-white">
                                  <span className="font-black text-slate-900 text-lg">
                                      {job.totalQty || job.targetQuantity || 0}
                                  </span>
                              </td>

                              <td className="p-4 text-slate-500 font-bold text-xs">{job.planId?.clientName || "INTERNAL"}</td>
                              <td className="p-4 text-right">
                                  <button 
                                      onClick={() => setSelectedJob(job)}
                                      className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-[11px] font-black uppercase rounded-lg shadow-md transition-all active:scale-95"
                                  >
                                      Inspect
                                  </button>
                              </td>
                          </tr>
                        );
                    })
                )}
            </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Inspection Gate: {selectedJob.jobId}</h2>
                    <p className="text-xs text-slate-500 font-bold mt-1 uppercase">
                        {selectedJob.productId?.name || "Unknown Product"}
                    </p>
                </div>
                <button onClick={() => setSelectedJob(null)} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm">✕</button>
            </div>

            <div className="p-6 space-y-6">
                
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200 opacity-80">
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1">
                            <FiBox /> Batch
                        </label>
                        <div className="text-xl font-black text-slate-700">
                            {selectedJob.totalQty || selectedJob.targetQuantity || 0}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Sample Size</label>
                        <input 
                            type="number" 
                            className="w-full p-3 bg-white border border-slate-200 rounded-2xl font-black text-2xl text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
                            placeholder="0"
                            value={formData.sampleSize}
                            onChange={(e) => setFormData({...formData, sampleSize: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-red-400 uppercase mb-1">Rejected</label>
                        <input 
                            type="number" 
                            className="w-full p-3 bg-red-50 border border-red-100 rounded-2xl font-black text-2xl text-red-600 focus:ring-4 focus:ring-red-100 focus:border-red-500 outline-none transition-all"
                            placeholder="0"
                            value={formData.qtyRejected}
                            onChange={(e) => setFormData({...formData, qtyRejected: e.target.value})}
                        />
                    </div>
                </div>

                {/* 🟢 DYNAMIC STATUS BOX */}
                <div className={`rounded-2xl p-5 border-2 grid grid-cols-2 gap-4 transition-all ${stats.isHold ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div>
                        <p className={`text-[10px] font-black uppercase ${stats.isHold ? 'text-red-500' : 'text-emerald-600'}`}>
                            Defect Rate (Threshold 20%)
                        </p>
                        <p className={`text-3xl font-black ${stats.isHold ? 'text-red-600' : 'text-emerald-700'}`}>
                            {stats.defectRate}%
                        </p>
                        {stats.isHold && <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full mt-2 inline-block">QC HOLD TRIGGERED</span>}
                    </div>
                    <div className="text-right flex flex-col justify-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Passed Units</p>
                            <p className={`text-3xl font-black ${stats.isHold ? 'text-slate-300 line-through' : 'text-slate-900'}`}>
                                {stats.projectedPass}
                            </p>
                            {stats.isHold && <p className="text-[10px] text-red-600 font-black mt-1 uppercase">Stock Addition Blocked</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Inspection Remarks</label>
                    <textarea 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm outline-none focus:ring-2 focus:ring-blue-100 h-24 resize-none"
                        placeholder="Detail any defects found during sample check..."
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    ></textarea>
                </div>

                <button 
                    onClick={handleSubmit}
                    className={`w-full py-4 text-white font-black text-lg rounded-2xl shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3 
                    ${stats.isHold ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}
                >
                    {stats.isHold ? <><FiAlertTriangle size={20}/> Send to Admin Review</> : <><FiCheckCircle size={20}/> Approve Batch</>}
                </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}