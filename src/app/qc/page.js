"use client";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import { 
  FiCheckCircle, FiActivity, FiUserCheck, FiBox
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
    status: "Pending"
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

  // 🟢 FIX 1: CALCULATOR LOGIC (Updated Variable Name)
  useEffect(() => {
    if (!selectedJob) return;

    // Look for 'totalQty' first (based on your old data), then fallbacks
    const total = selectedJob.totalQty || selectedJob.targetQuantity || selectedJob.quantity || 0;
    
    const sample = Number(formData.sampleSize) || 0;
    const rejected = Number(formData.qtyRejected) || 0;

    let rate = 0;
    if (sample > 0) rate = (rejected / sample) * 100;

    let passed = total - rejected;
    if (passed < 0) passed = 0;

    let statusRec = "Excellent";
    if (rate > 0) statusRec = "Rectification Required";
    if (rate > 10) statusRec = "⚠️ High Failure Rate";

    setStats({
        defectRate: rate.toFixed(2),
        projectedPass: passed,
        status: statusRec
    });

  }, [formData.sampleSize, formData.qtyRejected, selectedJob]);


  const handleSubmit = async () => {
    const sample = Number(formData.sampleSize);
    const rejected = Number(formData.qtyRejected);

    if (!sample || sample <= 0) return alert("Please enter a valid Sample Size");
    if (rejected > sample) return alert("Rejected quantity cannot be more than Sample Size!");

    if(!confirm(`Confirm QC Results?\n\n• Inspector: ${inspectorName}\n• Approved: ${stats.projectedPass} units`)) return;

    try {
      await api.post("/quality/submit", {
        jobId: selectedJob.jobId,
        sampleSize: sample,
        qtyRejected: rejected,
        notes: formData.notes
      });

      alert("✅ QC Submitted Successfully!");
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
                            
                            {/* 🟢 FIX 2: TABLE DISPLAY (Use totalQty) */}
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
                    {/* 🟢 FIX 3: MODAL DISPLAY (Use totalQty) */}
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

                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Defect Rate</p>
                        <p className={`text-2xl font-black ${Number(stats.defectRate) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {stats.defectRate}%
                        </p>
                    </div>
                    <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Approved Stock</p>
                            <p className="text-2xl font-black text-slate-900">
                            {stats.projectedPass} <span className="text-sm text-slate-400 font-medium">pcs</span>
                            </p>
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
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <FiCheckCircle /> Confirm QC
                </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}