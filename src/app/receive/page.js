"use client";
import { useState, useEffect, useMemo } from "react";
import api from '@/utils/api';
import {
  FiClock, FiPlus, FiSave, FiFilter, FiRefreshCw, FiShield, FiAlertTriangle, FiCheckCircle, FiSearch, FiCheckSquare
} from "react-icons/fi";

// [Keep QCModal and DirectReceiveModal exactly as they were in previous turn]
// I am pasting them here briefly for context, but the main change is in the main component below.

const QCModal = ({ order, onClose, onSuccess, user }) => {
    // ... (Same as previous code)
    const remaining = order.orderedQty - order.receivedQty;
    const [formData, setFormData] = useState({ qtyReceived: remaining, sampleSize: "", rejectedQty: "", reason: "", lotNumber: "" });
    const [loading, setLoading] = useState(false);
    const stockToAdd = (Number(formData.qtyReceived) || 0) - (Number(formData.rejectedQty) || 0);
    const rejectionRate = formData.sampleSize ? ((Number(formData.rejectedQty) / Number(formData.sampleSize)) * 100).toFixed(1) : 0;
    const isHighFailure = rejectionRate > 20;

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await api.put(`procurement/receive/${order._id}`, {
                mode: 'qc',
                qtyReceived: formData.qtyReceived,
                lotNumber: formData.lotNumber,
                qcBy: user?.name || "Unknown",
                sampleSize: formData.sampleSize,
                rejectedQty: formData.rejectedQty,
                reason: formData.reason
            });
            alert(res.data.msg); 
            onSuccess();
        } catch (error) { alert("Error: " + error.message); } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-300">
                <div className="px-6 py-4 border-b border-slate-200 bg-purple-50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-purple-900 flex items-center gap-2"><FiShield/> QC Inspection</h3>
                    <div className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded">Inspector: {user?.name}</div>
                </div>
                <div className="p-6 space-y-4">
                     <div className="bg-slate-50 p-3 rounded text-xs text-slate-500 mb-2 border border-slate-200 flex justify-between">
                        <div>Checking: <span className="font-bold text-slate-800">{order.itemName}</span></div>
                        <div>Pending: <span className="font-bold text-red-600">{remaining}</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-slate-500 uppercase">Qty Receiving</label><input type="number" className="w-full border p-2 rounded mt-1 font-bold text-lg" value={formData.qtyReceived} max={remaining} onChange={e => setFormData({...formData, qtyReceived: e.target.value})} /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase">Batch</label><input type="text" className="w-full border p-2 rounded mt-1 uppercase" placeholder="Auto" value={formData.lotNumber} onChange={e => setFormData({...formData, lotNumber: e.target.value})} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-purple-50/50 p-4 rounded border border-purple-100">
                        <div><label className="text-xs font-bold text-purple-700 uppercase">Sample Size</label><input type="number" className="w-full border border-purple-200 p-2 rounded mt-1 font-bold text-purple-900" value={formData.sampleSize} onChange={e => setFormData({...formData, sampleSize: e.target.value})} /></div>
                        <div><label className="text-xs font-bold text-red-600 uppercase">Rejected Qty</label><input type="number" className="w-full border border-red-200 p-2 rounded mt-1 font-bold text-red-600" value={formData.rejectedQty} onChange={e => setFormData({...formData, rejectedQty: e.target.value})} /></div>
                    </div>
                    {formData.rejectedQty !== "" && (
                        <div className={`p-3 rounded text-xs font-bold border ${isHighFailure ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            <div className="flex justify-between"><span>Rate: {rejectionRate}%</span><span>{isHighFailure ? "❌ FAIL" : "✅ PASS"}</span></div>
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded text-sm">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded text-sm flex items-center gap-2">{loading ? "..." : "Submit"}</button>
                </div>
            </div>
        </div>
    );
};

const DirectReceiveModal = ({ order, onClose, onSuccess, user }) => {
    const remaining = order.orderedQty - order.receivedQty;
    const [qtyInput, setQtyInput] = useState(remaining);
    const [lotInput, setLotInput] = useState("");
    const [loading, setLoading] = useState(false);
  
    const handleSubmit = async () => {
      if(Number(qtyInput) > remaining) return alert("Exceeds pending order.");
      setLoading(true);
      try {
        await api.put(`procurement/receive/${order._id}`, {
            mode: 'direct',
            qtyReceived: qtyInput,
            lotNumber: lotInput,
            qcBy: user?.name || "Direct" // Record who did direct receive
        });
        alert(`Received ${qtyInput} units. ✅`);
        onSuccess();
      } catch (error) { alert(error.message); } finally { setLoading(false); }
    };
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white rounded w-full max-w-sm shadow-2xl overflow-hidden border border-slate-300">
            <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100"><h3 className="font-bold text-emerald-800">Direct Receive</h3></div>
            <div className="p-6 space-y-4">
                <div className="text-xs text-slate-500 mb-2">Pending: <span className="font-bold text-red-600">{remaining}</span></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Quantity</label><input type="number" className="w-full border p-2 rounded mt-1 text-lg font-bold" max={remaining} value={qtyInput} onChange={e => setQtyInput(e.target.value)} /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Batch</label><input type="text" className="w-full border p-2 rounded mt-1 uppercase" placeholder="Auto" value={lotInput} onChange={e => setLotInput(e.target.value)} /></div>
            </div>
            <div className="px-6 py-3 bg-slate-50 flex justify-end gap-2 border-t border-slate-200">
                <button onClick={onClose} className="px-3 py-1.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded">Cancel</button>
                <button onClick={handleSubmit} disabled={loading || !qtyInput} className="px-3 py-1.5 text-sm font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700">Confirm</button>
            </div>
        </div>
      </div>
    );
};

export default function ReceiveStockPage() {
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [directModal, setDirectModal] = useState(null);
  const [qcModal, setQcModal] = useState(null);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("");
  const [historyFilter, setHistoryFilter] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [openRes, histRes] = await Promise.all([
          api.get("/procurement/open-orders"),
          api.get("/procurement/received-history")
      ]);
      setOrders(openRes.data);
      setHistory(histRes.data);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const stored = localStorage.getItem("userInfo");
    if(stored) setUser(JSON.parse(stored));
  }, []);

  const filteredOrders = orders.filter(o => 
    (o.itemName || "").toLowerCase().includes(filter.toLowerCase()) || 
    (o.vendor_id?.name || "").toLowerCase().includes(filter.toLowerCase())
  );

  // Flatten history for display (Each history log entry becomes a row)
  const flattenedHistory = useMemo(() => {
      let flat = [];
      history.forEach(order => {
          if(order.history && order.history.length > 0) {
              order.history.forEach(log => {
                  flat.push({
                      poId: order._id,
                      itemName: order.itemName,
                      vendor: order.vendor_id?.name || "Unknown",
                      ...log
                  });
              });
          }
      });
      // Sort by date desc
      return flat.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [history]);

  const filteredHistory = flattenedHistory.filter(h => 
      h.itemName.toLowerCase().includes(historyFilter.toLowerCase()) || 
      h.vendor.toLowerCase().includes(historyFilter.toLowerCase()) ||
      h.receivedBy.toLowerCase().includes(historyFilter.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8 bg-white min-h-screen pb-20">
      
      {/* 1. OPEN ORDERS SECTION */}
      <div className="space-y-4">
          <div className="flex justify-between items-end border-b border-slate-200 pb-4">
            <div><h1 className="text-2xl font-black text-slate-800">Pending Receipts (GRN)</h1><p className="text-slate-500 text-sm">Action items requiring receipt.</p></div>
            <div className="flex gap-2">
                <input type="text" placeholder="Search Pending..." className="border p-2 rounded text-sm w-48" value={filter} onChange={e => setFilter(e.target.value)} />
                <button onClick={fetchData} className="p-2 bg-slate-100 border rounded hover:bg-slate-200"><FiRefreshCw /></button>
            </div>
          </div>

          <div className="border border-slate-300 rounded overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-300">
                    <tr>
                        <th className="p-3 font-bold border-r w-24">PO #</th>
                        <th className="p-3 font-bold border-r">Item</th>
                        <th className="p-3 font-bold border-r">Vendor</th>
                        <th className="p-3 font-bold border-r text-right">Ord</th>
                        <th className="p-3 font-bold border-r text-right">Rec</th>
                        <th className="p-3 font-bold border-r text-right text-red-600">Bal</th>
                        <th className="p-3 font-bold text-center w-48">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {filteredOrders.length === 0 ? <tr><td colSpan="7" className="p-6 text-center text-slate-400">No pending orders.</td></tr> : 
                    filteredOrders.map((order) => {
                        const remaining = order.orderedQty - order.receivedQty;
                        return (
                            <tr key={order._id} className="hover:bg-blue-50 transition-colors">
                                <td className="p-3 border-r font-mono text-xs text-slate-500">{order._id.substr(-6)}</td>
                                <td className="p-3 border-r font-bold text-slate-800">{order.itemName}</td>
                                <td className="p-3 border-r text-slate-600">{order.vendor_id?.name}</td>
                                <td className="p-3 border-r text-right font-mono">{order.orderedQty}</td>
                                <td className="p-3 border-r text-right font-mono text-green-600">{order.receivedQty}</td>
                                <td className="p-3 border-r text-right font-mono text-red-600 font-bold bg-red-50/50">{remaining}</td>
                                <td className="p-2 text-center flex gap-2 justify-center">
                                    <button onClick={() => setDirectModal(order)} disabled={remaining === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1.5 rounded text-xs font-bold flex items-center gap-1"><FiPlus/> Direct</button>
                                    <button onClick={() => setQcModal(order)} disabled={remaining === 0} className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1.5 rounded text-xs font-bold flex items-center gap-1"><FiShield/> QC</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>
      </div>

      {/* 2. HISTORY SECTION */}
      <div className="space-y-4 pt-8 border-t border-slate-200">
          <div className="flex justify-between items-end">
            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2"><FiCheckSquare /> Reception History</h3>
            <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-slate-400"/>
                <input type="text" placeholder="Search History (Item, Vendor, User)..." 
                    value={historyFilter} onChange={e => setHistoryFilter(e.target.value)}
                    className="pl-10 p-2 border border-slate-300 rounded text-sm w-64 focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="border border-slate-300 rounded overflow-hidden shadow-sm max-h-[400px] overflow-y-auto">
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-300 sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="p-3 border-r">Date</th>
                        <th className="p-3 border-r">Item Name</th>
                        <th className="p-3 border-r">Vendor</th>
                        <th className="p-3 border-r text-right">Received Qty</th>
                        <th className="p-3 border-r">Received By</th>
                        <th className="p-3 border-r">Mode</th>
                        <th className="p-3 text-center">Batch</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredHistory.length === 0 ? <tr><td colSpan="7" className="p-6 text-center text-slate-400">No history found.</td></tr> :
                    filteredHistory.map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 border-r font-mono text-xs text-slate-500">{new Date(log.date).toLocaleString()}</td>
                            <td className="p-3 border-r font-bold text-slate-800">{log.itemName}</td>
                            <td className="p-3 border-r text-slate-600 text-xs">{log.vendor}</td>
                            <td className="p-3 border-r text-right font-mono font-bold text-emerald-600">+{log.qty}</td>
                            <td className="p-3 border-r text-xs font-bold text-slate-700">{log.receivedBy}</td>
                            <td className="p-3 border-r text-xs">
                                <span className={`px-2 py-0.5 rounded ${log.mode === 'qc' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {log.mode === 'qc' ? 'QC Check' : 'Direct'}
                                </span>
                            </td>
                            <td className="p-3 text-center font-mono text-xs text-slate-400">{log.lotNumber}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
      </div>

      {directModal && <DirectReceiveModal order={directModal} onClose={() => setDirectModal(null)} onSuccess={() => { setDirectModal(null); fetchData(); }} user={user} />}
      {qcModal && <QCModal order={qcModal} user={user} onClose={() => setQcModal(null)} onSuccess={() => { setQcModal(null); fetchData(); }} />}
    </div>
  );
}