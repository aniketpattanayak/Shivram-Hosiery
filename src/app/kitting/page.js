"use client";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import { 
  FiPackage, FiScissors, FiUser, FiSave, FiTruck, FiPlus, FiTrash2, FiSearch, FiX, FiFilter
} from "react-icons/fi";

export default function KittingPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); // 🟢 Added Search State
  
  // Modal / Selection State
  const [selectedJob, setSelectedJob] = useState(null); 
  const [customBOM, setCustomBOM] = useState([]); 
  
  // Issue Form Data
  const [issuedToType, setIssuedToType] = useState("In-House"); 
  const [issuedToId, setIssuedToId] = useState("");
  const [manualReceiver, setManualReceiver] = useState(""); 
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data Lists
  const [vendors, setVendors] = useState([]);
  const [allMaterials, setAllMaterials] = useState([]);
  
  // Add Material Modal
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialSearch, setMaterialSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [jobsResult, materialsResult, vendorsResult] = await Promise.allSettled([
          api.get("/production/kitting"),
          api.get("/inventory/materials"), 
          api.get("/procurement/vendors")   
      ]);

      if (jobsResult.status === 'fulfilled') {
          setJobs(jobsResult.value.data);
      } else {
          console.error("❌ Failed to load Jobs");
      }

      if (materialsResult.status === 'fulfilled') {
          setAllMaterials(materialsResult.value.data);
      }

      if (vendorsResult.status === 'fulfilled') {
          setVendors(vendorsResult.value.data);
      }

    } catch (error) {
      console.error("Critical Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const openJobSheet = (job) => {
    setSelectedJob(job);
    setIssuedToId("");
    setManualReceiver("");
    setRemarks("");

    let initialBOM = [];

    if (job.customBOM && job.customBOM.length > 0) {
        initialBOM = JSON.parse(JSON.stringify(job.customBOM));
    } 
    else if (job.productId?.bom) {
        initialBOM = job.productId.bom.map(item => {
            const unitConsumption = Number(
                item.qtyRequired || item.qty || item.quantity || item.consumption || 0
            );
            const jobTargetQty = Number(job.totalQty || 0);
            const totalRequired = Number((unitConsumption * jobTargetQty).toFixed(2));

            return {
                materialId: item.material?._id,
                materialName: item.material?.name || "Unknown",
                unit: item.material?.unit || "Units",
                currentStock: item.material?.stock?.current || 0,
                batches: item.material?.stock?.batches || [],
                requiredQty: totalRequired, 
                issueQty: 0,
                selectedLot: "" 
            };
        });
    }
    setCustomBOM(initialBOM);
  };

  const handleAddMaterial = (material) => {
    if(customBOM.some(i => i.materialId === material._id)) {
        alert("Material already in BOM!");
        return;
    }
    setCustomBOM([...customBOM, {
        materialId: material._id,
        materialName: material.name,
        unit: material.unit,
        currentStock: material.stock?.current || 0,
        batches: material.stock?.batches || [],
        requiredQty: 0, 
        issueQty: 0,
        selectedLot: ""
    }]);
    setIsMaterialModalOpen(false); 
  };

  const handleRemoveMaterial = (index) => {
    const updated = [...customBOM];
    updated.splice(index, 1);
    setCustomBOM(updated);
  };

  const handleValueChange = (index, field, value) => {
    const updated = [...customBOM];
    updated[index][field] = value;
    setCustomBOM(updated);
  };

  const handleSubmit = async (sendToFloor) => {
    const receiver = issuedToType === 'Vendor' ? issuedToId : manualReceiver;
    if (!receiver) return alert("Please specify who you are issuing to.");

    const materialsToIssue = customBOM
        .filter(item => item.issueQty > 0)
        .map(item => ({
            materialId: item.materialId,
            materialName: item.materialName,
            issueQty: item.issueQty,
            lotNumber: item.selectedLot, 
            issuedTo: receiver,
            remarks
        }));

    if (materialsToIssue.length === 0 && !sendToFloor) {
        return alert("Please enter quantities to issue.");
    }

    if (confirm(sendToFloor ? "Confirm Issue & SEND TO CUTTING FLOOR?" : "Confirm Partial Issue (Keep in Store)?")) {
        setIsSubmitting(true);
        try {
            const res = await api.post("/production/kitting/issue", {
                jobId: selectedJob.jobId,
                customBOM: customBOM.map(i => ({ 
                    materialId: i.materialId,
                    materialName: i.materialName,
                    unit: i.unit,
                    requiredQty: i.requiredQty 
                })),
                materialsToIssue,
                sendToFloor,
                issuerName: "Pramod", 
                issuerRole: "Store Manager"
            });
            alert(res.data.msg);
            setSelectedJob(null); 
            fetchData(); 
        } catch (error) {
            alert("Error: " + (error.response?.data?.msg || error.message));
        } finally {
            setIsSubmitting(false);
        }
    }
  };

  // 🟢 FILTER LOGIC
  const filteredJobs = jobs.filter(job => {
      const query = searchQuery.toLowerCase();
      return (
          job.jobId?.toLowerCase().includes(query) ||
          job.productId?.name?.toLowerCase().includes(query) ||
          job.productId?.sku?.toLowerCase().includes(query)
      );
  });

  // 🟢 VIEW 1: MAIN TABLE WITH SEARCH
  if (!selectedJob) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <FiPackage className="text-blue-600" /> Kitting & Fabric Issue
                </h1>
                <p className="text-slate-500">Select a job to issue materials (FIFO or Specific Lot).</p>
            </div>
            
            {/* 🟢 SEARCH BAR */}
            <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search Job ID, Product, SKU..." 
                    className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 w-full md:w-80 shadow-sm transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                    <tr>
                        <th className="p-4 w-32">Job ID</th>
                        <th className="p-4">Product Details</th>
                        <th className="p-4 text-center">Order Qty</th>
                        <th className="p-4 text-center">Type</th>
                        <th className="p-4 text-center">Date Created</th>
                        <th className="p-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading Jobs...</td></tr>
                    ) : filteredJobs.length === 0 ? (
                        <tr><td colSpan="6" className="p-8 text-center text-slate-400">No Jobs Found</td></tr>
                    ) : (
                        filteredJobs.map(job => (
                            <tr key={job._id} className="hover:bg-blue-50/50 transition-colors group">
                                <td className="p-4 font-mono font-bold text-slate-700">{job.jobId}</td>
                                <td className="p-4">
                                    <div className="font-bold text-slate-900">{job.productId?.name}</div>
                                    <div className="text-xs text-slate-500">SKU: {job.productId?.sku}</div>
                                </td>
                                <td className="p-4 text-center font-bold text-slate-800">{job.totalQty}</td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${job.type === 'In-House' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {job.type}
                                    </span>
                                </td>
                                <td className="p-4 text-center text-sm text-slate-500">{new Date(job.createdAt).toLocaleDateString()}</td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => openJobSheet(job)}
                                        className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-md shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
                                    >
                                        Open Issue Sheet
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    );
  }

  // 🟢 VIEW 2: DETAIL ISSUE SHEET (Unchanged Logic, just re-rendering)
  return (
    <div className="p-6 h-screen flex flex-col bg-slate-50 relative">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-4 flex justify-between items-start">
            <div>
                <button onClick={() => setSelectedJob(null)} className="text-xs font-bold text-slate-400 hover:text-blue-600 mb-2">← BACK TO LIST</button>
                <h1 className="text-2xl font-black text-slate-800">{selectedJob.productId?.name} <span className="text-lg font-medium text-slate-400">({selectedJob.jobId})</span></h1>
                <p className="text-slate-500 text-sm">Target Qty: <strong>{selectedJob.totalQty}</strong></p>
            </div>
            
            <div className="flex flex-col items-end gap-2">
                 <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setIssuedToType('In-House')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${issuedToType==='In-House' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>In-House</button>
                    <button onClick={() => setIssuedToType('Vendor')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${issuedToType==='Vendor' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>Vendor</button>
                 </div>
                 
                 {issuedToType === 'Vendor' ? (
                     <select 
                        className="bg-white border border-slate-300 rounded-lg p-2 text-sm font-bold w-64"
                        value={issuedToId}
                        onChange={(e) => setIssuedToId(e.target.value)}
                     >
                        <option value="">Select Vendor...</option>
                        {vendors.map(v => <option key={v._id} value={v.name}>{v.name}</option>)}
                     </select>
                 ) : (
                     <input 
                        type="text" 
                        placeholder="Enter Staff Name (e.g. Ramesh)"
                        className="bg-white border border-slate-300 rounded-lg p-2 text-sm font-bold w-64"
                        value={manualReceiver}
                        onChange={(e) => setManualReceiver(e.target.value)}
                     />
                 )}
            </div>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><FiPackage /> Bill of Materials (BOM)</h3>
                <button 
                    onClick={() => setIsMaterialModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-md transition-all"
                >
                    <FiPlus /> Add Material
                </button>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white sticky top-0 z-10 shadow-sm text-xs font-bold text-slate-500 uppercase">
                        <tr>
                            <th className="p-4 border-b">Material</th>
                            <th className="p-4 border-b text-center w-32">Required</th>
                            <th className="p-4 border-b text-center w-32">Total Stock</th>
                            <th className="p-4 border-b text-center w-48">Select Lot / Batch</th>
                            <th className="p-4 border-b text-center w-32 bg-blue-50/50 text-blue-700">Issue Qty</th>
                            <th className="p-4 border-b text-center w-16">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {customBOM.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50">
                                <td className="p-4 font-bold text-slate-700">
                                    {item.materialName} <span className="text-[10px] text-slate-400 font-normal">({item.unit})</span>
                                </td>
                                
                                <td className="p-4 text-center">
                                    <input 
                                        type="number"
                                        className="w-20 p-1 text-center border border-slate-200 rounded font-bold text-slate-700 focus:border-blue-500 outline-none"
                                        value={item.requiredQty || 0} 
                                        onChange={(e) => handleValueChange(index, 'requiredQty', e.target.value)}
                                    />
                                </td>

                                <td className={`p-4 text-center font-bold ${item.currentStock < item.requiredQty ? 'text-red-500' : 'text-emerald-600'}`}>
                                    {Number(item.currentStock || 0).toFixed(2)}
                                </td>

                                <td className="p-4 text-center">
                                    {item.batches && item.batches.length > 0 ? (
                                        <select 
                                            className="w-full text-xs border border-slate-300 rounded p-1 outline-none"
                                            value={item.selectedLot}
                                            onChange={(e) => handleValueChange(index, 'selectedLot', e.target.value)}
                                        >
                                            <option value="">Any (FIFO)</option>
                                            {item.batches.map((b, i) => (
                                                <option key={i} value={b.lotNumber}>{b.lotNumber} ({Number(b.qty).toFixed(2)} left)</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">No Batches</span>
                                    )}
                                </td>

                                <td className="p-4 text-center bg-blue-50/10">
                                    <input 
                                        type="number" 
                                        className="w-24 p-2 text-center border border-blue-200 rounded-lg font-bold text-blue-700 focus:ring-2 focus:ring-blue-200 outline-none"
                                        placeholder="0"
                                        value={item.issueQty || ""}
                                        onChange={(e) => handleValueChange(index, 'issueQty', e.target.value)}
                                    />
                                </td>

                                <td className="p-4 text-center">
                                    <button onClick={() => handleRemoveMaterial(index)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                        <FiTrash2 />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
                <input 
                    type="text" 
                    placeholder="Remarks..." 
                    className="flex-1 mr-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                />
                <div className="flex gap-3">
                    <button 
                        disabled={isSubmitting}
                        onClick={() => handleSubmit(false)} 
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
                    >
                        Save Partial
                    </button>
                    <button 
                        disabled={isSubmitting}
                        onClick={() => handleSubmit(true)} 
                        className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center gap-2"
                    >
                        <FiScissors /> Issue & Send to Floor
                    </button>
                </div>
            </div>
        </div>

        {isMaterialModalOpen && (
            <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Select Material to Add</h3>
                        <button onClick={() => setIsMaterialModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><FiX /></button>
                    </div>
                    <div className="p-4 border-b border-slate-100">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2">
                            <FiSearch className="text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search materials..." 
                                className="bg-transparent outline-none flex-1 text-sm font-bold"
                                autoFocus
                                value={materialSearch}
                                onChange={(e) => setMaterialSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {allMaterials.filter(m => m.name.toLowerCase().includes(materialSearch.toLowerCase())).map(m => (
                            <button 
                                key={m._id} 
                                onClick={() => handleAddMaterial(m)}
                                className="w-full text-left p-3 hover:bg-blue-50 rounded-lg flex justify-between items-center group transition-colors"
                            >
                                <div>
                                    <p className="font-bold text-slate-700 group-hover:text-blue-700">{m.name}</p>
                                    <p className="text-xs text-slate-400">Stock: {Number(m.stock?.current || 0).toFixed(2)} {m.unit}</p>
                                </div>
                                <FiPlus className="text-slate-300 group-hover:text-blue-600" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}