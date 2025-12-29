"use client";
import { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";
import AuthGuard from "@/components/AuthGuard";
import {
  FiPackage, FiTruck, FiX, FiCheckCircle, FiInfo, FiLayers,
  FiUser, FiFilter, FiSearch, FiActivity
} from "react-icons/fi";

export default function VendorSpreadsheetPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorFilter, setVendorFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [dispatchData, setDispatchData] = useState({ actualQty: "", wastage: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/vendors/my-jobs");
      setJobs(res.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchMyJobs(); }, []);

  const uniqueVendors = useMemo(() => {
    const vendors = jobs.map((j) => j.vendorId?.name).filter(Boolean);
    return ["ALL", ...new Set(vendors)];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchesVendor = vendorFilter === "ALL" || j.vendorId?.name === vendorFilter;
      const matchesSearch = j.jobId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesVendor && matchesSearch;
    });
  }, [jobs, vendorFilter, searchQuery]);

  const handleDispatch = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post("/procurement/dispatch-job", {
        jobId: selectedJob.jobId,
        actualQty: Number(dispatchData.actualQty) || 0,
        wastage: Number(dispatchData.wastage) || 0,
      });
      setIsModalOpen(false);
      setDispatchData({ actualQty: "", wastage: "" });
      fetchMyJobs();
      alert("🚀 Goods Dispatched!");
    } catch (error) { alert(error.response?.data?.msg || error.message); } finally { setSubmitting(false); }
  };

  const handleStageUpdate = async (jobId, stageResult) => {
    try {
      await api.post('/procurement/update-stage', { jobId, stageResult });
      fetchMyJobs(); 
    } catch (error) { alert(error.response?.data?.msg || error.message); }
  };

  return (
    <AuthGuard requiredPermission="vendor_portal">
      <div className="min-h-screen bg-white">
        {/* Header with Search & Filter Together */}
        <div className="p-6 border-b flex flex-col lg:flex-row justify-between items-center gap-4 bg-slate-50">
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase">Production Log</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <FiSearch className="absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text" placeholder="Search Job ID..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border rounded-xl text-xs font-bold outline-none ring-blue-100 focus:ring-2"
              />
            </div>
            <div className="flex items-center gap-2 bg-white border px-3 py-2 rounded-xl">
              <FiFilter size={12} className="text-slate-400" />
              <select 
                value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)}
                className="text-xs font-bold outline-none bg-transparent"
              >
                {uniqueVendors.map(v => <option key={v} value={v}>{v === "ALL" ? "All Vendors" : v}</option>)}
              </select>
            </div>
            <button onClick={fetchMyJobs} className="p-2.5 bg-slate-900 text-white rounded-xl shadow-md hover:scale-95 transition-all"><FiLayers /></button>
          </div>
        </div>

        <div className="p-4">
          <div className="border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                  <th className="p-4 border-r border-slate-800">Job & Vendor</th>
                  <th className="p-4 border-r border-slate-800">Product</th>
                  <th className="p-4 border-r border-slate-800">Materials</th>
                  <th className="p-4 border-r border-slate-800 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="5" className="p-10 text-center font-bold text-slate-400">LOADING...</td></tr>
                ) : filteredJobs.map((job) => (
                  <tr key={job._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 border-r">
                      <div className="font-mono font-black text-blue-600 text-xs">{job.jobId}</div>
                      <div className="flex items-center gap-1 mt-1 text-slate-500">
                        <FiUser size={10} />
                        <span className="text-[10px] font-bold uppercase truncate max-w-[120px]">{job.vendorId?.name || "Unassigned"}</span>
                      </div>
                    </td>
                    <td className="p-4 border-r">
                      <div className="font-bold text-slate-800 text-xs truncate max-w-[150px]">{job.productId?.name}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">{job.productId?.sku}</div>
                    </td>
                    <td className="p-4 border-r">
                      <div className="text-[10px] font-black text-slate-900">{job.totalQty} PCS</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {job.issuedMaterials?.slice(0, 2).map((m, i) => (
                          <span key={i} className="text-[8px] bg-slate-100 px-1 py-0.5 rounded font-bold">{m.lotNumber}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 border-r text-center">
                      <span className={`text-[9px] font-black px-2 py-1 rounded uppercase border ${job.status === "In_Progress" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-amber-50 text-amber-600 border-amber-100"}`}>
                        {job.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {job.logisticsStatus === "In_Transit" ? (
                        <div className="text-blue-600 font-black text-[9px] uppercase flex items-center justify-center gap-1">
                          <FiTruck size={12} className="animate-bounce" /> In Transit
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 items-center">
                          {job.currentStep === 'Cutting_Pending' && <button onClick={() => handleStageUpdate(job.jobId, 'Cutting_Started')} className="w-full bg-blue-600 text-white py-1.5 rounded-lg text-[9px] font-black uppercase">Start Cutting</button>}
                          {job.currentStep === 'Cutting_Started' && <button onClick={() => handleStageUpdate(job.jobId, 'Cutting_Completed')} className="w-full bg-blue-800 text-white py-1.5 rounded-lg text-[9px] font-black uppercase">Cutting Done</button>}
                          {job.currentStep === 'Stitching_Pending' && <button onClick={() => handleStageUpdate(job.jobId, 'Sewing_Started')} className="w-full bg-indigo-600 text-white py-1.5 rounded-lg text-[9px] font-black uppercase">Start Stitching</button>}
                          {job.currentStep === 'Sewing_Started' && <button onClick={() => { setSelectedJob(job); setIsModalOpen(true); }} className="w-full bg-orange-600 text-white py-1.5 rounded-lg text-[9px] font-black uppercase">Dispatch</button>}
                          {job.currentStep === 'Packaging_Pending' && <button onClick={() => handleStageUpdate(job.jobId, 'Packaging_Started')} className="w-full bg-purple-600 text-white py-1.5 rounded-lg text-[9px] font-black uppercase">Start Packing</button>}
                          {job.currentStep === 'Packaging_Started' && <button onClick={() => { setSelectedJob(job); setIsModalOpen(true); }} className="w-full bg-slate-900 text-white py-1.5 rounded-lg text-[9px] font-black uppercase">Packing Dispatch</button>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-black text-slate-900 uppercase">Report Work</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full"><FiX /></button>
              </div>
              <form onSubmit={handleDispatch} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase">PCS Produced</label>
                    <input type="number" required className="w-full p-3 bg-slate-50 border rounded-xl font-black text-lg" value={dispatchData.actualQty} onChange={(e) => setDispatchData({ ...dispatchData, actualQty: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase">Wastage (KG)</label>
                    <input type="number" step="0.01" required className="w-full p-3 bg-slate-50 border rounded-xl font-black text-lg text-red-600" value={dispatchData.wastage} onChange={(e) => setDispatchData({ ...dispatchData, wastage: e.target.value })} />
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="w-full py-3.5 bg-blue-600 text-white font-black rounded-xl uppercase text-xs">
                  {submitting ? "Processing..." : "Confirm Dispatch"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}