"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "@/utils/api";
import AuthGuard from "@/components/AuthGuard";
import {
  FiShoppingCart,
  FiUser,
  FiPlus,
  FiX,
  FiTrash2,
  FiPhone,
  FiAlertCircle,
  FiArrowDown,
  FiTag,
  FiBox,
  FiActivity,
  FiRefreshCw,
  FiMapPin, 
  FiMail 
} from "react-icons/fi";

export default function ProcurementPage() {
  const [vendors, setVendors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("RM");
  const [showVendorModal, setShowVendorModal] = useState(false);

  // --- STATE FOR PENDING REQUESTS ---
  const [pendingTrades, setPendingTrades] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);

  // 🟢 UPDATED STATE FOR NEW FIELDS
  const [newVendor, setNewVendor] = useState({
    name: "",
    category: "Material Supplier",
    services: [],
    phone: "",
    email: "",    
    gst: "",      
    address: ""   
  });

  const [formData, setFormData] = useState({
    vendor: "",
    itemId: "",
    itemType: "Raw Material",
    qty: "",
    unitPrice: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vRes, mRes, pRes, tRes] = await Promise.all([
        api.get("/vendors"),
        api.get("/inventory/stock"),
        api.get("/products"),
        api.get("/procurement/trading"),
      ]);
      setVendors(vRes.data);
      setMaterials(mRes.data);
      setProducts(pRes.data);
      setPendingTrades(tRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  // 1. LOGIC: IDENTIFY CRITICAL STOCK
  const criticalMaterials = useMemo(() => {
    return materials.filter(m => {
        const current = m.stock?.current || 0;
        const safety = m.safetyStock || 0; 
        return safety > 0 && current <= safety;
    });
  }, [materials]);

  // 2. ACTION: PRE-FILL FORM FOR RESTOCKING (🟢 UPDATED TO SCROLL TO TOP)
  const handleRestock = (material) => {
      setActiveTab("RM");
      
      const current = material.stock?.current || 0;
      const safety = material.safetyStock || 0;
      const deficit = Math.max(0, safety - current);
      const suggestedQty = deficit === 0 ? 10 : deficit; 

      setFormData({
          vendor: "", 
          itemId: material._id,
          itemType: "Raw Material",
          qty: suggestedQty,
          unitPrice: "" 
      });
      
      // 🟢 Scroll to top where the form is now located
      window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getVendorNameForCard = (req) => {
      if (!req.vendorId) return "Not Assigned";
      if (typeof req.vendorId === 'object' && req.vendorId.name) return req.vendorId.name;
      const found = vendors.find(v => v._id === String(req.vendorId));
      if (found) return found.name;
      return "Unknown Vendor"; 
  };

  const handleLoadRequest = (req) => {
    setActiveTab("FG");

    let matchedVendorId = "";
    if (req.vendorId) {
      if (typeof req.vendorId === "object" && req.vendorId._id) {
        matchedVendorId = req.vendorId._id;
      } else {
        const directMatch = vendors.find((v) => v._id === req.vendorId);
        if (directMatch) {
          matchedVendorId = directMatch._id;
        } else {
          const nameMatch = vendors.find(
            (v) => v.name.toLowerCase().trim() === String(req.vendorId).toLowerCase().trim()
          );
          if (nameMatch) matchedVendorId = nameMatch._id;
        }
      }
    }

    setFormData({
      vendor: matchedVendorId, 
      itemId: req.productId?._id,
      itemType: "Finished Good",
      qty: req.totalQty,
      unitPrice: req.unitCost || req.cost || "", 
    });

    setSelectedJobId(req._id);
    // 🟢 Already scrolls to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    try {
      if (selectedJobId) {
        await api.post("/procurement/create-trading-po", {
          jobId: selectedJobId,
          vendorId: formData.vendor,
          costPerUnit: Number(formData.unitPrice),
        });
        alert("Trading PO Created! Job Card Updated. 🚀");
        setSelectedJobId(null);
      } else {
        await api.post("/procurement/purchase", formData);
        alert("Purchase Successful! Stock Updated.");
      }

      setFormData({
        vendor: "",
        itemId: "",
        itemType: "Raw Material",
        qty: "",
        unitPrice: "",
      });
      fetchData();
    } catch (error) {
      alert("Error purchasing: " + (error.response?.data?.msg || error.message));
    }
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    try {
      await api.post("/vendors", newVendor);
      alert("Vendor Added Successfully");
      setShowVendorModal(false);
      setNewVendor({
        name: "",
        category: "Material Supplier",
        services: [],
        phone: "",
        email: "",
        gst: "",
        address: ""
      });
      fetchData();
    } catch (error) {
      alert("Error adding vendor");
    }
  };

  const deleteVendor = async (id) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;
    try {
      await api.delete(`/vendors/${id}`);
      fetchData();
    } catch (error) {
      alert("Error deleting vendor");
    }
  };

  const filteredVendors = vendors.filter((v) => {
    if (activeTab === "RM") return v.category === "Material Supplier";
    if (activeTab === "FG") return v.category === "Full Service Factory" || v.category === "Trading";
    return true;
  });

  return (
    <AuthGuard requiredPermission="procurement">
      <div className="space-y-8 animate-in fade-in">
        
        {/* 🟢 1. HEADER (STAYS ON TOP) */}
        <div className="border-b border-slate-200 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Procurement Hub</h1>
            <p className="text-slate-500 mt-2">Manage Purchases, Stock Strategy & Suppliers.</p>
          </div>
          <button
            onClick={() => setShowVendorModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            <FiPlus /> Add New Vendor
          </button>
        </div>

        {/* 🟢 2. MAIN WORKSPACE (PURCHASE FORM & VENDORS MOVED TO TOP) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* PURCHASE FORM ENTRY */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-fit scroll-mt-10">
            <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-slate-800">
              <FiShoppingCart />
              {selectedJobId ? (
                <span className="text-purple-600">Fulfilling Request...</span>
              ) : (
                "Create Purchase Entry"
              )}
            </h3>

            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("RM");
                  setFormData({ ...formData, itemType: "Raw Material", itemId: "" });
                  setSelectedJobId(null);
                }}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "RM"
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                Raw Material
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("FG");
                  setFormData({ ...formData, itemType: "Finished Good", itemId: "" });
                }}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "FG"
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                Finished Goods
              </button>
            </div>

            <form onSubmit={handlePurchase} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  Select {activeTab === "RM" ? "Material Supplier" : "Partner / Factory"}
                </label>
                <div className="relative">
                  <select
                    className="w-full p-4 border border-slate-200 rounded-xl font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    value={formData.vendor}
                    required
                  >
                    <option value="" className="text-slate-400">-- Choose Vendor --</option>
                    {filteredVendors.map((v) => (
                      <option key={v._id} value={v._id}>{v.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-4 text-slate-400 pointer-events-none">▼</div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  Select Item
                </label>
                <div className="relative">
                  <select
                    className="w-full p-4 border border-slate-200 rounded-xl font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                    value={formData.itemId}
                    required
                  >
                    <option value="">-- Choose Item --</option>
                    {activeTab === "RM"
                      ? materials.map((m) => (
                          <option key={m._id} value={m._id}>{m.name} (In Stock: {m.stock.current} {m.unit})</option>
                        ))
                      : products.map((p) => (
                          <option key={p._id} value={p._id}>{p.name} (Warehouse: {p.stock.warehouse})</option>
                        ))}
                  </select>
                  <div className="absolute right-4 top-4 text-slate-400 pointer-events-none">▼</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Quantity</label>
                  <input
                    type="number"
                    className="w-full p-4 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0"
                    value={formData.qty}
                    onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Rate (Cost)</label>
                  <input
                    type="number"
                    className="w-full p-4 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0.00"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase">Total Payable</span>
                <span className="text-2xl font-black text-slate-900">
                ₹{(Number(formData.qty) * Number(formData.unitPrice)).toFixed(2)}
                </span>
              </div>

              <button className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] text-white ${
                  selectedJobId ? "bg-purple-600 hover:bg-purple-700 shadow-purple-200" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                }`}
              >
                {selectedJobId ? "Confirm Trading Order" : "Confirm Purchase"}
              </button>

              {selectedJobId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedJobId(null);
                    setFormData({ ...formData, itemId: "", qty: "", unitPrice: "" });
                  }}
                  className="w-full py-2 text-slate-400 text-xs font-bold hover:text-slate-600"
                >
                  Cancel Request & Clear Form
                </button>
              )}
            </form>
          </div>

          {/* VENDORS LIST */}
          <div className="space-y-6">
            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
              <FiUser /> My Suppliers & Vendors
            </h3>
            {vendors.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 font-medium">
                No vendors added yet.
              </div>
            ) : (
              <div className="space-y-4">
                {vendors.map((vendor) => (
                  <div key={vendor._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative group">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-lg text-slate-800">{vendor.name}</h4>
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded mt-1 inline-block ${
                                          vendor.category === "Material Supplier" ? "bg-blue-50 text-blue-700" : 
                                          vendor.category === "Full Service Factory" ? "bg-purple-50 text-purple-700" : 
                                          vendor.category === "Trading" ? "bg-purple-50 text-purple-700" : "bg-amber-50 text-amber-700"
                                        }`}
                        >
                          {vendor.category}
                        </span>
                      </div>
                      <button onClick={() => deleteVendor(vendor._id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <FiTrash2 />
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-bold text-slate-500">
                      {vendor.phone && <div className="flex items-center gap-1"><FiPhone /> {vendor.phone}</div>}
                      {vendor.email && <div className="flex items-center gap-1"><FiMail /> {vendor.email}</div>}
                      {vendor.address && <div className="flex items-center gap-1 col-span-2"><FiMapPin /> {vendor.address}</div>}
                      {vendor.gst && <div className="col-span-2 text-slate-400 font-mono">GST: {vendor.gst}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 🟢 3. NOTIFICATION & ALERT SECTIONS (MOVED TO BOTTOM) */}
        <div className="space-y-8 pt-6 border-t border-slate-100">
            
            {/* PENDING FULL-BUY REQUESTS */}
            {pendingTrades.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in slide-in-from-top-4">
                <div className="bg-purple-50 px-6 py-4 border-b border-purple-100 flex items-center justify-between">
                <h3 className="font-bold text-lg text-purple-900 flex items-center gap-2">
                    <FiAlertCircle /> Pending Full-Buy Requests
                </h3>
                <span className="bg-purple-600 text-white text-xs font-black px-2.5 py-1 rounded-full">
                    {pendingTrades.length} Action Items
                </span>
                </div>
                
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                        <th className="px-6 py-4">Request ID</th>
                        <th className="px-6 py-4">Product Details</th>
                        <th className="px-6 py-4">Assigned Vendor</th>
                        <th className="px-6 py-4">Quantity</th>
                        <th className="px-6 py-4">Negotiated Rate</th>
                        <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {pendingTrades.map((req) => {
                        const vendorName = getVendorNameForCard(req);
                        const rate = req.unitCost || req.cost || 0;

                        return (
                        <tr key={req._id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                            <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                {req.jobId}
                            </span>
                            </td>
                            <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 text-sm">
                                {req.productId?.name || "Unknown Product"}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="bg-purple-100 text-purple-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                                Full Buy
                                </span>
                            </div>
                            </td>
                            <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600 font-semibold text-xs">
                                <FiUser className="text-slate-400" />
                                {vendorName}
                            </div>
                            </td>
                            <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                                <FiBox className="text-blue-500" />
                                {req.totalQty} Units
                            </div>
                            </td>
                            <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-emerald-600 font-black text-sm">
                                <FiTag className="text-emerald-400" size={14} />
                                ₹{rate.toLocaleString()}
                            </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                            <button
                                onClick={() => handleLoadRequest(req)}
                                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-bold hover:bg-purple-600 transition-all flex items-center gap-2 ml-auto shadow-md shadow-slate-200"
                            >
                                Prepare PO <FiArrowDown />
                            </button>
                            </td>
                        </tr>
                        );
                    })}
                    </tbody>
                </table>
                </div>
            </div>
            )}

            {/* CRITICAL STOCK ALERT */}
            {criticalMaterials.length > 0 && (
            <div className="bg-white border border-red-100 rounded-2xl shadow-sm overflow-hidden animate-in slide-in-from-top-4">
                <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-red-800 flex items-center gap-2">
                    <FiActivity className="text-red-600" /> Critical Stock Levels
                    </h3>
                    <span className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full animate-pulse">
                    {criticalMaterials.length} Items Low
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-red-50/30 text-red-900/50 uppercase text-[10px] font-bold border-b border-red-50">
                            <th className="px-6 py-3">Material Name</th>
                            <th className="px-6 py-3">Current Stock</th>
                            <th className="px-6 py-3">Safety Level</th>
                            <th className="px-6 py-3">Deficit</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-red-50">
                        {criticalMaterials.map((m) => (
                            <tr key={m._id} className="hover:bg-red-50/40 transition-colors">
                                <td className="px-6 py-3 font-bold text-slate-800">{m.name}</td>
                                <td className="px-6 py-3 font-mono font-bold text-red-600">{m.stock?.current || 0} {m.unit}</td>
                                <td className="px-6 py-3 font-mono text-slate-500">{m.safetyStock || 0} {m.unit}</td>
                                <td className="px-6 py-3 font-mono font-bold text-slate-700">
                                - {((m.safetyStock || 0) - (m.stock?.current || 0)).toFixed(2)}
                                </td>
                                <td className="px-6 py-3 text-right">
                                <button 
                                    onClick={() => handleRestock(m)}
                                    className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 ml-auto shadow-md shadow-red-100 transition-all"
                                >
                                    <FiRefreshCw /> Restock
                                </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            </div>
            )}
        </div>

        {/* VENDOR MODAL (STAYS SAME) */}
        {showVendorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Add New Vendor</h3>
                <button onClick={() => setShowVendorModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><FiX /></button>
              </div>
              <form onSubmit={handleAddVendor} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Vendor Name</label>
                  <input className="w-full border border-slate-200 p-3 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" value={newVendor.name} onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })} required placeholder="e.g. A1 Trading Co." />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Category</label>
                  <div className="relative">
                    <select className="w-full border border-slate-200 p-3 rounded-xl font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none" value={newVendor.category} onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}>
                      <option value="Material Supplier">Material Supplier</option>
                      <option value="Job Worker">Job Worker</option>
                      <option value="Full Service Factory">Full Service Factory</option>
                      <option value="Trading">Trading Partner</option>
                    </select>
                    <div className="absolute right-4 top-3.5 text-slate-400 pointer-events-none">▼</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Phone</label>
                        <input className="w-full border border-slate-200 p-3 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" value={newVendor.phone} onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })} placeholder="9876543210" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
                        <input type="email" className="w-full border border-slate-200 p-3 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" value={newVendor.email} onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })} placeholder="vendor@mail.com" />
                    </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Address</label>
                  <textarea rows="2" className="w-full border border-slate-200 p-3 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none" value={newVendor.address} onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })} placeholder="Shop 12, Industrial Area..." />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">GST Number</label>
                  <input className="w-full border border-slate-200 p-3 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" value={newVendor.gst} onChange={(e) => setNewVendor({ ...newVendor, gst: e.target.value })} placeholder="27ABCDE1234F1Z5" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowVendorModal(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                  <button className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg">Save Vendor</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}