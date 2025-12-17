"use client";
import { useState, useMemo, useEffect } from "react";
import api from "@/utils/api";
import {
  FiPlus, FiTrash2, FiCheckCircle, FiPackage, FiSearch,
  FiArrowDownCircle, FiFileText, FiMinus, FiSave, FiAlertCircle,
  FiShoppingCart, FiClock, FiTruck, FiBox, FiUser 
} from "react-icons/fi";

// --- HELPER: Order Item Row (For the Form) ---
const OrderItemRow = ({ index, item, onChange, onRemove, isOnlyItem, productList }) => {
  return (
    <div className="group flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm transition-all hover:shadow-md hover:border-blue-300 relative mb-3">
      <span className="hidden sm:flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500 font-mono">
        {index + 1}
      </span>
      <div className="flex-grow w-full sm:w-auto relative">
        <div className="relative">
          <input
            list={`product-list-${index}`}
            type="text"
            value={item.productName}
            onChange={(e) => onChange(index, "productName", e.target.value)}
            placeholder="Search product name..."
            className="w-full bg-transparent border-0 border-b border-slate-200 px-0 py-2 pl-8 text-slate-900 placeholder:text-slate-400 focus:ring-0 focus:border-blue-600 transition-colors font-bold"
            required
          />
          <FiSearch className="absolute left-0 top-3 text-slate-400" />
        </div>
        <datalist id={`product-list-${index}`}>
          {productList.map((prod) => (
            <option key={prod._id} value={prod.name}>
              Category: {prod.category} | Price: ₹{prod.sellingPrice || 0}
            </option>
          ))}
        </datalist>
      </div>
      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden shrink-0">
        <button type="button" onClick={() => onChange(index, "qtyOrdered", Math.max(1, Number(item.qtyOrdered) - 1))} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border-r border-slate-200"><FiMinus size={14} /></button>
        <input type="number" value={item.qtyOrdered} onChange={(e) => onChange(index, "qtyOrdered", Number(e.target.value))} className="w-16 text-center border-none bg-white p-0 text-sm font-semibold text-slate-700 focus:ring-0 appearance-none" min="1" required />
        <button type="button" onClick={() => onChange(index, "qtyOrdered", Number(item.qtyOrdered) + 1)} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border-l border-slate-200"><FiPlus size={14} /></button>
      </div>
      <button type="button" onClick={() => onRemove(index)} disabled={isOnlyItem} className={`p-2 rounded-lg transition-colors ml-0 sm:ml-2 ${isOnlyItem ? "text-slate-200 cursor-not-allowed" : "text-slate-400 hover:text-red-600 hover:bg-red-50"}`}><FiTrash2 size={18} /></button>
    </div>
  );
};

export default function SalesOrdersPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });
  
  // Data States
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]); // Existing Orders List
  const [wonLeads, setWonLeads] = useState([]); 
  const [clientQuotes, setClientQuotes] = useState([]); 

  // Form State
  const [formData, setFormData] = useState({
    customerName: "",
    customerId: "", 
    deliveryDate: new Date().toISOString().split("T")[0],
    priority: "Medium",
    items: [{ productName: "", qtyOrdered: 1 }],
  });

  // 1. Fetch All Data (Products, Clients/Leads, Orders)
  const fetchAllData = async () => {
    try {
      const [prodRes, leadsRes, ordersRes] = await Promise.all([
        api.get("/products"),
        api.get("/sales/clients"),
        api.get("/sales/orders") // 🟢 Fetch existing orders for the table
      ]);
      
      setProducts(prodRes.data);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      
      if (leadsRes.data) {
         const won = leadsRes.data.filter(l => l.status === 'Order Won');
         setWonLeads(won);
      }
    } catch (error) {
      console.error("Failed to load data", error);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const totalUnits = useMemo(() => {
    return formData.items.reduce((acc, curr) => acc + (Number(curr.qtyOrdered) || 0), 0);
  }, [formData.items]);

  // --- SYNC LOGIC ---
  const handleConvertLead = async (lead) => {
    setFormData(prev => ({ ...prev, customerName: lead.name, customerId: lead._id }));
    try {
        const res = await api.get('/sales/quotes'); 
        const matchedQuotes = res.data.filter(q => q.clientName === lead.name);
        setClientQuotes(matchedQuotes);
        if (matchedQuotes.length > 0) alert(`✅ Synced ${lead.name}! Found ${matchedQuotes.length} quotes.`);
        else alert(`✅ Synced ${lead.name}! No quotes found.`);
    } catch (e) { console.error("Quote fetch error", e); }
  };

  const handleApplyQuote = (quoteId) => {
    const selectedQuote = clientQuotes.find(q => q._id === quoteId);
    if (!selectedQuote) return;
    const mappedItems = selectedQuote.items.map(item => ({ productName: item.name, qtyOrdered: item.qty }));
    setFormData(prev => ({ ...prev, items: mappedItems }));
  };

  // --- FORM HANDLERS ---
  const handleHeaderChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };
  const addItem = () => setFormData((prev) => ({ ...prev, items: [...prev.items, { productName: "", qtyOrdered: 1 }] }));
  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  // --- SUBMIT ORDER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", msg: "" });
    
    try {
      const res = await api.post("/sales/orders", formData);
      if (res.data.success) {
        
        // Update Client Status to "Customer"
        if (formData.customerId) {
            try { await api.put(`/sales/clients/${formData.customerId}`, { status: 'Customer' }); } 
            catch (err) { console.error(err); }
        }

        setStatus({ type: "success", msg: `Order #${res.data.order.orderId} Created Successfully` });
        
        // Reset Form
        setFormData({
          customerName: "", customerId: "",
          deliveryDate: new Date().toISOString().split("T")[0],
          priority: "Medium", items: [{ productName: "", qtyOrdered: 1 }],
        });
        setClientQuotes([]);
        
        // 🟢 Refresh EVERYTHING (Table + Notifications)
        fetchAllData(); 
      }
    } catch (error) {
      setStatus({ type: "error", msg: error.response?.data?.msg || error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 p-6">
      
      {/* ========================================= */}
      {/* 🟢 TOP SECTION: CREATE ORDER FORM       */}
      {/* ========================================= */}
      <div>
        <div className="mb-6 border-b border-slate-200 pb-4">
            <h1 className="text-3xl font-extrabold text-slate-900">Sales Orders</h1>
            <p className="text-slate-500 mt-1 text-sm">Create new demand and view history.</p>
        </div>

        {/* Sync Notifications */}
        {wonLeads.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-sm mb-8">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span></span>
                    Pending Won Leads (Ready for Order)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wonLeads.map(lead => (
                        <div key={lead._id} className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex justify-between items-center hover:border-indigo-300 transition-all">
                            <div><p className="font-bold text-slate-800">{lead.name}</p><p className="text-xs text-slate-500 font-medium">Status: Won 🏆</p></div>
                            <button type="button" onClick={() => handleConvertLead(lead)} className="text-xs font-bold bg-slate-900 text-white px-3 py-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-1 shadow-lg shadow-indigo-100">Create Order <FiArrowDownCircle /></button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Status Message */}
        {status.msg && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium flex items-center shadow-sm ${status.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
            {status.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-50 p-6 rounded-3xl border border-slate-200">
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FiUser /> Client Details</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Customer Name</label>
                            <input type="text" name="customerName" value={formData.customerName} onChange={handleHeaderChange} className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="e.g. Acme Corp" required />
                        </div>
                        {clientQuotes.length > 0 && (
                            <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 animate-in fade-in">
                                <label className="block text-xs font-bold text-purple-700 uppercase tracking-wider mb-2 flex items-center gap-2"><FiFileText /> Link Quote</label>
                                <select onChange={(e) => handleApplyQuote(e.target.value)} className="w-full bg-white border-purple-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none"><option value="">-- Select --</option>{clientQuotes.map(q => <option key={q._id} value={q._id}>{q.subject} (₹{q.grandTotal})</option>)}</select>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Delivery Date</label>
                            <input type="date" name="deliveryDate" value={formData.deliveryDate} onChange={handleHeaderChange} className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Priority</label>
                            <div className="grid grid-cols-3 gap-2">{["Low", "Medium", "High"].map((p) => (<button key={p} type="button" onClick={() => setFormData({ ...formData, priority: p })} className={`py-2 text-sm font-medium rounded-lg border transition-all ${formData.priority === p ? p === "High" ? "bg-red-50 border-red-200 text-red-700 ring-1 ring-red-500" : "bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{p}</button>))}</div>
                        </div>
                    </div>
                </div>
                
                {/* Submit Block */}
                <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-end mb-6">
                        <div><div className="text-3xl font-bold">{formData.items.length}</div><div className="text-slate-400 text-sm">Unique Items</div></div>
                        <div className="text-right"><div className="text-3xl font-bold text-blue-300">{totalUnits}</div><div className="text-slate-400 text-sm">Total Units</div></div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-base shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all flex justify-center items-center gap-2">{loading ? "Processing..." : <><FiSave size={18} /> Confirm Order</>}</button>
                </div>
            </div>

            <div className="lg:col-span-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><FiBox /> Order Items</h3>
                        <button type="button" onClick={addItem} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 text-sm font-bold rounded-lg hover:bg-blue-100 transition-colors"><FiPlus /> Add Item</button>
                    </div>
                    <div className="space-y-3 flex-grow">
                        {formData.items.map((item, index) => (
                            <OrderItemRow key={index} index={index} item={item} onChange={handleItemChange} onRemove={removeItem} isOnlyItem={formData.items.length === 1} productList={products} />
                        ))}
                    </div>
                </div>
            </div>
        </form>
      </div>

      {/* ========================================= */}
      {/* 🟢 BOTTOM SECTION: ORDER HISTORY TABLE  */}
      {/* ========================================= */}
      <div className="border-t border-slate-200 pt-8">
        <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
            <FiClock className="text-slate-400" /> Recent Order History
        </h2>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Items</th>
                  <th className="p-4">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length > 0 ? (
                    orders.map((order) => (
                      <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-blue-600">{order.orderId}</td>
                        <td className="p-4 font-bold text-slate-800">{order.customerName}</td>
                        <td className="p-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold border ${
                            order.status === 'Production_Queued' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                            order.status === 'Ready_Dispatch' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {order.status === 'Production_Queued' ? <><FiClock className="inline mr-1"/> In Production</> : 
                             order.status === 'Ready_Dispatch' ? <><FiTruck className="inline mr-1"/> Ready</> : order.status}
                          </span>
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-slate-600">{order.items?.length || 0}</td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${
                                order.priority === 'High' ? 'bg-red-100 text-red-700' :
                                order.priority === 'Low' ? 'bg-slate-100 text-slate-600' :
                                'bg-blue-50 text-blue-700'
                            }`}>{order.priority}</span>
                        </td>
                      </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-400">
                            <div className="flex flex-col items-center gap-2">
                                <FiShoppingCart size={24} className="opacity-20" />
                                <p>No orders found. Create one above.</p>
                            </div>
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
        </div>
      </div>

    </div>
  );
}