'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiTruck, FiMapPin, FiPackage, FiCheckCircle, FiClock, FiSearch } from 'react-icons/fi';

export default function DispatchPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shippingDetails, setShippingDetails] = useState({}); // Stores inputs for each order

  const fetchOrders = async () => {
    try {
      // Connects to Backend Port 2121
      const res = await axios.get('http://localhost:2121/api/inventory/orders');
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

  const handleInputChange = (orderId, field, value) => {
    setShippingDetails(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], [field]: value }
    }));
  };

  const handleDispatch = async (orderId) => {
    const details = shippingDetails[orderId];
    if (!details?.vehicleNo || !details?.trackingId) {
      alert("Please enter Vehicle No and Tracking ID");
      return;
    }

    if (!confirm("Confirm Shipment? Stock will be permanently deducted.")) return;

    try {
      await axios.post('http://localhost:2121/api/inventory/ship', {
        orderId: orderId, // Note: We need the String ID (e.g. SO-1001)
        transportDetails: details
      });
      alert("Order Dispatched Successfully! 🚚");
      fetchOrders(); // Refresh list
    } catch (error) {
      alert('Error: ' + (error.response?.data?.msg || error.message));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Logistics & Dispatch</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Manage shipments, assign vehicles, and close orders.</p>
        </div>
        <div className="flex gap-3">
           <div className="relative group">
              <FiSearch className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500" />
              <input 
                type="text" 
                placeholder="Search Order #..." 
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all w-64 outline-none"
              />
           </div>
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Loading Shipments...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-100 shadow-sm text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
            <FiTruck size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Pending Shipments</h3>
          <p className="text-slate-500 mt-2">All orders have been dispatched.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
             // 🟢 FIX: Smart Name Detection
             // Checks "customer" (Old data) OR "clientId.name" (New data) OR "clientName" (Backup)
             const customerName = order.customer 
                              || order.clientId?.name 
                              || order.clientName 
                              || 'Unknown Customer';

             return (
              <div key={order._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                
                {/* Order Header */}
                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm shadow-blue-200">
                      {order.orderId}
                    </span>
                    <div>
                      {/* 🟢 UPDATED: Display the fixed customer name */}
                      <h3 className="text-base font-bold text-slate-800">{customerName}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <FiClock size={10} /> Due: {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border 
                      ${order.status === 'Ready_Dispatch' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Order Body */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Column 1: Items */}
                  <div className="lg:col-span-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Packing List</h4>
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-white rounded-lg text-slate-400 border border-slate-200">
                                <FiPackage />
                              </div>
                              <span className="text-sm font-bold text-slate-700">{item.productName || item.product?.name || 'Item'}</span>
                           </div>
                           <span className="text-sm font-bold text-slate-900">{item.qtyOrdered} Units</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Dispatch Form */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <FiMapPin /> Logistics Details
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Vehicle Number</label>
                        <input 
                          type="text" 
                          placeholder="e.g. MH-02-AB-1234"
                          className="w-full bg-white border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                          onChange={(e) => handleInputChange(order.orderId, 'vehicleNo', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Tracking / AWB ID</label>
                        <input 
                          type="text" 
                          placeholder="e.g. FEDEX-998877"
                          className="w-full bg-white border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                          onChange={(e) => handleInputChange(order.orderId, 'trackingId', e.target.value)}
                        />
                      </div>
                      
                      <button 
                        onClick={() => handleDispatch(order.orderId)}
                        className="w-full py-3 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-[0.98] flex justify-center items-center gap-2 mt-2"
                      >
                        <FiTruck /> Mark Dispatched
                      </button>
                    </div>
                  </div>

                </div>
              </div>
             );
          })}
        </div>
      )}
    </div>
  );
}