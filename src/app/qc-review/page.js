"use client";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import { 
  FiAlertTriangle, FiCheck, FiX, FiFileText 
} from "react-icons/fi";

export default function AdminQCReview() {
  const [heldJobs, setHeldJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [decision, setDecision] = useState(null); // 'approve' or 'reject'
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    fetchHeldJobs();
  }, []);

  const fetchHeldJobs = async () => {
    try {
      const res = await api.get("/quality/held");
      setHeldJobs(res.data);
    } catch (error) {
      console.error("Error fetching held jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (job, type) => {
    setSelectedJob(job);
    setDecision(type);
    setAdminNote(""); 
    setModalOpen(true);
  };

  const handleSubmitDecision = async () => {
    if (!selectedJob || !decision) return;

    try {
      const res = await api.post("/quality/review", {
        jobId: selectedJob.jobId,
        decision: decision,
        adminNotes: adminNote
      });
      
      setModalOpen(false);
      setSelectedJob(null);
      alert(res.data.msg); 
      fetchHeldJobs(); 
    } catch (error) {
      alert("Error: " + (error.response?.data?.msg || error.message));
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 h-screen flex flex-col">
      
      {/* Page Header */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FiAlertTriangle className="text-red-600" /> QC Hold Review
        </h1>
        <p className="text-slate-500 text-sm mt-1">Review batches with high rejection rates ({'>'}20%).</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading Data...</div>
      ) : heldJobs.length === 0 ? (
        <div className="p-16 bg-green-50 border border-green-100 rounded-3xl text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <FiCheck size={32} />
            </div>
            <h3 className="text-green-900 font-bold text-xl">All Clear!</h3>
            <p className="text-green-700 mt-1">No batches are currently on hold.</p>
        </div>
      ) : (
        /* EXCEL-LIKE TABLE CONTAINER */
        <div className="flex-1 overflow-auto border border-slate-200 rounded-xl shadow-sm bg-white">
          <table className="w-full text-left border-collapse">
            
            {/* STICKY HEADER */}
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <tr>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 w-32">Status</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 w-32">Job ID</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">Product</th>
                    
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 text-center bg-blue-50/10 w-24">Total Batch</th>
                    <th className="p-4 text-xs font-bold text-blue-700 uppercase border-b border-slate-200 text-center bg-blue-50/30 w-24">Sample Size</th>
                    <th className="p-4 text-xs font-bold text-red-600 uppercase border-b border-slate-200 text-center bg-red-50/30 w-24">Rejected</th>
                    
                    <th className="p-4 text-xs font-bold text-red-600 uppercase border-b border-slate-200 text-center w-24">Rate %</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 w-64">Inspector Note</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 text-center w-24">Stock Add</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 text-right w-32">Action</th>
                </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {heldJobs.map((job) => {
                const qc = job.qcResult || {}; 

                // 🟢 FIX: Check ALL possible field names for Total Qty
                // 1. Try QC Snapshot (totalBatchQty)
                // 2. Try Job Field A (totalQty)
                // 3. Try Job Field B (targetQuantity)
                const finalTotal = qc.totalBatchQty || job.totalQty || job.targetQuantity || 0;

                return (
                  <tr key={job._id} className="hover:bg-slate-50 transition-colors group">
                    
                    {/* Status Badge */}
                    <td className="p-4">
                         <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-black uppercase whitespace-nowrap">
                            QC HOLD
                         </span>
                    </td>

                    {/* Job ID & Date */}
                    <td className="p-4">
                        <div className="font-mono text-xs font-bold text-slate-700">{job.jobId}</div>
                        <div className="text-[10px] text-slate-400">{new Date(job.updatedAt).toLocaleDateString()}</div>
                    </td>

                    {/* Product */}
                    <td className="p-4">
                        <div className="font-bold text-slate-900 text-sm">{job.productId?.name || "Unknown"}</div>
                        <div className="text-xs text-slate-500 font-mono">SKU: {job.productId?.sku || "N/A"}</div>
                    </td>

                    {/* 🟢 TOTAL BATCH (Fixed) */}
                    <td className="p-4 text-center font-bold text-slate-700 bg-blue-50/10 border-l border-slate-100">
                        {finalTotal}
                    </td>

                    {/* Sample Size */}
                    <td className="p-4 text-center font-black text-blue-700 bg-blue-50/30 border-l border-white">
                        {qc.sampleSize || 0}
                    </td>

                    {/* Rejected Qty */}
                    <td className="p-4 text-center font-black text-red-600 bg-red-50/30 border-l border-white">
                        {qc.rejectedQty || 0}
                    </td>

                    {/* Rate % */}
                    <td className="p-4 text-center font-bold text-red-600 bg-red-50/10 border-l border-white">
                        {qc.defectRate || "0%"}
                    </td>

                    {/* Inspector Note */}
                    <td className="p-4">
                        <div className="flex items-start gap-2">
                             <FiFileText className="text-slate-400 mt-0.5 flex-shrink-0" />
                             <div>
                                 <p className="text-xs text-slate-600 italic line-clamp-2" title={qc.notes}>
                                    "{qc.notes || "No notes"}"
                                 </p>
                                 <p className="text-[10px] text-slate-400 font-bold mt-0.5">{qc.inspectorName}</p>
                             </div>
                        </div>
                    </td>

                    {/* Potential Stock */}
                    <td className="p-4 text-center">
                        <span className="font-black text-slate-800">
                            {qc.passedQty !== undefined ? qc.passedQty : (finalTotal - (qc.rejectedQty || 0))}
                        </span>
                        <span className="text-[10px] text-slate-400 block">pcs</span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => openReviewModal(job, 'approve')}
                                className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors"
                                title="Force Accept"
                            >
                                <FiCheck size={16} />
                            </button>
                            <button 
                                onClick={() => openReviewModal(job, 'reject')}
                                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                                title="Reject & Discard"
                            >
                                <FiX size={16} />
                            </button>
                        </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CUSTOM MODAL */}
      {modalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`px-6 py-4 border-b flex justify-between items-center ${decision === 'approve' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
               <div>
                 <h3 className={`text-lg font-black ${decision === 'approve' ? 'text-emerald-800' : 'text-red-800'}`}>
                   {decision === 'approve' ? 'Force Accept Batch' : 'Reject & Discard Batch'}
                 </h3>
                 <p className="text-xs font-bold text-slate-500 mt-0.5">Job ID: {selectedJob.jobId}</p>
               </div>
               <button onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-full bg-white/50 hover:bg-white flex items-center justify-center transition-colors">✕</button>
            </div>
            <div className="p-6">
                <p className="text-sm text-slate-600 mb-4 font-medium">
                  {decision === 'approve' 
                    ? "This will override the QC Hold and add the stock to inventory immediately."
                    : "This will mark the batch as rejected. No stock will be added and the job will be closed."}
                </p>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Admin Notes (Optional)</label>
                <textarea 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-24 resize-none"
                  placeholder="Reason for this decision..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                ></textarea>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                  <button onClick={handleSubmitDecision} className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 ${decision === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}>
                    Confirm {decision === 'approve' ? 'Accept' : 'Reject'}
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}