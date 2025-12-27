"use client";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import AuthGuard from "@/components/AuthGuard";
import {
  FiPackage,
  FiTruck,
  FiX,
  FiCheckCircle,
  FiInfo,
  FiLayers,
} from "react-icons/fi";

export default function VendorSpreadsheetPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [dispatchData, setDispatchData] = useState({
    actualQty: "",
    wastage: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/vendors/my-jobs");
      setJobs(res.data);
    } catch (error) {
      console.error("Error fetching vendor jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const handleDispatch = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post("/vendors/dispatch", {
        jobId: selectedJob.jobId,
        actualQty: dispatchData.actualQty,
        wastage: dispatchData.wastage,
        lotUsed: selectedJob.issuedMaterials?.[0]?.lotNumber || "N/A",
      });
      setIsModalOpen(false);
      setDispatchData({ actualQty: "", wastage: "" });
      fetchMyJobs();
      alert("Work reported successfully!");
    } catch (error) {
      alert(error.response?.data?.msg || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };
  const handleStageUpdate = async (jobId, stageResult) => {
    try {
      // This moves the job to the next stage in the database
      await api.post('/vendors/update-stage', { jobId, stageResult });
      alert(`Success: ${stageResult.replace('_', ' ')}`);
      fetchMyJobs(); // Refresh the list
    } catch (error) {
      alert("Error updating stage: " + (error.response?.data?.msg || error.message));
    }
  };

  return (
    
    <AuthGuard requiredPermission="vendor_portal">
      <div className="min-h-screen bg-white">
        {/* Header Section */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Production Log Sheet
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Manage your active job assignments and material wastage
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchMyJobs}
              className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
            >
              <FiLayers />
            </button>
          </div>
        </div>

        {/* Excel Style Table Area */}
        <div className="p-6">
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest">
                  <th className="p-4 border-r border-slate-800">Job ID</th>
                  <th className="p-4 border-r border-slate-800">
                    Product Details
                  </th>
                  <th className="p-4 border-r border-slate-800">
                    Material Issued
                  </th>
                  <th className="p-4 border-r border-slate-800 text-center">
                    Lot #
                  </th>
                  <th className="p-4 border-r border-slate-800 text-center">
                    Target
                  </th>
                  <th className="p-4 border-r border-slate-800 text-center">
                    Status
                  </th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-20 text-center text-slate-400 font-bold"
                    >
                      Loading Ledger Data...
                    </td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-20 text-center text-slate-400 font-bold"
                    >
                      No Active Assignments
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr
                      key={job._id}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="p-4 font-mono font-bold text-blue-600 border-r border-slate-100">
                        {job.jobId}
                      </td>
                      <td className="p-4 border-r border-slate-100">
                        <div className="font-bold text-slate-800">
                          {job.productId?.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">
                          {job.productId?.sku}
                        </div>
                      </td>
                      <td className="p-4 border-r border-slate-100">
                        {job.issuedMaterials &&
                        job.issuedMaterials.length > 0 ? (
                          <div className="space-y-3">
                            {job.issuedMaterials.map((mat, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-50 p-2 rounded-lg border border-slate-100"
                              >
                                <div className="font-black text-slate-900 text-[11px] uppercase">
                                  {mat.materialName}
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-[10px] font-bold text-slate-500">
                                    Qty: {mat.qtyIssued}
                                  </span>
                                  <span className="text-[9px] font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                    {mat.lotNumber}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-xs">
                            Waiting for Store Issue...
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center border-r border-slate-100">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[11px] font-black">
                          {job.issuedMaterials?.[0]?.lotNumber || "---"}
                        </span>
                      </td>
                      <td className="p-4 text-center border-r border-slate-100 font-black text-slate-900">
                        {job.totalQty}{" "}
                        <span className="text-[10px] text-slate-400">PCS</span>
                      </td>
                      <td className="p-4 text-center border-r border-slate-100">
                        <span
                          className={`text-[10px] font-black px-2 py-1 rounded-md uppercase border ${
                            job.status === "In_Progress"
                              ? "bg-blue-50 text-blue-600 border-blue-100"
                              : "bg-amber-50 text-amber-600 border-amber-100"
                          }`}
                        >
                          {job.status.replace("_", " ")}
                        </span>
                      </td>
                      {/* Action Column in Vendor Job List */}
<td className="p-4 text-center">
  <div className="flex flex-col gap-2">
    
    {/* Step 1: Cutting */}
    {job.currentStep === 'Cutting_Pending' && (
      <button 
        onClick={() => handleStageUpdate(job.jobId, 'Cutting_Completed')}
        className="w-full bg-blue-600 text-white py-2 rounded-lg text-[10px] font-black uppercase hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
      >
        Mark Cutting Done
      </button>
    )}

    {/* Step 2: Stitching */}
    {job.currentStep === 'Stitching_Pending' && (
      <button 
        onClick={() => handleStageUpdate(job.jobId, 'Stitching_Completed')}
        className="w-full bg-purple-600 text-white py-2 rounded-lg text-[10px] font-black uppercase hover:bg-purple-700"
      >
        Mark Stitching Done
      </button>
    )}

    {/* Final Step: Dispatch (Triggers Wastage Modal) */}
    {job.currentStep === 'Packaging_Pending' && (
      <button 
        onClick={() => { setSelectedJob(job); setIsModalOpen(true); }}
        className="w-full bg-slate-900 text-white py-2 rounded-lg text-[10px] font-black uppercase hover:bg-black flex items-center justify-center gap-1"
      >
        <FiTruck className="mr-1" /> Final Dispatch
      </button>
    )}
    
    {/* Waiting State */}
    {job.status === 'QC_Pending' && (
      <span className="text-slate-400 font-bold text-[10px] italic">Sent for Admin QC</span>
    )}
  </div>
</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Phase 3: Reporting Modal --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-900">
                  Final Entry
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 bg-slate-100 rounded-full"
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleDispatch} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">
                      Produced (PCS)
                    </label>
                    <input
                      type="number"
                      required
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xl"
                      value={dispatchData.actualQty}
                      onChange={(e) =>
                        setDispatchData({
                          ...dispatchData,
                          actualQty: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">
                      Wastage (KG)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xl text-red-600"
                      value={dispatchData.wastage}
                      onChange={(e) =>
                        setDispatchData({
                          ...dispatchData,
                          wastage: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  {submitting
                    ? "Processing..."
                    : "Submit to Admin Verification"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
