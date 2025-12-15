// frontend/src/app/procurement/receive/page.js
"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import api from '@/utils/api';
import {
  FiBox,
  FiTruck,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiPlus,
  FiSave,
} from "react-icons/fi";

// Helper function to map item names from IDs (if needed later)
const getTypeName = (po) =>
  po.itemName === "RM" ? "Raw Material" : "Finished Good";

// --- Sub-Component: Receive Modal ---
// frontend/src/app/procurement/receive/page.js

// ... (existing imports) ...

// --- Sub-Component: Receive Modal ---
const ReceiveModal = ({ order, onClose, onSuccess }) => {
    const [qtyInput, setQtyInput] = useState("");
    const [lotInput, setLotInput] = useState(""); // <--- NEW STATE FOR LOT NUMBER
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
        // CALL THE BACKEND ROUTE
        await api.put(
          `procurement/receive/${order._id}`,
          {
            qtyReceived: qtyToReceive,
            itemType: order.itemType, // Pass the type for correct stock update
            lotNumber: lotInput // <--- SEND LOT NUMBER TO BACKEND
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
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-100 bg-blue-50/50">
            <h3 className="font-bold text-lg text-blue-900">Receive Shipment</h3>
          </div>
  
          <div className="p-6 space-y-4">
            <p className="text-sm font-bold text-slate-700">
              {/* Handle missing itemType safely if helper function isn't available in this scope, 
                  otherwise assuming getTypeName exists or order.itemType is used directly */}
              Item ID: {order.item_id.toString().substring(0, 10)}... | Type:{" "}
              {order.itemType || "Unknown"}
            </p>
            <p className="text-xs text-slate-500">
              Ordered: {order.orderedQty} | Received So Far: {order.receivedQty} |{" "}
              <strong className="text-red-600">Remaining: {remaining}</strong>
            </p>
  
            {/* Quantity Input */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Quantity Arrived Now
              </label>
              <input
                type="number"
                className="w-full border-slate-200 rounded-lg p-3 text-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none mt-1"
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                max={remaining}
                min="1"
                placeholder="0"
                required
                autoFocus
              />
            </div>
  
            {/* --- NEW LOT NUMBER INPUT --- */}
            <div className="pt-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex justify-between">
                <span>Lot / Batch Number</span>
                <span className="text-[10px] text-blue-500 font-normal normal-case">
                  Optional (Auto-generated if empty)
                </span>
              </label>
              <input
                type="text"
                className="w-full border-slate-200 rounded-lg p-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none mt-1 uppercase placeholder:normal-case"
                value={lotInput}
                onChange={(e) => setLotInput(e.target.value)}
                placeholder="e.g. LOT-VENDOR-001"
              />
            </div>
          </div>
  
          <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !qtyInput || remaining === 0}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all transform active:scale-[0.98]"
            >
              {loading ? (
                "Adding Stock..."
              ) : (
                <>
                  <FiSave /> Confirm Receipt
                </>
              )}
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

  const fetchOrders = async () => {
    try {
      // CALL THE BACKEND ROUTE
      const res = await api.get(
        "/procurement/open-orders"
      );
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

  if (loading)
    return (
      <div className="p-12 text-center text-slate-400 font-medium">
        Loading Open Orders...
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Goods Receipt Notes (GRN)
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            Manage stock additions against pending purchase orders.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
        >
          <FiClock className="text-lg" />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-100 shadow-sm text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
            <FiCheckCircle size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            No Pending Shipments
          </h3>
          <p className="text-slate-500 mt-2">
            All purchase orders have been fully received.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orders.map((order) => {
            const remaining = order.orderedQty - order.receivedQty;
            const itemType = order.itemType;

            return (
              <div
                key={order._id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-center gap-4"
              >
                {/* Order Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                      PO-{order._id.substring(0, 6)}...
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                        itemType === "Raw Material"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-purple-50 text-purple-700"
                      }`}
                    >
                      {itemType}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {order.itemName || "Item Name Missing"}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                    <FiTruck size={12} /> Vendor:{" "}
                    <strong className="text-slate-700">
                      {order.vendor_id?.name || "Unknown Vendor"}
                    </strong>
                  </p>
                  <h3 className="text-lg font-bold text-slate-800">
                    Ordered: {order.orderedQty} Units
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                    <FiClock size={12} /> Date:{" "}
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase">
                      Remaining
                    </p>
                    <p className="text-2xl font-black text-red-600">
                      {remaining}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedOrder(order)}
                    disabled={remaining === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all transform active:scale-95 flex items-center gap-2"
                  >
                    <FiPlus /> Receive Stock
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
