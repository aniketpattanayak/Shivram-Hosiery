"use client";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import { 
  FiAlertTriangle, FiCheck, FiX, FiUser, FiLayers 
} from "react-icons/fi";

export default function AdminQCReview() {
  const [heldJobs, setHeldJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [decision, setDecision] = useState(null); 
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => { fetchHeldJobs(); }, []);

  const fetchHeldJobs = async () => {
    setLoading(true); // 🟢 Show syncing state
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
      
      // 🟢 Force Refresh Sequence
      setModalOpen(false);
      setSelectedJob(null);
      
      // Wait a moment for DB to update then refresh list
      setTimeout(() => {
        fetchHeldJobs();
      }, 500);

      alert(res.data.msg); 
    } catch (error) {
      alert("Error: " + (error.response?.data?.msg || error.message));
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in h-screen flex flex-col">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FiAlertTriangle className="text-red-600" /> Admin QC Review
        </h1>
        <p className="text-slate-500 text-sm mt-1 uppercase font-black text-[10px]">Manage Production holds and overrides</p>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 font-black uppercase text-xs tracking-widest">
            Syncing QC Data...
        </div>
      ) : heldJobs.length === 0 ? (
        <div className="p-16 bg-slate-50 border border-dashed rounded-3xl text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-white shadow-sm text-emerald-500 rounded-full flex items-center justify-center mb-4">
                <FiCheck size={32} />
            </div>
            <h3 className="text-slate-900 font-bold text-xl uppercase">All Clear</h3>
            <p className="text-slate-500 mt-1">No production batches are currently on hold.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto border border-slate-200 rounded-xl shadow-sm bg-white">
          <table className="w-full text-left">
            <thead className="bg-slate-50 sticky top-0 z-10 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b">
                <tr>
                    <th className="p-4">Job Info</th>
                    <th className="p-4">Product</th>
                    <th className="p-4 text-center bg-red-50 text-red-600">Rejections</th>
                    <th className="p-4 text-center bg-emerald-50 text-emerald-600">Passed</th>
                    <th className="p-4">Inspector Feedback</th>
                    <th className="p-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {heldJobs.map((job) => (
                <tr key={job._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-mono text-xs font-black text-slate-700">{job.jobId}</div>
                    <div className="text-[10px] text-slate-400 font-bold mt-0.5">{new Date(job.updatedAt).toLocaleDateString()}</div>
                  </td>
                  <td className="p-4 font-bold text-slate-800 text-sm">
                    {job.productId?.name}
                    <div className="text-[9px] font-black text-slate-400 uppercase">SKU: {job.productId?.sku}</div>
                  </td>
                  <td className="p-4 text-center font-black text-red-600 bg-red-50/20">{job.qcResult?.rejectedQty || 0}</td>
                  <td className="p-4 text-center font-black text-emerald-600 bg-emerald-50/20">{job.qcResult?.passedQty || 0}</td>
                  <td className="p-4">
                    <p className="text-xs italic text-slate-500 line-clamp-2 leading-relaxed">"{job.qcResult?.notes || 'N/A'}"</p>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => openReviewModal(job, 'approve')} className="bg-emerald-600 text-white text-[9px] font-black px-4 py-2 rounded-lg shadow-lg uppercase">Approve</button>
                        <button onClick={() => openReviewModal(job, 'reject')} className="bg-red-600 text-white text-[9px] font-black px-4 py-2 rounded-lg shadow-lg uppercase">Scrap</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL PRESERVED */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">
            <h3 className={`text-lg font-black uppercase mb-4 ${decision === 'approve' ? 'text-emerald-600' : 'text-red-600'}`}>
              Confirm {decision}
            </h3>
            <textarea 
                className="w-full p-4 bg-slate-50 border rounded-xl text-sm font-medium outline-none h-24 mb-6" 
                placeholder="Reason for decision..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-3 text-[10px] font-black uppercase text-slate-400">Cancel</button>
              <button onClick={handleSubmitDecision} className={`flex-1 py-3 text-white text-[10px] font-black uppercase rounded-xl ${decision === 'approve' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                Confirm Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}