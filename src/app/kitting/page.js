"use client";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  FiPackage, FiScissors, FiPlus, FiTrash2, FiSearch, FiX, FiPrinter, 
  FiDownload, FiClock, FiFileText, FiList, FiEye, FiCheckCircle
} from "react-icons/fi";

export default function KittingPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [jobs, setJobs] = useState([]);
  const [historyJobs, setHistoryJobs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [allMaterials, setAllMaterials] = useState([]);

  const [selectedJob, setSelectedJob] = useState(null); 
  const [customBOM, setCustomBOM] = useState([]); 

  const [viewHistoryJob, setViewHistoryJob] = useState(null);
  const [pdfPreviewData, setPdfPreviewData] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialSearch, setMaterialSearch] = useState("");

  const [issuedToType, setIssuedToType] = useState("In-House"); 
  const [issuedToId, setIssuedToId] = useState("");
  const [manualReceiver, setManualReceiver] = useState(""); 
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]); 

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, materialsRes, vendorsRes, historyRes] = await Promise.allSettled([
          api.get("/production/kitting"),
          api.get("/inventory/materials"), 
          api.get("/procurement/vendors"),
          api.get("/production/kitting/history") 
      ]);

      if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value.data);
      if (materialsRes.status === 'fulfilled') setAllMaterials(materialsRes.value.data);
      if (vendorsRes.status === 'fulfilled') setVendors(vendorsRes.value.data);
      if (historyRes.status === 'fulfilled') setHistoryJobs(historyRes.value.data);
    } catch (error) {
      console.error("Error loading data:", error);
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
    } else if (job.productId?.bom) {
        initialBOM = job.productId.bom.map(item => {
            const unitConsumption = Number(item.qtyRequired || item.qty || item.quantity || item.consumption || 0);
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

  const generatePDF = (data, download = false) => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("MATERIAL ISSUE SLIP", 105, 15, null, null, "center");
    doc.setFontSize(10); doc.text(`Shivram Hosiery Factory`, 105, 22, null, null, "center");
    doc.text(`Job ID: ${data.jobId}`, 14, 35);
    doc.text(`Date: ${new Date().toLocaleString()}`, 140, 35);
    doc.text(`Issued To: ${data.issuedTo}`, 14, 42);
    doc.text(`Issuer: ${data.issuerName}`, 140, 42);
    
    const tableColumn = ["Material Name", "Lot / Batch", "Qty Issued"];
    const tableRows = data.items.map(item => [item.materialName, item.lotNumber || "FIFO", item.issueQty]);
    
    autoTable(doc, { 
        head: [tableColumn], 
        body: tableRows, 
        startY: 50, 
        theme: 'grid', 
        headStyles: { fillColor: [22, 163, 74] } 
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Remarks: ${data.remarks || "N/A"}`, 14, finalY);
    doc.text("__________________", 14, finalY + 20); doc.text("Receiver Sign", 14, finalY + 25);
    doc.text("__________________", 140, finalY + 20); doc.text("Store Manager Sign", 140, finalY + 25);
    
    if (download) {
        doc.save(`Issue_Slip_${data.jobId}.pdf`);
    } else {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    }
  };

  const handleValueChange = (index, field, value) => {
    const updated = [...customBOM];
    updated[index][field] = value;
    setCustomBOM(updated);
  };

  const handleAddMaterial = (material) => {
    if(customBOM.some(i => i.materialId === material._id)) return alert("Material already in BOM!");
    setCustomBOM([...customBOM, {
        materialId: material._id, materialName: material.name, unit: material.unit,
        currentStock: material.stock?.current || 0, batches: material.stock?.batches || [],
        requiredQty: 0, issueQty: 0, selectedLot: ""
    }]);
    setIsMaterialModalOpen(false);
  };

  const handleSubmit = async (sendToFloor) => {
    const receiver = issuedToType === 'Vendor' ? issuedToId : manualReceiver;
    if (!receiver) return alert("Please specify who you are issuing to.");
    const materialsToIssue = customBOM.filter(item => item.issueQty > 0).map(item => ({
        materialId: item.materialId, materialName: item.materialName,
        issueQty: item.issueQty, lotNumber: item.selectedLot, 
        issuedTo: receiver, remarks
    }));
    if (materialsToIssue.length === 0 && !sendToFloor) return alert("Please enter quantities to issue.");
    if (confirm(sendToFloor ? "Confirm Issue & SEND TO CUTTING FLOOR?" : "Confirm Partial Issue (Keep in Store)?")) {
        setIsSubmitting(true);
        try {
            await api.post("/production/kitting/issue", {
                jobId: selectedJob.jobId,
                customBOM: customBOM.map(i => ({ materialId: i.materialId, materialName: i.materialName, unit: i.unit, requiredQty: i.requiredQty })),
                materialsToIssue, sendToFloor, issuerName: "Pramod", issuerRole: "Store Manager"
            });
            const pdfData = { jobId: selectedJob.jobId, issuedTo: receiver, issuerName: "Pramod", remarks, items: materialsToIssue };
            setPdfPreviewData(pdfData);
            setShowPdfModal(true);
            fetchData(); 
        } catch (error) { alert("Error: " + (error.response?.data?.msg || error.message)); } 
        finally { setIsSubmitting(false); }
    }
  };

  if (selectedJob) {
    return (
      <div className="p-6 h-screen flex flex-col bg-slate-50 relative">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-4 flex justify-between items-start">
            <div>
                <button onClick={() => setSelectedJob(null)} className="text-xs font-bold text-slate-400 hover:text-blue-600 mb-2">← BACK TO LIST</button>
                <h1 className="text-2xl font-black text-slate-800">{selectedJob.productId?.name} <span className="text-lg font-medium text-slate-400">({selectedJob.jobId})</span></h1>
                <p className="text-slate-500 text-sm">Target Qty: <strong>{selectedJob.totalQty}</strong> | Type: <strong>{selectedJob.type}</strong></p>
            </div>
            <div className="flex flex-col items-end gap-2">
                 <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setIssuedToType('In-House')} className={`px-3 py-1 text-xs font-bold rounded-md ${issuedToType==='In-House' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>In-House</button>
                    <button onClick={() => setIssuedToType('Vendor')} className={`px-3 py-1 text-xs font-bold rounded-md ${issuedToType==='Vendor' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>Vendor</button>
                 </div>
                 {issuedToType === 'Vendor' ? (
                     <select className="bg-white border border-slate-300 rounded-lg p-2 text-sm font-bold w-64" value={issuedToId} onChange={(e) => setIssuedToId(e.target.value)}>
                        <option value="">Select Vendor...</option>{vendors.map(v => <option key={v._id} value={v.name}>{v.name}</option>)}
                     </select>
                 ) : (
                     <input type="text" placeholder="Enter Staff Name..." className="bg-white border border-slate-300 rounded-lg p-2 text-sm font-bold w-64" value={manualReceiver} onChange={(e) => setManualReceiver(e.target.value)} />
                 )}
            </div>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col mb-4">
             <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                 <h3 className="font-bold text-slate-700 flex items-center gap-2"><FiPackage /> Bill of Materials (BOM)</h3>
                 <button onClick={() => setIsMaterialModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-md transition-all"><FiPlus /> Add Material</button>
             </div>
             <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white sticky top-0 z-10 shadow-sm text-xs font-bold text-slate-500 uppercase">
                        <tr>
                            <th className="p-4 border-b text-left">Material</th>
                            <th className="p-4 border-b text-center w-24">Req</th>
                            <th className="p-4 border-b text-center w-24">Stock</th>
                            <th className="p-4 border-b text-center w-48">Lot</th>
                            <th className="p-4 border-b text-center w-32 bg-blue-50/50 text-blue-700">Issue</th>
                            <th className="p-4 border-b text-center w-16">Del</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {customBOM.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50">
                                <td className="p-4 font-bold text-slate-700">{item.materialName}</td>
                                <td className="p-4 text-center"><input type="number" className="w-16 p-1 text-center border rounded font-bold" value={item.requiredQty || 0} onChange={(e) => handleValueChange(index, 'requiredQty', e.target.value)}/></td>
                                <td className={`p-4 text-center font-bold ${item.currentStock < item.requiredQty ? 'text-red-500' : 'text-emerald-600'}`}>{Number(item.currentStock || 0).toFixed(2)}</td>
                                <td className="p-4 text-center">
                                    {item.batches && item.batches.length > 0 ? (
                                        <select className="w-full text-xs border rounded p-1" value={item.selectedLot} onChange={(e) => handleValueChange(index, 'selectedLot', e.target.value)}>
                                            <option value="">Any (FIFO)</option>{item.batches.map((b, i) => <option key={i} value={b.lotNumber}>{b.lotNumber} ({Number(b.qty).toFixed(2)})</option>)}
                                        </select>
                                    ) : <span className="text-xs text-slate-400 italic">No Batch</span>}
                                </td>
                                <td className="p-4 text-center bg-blue-50/10"><input type="number" className="w-20 p-2 text-center border border-blue-200 rounded font-bold text-blue-700" value={item.issueQty || ""} onChange={(e) => handleValueChange(index, 'issueQty', e.target.value)} placeholder="0"/></td>
                                <td className="p-4 text-center"><button onClick={() => {const u=[...customBOM];u.splice(index,1);setCustomBOM(u)}} className="text-slate-400 hover:text-red-500"><FiTrash2 /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
             <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
                <input type="text" placeholder="Remarks..." className="flex-1 mr-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                <div className="flex gap-3">
                    <button disabled={isSubmitting} onClick={() => handleSubmit(false)} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">Save Partial</button>
                    <button disabled={isSubmitting} onClick={() => handleSubmit(true)} className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg flex items-center gap-2"><FiScissors /> Issue & Send to Floor</button>
                </div>
            </div>
        </div>

        {/* ✅ FIXED: PDF Modal using 'fixed' to stay on top */}
        {showPdfModal && pdfPreviewData && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center"><h3 className="font-bold text-slate-800 flex items-center gap-2"><FiPrinter/> Slip Preview</h3><button onClick={() => setShowPdfModal(false)} className="p-2 hover:bg-slate-200 rounded-full"><FiX /></button></div>
                    <div className="p-8 bg-white overflow-y-auto font-mono text-sm border-b border-slate-200 text-slate-900">
                        <div className="text-center mb-6"><h2 className="text-xl font-bold border-b-2 border-slate-800 inline-block pb-1">MATERIAL ISSUE SLIP</h2><p className="mt-1 font-bold text-slate-600">Shivram Hosiery Factory</p></div>
                        <div className="flex justify-between mb-4"><div><p><strong>Job ID:</strong> {pdfPreviewData.jobId}</p><p><strong>Issued To:</strong> {pdfPreviewData.issuedTo}</p></div><div className="text-right"><p><strong>Date:</strong> {new Date().toLocaleDateString()}</p><p><strong>Issuer:</strong> {pdfPreviewData.issuerName}</p></div></div>
                        <table className="w-full border-collapse border border-slate-800 mb-4">
                            <thead><tr className="bg-slate-100">
                                <th className="border border-slate-800 p-2 text-left">Material</th>
                                <th className="border border-slate-800 p-2 text-left">Lot</th>
                                <th className="border border-slate-800 p-2 text-center">Qty</th>
                            </tr></thead>
                            <tbody>{pdfPreviewData.items.map((item, i) => (<tr key={i}><td className="border border-slate-800 p-2">{item.materialName}</td><td className="border border-slate-800 p-2">{item.lotNumber || "FIFO"}</td><td className="border border-slate-800 p-2 text-center font-bold">{item.issueQty}</td></tr>))}</tbody>
                        </table>
                        <p><strong>Remarks:</strong> {pdfPreviewData.remarks || "-"}</p>
                    </div>
                    <div className="p-4 bg-slate-50 flex justify-end gap-3">
                        <button onClick={() => setShowPdfModal(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg">Close</button>
                        <button onClick={() => generatePDF(pdfPreviewData, false)} className="px-6 py-2 bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2">View Full PDF</button>
                        <button onClick={() => generatePDF(pdfPreviewData, true)} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 flex items-center gap-2"><FiDownload /> Download PDF</button>
                    </div>
                </div>
            </div>
        )}

        {/* ✅ FIXED: Material Modal using 'fixed' */}
        {isMaterialModalOpen && (
            <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-800">Select Material</h3><button onClick={() => setIsMaterialModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><FiX /></button></div>
                    <div className="p-4 border-b border-slate-100"><div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"><FiSearch className="text-slate-400" /><input type="text" placeholder="Search..." className="bg-transparent outline-none flex-1 text-sm font-bold" autoFocus value={materialSearch} onChange={(e) => setMaterialSearch(e.target.value)}/></div></div>
                    <div className="flex-1 overflow-y-auto p-2 text-slate-900">{allMaterials.filter(m => m.name.toLowerCase().includes(materialSearch.toLowerCase())).map(m => (<button key={m._id} onClick={() => handleAddMaterial(m)} className="w-full text-left p-3 hover:bg-blue-50 rounded-lg flex justify-between items-center group transition-colors"><div><p className="font-bold text-slate-700 group-hover:text-blue-700">{m.name}</p><p className="text-xs text-slate-400">Stock: {Number(m.stock?.current || 0).toFixed(2)} {m.unit}</p></div><FiPlus className="text-slate-300 group-hover:text-blue-600" /></button>))}</div>
                </div>
            </div>
        )}
      </div>
    );
  }

  // --- MAIN LIST VIEW ---
  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
        <div className="mb-6 flex justify-between items-end">
            <div>
                <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><FiPackage className="text-blue-600" /> Kitting & Fabric Store</h1>
                <p className="text-slate-500">Manage issue notes and view global history.</p>
            </div>
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                <button onClick={() => setActiveTab("pending")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab==='pending' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>Pending Jobs</button>
                <button onClick={() => setActiveTab("history")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab==='history' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}><FiClock /> Global History</button>
            </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[500px]">
            {activeTab === 'pending' ? (
                <div className="overflow-x-auto">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                       <h3 className="font-bold text-slate-700">Jobs Waiting for Material</h3>
                       <div className="relative"><FiSearch className="absolute left-3 top-2.5 text-slate-400" /><input type="text" placeholder="Search Job..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                            <tr>
                                <th className="p-4 text-left">Job ID</th>
                                <th className="p-4 text-left">Product</th>
                                <th className="p-4 text-center">Qty</th>
                                <th className="p-4 text-center">Type</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {jobs.filter(j => j.jobId.toLowerCase().includes(searchQuery.toLowerCase())).map(job => (
                                <tr key={job._id} className="hover:bg-slate-50">
                                    <td className="p-4 font-mono font-bold text-blue-600">{job.jobId}</td>
                                    <td className="p-4 font-bold text-slate-700">{job.productId?.name} <span className="text-xs font-normal text-slate-400 block">{job.productId?.sku}</span></td>
                                    <td className="p-4 text-center font-bold">{job.totalQty}</td>
                                    <td className="p-4 text-center"><span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${job.type==='In-House'?'bg-blue-50 text-blue-600':'bg-orange-50 text-orange-600'}`}>{job.type}</span></td>
                                    <td className="p-4 text-right"><button onClick={() => openJobSheet(job)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700">Issue Material</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-blue-50/30">
                        <h3 className="font-bold text-blue-800 flex items-center gap-2"><FiList/> Issued Jobs Log</h3>
                        <div className="relative"><FiSearch className="absolute left-3 top-2.5 text-slate-400" /><input type="text" placeholder="Search Job ID..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                     </div>
                     <div className="overflow-auto max-h-[70vh]">
                         <table className="w-full text-left border-collapse">
                             <thead className="bg-slate-100 sticky top-0 z-10 text-xs font-bold text-slate-600 uppercase border-b border-slate-300">
                                 <tr>
                                     <th className="p-3 border-r text-left">Job ID</th>
                                     <th className="p-3 border-r text-left">Product Name</th>
                                     <th className="p-3 border-r text-center">Type</th>
                                     <th className="p-3 border-r text-center">Issued Items</th>
                                     <th className="p-3 text-right">Action</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100 text-sm">
                                 {historyJobs.filter(j => j.jobId.toLowerCase().includes(searchQuery.toLowerCase())).map((job, i) => (
                                     <tr key={i} className="hover:bg-yellow-50">
                                         <td className="p-3 border-r font-mono font-bold text-blue-600">{job.jobId}</td>
                                         <td className="p-3 border-r font-medium text-slate-800">{job.productId?.name}</td>
                                         <td className="p-3 border-r text-center">
                                             <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${job.type==='In-House'?'bg-blue-50 text-blue-600':'bg-orange-50 text-orange-600'}`}>{job.type}</span>
                                         </td>
                                         <td className="p-3 border-r text-center font-bold text-emerald-600">{job.issuedMaterials?.length || 0}</td>
                                         <td className="p-3 text-right">
                                             <button onClick={() => setViewHistoryJob(job)} className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-200 flex items-center gap-1 ml-auto"><FiEye /> View History</button>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                </div>
            )}
        </div>

        {/* ✅ FIXED: History View Modal using 'fixed' */}
        {viewHistoryJob && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                     <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                        <div><h3 className="text-xl font-black text-slate-800">History Log: {viewHistoryJob.jobId}</h3><p className="text-sm text-slate-500">{viewHistoryJob.productId?.name}</p></div>
                        <button onClick={() => setViewHistoryJob(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-900"><FiX /></button>
                     </div>
                     <div className="flex-1 overflow-auto p-0">
                         <table className="w-full text-left border-collapse">
                             <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase border-b border-slate-200 sticky top-0 z-10">
                                 <tr>
                                     <th className="p-3 border-r text-left">Date</th>
                                     <th className="p-3 border-r text-left">Issued To</th>
                                     <th className="p-3 border-r text-left">Material</th>
                                     <th className="p-3 border-r text-center">Qty</th>
                                     <th className="p-3 border-r text-left">Lot No.</th>
                                     <th className="p-3 border-r text-left">Issuer</th>
                                     <th className="p-3 text-center">Docs</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100 text-sm text-slate-900">
                                 {viewHistoryJob.issuedMaterials?.map((log, idx) => (
                                     <tr key={idx} className="hover:bg-slate-50">
                                         <td className="p-3 border-r font-mono text-xs">{new Date(log.date).toLocaleString()}</td>
                                         <td className="p-3 border-r font-bold text-slate-700">{log.issuedTo}</td>
                                         <td className="p-3 border-r">{log.materialName}</td>
                                         <td className="p-3 border-r text-center font-bold text-emerald-600">{log.qtyIssued}</td>
                                         <td className="p-3 border-r font-mono text-xs">{log.lotNumber || "FIFO"}</td>
                                         <td className="p-3 border-r text-slate-500 text-xs">{log.issuedBy}</td>
                                         <td className="p-3 text-center">
                                            <button onClick={() => {
                                                const pdfData = { jobId: viewHistoryJob.jobId, issuedTo: log.issuedTo, issuerName: log.issuedBy, remarks: log.remarks, items: [{ materialName: log.materialName, lotNumber: log.lotNumber, issueQty: log.qtyIssued }] };
                                                setPdfPreviewData(pdfData); setShowPdfModal(true);
                                            }} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"><FiFileText/></button>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                     <div className="p-4 border-t bg-slate-50 text-right flex justify-end gap-3">
                         <button onClick={() => {
                             const pdfData = { jobId: viewHistoryJob.jobId, issuedTo: viewHistoryJob.issuedMaterials[0]?.issuedTo || "Various", issuerName: "Pramod", remarks: "Complete History", items: viewHistoryJob.issuedMaterials.map(m => ({ materialName: m.materialName, lotNumber: m.lotNumber, issueQty: m.qtyIssued })) };
                             generatePDF(pdfData, false);
                         }} className="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2">View Job PDF</button>
                         
                         <button onClick={() => {
                             const pdfData = { jobId: viewHistoryJob.jobId, issuedTo: viewHistoryJob.issuedMaterials[0]?.issuedTo || "Various", issuerName: "Pramod", remarks: "Complete History", items: viewHistoryJob.issuedMaterials.map(m => ({ materialName: m.materialName, lotNumber: m.lotNumber, issueQty: m.qtyIssued })) };
                             generatePDF(pdfData, true);
                         }} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg flex items-center gap-2 shadow-lg"><FiDownload /> Download Job PDF</button>
                         
                         <button onClick={() => setViewHistoryJob(null)} className="px-6 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300">Close</button>
                     </div>
                </div>
            </div>
        )}
    </div>
  );
}