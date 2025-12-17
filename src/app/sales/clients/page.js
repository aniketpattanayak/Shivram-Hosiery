"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from '@/components/AuthGuard';
import api from "@/utils/api";
import {
  FiUser, FiMapPin, FiCreditCard, FiSave, FiSearch,
  FiPlus, FiArrowLeft, FiActivity, FiX, FiFileText
} from "react-icons/fi";
import Link from "next/link";

// --- ACTIVITY MODAL ---
const ActivityModal = ({ isOpen, onClose, client, onSuccess }) => {
  const [formData, setFormData] = useState({
    type: 'Call',
    status: '',
    remark: ''
  });

  useEffect(() => {
    if (client) {
      setFormData(prev => ({ ...prev, status: client.status || 'Interested' }));
    }
  }, [client]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/sales/clients/${client._id}`, {
        status: formData.status,
        lastActivity: {
            type: formData.type,
            remark: formData.remark,
            date: new Date()
        }
      });
      alert(`✅ Status Updated to: ${formData.status}`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error updating client activity.");
    }
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
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Client</label>
                <input value={client.name} disabled className="w-full mt-1 p-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-600" />
            </div>
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
                        <option>Interested</option><option>Approach</option><option>Negotiation</option>
                        <option value="Order Won">Order Won 🏆</option><option>Order Lost</option><option>Cold Stage</option>
                        {/* 🟢 Added Manual Option for Customer if needed */}
                        <option value="Customer">Customer ✅</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Remark</label>
                <textarea className="w-full mt-1 p-3 border border-slate-200 rounded-xl text-sm" rows="3" value={formData.remark} onChange={e => setFormData({...formData, remark: e.target.value})} required></textarea>
            </div>
            <button type="submit" className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg">Save Update</button>
        </form>
      </div>
    </div>
  );
};

export default function ClientsPage() {
  const router = useRouter();
  const [view, setView] = useState("list");
  const [clients, setClients] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);

  const [formData, setFormData] = useState({
    name: "", gstNumber: "", address: "", billToAddress: "",
    contactPerson: "", contactNumber: "", email: "",
    paymentTerms: "30 Days", salesPerson: "Admin",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, quotesRes] = await Promise.all([
        api.get("/sales/clients"),
        api.get("/sales/quotes")
      ]);
      setClients(clientsRes.data);
      setQuotes(quotesRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const hasQuote = (clientId) => {
    return quotes.some(q => {
      const quoteClientId = q.clientId || q.client; 
      return String(quoteClientId) === String(clientId);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/sales/clients", formData);
      alert("✅ Customer Added!");
      setView("list");
      fetchData();
      setFormData({ name: "", gstNumber: "", address: "", billToAddress: "", contactPerson: "", contactNumber: "", email: "", paymentTerms: "30 Days", salesPerson: "Admin" });
    } catch (error) {
      alert("Error adding customer");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const filteredClients = clients.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.gstNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AuthGuard requiredPermission="sales_clients">
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Client Master</h1>
            <p className="text-slate-500 text-sm">Manage customer details and statuses.</p>
          </div>
        </div>
        {view === "list" && (
          <button onClick={() => setView("add")} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <FiPlus /> Add Customer
          </button>
        )}
      </div>

      {view === "list" && (
        <div className="space-y-4">
          <div className="relative">
            <FiSearch className="absolute left-4 top-3.5 text-slate-400" />
            <input type="text" placeholder="Search..." className="w-full pl-11 p-3 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-100 outline-none" onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                <tr>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Payment Terms</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => {
                  const clientHasQuote = hasQuote(client._id);
                  
                  return (
                    <tr key={client._id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">{client.name}</td>
                        <td className="p-4">
                            <div className="text-slate-900 font-medium">{client.contactPerson}</div>
                            <div className="text-xs text-slate-500">{client.contactNumber}</div>
                        </td>
                        
                        {/* 🟢 NEW: Added 'Customer' styling (Purple) */}
                        <td className="p-4">
                            <span className={`px-2 py-1 text-xs font-bold rounded border ${
                                client.status === 'Customer' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                client.status === 'Order Won' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                client.status === 'Order Lost' ? 'bg-red-50 text-red-700 border-red-200' :
                                client.status === 'Negotiation' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                                {client.status === 'Customer' && '✅ '}
                                {client.status === 'Order Won' && '🏆 '} 
                                {client.status || 'Active'}
                            </span>
                        </td>
                        
                        <td className="p-4">
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold border border-slate-200">{client.paymentTerms}</span>
                        </td>

                        <td className="p-4 text-right">
                            {clientHasQuote ? (
                                <button 
                                    onClick={() => setSelectedClient(client)}
                                    className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-800 hover:text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ml-auto"
                                >
                                    <FiActivity /> Update Activity
                                </button>
                            ) : (
                                <Link 
                                    href={`/sales/quotes/new?clientId=${client._id}`}
                                    className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ml-auto w-fit"
                                >
                                    <FiPlus /> Create Quote
                                </Link>
                            )}
                        </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredClients.length === 0 && <div className="p-8 text-center text-slate-400">No clients found.</div>}
          </div>
        </div>
      )}

      {view === "add" && (
        <div className="max-w-4xl mx-auto">
          {/* Your Add Form is unchanged, so keeping it standard to save space in this message */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FiUser className="text-blue-500" /> Company Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Name</label>
                        <input type="text" name="name" required onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-100 outline-none" placeholder="e.g. Tata Steel Ltd" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">GST Number</label>
                        <input type="text" name="gstNumber" onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                        <input type="email" name="email" onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none" />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FiMapPin className="text-red-500" /> Locations</h3>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Billing Address</label>
                        <textarea name="billToAddress" required onChange={handleChange} rows="2" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"></textarea>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Shipping Address</label>
                        <textarea name="address" onChange={handleChange} rows="2" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"></textarea>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FiCreditCard className="text-emerald-500" /> Commercial Terms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Person</label>
                        <input type="text" name="contactPerson" onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                        <input type="text" name="contactNumber" onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Terms</label>
                        <select name="paymentTerms" onChange={handleChange} defaultValue="30 Days" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none">
                            <option value="Advance">Advance</option><option value="15 Days">15 Days</option><option value="30 Days">30 Days</option><option value="45 Days">45 Days</option><option value="60 Days">60 Days</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <button type="button" onClick={() => setView("list")} className="flex-1 py-4 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-black flex justify-center items-center gap-2">{loading ? "Saving..." : <><FiSave /> Save Customer</>}</button>
            </div>
          </form>
        </div>
      )}
      
      <ActivityModal isOpen={!!selectedClient} client={selectedClient} onClose={() => setSelectedClient(null)} onSuccess={fetchData} />
    </div>
    </AuthGuard>
  );
}