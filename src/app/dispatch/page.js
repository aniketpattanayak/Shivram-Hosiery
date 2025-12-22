"use client";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import AuthGuard from '@/components/AuthGuard';
import { 
  FiTruck, FiSearch, FiCheckCircle, FiAlertTriangle, 
  FiMapPin, FiPackage, FiFileText, FiActivity, FiX, FiSave, FiFlag 
} from "react-icons/fi";

export default function LogisticsPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dispatch Modal State
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [activeDispatchId, setActiveDispatchId] = useState(null);
  const [logisticsForm, setLogisticsForm] = useState({ vehicleNo: "", trackingId: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [orderRes, prodRes] = await Promise.all([
        api.get("/sales/orders"), 
        api.get("/products")      
      ]);
      
      const activeOrders = orderRes.data.filter(o => 
        o.status === 'Ready_Dispatch' || 
        o.status === 'Production_Queued' || 
        o.status === 'Partially_Dispatched' ||
        o.status === 'Pending'
      );
      
      setOrders(activeOrders);
      setProducts(prodRes.data);
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  const getStockLevel = (productName) => {
    const prod = products.find(p => p.name === productName);
    return prod?.stock?.warehouse || 0;
  };

  const checkOrderStockStatus = (orderItems) => {
    let canFulfill = true;
    for (const item of orderItems) {
        const stock = getStockLevel(item.productName);
        if (stock < item.qtyOrdered) {
            canFulfill = false;
            break;
        }
    }
    return canFulfill;
  };

  // Open Modal
  const openDispatchModal = (orderId) => {
    setActiveDispatchId(orderId);
    setLogisticsForm({ vehicleNo: "", trackingId: "" }); 
    setShowDispatchModal(true);
  };

  // Submit Dispatch
  const handleConfirmDispatch = async () => {
    if (!logisticsForm.vehicleNo || !logisticsForm.trackingId) {
      alert("Please enter Vehicle Number and Tracking/AWB ID.");
      return;
    }

    if (!confirm("Confirm Shipment? Stock will be permanently deducted.")) return;

    try {
      await api.post("/logistics/dispatch", { 
        orderId: activeDispatchId,
        transportDetails: logisticsForm 
      });
      alert("✅ Order Dispatched Successfully!");
      setShowDispatchModal(false);
      fetchData();
    } catch (e) {
      alert("Error: " + (e.response?.data?.msg || e.message));
    }
  };

  const filteredOrders = orders.filter(o => 
    o.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AuthGuard requiredPermission="logistics">
    <div className="p-6 bg-white min-h-screen animate-in fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Logistics & Dispatch</h1>
          <p className="text-slate-500 mt-2 text-sm">Manage shipments and verify stock availability.</p>
        </div>
        <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-slate-400" />
            <input 
                type="text" 
                placeholder="Search Order ID..." 
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm font-bold w-64 outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
      </div>

      {/* TABULAR VIEW */}
      <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-300">
                <tr>
                    <th className="p-4 w-32 border-r border-slate-300">Order Ref</th>
                    <th className="p-4 w-40 border-r border-slate-300">Customer</th>
                    {/* 🟢 NEW PRIORITY COLUMN */}
                    <th className="p-4 w-24 border-r border-slate-300 text-center">Priority</th>
                    <th className="p-4 border-r border-slate-300">Item Details</th>
                    <th className="p-4 text-right border-r border-slate-300 w-24">Qty Needed</th>
                    <th className="p-4 text-right border-r border-slate-300 w-24 bg-slate-50">Current Stock</th>
                    <th className="p-4 text-center w-40">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
                {filteredOrders.map((order) => {
                    const canDispatch = checkOrderStockStatus(order.items);

                    return (
                        <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                            {/* 1. Order Ref */}
                            <td className="p-4 align-top border-r border-slate-200">
                                <span className="font-mono text-blue-600 font-bold text-xs bg-blue-50 px-2 py-1 rounded">{order.orderId}</span>
                                <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                                    <FiFileText /> {new Date(order.createdAt).toLocaleDateString()}
                                </div>
                            </td>

                            {/* 2. Customer */}
                            <td className="p-4 align-top border-r border-slate-200">
                                <div className="font-bold text-slate-800">{order.customerName}</div>
                                <div className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                                    <FiMapPin className="mt-0.5 text-slate-400" />
                                    <span>Mumbai, India</span>
                                </div>
                            </td>

                            {/* 🟢 3. PRIORITY BADGE */}
                            <td className="p-4 align-top border-r border-slate-200 text-center">
                                <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold flex items-center justify-center gap-1 w-fit mx-auto ${
                                    order.priority === 'High' ? 'bg-red-100 text-red-700' :
                                    order.priority === 'Medium' ? 'bg-blue-50 text-blue-700' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                    <FiFlag size={10} className={order.priority === 'High' ? 'fill-current' : ''} />
                                    {order.priority || 'Normal'}
                                </span>
                            </td>

                            {/* 4. Items */}
                            <td className="p-4 align-top border-r border-slate-200 p-0">
                                <div className="flex flex-col h-full">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className={`p-3 ${idx !== order.items.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                            <span className="font-bold text-slate-700">{item.productName}</span>
                                            <div className="text-[10px] text-slate-400">
                                                {item.category} • {item.color}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </td>

                            {/* 5. Qty Needed */}
                            <td className="p-4 align-top text-right border-r border-slate-200 p-0 bg-blue-50/10">
                                <div className="flex flex-col h-full">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className={`p-3 h-full flex items-center justify-end font-mono font-bold text-slate-800 ${idx !== order.items.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                            {item.qtyOrdered}
                                        </div>
                                    ))}
                                </div>
                            </td>

                            {/* 6. Stock Available */}
                            <td className="p-4 align-top text-right border-r border-slate-200 p-0">
                                <div className="flex flex-col h-full">
                                    {order.items.map((item, idx) => {
                                        const available = getStockLevel(item.productName);
                                        const isShort = available < item.qtyOrdered;
                                        return (
                                            <div key={idx} className={`p-3 h-full flex items-center justify-end font-mono font-bold ${idx !== order.items.length - 1 ? 'border-b border-slate-100' : ''} ${isShort ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {isShort && <FiAlertTriangle className="mr-1" size={12}/>}
                                                {available}
                                            </div>
                                        );
                                    })}
                                </div>
                            </td>

                            {/* 7. Action Button */}
                            <td className="p-4 align-middle text-center">
                                {canDispatch ? (
                                    <button 
                                        onClick={() => openDispatchModal(order.orderId)}
                                        className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 mx-auto shadow-md transition-all active:scale-95"
                                    >
                                        <FiTruck size={14} /> Dispatch
                                    </button>
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-amber-600">
                                        <span className="text-xs font-bold flex items-center gap-1">
                                            <FiActivity /> Wait for Mfg
                                        </span>
                                        <span className="text-[9px] uppercase font-bold text-amber-400 bg-amber-50 px-1.5 py-0.5 rounded">
                                            Insufficient Stock
                                        </span>
                                    </div>
                                )}
                            </td>
                        </tr>
                    );
                })}
                {filteredOrders.length === 0 && !loading && (
                    <tr><td colSpan="7" className="p-8 text-center text-slate-400 font-medium">No pending dispatches found.</td></tr>
                )}
            </tbody>
        </table>
      </div>

      {/* DISPATCH POPUP MODAL */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
                
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                        <FiTruck /> Dispatch Details
                    </h3>
                    <button onClick={() => setShowDispatchModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <FiX />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-700 font-medium mb-2">
                        Dispatching Order: <span className="font-bold font-mono">{activeDispatchId}</span>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vehicle Number</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. MH-04-AB-1234"
                            value={logisticsForm.vehicleNo}
                            onChange={(e) => setLogisticsForm({...logisticsForm, vehicleNo: e.target.value})}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tracking / AWB ID</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. TRK-998877"
                            value={logisticsForm.trackingId}
                            onChange={(e) => setLogisticsForm({...logisticsForm, trackingId: e.target.value})}
                        />
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button 
                        onClick={() => setShowDispatchModal(false)} 
                        className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl text-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirmDispatch} 
                        className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 flex items-center gap-2 text-sm"
                    >
                        <FiSave /> Confirm & Dispatch
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
    </AuthGuard>
  );
}