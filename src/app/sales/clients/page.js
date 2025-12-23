"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from '@/components/AuthGuard';
import api from "@/utils/api";
import {
  FiUser, FiMapPin, FiCreditCard, FiSave, FiSearch,
  FiPlus, FiActivity, FiX, FiBriefcase, FiEdit3, FiClock
} from "react-icons/fi";
import Link from "next/link";

// 🟢 NEW: HISTORY MODAL COMPONENT
const HistoryModal = ({ isOpen, onClose, client }) => {
  if (!isOpen || !client) return null;

  // Sort history: Newest first
  const history = client.activityLog?.sort((a, b) => new Date(b.date) - new Date(a.date)) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[80vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-800">Activity History</h3>
              <p className="text-xs text-slate-500">{client.name}</p>
            </div>
            <button onClick={onClose}><FiX size={20} className="text-slate-400 hover:text-red-500"/></button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          {history.length === 0 ? (
            <div className="text-center text-slate-400 text-sm">No history found.</div>
          ) : (
            history.map((log, idx) => (
              <div key={idx} className="relative pl-6 border-l-2 border-slate-100 last:border-0 pb-1">
                {/* Timeline Dot */}
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500"></div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">{log.status}</span>
                    <p className="text-sm font-medium text-slate-800 mt-1">"{log.remark}"</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded flex items-center gap-1">
                           <FiUser size={10} /> {log.updatedBy || 'Unknown'}
                        </span>
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded uppercase">
                           {log.type}
                        </span>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 text-right">
                    {new Date(log.date).toLocaleDateString()}<br/>
                    {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- UPDATE STATUS MODAL (Unchanged) ---
const ActivityModal = ({ isOpen, onClose, client, onSuccess }) => {
  const [formData, setFormData] = useState({ type: 'Call', status: '', remark: '' });

  useEffect(() => {
    if (client) setFormData(prev => ({ ...prev, status: client.status || 'Interested' }));
  }, [client]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/sales/clients/${client._id}`, {
        status: formData.status,
        lastActivity: { type: formData.type, remark: formData.remark }
      });
      alert(`✅ Status Updated`);
      onSuccess();
      onClose();
    } catch (error) { console.error(error); alert("Error updating client activity."); }
  };

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div><h3 className="font-bold text-slate-800">Update Status</h3></div>
            <button onClick={onClose}><FiX size={20} className="text-slate-400 hover:text-red-500"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div><label className="text-xs font-bold text-slate-400 uppercase">Client</label><input value={client.name} disabled className="w-full mt-1 p-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-600" /></div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                    <select className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm font-medium bg-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                        <option>Call</option><option>Visit</option><option>Email</option><option>Whatsapp</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">New Status</label>
                    <select className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm font-bold text-blue-600 bg-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option>Interested</option><option>Approach</option><option>Negotiation</option><option value="Order Won">Order Won 🏆</option><option value="Customer">Customer ✅</option><option>Order Lost</option><option>Cold Stage</option>
                    </select>
                </div>
            </div>
            <div><label className="text-xs font-bold text-slate-500 uppercase">Remark</label><textarea className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm" rows="3" value={formData.remark} onChange={e => setFormData({...formData, remark: e.target.value})} required></textarea></div>
            <button type="submit" className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg">Save Update</button>
        </form>
      </div>
    </div>
  );
};

export default function ClientsPage() {
  const router = useRouter();
  const [view, setView] = useState("list");
  
  // Data State
  const [clients, setClients] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [usersList, setUsersList] = useState([]); // 🟢 Store list of Salesmen for Admin dropdown
  const [currentUser, setCurrentUser] = useState(null); // 🟢 Store Logged In User Info

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  
  // 🟢 NEW STATE FOR HISTORY MODAL
  const [historyClient, setHistoryClient] = useState(null);

  // 🟢 Edit Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "", gstNumber: "", address: "", billToAddress: "",
    contactPerson: "", contactNumber: "", email: "",
    paymentTerms: "30 Days", 
    salesPerson: "" 
  });

  useEffect(() => {
    fetchData();
    
    // 🟢 1. Load Logged In User from LocalStorage
    const storedUser = localStorage.getItem("userInfo");
    if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
        // If they are not Admin, default the form to their name immediately
        if (parsed.role !== 'Admin' && parsed.role !== 'Manager') {
             setFormData(prev => ({ ...prev, salesPerson: parsed.name }));
        }
    }
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, quotesRes, usersRes] = await Promise.all([
        api.get("/sales/clients"), // 🟢 Backend filters this automatically based on Token
        api.get("/sales/quotes"),
        api.get("/auth/users") // 🟢 Updated path to fetch users for Admin Dropdown
      ]);
      setClients(clientsRes.data);
      setQuotes(quotesRes.data || []);
      setUsersList(usersRes.data || []);
    } catch (error) { 
        console.error("Error loading data:", error); 
    }
  };

  const hasQuote = (clientId) => {
    return quotes.some(q => String(q.clientId || q.client) === String(clientId));
  };

  // 🟢 START EDIT FUNCTION
  const startEdit = (client) => {
    setFormData({
        name: client.name || "", 
        gstNumber: client.gstNumber || "", 
        address: client.address || "", 
        billToAddress: client.billToAddress || "",
        contactPerson: client.contactPerson || "", 
        contactNumber: client.contactNumber || "", 
        email: client.email || "",
        paymentTerms: client.paymentTerms || "30 Days", 
        salesPerson: client.salesPerson || ""
    });
    setIsEditMode(true);
    setEditingId(client._id);
    setView("add");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditMode) {
          // 🟢 UPDATE EXISTING (Backend will block if not Admin)
          await api.put(`/sales/clients/${editingId}`, formData);
          alert("✅ Client Details Updated!");
      } else {
          // CREATE NEW
          await api.post("/sales/clients", formData);
          alert("✅ Customer Added!");
      }

      setView("list");
      fetchData();
      resetForm();
    } catch (error) {
      alert("Error saving: " + (error.response?.data?.msg || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 🟢 RESET FORM FUNCTION
  const resetForm = () => {
      const defaultSalesPerson = (currentUser?.role === 'Admin' || currentUser?.role === 'Manager') ? "" : currentUser?.name;
      setFormData({ 
          name: "", gstNumber: "", address: "", billToAddress: "", 
          contactPerson: "", contactNumber: "", email: "", 
          paymentTerms: "30 Days", 
          salesPerson: defaultSalesPerson 
      });
      setIsEditMode(false);
      setEditingId(null);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const filteredClients = clients.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.gstNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSalesPersonLocked = currentUser && (currentUser.role !== 'Admin' && currentUser.role !== 'Manager');

  return (
    <AuthGuard requiredPermission="sales_clients">
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Client Master</h1>
            <p className="text-slate-500 text-sm">Manage customer details and statuses.</p>
        </div>
        {view === "list" && (
          <button onClick={() => { resetForm(); setView("add"); }} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-lg shadow-blue-200">
            <FiPlus /> Add Leads
          </button>
        )}
      </div>

      {view === "list" && (
        <div className="space-y-4">
          <div className="relative">
            <FiSearch className="absolute left-4 top-3.5 text-slate-400" />
            <input type="text" placeholder="Search client name or GST..." className="w-full pl-11 p-3 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-100 outline-none" onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200">
                <tr>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Sales Person</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => {
                  const clientHasQuote = hasQuote(client._id);
                  return (
                    <tr key={client._id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">
                            {client.name}
                            {/* 🟢 EDIT ICON: ONLY VISIBLE TO ADMIN */}
                            {currentUser?.role === 'Admin' && (
                                <button 
                                    onClick={() => startEdit(client)} 
                                    className="ml-2 text-slate-300 hover:text-blue-600 transition-colors"
                                    title="Edit Master Details (Admin Only)"
                                >
                                    <FiEdit3 size={16} />
                                </button>
                            )}
                        </td>
                        <td className="p-4">
                            <div className="text-slate-900 font-medium">{client.contactPerson}</div>
                            <div className="text-xs text-slate-500">{client.contactNumber}</div>
                        </td>
                        <td className="p-4">
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs font-bold rounded border ${
                                    client.status === 'Customer' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                    client.status === 'Order Won' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                    'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                    {client.status || 'Active'}
                                </span>
                                {/* 🟢 HISTORY BUTTON */}
                                <button onClick={() => setHistoryClient(client)} className="text-slate-400 hover:text-slate-800 transition-colors" title="View History">
                                    <FiClock size={16} />
                                </button>
                            </div>
                        </td>
                        
                        {/* Show Sales Person Name */}
                        <td className="p-4 text-xs font-bold text-slate-600">
                            <div className="flex items-center gap-1"><FiUser/> {client.salesPerson}</div>
                        </td>

                        <td className="p-4 text-right">
                            {clientHasQuote ? (
                                <button onClick={() => setSelectedClient(client)} className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-800 hover:text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ml-auto">
                                    <FiActivity /> Update
                                </button>
                            ) : (
                                <Link href={`/sales/quotes/new?clientId=${client._id}`} className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ml-auto w-fit">
                                    <FiPlus /> Quote
                                </Link>
                            )}
                        </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredClients.length === 0 && <div className="p-12 text-center text-slate-400 font-medium">No clients found.</div>}
          </div>
        </div>
      )}

      {view === "add" && (
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Company Info */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FiUser className="text-blue-500" /> 
                    {isEditMode ? "Edit Company Details" : "Company Details"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Name</label>
                        <input type="text" name="name" value={formData.name} required onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-100 outline-none" placeholder="e.g. Tata Steel Ltd" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">GST Number</label>
                        <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none" />
                    </div>
                </div>
            </div>

            {/* Address */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FiMapPin className="text-red-500" /> Locations</h3>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Billing Address</label>
                        <textarea name="billToAddress" value={formData.billToAddress} required onChange={handleChange} rows="2" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"></textarea>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Shipping Address</label>
                        <textarea name="address" value={formData.address} onChange={handleChange} rows="2" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"></textarea>
                    </div>
                </div>
            </div>

            {/* Commercial Terms */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FiCreditCard className="text-emerald-500" /> Commercial Terms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Person</label>
                        <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                        <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Terms</label>
                        <select name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none">
                            <option value="Advance">Advance</option><option value="15 Days">15 Days</option><option value="30 Days">30 Days</option><option value="45 Days">45 Days</option><option value="60 Days">60 Days</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                            <FiBriefcase /> Assigned Sales Rep
                        </label>
                        
                        {isSalesPersonLocked ? (
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={formData.salesPerson} 
                                    disabled 
                                    className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-not-allowed"
                                />
                                <span className="absolute right-3 top-3 text-[10px] text-slate-400 font-bold uppercase">Locked</span>
                            </div>
                        ) : (
                            <select 
                                name="salesPerson" 
                                value={formData.salesPerson} 
                                onChange={handleChange}
                                className="w-full p-3 bg-white border border-blue-200 text-blue-700 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-200"
                            >
                                <option value="">-- Assign Sales Person --</option>
                                {usersList.map(u => (
                                    <option key={u._id} value={u.name}>{u.name} ({u.role})</option>
                                ))}
                            </select>
                        )}
                    </div>

                </div>
            </div>

            <div className="flex gap-4">
                <button type="button" onClick={() => { setView("list"); resetForm(); }} className="flex-1 py-4 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-black flex justify-center items-center gap-2">
                    {loading ? "Saving..." : <><FiSave /> {isEditMode ? "Update Customer" : "Save Customer"}</>}
                </button>
            </div>
          </form>
        </div>
      )}
      
      <ActivityModal isOpen={!!selectedClient} client={selectedClient} onClose={() => setSelectedClient(null)} onSuccess={fetchData} />
      {/* 🟢 HISTORY MODAL */}
      <HistoryModal isOpen={!!historyClient} client={historyClient} onClose={() => setHistoryClient(null)} />
    </div>
    </AuthGuard>
  );
}