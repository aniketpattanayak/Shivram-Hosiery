"use client";
import { useState, useEffect } from "react";
import api from '@/utils/api';
import {
  FiClock,
  FiPlus,
  FiSave,
  FiFilter,
  FiRefreshCw
} from "react-icons/fi";

// --- Sub-Component: Receive Modal ---
const ReceiveModal = ({ order, onClose, onSuccess }) => {
    const [qtyInput, setQtyInput] = useState("");
    const [lotInput, setLotInput] = useState("");
    const [loading, setLoading] = useState(false);
    const remaining = order.orderedQty - order.receivedQty;
  
    const handleSubmit = async () => {
      const qtyToReceive = Number(qtyInput);
      if (!qtyToReceive || qtyToReceive <= 0 || qtyToReceive > remaining) {
        alert(`Please enter a quantity between 1 and ${remaining}.`);
        return;
      }
  
      setLoading(true);
      try {
        await api.put(
          `procurement/receive/${order._id}`,
          {
            qtyReceived: qtyToReceive,
            itemType: order.itemType,
            lotNumber: lotInput
          }
        );
        alert("Stock Updated & Receipt Recorded! ✅");
        onSuccess();
      } catch (error) {
        alert("Error: " + (error.response?.data?.msg || error.message));
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white rounded w-full max-w-md shadow-2xl overflow-hidden border border-slate-300">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-lg text-slate-800">Receive Shipment (GRN)</h3>
          </div>
  
          <div className="p-6 space-y-4">
            <div className="text-sm space-y-1">
                <p><strong>PO ID:</strong> {order._id}</p>
                <p><strong>Item:</strong> {order.itemName || "Unknown Item"}</p>
                <p><strong>Type:</strong> {order.itemType || "Unknown"}</p>
                <p className="text-slate-500">Ordered: {order.orderedQty} | Received: {order.receivedQty}</p>
                <p className="text-red-600 font-bold">Remaining to Receive: {remaining}</p>
            </div>
  
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Quantity Arrived
              </label>
              <input
                type="number"
                className="w-full border border-slate-300 rounded p-2 text-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none mt-1"
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                max={remaining}
                min="1"
                placeholder="0"
                required
                autoFocus
              />
            </div>
  
            <div className="pt-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Lot / Batch Number (Optional)
              </label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded p-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none mt-1 uppercase placeholder:normal-case"
                value={lotInput}
                onChange={(e) => setLotInput(e.target.value)}
                placeholder="e.g. LOT-VENDOR-001"
              />
            </div>
          </div>
  
          <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !qtyInput || remaining === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-sm flex items-center gap-2 transition-all"
            >
              {loading ? "Saving..." : <><FiSave /> Confirm</>}
            </button>
          </div>
        </div>
      </div>
    );
  };

// --- Main Page Component ---
export default function ReceiveStockPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/procurement/open-orders");
      setOrders(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 🟢 FIXED: Added safety check (o.itemName || "") to prevent crashes
  const filteredOrders = orders.filter(o => 
    (o.itemName || "").toLowerCase().includes(filter.toLowerCase()) || 
    (o.vendor_id?.name || "").toLowerCase().includes(filter.toLowerCase()) ||
    (o._id || "").includes(filter)
  );

  return (
    <div className="p-6 space-y-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Goods Receipt Notes (GRN)</h1>
          <p className="text-slate-500 text-sm">Tabular view of pending shipments.</p>
        </div>
        <div className="flex gap-2">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Filter by Item, Vendor or PO..." 
                    className="pl-3 pr-4 py-2 border border-slate-300 rounded text-sm w-64 focus:outline-none focus:border-blue-500"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>
            <button
            onClick={fetchOrders}
            className="p-2 bg-slate-100 border border-slate-300 rounded hover:bg-slate-200 text-slate-600"
            title="Refresh Data"
            >
            <FiRefreshCw />
            </button>
        </div>
      </div>

      {/* Sheet / Table View */}
      <div className="border border-slate-300 rounded overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-300">
                <tr>
                    <th className="p-3 font-bold border-r border-slate-200 w-32">PO #</th>
                    <th className="p-3 font-bold border-r border-slate-200">Date</th>
                    <th className="p-3 font-bold border-r border-slate-200 w-24">Type</th>
                    <th className="p-3 font-bold border-r border-slate-200">Item Name</th>
                    <th className="p-3 font-bold border-r border-slate-200">Vendor</th>
                    <th className="p-3 font-bold border-r border-slate-200 text-right w-24">Ordered</th>
                    <th className="p-3 font-bold border-r border-slate-200 text-right w-24">Received</th>
                    <th className="p-3 font-bold border-r border-slate-200 text-right w-24 text-red-600">Pending</th>
                    <th className="p-3 font-bold text-center w-32">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
                {loading ? (
                    <tr><td colSpan="9" className="p-8 text-center text-slate-500">Loading Order Data...</td></tr>
                ) : filteredOrders.length === 0 ? (
                    <tr><td colSpan="9" className="p-8 text-center text-slate-500 font-medium">No open purchase orders found.</td></tr>
                ) : (
                    filteredOrders.map((order) => {
                        const remaining = order.orderedQty - order.receivedQty;
                        return (
                            <tr key={order._id} className="hover:bg-blue-50 transition-colors">
                                <td className="p-3 border-r border-slate-200 font-mono text-xs text-slate-500">
                                    {order._id.substring(0, 8)}...
                                </td>
                                <td className="p-3 border-r border-slate-200 text-xs">
                                    {new Date(order.created_at).toLocaleDateString()}
                                </td>
                                <td className="p-3 border-r border-slate-200">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                                        order.itemType === "Raw Material" 
                                        ? "bg-amber-50 text-amber-700 border-amber-200" 
                                        : "bg-purple-50 text-purple-700 border-purple-200"
                                    }`}>
                                        {order.itemType === "Raw Material" ? "RM" : "FG"}
                                    </span>
                                </td>
                                <td className="p-3 border-r border-slate-200 font-bold text-slate-800">
                                    {order.itemName || <span className="text-red-400 italic">Name Missing</span>}
                                </td>
                                <td className="p-3 border-r border-slate-200 text-slate-600">
                                    {order.vendor_id?.name || "Unknown"}
                                </td>
                                <td className="p-3 border-r border-slate-200 text-right font-mono">
                                    {order.orderedQty}
                                </td>
                                <td className="p-3 border-r border-slate-200 text-right font-mono text-green-600 font-bold">
                                    {order.receivedQty}
                                </td>
                                <td className="p-3 border-r border-slate-200 text-right font-mono text-red-600 font-black bg-red-50/50">
                                    {remaining}
                                </td>
                                <td className="p-2 text-center">
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        disabled={remaining === 0}
                                        className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded text-xs font-bold w-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <FiPlus className="inline mr-1"/> Receive
                                    </button>
                                </td>
                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>
      </div>

      {selectedOrder && (
        <ReceiveModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSuccess={() => {
            setSelectedOrder(null);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}