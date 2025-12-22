"use client";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import AuthGuard from '@/components/AuthGuard';
import { 
  FiTruck, FiSearch, FiCheckCircle, FiAlertTriangle, 
  FiMapPin, FiPackage, FiFileText, FiActivity, FiX, FiSave, FiFlag, FiUser, FiPhone, FiBox, FiPrinter, FiArrowLeft
} from "react-icons/fi";

export default function LogisticsPage() {
  const [orders, setOrders] = useState([]);
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

  // 🟢 NEW STATE: For Printable Document
  const [printOrder, setPrintOrder] = useState(null); // Stores order data for printing

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
      
      // 🟢 1. FIND THE ORDER WE JUST DISPATCHED TO SHOW ON PRINT
      // We grab the full order object from our existing 'orders' state
      const dispatchedOrder = orders.find(o => o.orderId === activeDispatchId);
      
      // Combine it with the new logistics details for the print view
      const completeOrderData = {
          ...dispatchedOrder,
          transportDetails: { ...logisticsForm, dispatchedAt: new Date() }
      };

      setPrintOrder(completeOrderData); // Trigger Print View
      setShowDispatchModal(false);
      fetchData(); // Refresh list in background

    } catch (e) {
      alert("Error: " + (e.response?.data?.msg || e.message));
    }
  };

  // 🟢 IF PRINT MODE IS ACTIVE, SHOW ONLY THE DOCUMENT
  if (printOrder) {
      return (
        <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white flex justify-center">
            <div className="w-full max-w-[210mm] bg-white shadow-2xl print:shadow-none print:w-full">
                
                {/* Print Toolbar (Hidden when printing) */}
                <div className="p-4 bg-slate-800 text-white flex justify-between items-center print:hidden rounded-t-lg">
                    <button onClick={() => setPrintOrder(null)} className="flex items-center gap-2 hover:text-slate-300 font-bold text-sm">
                        <FiArrowLeft /> Back to List
                    </button>
                    <div className="flex gap-3">
                        <span className="text-sm font-medium opacity-70 flex items-center gap-2 mr-4">
                            <FiCheckCircle className="text-green-400"/> Dispatch Confirmed
                        </span>
                        <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2 text-sm transition-colors">
                            <FiPrinter /> Print Challan
                        </button>
                    </div>
                </div>

                {/* 📄 THE DOCUMENT (A4 Layout) */}
                <div className="p-12 print:p-8 text-slate-900">
                    {/* Doc Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight uppercase">Delivery Challan</h1>
                            <p className="text-sm font-bold text-slate-500 mt-1">Original for Recipient</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold">Shivram Hosiery</h2>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Plot No 45, Industrial Area,<br/>
                                Mumbai, Maharashtra - 400001<br/>
                                GSTIN: 27ABCDE1234F1Z5
                            </p>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-8 mb-8 border border-slate-200 rounded p-4">
                        <div>
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dispatch To</h3>
                            <p className="text-lg font-bold">{printOrder.customerName}</p>
                            <p className="text-sm text-slate-600">Mumbai, India</p> {/* Replace with real address if avail */}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Challan No</h3>
                                <p className="font-bold text-slate-800">{printOrder.orderId}</p>
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</h3>
                                <p className="font-bold text-slate-800">{new Date().toLocaleDateString()}</p>
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vehicle No</h3>
                                <p className="font-bold text-slate-800 uppercase">{printOrder.transportDetails.vehicleNo}</p>
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tracking ID</h3>
                                <p className="font-bold text-slate-800 uppercase">{printOrder.transportDetails.trackingId}</p>
                            </div>
                        </div>
                    </div>

                    {/* Driver & Packaging Info */}
                    <div className="mb-8 bg-slate-50 p-4 border border-slate-200 rounded">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Driver Details</span>
                                <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <FiUser size={14}/> {printOrder.transportDetails.driverName}
                                </p>
                                <p className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                                    <FiPhone size={12}/> {printOrder.transportDetails.driverPhone || "N/A"}
                                </p>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Packaging Note</span>
                                <p className="text-sm font-medium text-slate-800 whitespace-pre-line">
                                    {printOrder.transportDetails.packagingNote || "Standard Packaging"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Item Table */}
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

                    {/* Signature Area */}
                    <div className="mt-20 grid grid-cols-2 gap-20">
                        <div>
                            <div className="border-t border-slate-300 w-full pt-2">
                                <p className="text-xs font-bold text-slate-900">Received By</p>
                                <p className="text-[10px] text-slate-500">(Sign & Stamp)</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="border-t border-slate-300 w-full pt-2">
                                <p className="text-xs font-bold text-slate-900">For Shivram Hosiery</p>
                                <p className="text-[10px] text-slate-500">Authorized Signatory</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      );
  }

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

                            {/* 3. Priority */}
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
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                        <FiTruck /> Dispatch Details
                    </h3>
                    <button onClick={() => setShowDispatchModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <FiX />
                    </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-700 font-medium mb-2">
                        Dispatching Order: <span className="font-bold font-mono">{activeDispatchId}</span>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <FiTruck /> Transport Details
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vehicle Number</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="MH-04-AB-1234"
                                    value={logisticsForm.vehicleNo}
                                    onChange={(e) => setLogisticsForm({...logisticsForm, vehicleNo: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tracking ID</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="TRK-998877"
                                    value={logisticsForm.trackingId}
                                    onChange={(e) => setLogisticsForm({...logisticsForm, trackingId: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <FiUser /> Driver Information
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Driver Name</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ramesh Kumar"
                                    value={logisticsForm.driverName}
                                    onChange={(e) => setLogisticsForm({...logisticsForm, driverName: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Driver Phone</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="+91 98765 43210"
                                    value={logisticsForm.driverPhone}
                                    onChange={(e) => setLogisticsForm({...logisticsForm, driverPhone: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <FiBox /> Packaging List (Manual Entry)
                        </h4>
                        <textarea 
                            className="w-full p-3 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                            placeholder="e.g. 3 Bundles (15 pcs each) + 5 Loose pieces. Total 50."
                            value={logisticsForm.packagingNote}
                            onChange={(e) => setLogisticsForm({...logisticsForm, packagingNote: e.target.value})}
                        ></textarea>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={() => setShowDispatchModal(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl text-sm">Cancel</button>
                    <button onClick={handleConfirmDispatch} className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 flex items-center gap-2 text-sm"><FiSave /> Confirm & Dispatch</button>
                </div>
            </div>
        </div>
      )}

    </div>
    </AuthGuard>
  );
}