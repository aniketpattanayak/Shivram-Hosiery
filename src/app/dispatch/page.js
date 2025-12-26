"use client";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import AuthGuard from '@/components/AuthGuard';
import { 
  FiTruck, FiSearch, FiCheckCircle, FiAlertTriangle, 
  FiMapPin, FiPackage, FiFileText, FiActivity, FiX, FiSave, FiFlag, FiUser, FiPhone, FiBox, FiPrinter, FiArrowLeft, FiClock
} from "react-icons/fi";

export default function LogisticsPage() {
  const [activeTab, setActiveTab] = useState("pending"); // 🟢 Toggle between 'pending' and 'history'
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]); 
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dispatch Modal State
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [activeDispatchId, setActiveDispatchId] = useState(null);
  
  // Logistics Form State
  const [logisticsForm, setLogisticsForm] = useState({ 
      vehicleNo: "", 
      trackingId: "",
      driverName: "",
      driverPhone: "",
      packagingNote: "" 
  });

  // 🟢 Stores order data for printing (works for both new dispatches and history reprints)
  const [printOrder, setPrintOrder] = useState(null); 

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const prodRes = await api.get("/products");
      setProducts(prodRes.data);

      if (activeTab === "pending") {
        // Fetching active orders for dispatch
        const orderRes = await api.get("/logistics/pending"); 
        setOrders(orderRes.data);
      } else {
        // Fetching completed dispatches
        const historyRes = await api.get("/logistics/history"); 
        setHistory(historyRes.data);
      }
      setLoading(false);
    } catch (e) {
      console.error("Fetch Error:", e);
      setLoading(false);
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

  // 🟢 HELPER: Safely gets the address from the populated clientId
  const getCustomerAddress = (order) => {
    return order.clientId?.address || "Address Detail Pending";
  };

  const openDispatchModal = (orderId) => {
    setActiveDispatchId(orderId);
    setLogisticsForm({ 
        vehicleNo: "", 
        trackingId: "", 
        driverName: "", 
        driverPhone: "", 
        packagingNote: "" 
    }); 
    setShowDispatchModal(true);
  };

  const handleConfirmDispatch = async () => {
    if (!logisticsForm.vehicleNo || !logisticsForm.driverName) {
      alert("Please enter Vehicle Number and Driver Name.");
      return;
    }

    if (!confirm("Confirm Shipment? Stock will be permanently deducted.")) return;

    try {
      await api.post("/logistics/dispatch", { 
        orderId: activeDispatchId,
        transportDetails: logisticsForm 
      });
      
      const dispatchedOrder = orders.find(o => o.orderId === activeDispatchId);
      const completeOrderData = {
          ...dispatchedOrder,
          transportDetails: { ...logisticsForm, dispatchedAt: new Date() }
      };

      setPrintOrder(completeOrderData); 
      setShowDispatchModal(false);
      fetchData(); 

    } catch (e) {
      alert("Error: " + (e.response?.data?.msg || e.message));
    }
  };

  // 📄 PRINT VIEW RENDERING
  if (printOrder) {
      return (
        <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white flex justify-center">
            <div className="w-full max-w-[210mm] bg-white shadow-2xl print:shadow-none print:w-full">
                
                <div className="p-4 bg-slate-800 text-white flex justify-between items-center print:hidden rounded-t-lg">
                    <button onClick={() => setPrintOrder(null)} className="flex items-center gap-2 hover:text-slate-300 font-bold text-sm">
                        <FiArrowLeft /> Back to List
                    </button>
                    <div className="flex gap-3">
                        <span className="text-sm font-medium opacity-70 flex items-center gap-2 mr-4">
                            <FiCheckCircle className="text-green-400"/> Dispatch Verified
                        </span>
                        <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2 text-sm transition-colors">
                            <FiPrinter /> Print Challan
                        </button>
                    </div>
                </div>

                <div className="p-12 print:p-8 text-slate-900">
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight uppercase">Delivery Challan</h1>
                            <p className="text-sm font-bold text-slate-500 mt-1">Original for Recipient</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold">Shivram Hosiery Factory</h2>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Ludhiana <br/>
                                GSTIN: 03AFEPA1102L1ZB
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8 border border-slate-200 rounded p-4">
                        <div>
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dispatch To</h3>
                            <p className="text-lg font-bold">{printOrder.customerName}</p>
                            {/* 🟢 DYNAMIC ADDRESS ON CHALLAN */}
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                {getCustomerAddress(printOrder)}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Challan No</h3><p className="font-bold text-slate-800">{printOrder.orderId}</p></div>
                            <div><h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</h3><p className="font-bold text-slate-800">{new Date(printOrder.dispatchDetails?.dispatchedAt || Date.now()).toLocaleDateString()}</p></div>
                            <div><h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vehicle No</h3><p className="font-bold text-slate-800 uppercase">{printOrder.dispatchDetails?.vehicleNo || printOrder.transportDetails?.vehicleNo}</p></div>
                            <div><h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tracking ID</h3><p className="font-bold text-slate-800 uppercase">{printOrder.dispatchDetails?.trackingId || printOrder.transportDetails?.trackingId}</p></div>
                        </div>
                    </div>

                    <div className="mb-8 bg-slate-50 p-4 border border-slate-200 rounded">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Driver Details</span>
                                <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <FiUser size={14}/> {printOrder.dispatchDetails?.driverName || printOrder.transportDetails?.driverName}
                                </p>
                                <p className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                                    <FiPhone size={12}/> {printOrder.dispatchDetails?.driverPhone || printOrder.transportDetails?.driverPhone || "N/A"}
                                </p>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Packaging Note</span>
                                <p className="text-sm font-medium text-slate-800 whitespace-pre-line">
                                    {printOrder.dispatchDetails?.packagingNote || printOrder.transportDetails?.packagingNote || "Standard Packaging"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <table className="w-full text-left mb-12 border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-800">
                                <th className="py-2 text-xs font-bold text-slate-500 uppercase w-12">#</th>
                                <th className="py-2 text-xs font-bold text-slate-500 uppercase">Item Description</th>
                                <th className="py-2 text-xs font-bold text-slate-500 uppercase text-right">Quantity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {printOrder.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="py-3 text-sm text-slate-500">{index + 1}</td>
                                    <td className="py-3">
                                        <p className="font-bold text-slate-900">{item.productName}</p>
                                        <p className="text-xs text-slate-500">{item.category} • {item.color}</p>
                                    </td>
                                    <td className="py-3 text-right font-bold text-slate-900 text-lg">
                                        {item.qtyOrdered}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-20 grid grid-cols-2 gap-20">
                        <div><div className="border-t border-slate-300 w-full pt-2"><p className="text-xs font-bold text-slate-900">Received By</p></div></div>
                        <div className="text-right"><div className="border-t border-slate-300 w-full pt-2"><p className="text-xs font-bold text-slate-900">For Shivram Hosiery</p></div></div>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  const currentList = activeTab === "pending" ? orders : history;
  const filteredList = currentList.filter(o => 
    o.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AuthGuard requiredPermission="logistics">
    <div className="p-6 bg-white min-h-screen animate-in fade-in">
      
      {/* Header with Tab Navigation */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Logistics & Dispatch</h1>
          <div className="flex gap-4 mt-4">
              <button 
                onClick={() => setActiveTab("pending")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pending' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                  <FiClock /> Pending Dispatch
              </button>
              <button 
                onClick={() => setActiveTab("history")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                  <FiCheckCircle /> Dispatch History
              </button>
          </div>
        </div>
        <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-slate-400" />
            <input 
                type="text" 
                placeholder="Search orders..." 
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
                    <th className="p-4 w-40 border-r border-slate-300">Customer & Address</th>
                    {activeTab === 'pending' ? (
                        <>
                            <th className="p-4 w-24 border-r border-slate-300 text-center">Priority</th>
                            <th className="p-4 border-r border-slate-300">Item Details</th>
                            <th className="p-4 text-right border-r border-slate-300 w-24 bg-slate-50">Stock</th>
                            <th className="p-4 text-center w-40">Action</th>
                        </>
                    ) : (
                        <>
                            <th className="p-4 border-r border-slate-300">Transport Detail</th>
                            <th className="p-4 border-r border-slate-300">Status</th>
                            <th className="p-4 text-center w-40">Options</th>
                        </>
                    )}
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
                {filteredList.map((order) => {
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

                            {/* 2. Customer & Dynamic Address */}
                            <td className="p-4 align-top border-r border-slate-200">
                                <div className="font-bold text-slate-800">{order.customerName}</div>
                                <div className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                                    <FiMapPin className="mt-0.5 text-slate-400 shrink-0" />
                                    {/* 🟢 DYNAMIC ADDRESS IN TABLE */}
                                    <span className="font-medium text-slate-600 leading-relaxed">
                                        {getCustomerAddress(order)}
                                    </span>
                                </div>
                            </td>

                            {activeTab === 'pending' ? (
                                <>
                                    {/* Priority */}
                                    <td className="p-4 align-top border-r border-slate-200 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold flex items-center justify-center gap-1 w-fit mx-auto ${
                                            order.priority === 'High' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-50 text-blue-700'
                                        }`}>
                                            {order.priority || 'Normal'}
                                        </span>
                                    </td>

                                    {/* Item Details */}
                                    <td className="p-4 align-top border-r border-slate-200">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="mb-1 text-xs font-bold text-slate-700">
                                                {item.productName} ({item.qtyOrdered})
                                            </div>
                                        ))}
                                    </td>

                                    {/* Stock */}
                                    <td className="p-4 align-top text-right border-r border-slate-200 font-mono font-bold text-emerald-600">
                                        OK
                                    </td>

                                    {/* Action */}
                                    <td className="p-4 align-middle text-center">
                                        {canDispatch ? (
                                            <button 
                                                onClick={() => openDispatchModal(order.orderId)}
                                                className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 mx-auto shadow-md"
                                            >
                                                <FiTruck size={14} /> Dispatch
                                            </button>
                                        ) : (
                                            <span className="text-amber-600 text-[10px] font-black uppercase flex items-center justify-center gap-1">
                                                <FiActivity /> Wait for Mfg
                                            </span>
                                        )}
                                    </td>
                                </>
                            ) : (
                                <>
                                    {/* History View: Transport Detail */}
                                    <td className="p-4 align-top border-r border-slate-200">
                                        <div className="text-xs font-bold text-slate-800">{order.dispatchDetails?.vehicleNo}</div>
                                        <div className="text-[10px] text-slate-400">Driver: {order.dispatchDetails?.driverName}</div>
                                    </td>

                                    {/* History View: Status */}
                                    <td className="p-4 align-top border-r border-slate-200">
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                            Dispatched
                                        </span>
                                        <div className="text-[9px] text-slate-400 mt-1">
                                            {new Date(order.dispatchDetails?.dispatchedAt).toLocaleString()}
                                        </div>
                                    </td>

                                    {/* Options: Reprint */}
                                    <td className="p-4 align-middle text-center">
                                        <button 
                                            onClick={() => setPrintOrder(order)}
                                            className="text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 mx-auto transition-all"
                                        >
                                            <FiPrinter /> Reprint Challan
                                        </button>
                                    </td>
                                </>
                            )}
                        </tr>
                    );
                })}
            </tbody>
        </table>
        {!loading && filteredList.length === 0 && (
            <div className="p-12 text-center text-slate-400 font-medium">No records found.</div>
        )}
      </div>

      {/* DISPATCH POPUP MODAL */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                        <FiTruck /> Ship Order
                    </h3>
                    <button onClick={() => setShowDispatchModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <FiX />
                    </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-700 font-medium mb-2">
                        Dispatching Order: <span className="font-bold font-mono">{activeDispatchId}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vehicle No</label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                value={logisticsForm.vehicleNo}
                                onChange={(e) => setLogisticsForm({...logisticsForm, vehicleNo: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tracking ID</label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                value={logisticsForm.trackingId}
                                onChange={(e) => setLogisticsForm({...logisticsForm, trackingId: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Driver Name</label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                value={logisticsForm.driverName}
                                onChange={(e) => setLogisticsForm({...logisticsForm, driverName: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Driver Phone</label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                value={logisticsForm.driverPhone}
                                onChange={(e) => setLogisticsForm({...logisticsForm, driverPhone: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Packaging Notes</label>
                        <textarea 
                            className="w-full p-3 border rounded-xl text-sm h-24 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={logisticsForm.packagingNote}
                            onChange={(e) => setLogisticsForm({...logisticsForm, packagingNote: e.target.value})}
                        ></textarea>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-3">
                    <button onClick={() => setShowDispatchModal(false)} className="px-5 py-2.5 text-slate-600 font-bold">Cancel</button>
                    <button onClick={handleConfirmDispatch} className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 flex items-center gap-2 text-sm">
                        <FiSave /> Confirm Dispatch
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
    </AuthGuard>
  );
}