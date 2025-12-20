"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import AuthGuard from '@/components/AuthGuard';
import {
  FiPlus, FiTrash2, FiSave, FiUser, FiBox, 
  FiArrowLeft, FiCheckCircle, FiAlertCircle, 
  FiArrowDownCircle, FiClock, FiTruck, FiShoppingCart
} from "react-icons/fi";

// SUB-COMPONENT: DETAILED ITEM CARD
const OrderItemCard = ({ index, item, onChange, onRemove, productList }) => {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 relative group transition-all hover:shadow-md hover:border-blue-300">
      
      {/* Delete Button */}
      <button 
        type="button" 
        onClick={() => onRemove(index)}
        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
        title="Remove Item"
      >
        <FiTrash2 />
      </button>

      {/* Row 1: Product Search */}
      <div className="mb-4 pr-10">
        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Product Name</label>
        <input
          list={`product-list-${index}`}
          type="text"
          value={item.productName}
          onChange={(e) => onChange(index, "productName", e.target.value)}
          placeholder="Search Product Master..."
          className="w-full bg-white border border-slate-300 text-slate-900 font-bold text-lg rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none placeholder:font-normal placeholder:text-slate-300"
          required
        />
        <datalist id={`product-list-${index}`}>
          {productList.map((prod) => (
            <option key={prod._id} value={prod.name}>
              {prod.sku} | Price: ₹{prod.sellingPrice || 0}
            </option>
          ))}
        </datalist>
      </div>

      {/* Row 2: Specs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
            <div className="bg-slate-200/50 text-slate-600 font-medium text-xs px-3 py-2 rounded-lg border border-slate-200 h-9 flex items-center">
                {item.category || '-'}
            </div>
        </div>
        <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Sub-Cat</label>
            <div className="bg-slate-200/50 text-slate-600 font-medium text-xs px-3 py-2 rounded-lg border border-slate-200 h-9 flex items-center">
                {item.subCategory || '-'}
            </div>
        </div>
        <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Fabric</label>
            <div className="bg-slate-200/50 text-slate-600 font-medium text-xs px-3 py-2 rounded-lg border border-slate-200 h-9 flex items-center">
                {item.fabricType || '-'}
            </div>
        </div>
        <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Color</label>
            <div className="bg-slate-200/50 text-slate-600 font-medium text-xs px-3 py-2 rounded-lg border border-slate-200 h-9 flex items-center">
                {item.color || '-'}
            </div>
        </div>
      </div>

      {/* Row 3: Commercials */}
      <div className="flex items-end gap-4 border-t border-slate-200 pt-4">
        <div className="w-32">
            <label className="text-[10px] font-bold text-blue-600 uppercase mb-1 block">Quantity</label>
            <input 
                type="number" min="1"
                value={item.qtyOrdered}
                onChange={(e) => onChange(index, "qtyOrdered", Number(e.target.value))}
                className="w-full bg-white border border-blue-200 text-slate-900 font-bold text-center rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
        </div>
        <div className="w-32">
            <label className="text-[10px] font-bold text-emerald-600 uppercase mb-1 block">Rate (₹)</label>
            <input 
                type="number" min="0"
                value={item.unitPrice}
                onChange={(e) => onChange(index, "unitPrice", Number(e.target.value))}
                className="w-full bg-white border border-emerald-200 text-slate-900 font-bold text-right rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
        </div>
        <div className="flex-grow text-right pb-2">
            <span className="text-xs font-bold text-slate-400 uppercase mr-2">Line Total</span>
            <span className="text-lg font-black text-slate-800">
                ₹{((item.qtyOrdered || 0) * (item.unitPrice || 0)).toLocaleString()}
            </span>
        </div>
      </div>
    </div>
  );
};

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });
  
  // Data
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [wonLeads, setWonLeads] = useState([]);
  const [clientQuotes, setClientQuotes] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    customerName: "",
    customerId: "", 
    deliveryDate: new Date().toISOString().split("T")[0],
    priority: "Medium",
    items: [
        { productName: "", category: "", subCategory: "", fabricType: "", color: "", qtyOrdered: 1, unitPrice: 0 }
    ], 
  });

  const fetchInitData = async () => {
    try {
      const [prodRes, leadsRes, ordersRes] = await Promise.all([
        api.get("/products"),
        api.get("/sales/clients"),
        api.get("/sales/orders")
      ]);
      setProducts(prodRes.data);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      if (leadsRes.data) {
         const won = leadsRes.data.filter(l => l.status === 'Order Won');
         setWonLeads(won);
      }
    } catch (error) { console.error("Data load error", error); }
  };

  useEffect(() => { fetchInitData(); }, []);

  const financials = useMemo(() => {
    const subTotal = formData.items.reduce((acc, item) => acc + ((item.qtyOrdered || 0) * (item.unitPrice || 0)), 0);
    const taxAmount = subTotal * 0.18; 
    const grandTotal = subTotal + taxAmount;
    return { subTotal, taxAmount, grandTotal };
  }, [formData.items]);

  // --- HANDLERS ---
  const handleConvertLead = async (lead) => {
    setFormData(prev => ({ ...prev, customerName: lead.name, customerId: lead._id }));
    try {
        const res = await api.get('/sales/quotes'); 
        const matchedQuotes = res.data.filter(q => q.clientName === lead.name);
        setClientQuotes(matchedQuotes);
        alert(matchedQuotes.length > 0 ? `✅ Linked ${lead.name}. Found Quotes.` : `✅ Linked ${lead.name}. No Quotes found.`);
    } catch (e) { console.error(e); }
  };

  const handleApplyQuote = (quoteId) => {
    const selectedQuote = clientQuotes.find(q => q._id === quoteId);
    if (!selectedQuote) return;
    const mappedItems = selectedQuote.items.map(qItem => {
        const productMaster = products.find(p => p.name === qItem.name);
        return {
            productName: qItem.name,
            qtyOrdered: qItem.qty,
            unitPrice: qItem.rate,
            category: productMaster?.category || "",
            subCategory: productMaster?.subCategory || "",
            fabricType: productMaster?.fabricType || "",
            color: productMaster?.color || ""
        };
    });
    setFormData(prev => ({ ...prev, items: mappedItems }));
  };

  const handleHeaderChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    if (field === 'productName') {
        const product = products.find(p => p.name === value);
        if (product) {
            newItems[index].category = product.category || "";
            newItems[index].subCategory = product.subCategory || "";
            newItems[index].fabricType = product.fabricType || "";
            newItems[index].color = product.color || "";
            newItems[index].unitPrice = product.sellingPrice || 0;
        }
    }
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => setFormData(prev => ({ 
      ...prev, items: [...prev.items, { productName: "", qtyOrdered: 1, unitPrice: 0 }] 
  }));

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", msg: "" });

    try {
      const res = await api.post("/sales/orders", formData);
      if (res.data.success) {
        if (formData.customerId) {
            try { await api.put(`/sales/clients/${formData.customerId}`, { status: 'Customer' }); } catch (e) {}
        }
        alert(`✅ Order #${res.data.order.orderId} Created!`);
        
        // Reset Form & Refresh History
        setFormData({
          customerName: "", customerId: "",
          deliveryDate: new Date().toISOString().split("T")[0],
          priority: "Medium",
          items: [{ productName: "", category: "", subCategory: "", fabricType: "", color: "", qtyOrdered: 1, unitPrice: 0 }],
        });
        setClientQuotes([]);
        fetchInitData();
      }
    } catch (error) {
      setStatus({ type: "error", msg: error.response?.data?.msg || error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard requiredPermission="sales_orders">
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20 p-6">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Sales Order Entry</h1>
          <p className="text-slate-500 text-sm">Generate new demand and view history.</p>
        </div>
      </div>

      {/* Notifications */}
      {wonLeads.length > 0 && (
        <div className="mb-8 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-wrap gap-4 items-center">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> Won Leads:
            </span>
            {wonLeads.map(lead => (
                <button key={lead._id} onClick={() => handleConvertLead(lead)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg hover:shadow-md transition-all">
                    {lead.name} <FiArrowDownCircle />
                </button>
            ))}
        </div>
      )}

      {status.msg && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${status.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {status.type === 'error' ? <FiAlertCircle size={18}/> : <FiCheckCircle size={18}/>} {status.msg}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Customer Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FiUser /></div> Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer Name</label>
                    <input 
                        type="text" name="customerName" 
                        value={formData.customerName} onChange={handleHeaderChange}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                        required placeholder="e.g. Reliance Retail"
                    />
                </div>
                
                {clientQuotes.length > 0 ? (
                    <div>
                        <label className="block text-xs font-bold text-purple-600 uppercase mb-1">Link Quotation</label>
                        <select onChange={(e) => handleApplyQuote(e.target.value)} className="w-full p-3 bg-purple-50 border border-purple-200 rounded-xl font-bold text-purple-800 focus:ring-2 focus:ring-purple-200 outline-none">
                            <option value="">-- Select Approved Quote --</option>
                            {clientQuotes.map(q => <option key={q._id} value={q._id}>{q.subject} (₹{q.grandTotal})</option>)}
                        </select>
                    </div>
                ) : (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Delivery Date</label>
                        <input 
                            type="date" name="deliveryDate"
                            value={formData.deliveryDate} onChange={handleHeaderChange}
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-100 outline-none"
                            required
                        />
                    </div>
                )}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priority</label>
                    <div className="flex bg-slate-100 rounded-xl p-1">
                        {['Low', 'Medium', 'High'].map(p => (
                            <button key={p} type="button" onClick={() => setFormData({...formData, priority: p})} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.priority === p ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>{p}</button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Items Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><FiBox /></div> Order Items
                </h3>
                <button type="button" onClick={addItem} className="text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors flex items-center gap-2"><FiPlus /> Add Item</button>
            </div>
            <div className="space-y-4">
                {formData.items.map((item, index) => (
                    <OrderItemCard key={index} index={index} item={item} onChange={handleItemChange} onRemove={removeItem} productList={products} />
                ))}
            </div>
        </div>

        {/* Financials */}
        <div className="flex justify-end">
            <div className="w-full md:w-80 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between text-sm font-medium text-slate-500"><span>Subtotal</span><span>₹{financials.subTotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm font-medium text-slate-500"><span>GST (18%)</span><span>₹{financials.taxAmount.toLocaleString()}</span></div>
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center"><span className="font-bold text-slate-800">Grand Total</span><span className="text-2xl font-black text-slate-900">₹{financials.grandTotal.toLocaleString()}</span></div>
            </div>
        </div>

        {/* Submit */}
        <div className="pt-4">
            <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 text-white font-bold text-lg rounded-2xl shadow-xl hover:bg-black transition-transform active:scale-[0.99] flex justify-center items-center gap-3">
                {loading ? 'Processing...' : <><FiSave /> Confirm Sales Order</>}
            </button>
        </div>
      </form>

      {/* HISTORY TABLE */}
      <div className="border-t border-slate-200 pt-10 mt-10">
        <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
            <FiClock className="text-slate-400" /> Recent Order History
        </h2>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Items</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4 text-right">Total</th>
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
                        <td className="p-4 font-bold text-slate-900 text-right">₹{order.grandTotal ? order.grandTotal.toLocaleString() : '0'}</td>
                      </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-400">
                            <div className="flex flex-col items-center gap-2">
                                <FiShoppingCart size={24} className="opacity-20" />
                                <p>No orders found.</p>
                            </div>
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
        </div>
      </div>

    </div>
    </AuthGuard>
  );
}