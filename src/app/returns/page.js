"use client";
import { useState } from "react";
import api from "@/utils/api";
import AuthGuard from "@/components/AuthGuard";
import { 
  FiSearch, FiRotateCcw, FiAlertCircle, FiPackage, FiSave, FiInfo 
} from "react-icons/fi";

export default function ReturnsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]); 
  const [searching, setSearching] = useState(false);
  
  const [selectedOrder, setSelectedOrder] = useState(null); 
  const [returnItems, setReturnItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async (val) => {
    setSearchQuery(val);
    if (val.length < 2) {
        setSearchResults([]);
        return;
    }
    setSearching(true);
    try {
      const res = await api.get(`/returns/search?query=${val}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const selectOrder = (order) => {
    setSelectedOrder(order);
    setSearchResults([]);
    setSearchQuery(order.orderId);
    
    const initialItems = order.items.map(item => ({
      productId: item.product._id || item.product,
      productName: item.productName,
      sku: item.product.sku || "N/A",
      maxQty: item.qtyOrdered,
      returnQty: 0,
      reason: "", // Will be text input
      condition: "Good" // Will be dropdown
    }));
    setReturnItems(initialItems);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...returnItems];
    updated[index][field] = value;
    setReturnItems(updated);
  };

  const handleSubmitReturn = async () => {
    const itemsToReturn = returnItems.filter(i => i.returnQty > 0);
    if (itemsToReturn.length === 0) return alert("Please enter return quantity.");

    setSubmitting(true);
    try {
      await api.post("/returns/request", {
        orderObjectId: selectedOrder._id,
        orderId: selectedOrder.orderId,
        customerName: selectedOrder.customerName,
        items: itemsToReturn
      });
      alert("✅ Return request submitted to QC Hold.");
      setSelectedOrder(null);
      setSearchQuery("");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard requiredPermission="sales_orders">
      <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in duration-500">
        
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
           <FiRotateCcw className="text-blue-600" /> RETURN INITIATION
        </h1>

        <div className="relative group">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Search Order</label>
          <div className="relative">
            <FiSearch className="absolute left-5 top-5 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Search by ID or Name..."
              className="w-full pl-14 pr-4 py-5 bg-white border border-slate-200 rounded-3xl font-bold shadow-sm outline-none focus:ring-4 focus:ring-blue-50 transition-all text-lg"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searching && <div className="absolute right-5 top-5 animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>}
          </div>

          {searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-3 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
              {searchResults.map(order => (
                <button 
                  key={order._id}
                  onClick={() => selectOrder(order)}
                  className="w-full p-5 flex justify-between items-center hover:bg-blue-50 transition-colors border-b last:border-0"
                >
                  <div className="text-left">
                    <p className="font-black text-slate-900">{order.orderId}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase">{order.customerName}</p>
                  </div>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase">Ready to Return</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedOrder && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6">
             <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="text-2xl font-black">{selectedOrder.orderId} — {selectedOrder.customerName}</h3>
                <button onClick={() => setSelectedOrder(null)} className="text-xs font-bold bg-slate-800 px-4 py-2 rounded-xl">Cancel</button>
             </div>

             <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                   <tr><th className="p-6">Product Details</th><th className="p-6 text-center">Invoiced Qty</th><th className="p-6 text-center">Return Qty</th><th className="p-6">Reason for Return (Remark)</th><th className="p-6">Claimed Condition</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {returnItems.map((item, idx) => (
                     <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                       <td className="p-6">
                          <p className="font-black text-slate-800 leading-tight">{item.productName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">SKU: {item.sku}</p>
                       </td>
                       <td className="p-6 text-center font-bold text-slate-400">{item.maxQty}</td>
                       <td className="p-6 w-36">
                          <input 
                            type="number"
                            min="0"
                            max={item.maxQty}
                            className="w-full p-3 bg-blue-50 border border-blue-200 rounded-2xl text-center font-black text-blue-600 outline-none"
                            value={item.returnQty}
                            onChange={(e) => handleItemChange(idx, "returnQty", parseInt(e.target.value) || 0)}
                          />
                       </td>
                       {/* 🟢 REASON AS TEXT FIELD */}
                       <td className="p-6">
                          <input 
                            type="text"
                            placeholder="Type reason here..."
                            className="w-full p-3 bg-white border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:border-blue-400"
                            value={item.reason}
                            onChange={(e) => handleItemChange(idx, "reason", e.target.value)}
                          />
                       </td>
                       {/* 🟢 CONDITION AS DROPDOWN (PREVIOUS STYLE) */}
                       <td className="p-6">
                          <select 
                            className="w-full p-3 bg-white border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:border-blue-500"
                            value={item.condition}
                            onChange={(e) => handleItemChange(idx, "condition", e.target.value)}
                          >
                             <option value="Good">Good (Resalable)</option>
                             <option value="Damaged">Damaged</option>
                             <option value="Defective">Defective</option>
                          </select>
                       </td>
                     </tr>
                   ))}
                </tbody>
             </table>

             <div className="p-10 bg-slate-50 border-t flex justify-between items-center">
                <div className="flex items-center gap-3 text-slate-500">
                    <FiInfo size={20} />
                    <p className="text-xs font-bold italic">Inventory updates only after Admin approval.</p>
                </div>
                <button 
                  onClick={handleSubmitReturn}
                  disabled={submitting}
                  className="bg-slate-900 text-white px-14 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-black transition-all disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit to QC Hold"}
                </button>
             </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}