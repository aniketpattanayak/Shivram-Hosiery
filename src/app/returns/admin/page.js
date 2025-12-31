"use client";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import AuthGuard from "@/components/AuthGuard";
import { 
  FiShield, FiCheckCircle, FiXCircle, FiClock, 
  FiPackage, FiUser, FiInfo, FiActivity 
} from "react-icons/fi";

export default function AdminReturnsDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await api.get("/returns/history");
      setRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch returns", err);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 THE FINAL HANDSHAKE: Admin Approval
  const handleApprove = async (id) => {
    if (!confirm("Are you sure? This will add these items back to Warehouse Inventory and generate a Return Lot.")) return;
    
    setProcessingId(id);
    try {
      const res = await api.put(`/returns/approve/${id}`, {
        processedBy: "Admin", // In a real app, use the logged-in user's name
        adminNotes: "Physical QC passed. Items verified and restocked."
      });
      alert(`✅ Success! Lot Generated: ${res.data.lotNumber}`);
      fetchReturns(); // Refresh list
    } catch (err) {
      alert("Approval Failed: " + (err.response?.data?.msg || err.message));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-slate-400">LOADING QC HOLD...</div>;

  const pendingRequests = requests.filter(r => r.qcStatus === 'QC_PENDING');
  const historyRequests = requests.filter(r => r.qcStatus !== 'QC_PENDING');

  return (
    <AuthGuard requiredPermission="admin">
      <div className="max-w-6xl mx-auto p-8 space-y-10 animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <FiShield className="text-emerald-600" /> QC APPROVAL HUB
            </h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">
              Final Inventory Restocking Control
            </p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl border shadow-sm flex gap-8">
            <div className="text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase">Awaiting QC</p>
              <p className="text-xl font-black text-amber-600">{pendingRequests.length}</p>
            </div>
            <div className="border-l pl-8 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase">Total Restocked</p>
              <p className="text-xl font-black text-emerald-600">
                {requests.filter(r => r.qcStatus === 'APPROVED').length}
              </p>
            </div>
          </div>
        </div>

        {/* 📋 SECTION 1: ACTIVE QC HOLD (Pending Approval) */}
        <section className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <FiClock /> Pending Physical Verification
          </h3>
          {pendingRequests.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-12 rounded-3xl text-center text-slate-400 font-bold italic">
              No items currently in QC Hold.
            </div>
          ) : (
            pendingRequests.map((req) => (
              <div key={req._id} className="bg-white rounded-3xl border-2 border-amber-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                <div className="bg-amber-50 p-4 px-8 flex justify-between items-center border-b border-amber-100">
                  <div className="flex items-center gap-4">
                    <span className="bg-amber-600 text-white text-[10px] font-black px-3 py-1 rounded-full">{req.returnId}</span>
                    <h4 className="font-black text-slate-800">Order: {req.orderId} — {req.customerName}</h4>
                  </div>
                  <button 
                    onClick={() => handleApprove(req._id)}
                    disabled={processingId === req._id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    {processingId === req._id ? "Processing..." : <><FiCheckCircle /> Approve & Restock</>}
                  </button>
                </div>
                <div className="p-8">
                   <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="pb-4">Product Name</th>
                          <th className="pb-4 text-center">Return Qty</th>
                          <th className="pb-4">Reported Reason</th>
                          <th className="pb-4">Claimed Condition</th>
                        </tr>
                      </thead>
                      <tbody>
                        {req.items.map((item, i) => (
                          <tr key={i} className="border-t border-slate-50">
                            <td className="py-4 font-bold text-slate-800">{item.productName}</td>
                            <td className="py-4 text-center"><span className="bg-slate-100 px-3 py-1 rounded-lg font-black">{item.returnQty}</span></td>
                            <td className="py-4 text-slate-600">{item.reason}</td>
                            <td className="py-4">
                              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${item.condition === 'Good' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {item.condition}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </div>
            ))
          )}
        </section>

        {/* 📜 SECTION 2: RETURN HISTORY (Permanent Log) */}
        <section className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <FiActivity /> Processed Returns History
          </h3>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <tr>
                  <th className="p-6">Date</th>
                  <th className="p-6">RMA ID</th>
                  <th className="p-6">Order ID</th>
                  <th className="p-6">Customer</th>
                  <th className="p-6 text-center">Status</th>
                  <th className="p-6">Restocked Lot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {historyRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6 text-slate-400 font-mono text-[10px]">{new Date(req.processedAt || req.updatedAt).toLocaleDateString()}</td>
                    <td className="p-6 font-bold text-slate-700">{req.returnId}</td>
                    <td className="p-6 font-bold text-blue-600">{req.orderId}</td>
                    <td className="p-6 font-medium uppercase text-xs">{req.customerName}</td>
                    <td className="p-6 text-center">
                      <span className={`text-[9px] font-black px-2 py-1 rounded-full ${req.qcStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {req.qcStatus}
                      </span>
                    </td>
                    <td className="p-6 font-mono text-[10px] text-slate-500">{req.generatedLotNumber || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </AuthGuard>
  );
}