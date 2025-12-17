"use client";
import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import api from "@/utils/api";
import {
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiPackage,
  FiCalendar,
  FiUser,
  FiMinus,
  FiSave,
  FiAlertCircle,
  FiSearch,
  FiArrowDownCircle, 
  FiFileText         
} from "react-icons/fi";

// --- Sub-Component: Order Item Row ---
const OrderItemRow = ({
  index,
  item,
  onChange,
  onRemove,
  isOnlyItem,
  productList,
}) => {
  return (
    <div className="group flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm transition-all hover:shadow-md hover:border-blue-300 relative">
      <span className="hidden sm:flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500 font-mono">
        {index + 1}
      </span>
      <div className="flex-grow w-full sm:w-auto relative">
        <label className="sr-only">Product Name</label>
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
        <button
          type="button"
          onClick={() =>
            onChange(
              index,
              "qtyOrdered",
              Math.max(1, Number(item.qtyOrdered) - 1)
            )
          }
          className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border-r border-slate-200"
        >
          <FiMinus size={14} />
        </button>
        <input
          type="number"
          value={item.qtyOrdered}
          onChange={(e) =>
            onChange(index, "qtyOrdered", Number(e.target.value))
          }
          className="w-16 text-center border-none bg-white p-0 text-sm font-semibold text-slate-700 focus:ring-0 appearance-none"
          min="1"
          required
        />
        <button
          type="button"
          onClick={() =>
            onChange(index, "qtyOrdered", Number(item.qtyOrdered) + 1)
          }
          className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border-l border-slate-200"
        >
          <FiPlus size={14} />
        </button>
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        disabled={isOnlyItem}
        className={`p-2 rounded-lg transition-colors ml-0 sm:ml-2 ${
          isOnlyItem
            ? "text-slate-200 cursor-not-allowed"
            : "text-slate-400 hover:text-red-600 hover:bg-red-50"
        }`}
      >
        <FiTrash2 size={18} />
      </button>
    </div>
  );
};

export default function NewOrderPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [products, setProducts] = useState([]);
  
  // 🟢 SYNC STATES
  const [wonLeads, setWonLeads] = useState([]); 
  const [clientQuotes, setClientQuotes] = useState([]); 

  const [formData, setFormData] = useState({
    customerName: "",
    customerId: "", // 🟢 This ID is critical for the status update
    deliveryDate: new Date().toISOString().split("T")[0],
    priority: "Medium",
    items: [{ productName: "", qtyOrdered: 1 }],
  });

  // 1. Fetch Data
  const fetchInitData = async () => {
    try {
      const [prodRes, leadsRes] = await Promise.all([
        api.get("/products"),
        api.get("/sales/clients") // Fetching clients/leads
      ]);
      setProducts(prodRes.data);
      
      if (leadsRes.data) {
         // 🟢 FILTER: Only show leads that are "Order Won"
         const won = leadsRes.data.filter(l => l.status === 'Order Won');
         setWonLeads(won);
      }
    } catch (error) {
      console.error("Failed to load data", error);
    }
  };

  useEffect(() => {
    fetchInitData();
  }, []);

  const totalUnits = useMemo(() => {
    return formData.items.reduce(
      (acc, curr) => acc + (Number(curr.qtyOrdered) || 0),
      0
    );
  }, [formData.items]);

  // 🟢 SYNC LEAD -> ORDER FORM
  const handleConvertLead = async (lead) => {
    // Save the ID so we know which client to update later
    setFormData(prev => ({ 
        ...prev, 
        customerName: lead.name,
        customerId: lead._id 
    }));
    
    // Fetch quotes for this client
    try {
        const res = await api.get('/sales/quotes'); 
        const matchedQuotes = res.data.filter(q => q.clientName === lead.name);
        setClientQuotes(matchedQuotes);
        
        if (matchedQuotes.length > 0) {
            alert(`✅ Synced ${lead.name}! Found ${matchedQuotes.length} quotation(s).`);
        } else {
            alert(`✅ Synced ${lead.name}! No quotations found.`);
        }
    } catch (e) { console.error("Quote fetch error", e); }
  };

  // 🟢 SYNC QUOTE -> ORDER ITEMS
  const handleApplyQuote = (quoteId) => {
    const selectedQuote = clientQuotes.find(q => q._id === quoteId);
    if (!selectedQuote) return;

    const mappedItems = selectedQuote.items.map(item => ({
        productName: item.name,
        qtyOrdered: item.qty
    }));

    setFormData(prev => ({ ...prev, items: mappedItems }));
  };

  const handleHeaderChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };
  const addItem = () =>
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { productName: "", qtyOrdered: 1 }],
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
      // 1. Create the Order
      const res = await api.post("/sales/orders", formData);
      
      if (res.data.success) {
        
        // 🟢 2. AUTO-UPDATE CLIENT STATUS TO "Customer"
        if (formData.customerId) {
            try {
                // Update status from 'Order Won' -> 'Customer'
                await api.put(`/sales/clients/${formData.customerId}`, { 
                    status: 'Customer' 
                });
                
                // 🟢 3. REFRESH DATA IMMEDIATELY
                // This makes the notification disappear instantly
                await fetchInitData();
                
            } catch (err) {
                console.error("Failed to update client status", err);
            }
        }

        setStatus({
          type: "success",
          msg: `Order #${res.data.order.orderId} Created Successfully`,
        });
        
        // Reset Form
        setFormData({
          customerName: "",
          customerId: "",
          deliveryDate: new Date().toISOString().split("T")[0],
          priority: "Medium",
          items: [{ productName: "", qtyOrdered: 1 }],
        });
        setClientQuotes([]); // Clear quotes
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      setStatus({
        type: "error",
        msg: error.response?.data?.msg || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-6">
      
      {/* 🟢 NOTIFICATION SECTION (Will disappear after submit) */}
      {wonLeads.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
                Pending Won Leads (Ready for Order)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wonLeads.map(lead => (
                    <div key={lead._id} className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex justify-between items-center hover:border-indigo-300 transition-all">
                        <div>
                            <p className="font-bold text-slate-800">{lead.name}</p>
                            <p className="text-xs text-slate-500 font-medium">Status: Won 🏆</p>
                        </div>
                        <button 
                            type="button"
                            onClick={() => handleConvertLead(lead)}
                            className="text-xs font-bold bg-slate-900 text-white px-3 py-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-1 shadow-lg shadow-indigo-100"
                        >
                            Create Order <FiArrowDownCircle />
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            New Sales Order
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-lg">
            Generate a new demand order.
          </p>
        </div>
        {status.msg && (
          <div
            className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center shadow-sm ${
              status.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            {status.type === "success" ? (
              <FiCheckCircle className="mr-2 text-lg" />
            ) : (
              <FiAlertCircle className="mr-2 text-lg" />
            )}{" "}
            {status.msg}
          </div>
        )}
      </header>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="group mb-5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Customer Name
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleHeaderChange}
                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                placeholder="e.g. Acme Corp"
                required
              />
            </div>
            
            {/* 🟢 NEW: LINK QUOTATION DROPDOWN */}
            {clientQuotes.length > 0 && (
                <div className="mb-5 bg-purple-50 p-4 rounded-xl border border-purple-100 animate-in fade-in">
                    <label className="block text-xs font-bold text-purple-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <FiFileText /> Link Quotation (Auto-Fill)
                    </label>
                    <select 
                        onChange={(e) => handleApplyQuote(e.target.value)}
                        className="w-full bg-white border-purple-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-200"
                    >
                        <option value="">-- Select a Quote --</option>
                        {clientQuotes.map(q => (
                            <option key={q._id} value={q._id}>
                                {q.subject} (₹{q.grandTotal})
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="group mb-5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Delivery Date
              </label>
              <input
                type="date"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleHeaderChange}
                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                required
              />
            </div>
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Low", "Medium", "High"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={`py-2 text-sm font-medium rounded-lg border transition-all ${
                      formData.priority === p
                        ? p === "High"
                          ? "bg-red-50 border-red-200 text-red-700 ring-1 ring-red-500"
                          : "bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg sticky top-6">
            <h4 className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-4">
              Order Summary
            </h4>
            <div className="flex justify-between items-end mb-6">
              <div>
                <div className="text-3xl font-bold">
                  {formData.items.length}
                </div>
                <div className="text-slate-400 text-sm">Unique Products</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-300">
                  {totalUnits}
                </div>
                <div className="text-slate-400 text-sm">Total Units</div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-base shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  <FiSave size={18} /> Confirm Order
                </>
              )}
            </button>
          </div>
        </div>
        <div className="lg:col-span-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 min-h-[600px] flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg mr-3">
                  <FiPackage size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Order Items</h3>
                  <p className="text-xs text-slate-400">
                    Search for products from your Master List.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="group flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-all hover:pr-6"
              >
                <FiPlus className="transition-transform group-hover:rotate-90" />{" "}
                Add Item
              </button>
            </div>
            <div className="space-y-4 flex-grow">
              {formData.items.map((item, index) => (
                <OrderItemRow
                  key={index}
                  index={index}
                  item={item}
                  onChange={handleItemChange}
                  onRemove={removeItem}
                  isOnlyItem={formData.items.length === 1}
                  productList={products}
                />
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}