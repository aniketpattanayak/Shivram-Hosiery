'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import api from '@/utils/api';
import { FiShoppingCart, FiUser, FiPlus, FiX, FiTrash2, FiPhone, FiAlertCircle, FiArrowDown } from 'react-icons/fi';

export default function ProcurementPage() {
  const [vendors, setVendors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]); 
  const [activeTab, setActiveTab] = useState('RM'); // 'RM' = Raw Material, 'FG' = Finished Goods
  const [showVendorModal, setShowVendorModal] = useState(false);

  // --- NEW: STATE FOR PENDING REQUESTS ---
  const [pendingTrades, setPendingTrades] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null); // Tracks if we are fulfilling a request

  // Vendor Form State (Your simple version)
  const [newVendor, setNewVendor] = useState({
    name: '',
    category: 'Material Supplier',
    services: [], 
    phone: ''
  });

  // Purchase Form State
  const [formData, setFormData] = useState({
    vendor: '',
    itemId: '',
    itemType: 'Raw Material',
    qty: '',
    unitPrice: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        const [vRes, mRes, pRes, tRes] = await Promise.all([
            api.get('/vendors'),
            api.get('/inventory/stock'),
            api.get('/products'),
            api.get('/procurement/trading') // <--- NEW: Fetch Requests
        ]);
        setVendors(vRes.data);
        setMaterials(mRes.data);
        setProducts(pRes.data);
        setPendingTrades(tRes.data);
    } catch (e) { console.error(e); }
  };

  // --- NEW: LOAD REQUEST INTO FORM ---
  const handleLoadRequest = (req) => {
      // 1. Switch to Finished Goods mode
      setActiveTab('FG');
      
      // 2. Pre-fill the form
      setFormData({
          vendor: '', // User must select vendor manually
          itemId: req.productId?._id,
          itemType: 'Finished Good',
          qty: req.totalQty,
          unitPrice: '' // User must enter cost
      });

      // 3. Track the Job ID so we know to hit the trading endpoint later
      setSelectedJobId(req._id);

      // 4. Scroll to form
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    try {
        if (selectedJobId) {
            // --- SCENARIO A: FULFILLING A TRADING REQUEST ---
            await api.post('/procurement/create-trading-po', {
                jobId: selectedJobId,
                vendorId: formData.vendor,
                costPerUnit: Number(formData.unitPrice)
            });
            alert("Trading PO Created! Job Card Updated. 🚀");
            setSelectedJobId(null); // Reset
        } else {
            // --- SCENARIO B: NORMAL MANUAL PURCHASE ---
            await api.post('/procurement/purchase', formData);
            alert("Purchase Successful! Stock Updated.");
        }
        
        // Reset Form & Refresh
        setFormData({ vendor: '', itemId: '', itemType: 'Raw Material', qty: '', unitPrice: '' });
        fetchData();
    } catch (error) {
        alert("Error purchasing: " + (error.response?.data?.msg || error.message));
    }
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    try {
        await api.post('/vendors', newVendor);
        alert("Vendor Added Successfully");
        setShowVendorModal(false);
        setNewVendor({ name: '', category: 'Material Supplier', services: [], phone: '' });
        fetchData();
    } catch (error) {
        alert("Error adding vendor");
    }
  };

  const deleteVendor = async (id) => {
    if(!confirm("Are you sure you want to delete this vendor?")) return;
    try {
        await api.delete(`/vendors/${id}`);
        fetchData(); 
    } catch (error) {
        alert("Error deleting vendor");
    }
  };

  const toggleService = (service) => {
    if (newVendor.services.includes(service)) {
        setNewVendor({...newVendor, services: newVendor.services.filter(s => s !== service)});
    } else {
        setNewVendor({...newVendor, services: [...newVendor.services, service]});
    }
  };

  // Smart Filter for Dropdown
  const filteredVendors = vendors.filter(v => {
      if (activeTab === 'RM') return v.category === 'Material Supplier';
      if (activeTab === 'FG') return v.category === 'Full Service Factory' || v.category === 'Trading';
      return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in">
        
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex justify-between items-end">
        <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Procurement</h1>
            <p className="text-slate-500 mt-2">Manage Purchases & Suppliers.</p>
        </div>
        <button 
            onClick={() => setShowVendorModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
            <FiPlus /> Add New Vendor
        </button>
      </div>

      {/* --- NEW SECTION: PENDING FULL-BUY REQUESTS --- */}
      {pendingTrades.length > 0 && (
        <div className="bg-purple-50 border border-purple-100 p-6 rounded-2xl animate-in slide-in-from-top-4">
            <h3 className="font-bold text-lg text-purple-900 flex items-center gap-2 mb-4">
                <FiAlertCircle /> Pending Full-Buy Requests
                <span className="bg-purple-200 text-purple-800 text-xs px-2 py-1 rounded-full">{pendingTrades.length}</span>
            </h3>
            <div className="grid gap-3">
                {pendingTrades.map(req => (
                    <div key={req._id} className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between border border-purple-100 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-slate-400">{req.jobId}</span>
                                <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">FULL BUY</span>
                            </div>
                            <h4 className="font-bold text-slate-800">{req.productId?.name || 'Unknown Product'}</h4>
                            <p className="text-xs text-slate-500 mt-1">
                                Target Qty: <strong className="text-slate-900 text-sm">{req.totalQty} Units</strong>
                            </p>
                        </div>
                        <button 
                            onClick={() => handleLoadRequest(req)}
                            className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-purple-600 transition-colors flex items-center gap-2 shadow-lg shadow-slate-200"
                        >
                            Create PO <FiArrowDown />
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* PURCHASE FORM */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-fit">
            <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-slate-800">
                <FiShoppingCart /> 
                {selectedJobId ? <span className="text-purple-600">Fulfilling Request...</span> : "Create Purchase Entry"}
            </h3>

            <div className="flex gap-2 mb-6">
                <button 
                    type="button"
                    onClick={() => { setActiveTab('RM'); setFormData({...formData, itemType: 'Raw Material', itemId: ''}); setSelectedJobId(null); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'RM' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                    Raw Material
                </button>
                <button 
                     type="button"
                     onClick={() => { setActiveTab('FG'); setFormData({...formData, itemType: 'Finished Good', itemId: ''}); }}
                     className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'FG' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                    Finished Goods (Trading)
                </button>
            </div>

            <form onSubmit={handlePurchase} className="space-y-5">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                        Select {activeTab === 'RM' ? 'Material Supplier' : 'Partner / Factory'}
                    </label>
                    <div className="relative">
                        <select 
                            className="w-full p-4 border border-slate-200 rounded-xl font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                            onChange={e => setFormData({...formData, vendor: e.target.value})}
                            value={formData.vendor}
                            required
                        >
                            <option value="" className="text-slate-400">-- Choose Vendor --</option>
                            {filteredVendors.map(v => (
                                <option key={v._id} value={v._id}>
                                    {v.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-4 text-slate-400 pointer-events-none">▼</div>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Select Item</label>
                    <div className="relative">
                        <select 
                            className="w-full p-4 border border-slate-200 rounded-xl font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                            onChange={e => setFormData({...formData, itemId: e.target.value})}
                            value={formData.itemId}
                            required
                        >
                            <option value="">-- Choose Item --</option>
                            {activeTab === 'RM' 
                                ? materials.map(m => <option key={m._id} value={m._id}>{m.name} (In Stock: {m.stock.current} {m.unit})</option>)
                                : products.map(p => <option key={p._id} value={p._id}>{p.name} (Warehouse: {p.stock.warehouse})</option>)
                            }
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
                            onChange={e => setFormData({...formData, qty: e.target.value})} 
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
                            onChange={e => setFormData({...formData, unitPrice: e.target.value})} 
                            required 
                        />
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase">Total Payable</span>
                    <span className="text-2xl font-black text-slate-900">
                        ${(Number(formData.qty) * Number(formData.unitPrice)).toFixed(2)}
                    </span>
                </div>

                <button className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] text-white ${selectedJobId ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}>
                    {selectedJobId ? "Confirm Trading Order" : "Confirm Purchase"}
                </button>
                
                {selectedJobId && (
                    <button 
                        type="button" 
                        onClick={() => { setSelectedJobId(null); setFormData({...formData, itemId: '', qty: '', unitPrice: ''}); }}
                        className="w-full py-2 text-slate-400 text-xs font-bold hover:text-slate-600"
                    >
                        Cancel Request & Clear Form
                    </button>
                )}
            </form>
        </div>

        {/* --- VENDOR MANAGEMENT LIST --- */}
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
                    {vendors.map(vendor => (
                        <div key={vendor._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-lg text-slate-800">{vendor.name}</h4>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded mt-1 inline-block
                                        ${vendor.category === 'Material Supplier' ? 'bg-blue-50 text-blue-700' : 
                                          vendor.category === 'Full Service Factory' ? 'bg-purple-50 text-purple-700' : 
                                          vendor.category === 'Trading' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'}`}>
                                        {vendor.category}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => deleteVendor(vendor._id)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Vendor"
                                >
                                    <FiTrash2 />
                                </button>
                            </div>
                            <div className="mt-4 flex gap-4 text-xs font-bold text-slate-500">
                                {vendor.phone && <div className="flex items-center gap-1"><FiPhone /> {vendor.phone}</div>}
                                {vendor.services.length > 0 && (
                                    <div className="text-slate-400">
                                        Handles: {vendor.services.join(', ')}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </div>

      {/* --- VENDOR MODAL --- */}
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
                        <input className="w-full border border-slate-200 p-3 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} required placeholder="e.g. A1 Trading Co." />
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Category</label>
                        <div className="relative">
                            <select className="w-full border border-slate-200 p-3 rounded-xl font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none" value={newVendor.category} onChange={e => setNewVendor({...newVendor, category: e.target.value})}>
                                <option value="Material Supplier">Material Supplier (Sells Fabric/Buttons)</option>
                                <option value="Job Worker">Job Worker (Does Cutting/Stitching)</option>
                                <option value="Full Service Factory">Full Service Factory (Full Product Buy)</option>
                                <option value="Trading">Trading Partner</option>
                            </select>
                            <div className="absolute right-4 top-3.5 text-slate-400 pointer-events-none">▼</div>
                        </div>
                    </div>

                    {newVendor.category === 'Job Worker' && (
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                            <label className="text-xs font-bold text-amber-700 uppercase block mb-3">Select Capabilities</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['Cutting', 'Stitching', 'Packaging'].map(service => (
                                    <label key={service} className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer bg-white p-2 rounded-lg border border-amber-100 hover:border-amber-300 transition-colors">
                                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" checked={newVendor.services.includes(service)} onChange={() => toggleService(service)} />
                                        {service}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Phone / Contact</label>
                        <input className="w-full border border-slate-200 p-3 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" value={newVendor.phone} onChange={e => setNewVendor({...newVendor, phone: e.target.value})} placeholder="Optional" />
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
  );
}