"use client";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import { 
  FiCheckCircle, FiActivity, FiUserCheck, FiBox, FiAlertTriangle
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


  // ... existing imports

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
    // 🔗 Calling the Verification Endpoint we built in Phase 4
    const res = await api.post("/shopfloor/receive-v2", {
      jobId: selectedJob.jobId,
      finalQty: verifiedQty, 
      qcStatus: finalStatus, // 🟢 Sends 'QC_HOLD' if >= 20%
      remarks: formData.notes + ` (Defect Rate: ${stats.defectRate}%)`
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
          <h1 className="text-2xl font-black text-slate-900">Quality Control Log</h1>
          <p className="text-slate-500 text-sm mt-1">Pending inspections and batch approvals.</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-slate-600">Inspector: {inspectorName}</span>
            </div>
        </div>
      </div>

      {/* Table View */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200">
                <tr>
                    <th className="p-4 w-32">Job ID</th>
                    <th className="p-4 w-32">Date</th>
                    <th className="p-4">Product Details</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4 text-center bg-blue-50/50">Total Batch Qty</th>
                    <th className="p-4">Client</th>
                    <th className="p-4 text-right">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {loading ? (
                    <tr><td colSpan="7" className="p-8 text-center text-slate-400">Loading Data...</td></tr>
                ) : jobs.length === 0 ? (
                    <tr><td colSpan="7" className="p-8 text-center text-slate-400 font-medium">No pending jobs found.</td></tr>
                ) : (
                    jobs.map((job) => (
                        <tr key={job._id} className="hover:bg-slate-50 transition-colors group">
                            <td className="p-4 font-mono text-blue-600 font-bold">{job.jobId}</td>
                            <td className="p-4 text-slate-500">{new Date(job.createdAt).toLocaleDateString()}</td>
                            <td className="p-4">
                                <span className="font-bold text-slate-800 block">
                                    {job.productId?.name || job.planId?.product?.name || "Unknown Item"}
                                </span>
                            </td>
                            <td className="p-4 font-mono text-slate-500 text-xs">{job.productId?.sku || "N/A"}</td>
                            
                            <td className="p-4 text-center bg-blue-50/30">
                                <span className="font-black text-slate-900 text-lg">
                                    {job.totalQty || job.targetQuantity || 0}
                                </span>
                                <span className="text-xs text-slate-400 ml-1">pcs</span>
                            </td>

                            <td className="p-4 text-slate-500 font-medium">{job.planId?.clientName || "Internal"}</td>
                            <td className="p-4 text-right">
                                <button 
                                    onClick={() => setSelectedJob(job)}
                                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95"
                                >
                                    Inspect
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-black text-slate-900">Inspect Batch: {selectedJob.jobId}</h2>
                    <p className="text-xs text-slate-500 font-bold mt-1">
                        {selectedJob.productId?.name || "Unknown Product"}
                    </p>
                </div>
                <button onClick={() => setSelectedJob(null)} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">✕</button>
            </div>

            <div className="p-6 space-y-6">
                
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 opacity-80">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                            <FiBox /> Total Qty
                        </label>
                        <div className="text-xl font-black text-slate-700">
                            {selectedJob.totalQty || selectedJob.targetQuantity || 0}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sample Size</label>
                        <input 
                            type="number" 
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xl text-slate-900 focus:border-blue-500 outline-none transition-colors"
                            placeholder="0"
                            value={formData.sampleSize}
                            onChange={(e) => setFormData({...formData, sampleSize: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-red-400 uppercase mb-1">Rejected</label>
                        <input 
                            type="number" 
                            className="w-full p-3 bg-red-50 border border-red-100 rounded-xl font-bold text-xl text-red-600 focus:border-red-500 outline-none transition-colors"
                            placeholder="0"
                            value={formData.qtyRejected}
                            onChange={(e) => setFormData({...formData, qtyRejected: e.target.value})}
                        />
                    </div>
                </div>

                {/* 🟢 DYNAMIC STATUS BOX */}
                <div className={`rounded-xl p-5 border grid grid-cols-2 gap-4 transition-colors ${stats.isHold ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <div>
                        <p className={`text-[10px] font-bold uppercase ${stats.isHold ? 'text-red-500' : 'text-green-600'}`}>
                            Defect Rate (Max 20%)
                        </p>
                        <p className={`text-2xl font-black ${stats.isHold ? 'text-red-600' : 'text-green-700'}`}>
                            {stats.defectRate}%
                        </p>
                        {stats.isHold && <span className="text-[10px] font-bold bg-red-200 text-red-800 px-2 py-0.5 rounded">QC HOLD</span>}
                    </div>
                    <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Stock to Add</p>
                            <p className={`text-2xl font-black ${stats.isHold ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                {stats.projectedPass} <span className="text-sm font-medium">pcs</span>
                            </p>
                            {stats.isHold && <p className="text-[10px] text-red-500 font-bold">0 Will be added</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Notes</label>
                    <textarea 
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-sm outline-none focus:border-blue-500 h-20 resize-none"
                        placeholder="Remarks..."
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    ></textarea>
                </div>

                <button 
                    onClick={handleSubmit}
                    className={`w-full py-3 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 
                    ${stats.isHold ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}
                >
                    {stats.isHold ? <><FiAlertTriangle /> Trigger QC HOLD</> : <><FiCheckCircle /> Confirm & Add Stock</>}
                </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}