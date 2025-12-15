'use client';
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { 
  FiSave, FiPlus, FiTrash2, FiUser, FiBox, 
  FiFileText, FiArrowLeft, FiCreditCard 
} from 'react-icons/fi';

export default function NewQuotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Data from DB
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Form State
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    clientAddress: '',
    clientGst: '',
    subject: '',
    salesPerson: 'Admin', // In real app, get from localStorage
    items: [{ name: '', description: '', qty: 1, rate: 0, gstPercent: 18 }],
    terms: {
      delivery: 'Schedule to be finalized at the time of PO.',
      payment: '45% Advance, Balance before Dispatch.',
      validity: '30 Days'
    }
  });

  // 1. Fetch Master Data (Clients & Products)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, productsRes] = await Promise.all([
          axios.get('http://localhost:2121/api/sales/clients'),
          axios.get('http://localhost:2121/api/products')
        ]);
        setClients(clientsRes.data);
        setProducts(productsRes.data);
        
        // Auto-fill logged in user
        const user = JSON.parse(localStorage.getItem('userInfo'));
        if(user) setFormData(prev => ({ ...prev, salesPerson: user.name }));

      } catch (error) {
        console.error("Error loading data", error);
      }
    };
    fetchData();
  }, []);

  // 2. Handle Client Selection (Auto-fill)
  const handleClientChange = (e) => {
    const selectedClient = clients.find(c => c._id === e.target.value);
    if (selectedClient) {
      setFormData(prev => ({
        ...prev,
        clientId: selectedClient._id,
        clientName: selectedClient.name,
        clientAddress: selectedClient.billToAddress || selectedClient.address,
        clientGst: selectedClient.gstNumber,
        // Optional: Auto-fill payment terms from client master if available
        terms: { ...prev.terms, payment: selectedClient.paymentTerms || prev.terms.payment }
      }));
    } else {
      // Reset if cleared
      setFormData(prev => ({ ...prev, clientId: '', clientName: '', clientAddress: '', clientGst: '' }));
    }
  };

  // 3. Handle Product Selection (Auto-fill Price)
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    
    // If Product Name changes, auto-fill details
    if (field === 'name') {
      const product = products.find(p => p.name === value);
      if (product) {
        newItems[index].description = `Category: ${product.category}`; // Default desc
        newItems[index].rate = product.sellingPrice || 0;
      }
    }

    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', description: '', qty: 1, rate: 0, gstPercent: 18 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  // 4. Calculate Totals (Memoized for performance)
  const totals = useMemo(() => {
    let subTotal = 0;
    let taxAmount = 0;
    
    formData.items.forEach(item => {
      const lineTotal = Number(item.qty) * Number(item.rate);
      subTotal += lineTotal;
      taxAmount += lineTotal * (Number(item.gstPercent) / 100);
    });

    return { subTotal, taxAmount, grandTotal: subTotal + taxAmount };
  }, [formData.items]);

  // 5. Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:2121/api/sales/quotes', formData);
      alert("✅ Quotation Generated Successfully!");
      router.push('/sales'); // Go back to Sales Hub
    } catch (error) {
      alert("Error: " + (error.response?.data?.msg || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
          <FiArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">New Quotation</h1>
          <p className="text-slate-500 text-sm">Create a price estimate for a client.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: CLIENT DETAILS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FiUser /></div>
            Client Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Client Selector */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Client</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                onChange={handleClientChange}
                required
              >
                <option value="">-- Choose from Client Master --</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>{client.name}</option>
                ))}
              </select>
            </div>

            {/* Read-Only Auto-Filled Fields */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Billing Address</label>
              <textarea 
                readOnly 
                value={formData.clientAddress} 
                className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-600 resize-none"
                rows="3"
              ></textarea>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">GST Number</label>
                <input 
                  type="text" 
                  readOnly 
                  value={formData.clientGst} 
                  className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-600" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject / Title</label>
                <input 
                  type="text" 
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder="e.g. Quote for 500kg Wire Fencing"
                  required 
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: ITEMS TABLE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><FiBox /></div>
              Line Items
            </h3>
            <button type="button" onClick={addItem} className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
              + Add Item
            </button>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-3 items-start border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                
                {/* Product Name (Dropdown + Search) */}
                <div className="flex-grow w-full md:w-1/3">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product</label>
                  <input 
                    list={`product-list-${index}`}
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Search product..."
                    required
                  />
                  <datalist id={`product-list-${index}`}>
                    {products.map(p => <option key={p._id} value={p.name} />)}
                  </datalist>
                </div>

                {/* Description */}
                <div className="w-full md:w-1/4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
                  <input 
                    type="text" 
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm"
                    placeholder="Details..."
                  />
                </div>

                {/* Qty & Rate */}
                <div className="w-24">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qty</label>
                  <input 
                    type="number" value={item.qty} min="1"
                    onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm text-center"
                    required
                  />
                </div>
                <div className="w-32">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rate (₹)</label>
                  <input 
                    type="number" value={item.rate} min="0" step="0.01"
                    onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm text-right"
                    required
                  />
                </div>
                
                {/* Total & Delete */}
                <div className="w-32 text-right">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total</label>
                  <div className="p-2 text-sm font-bold text-slate-700">
                    ₹{(item.qty * item.rate).toFixed(2)}
                  </div>
                </div>
                <div className="pt-6">
                  <button type="button" onClick={() => removeItem(index)} className="text-slate-400 hover:text-red-500">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Grand Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-64 space-y-2 border-t border-slate-200 pt-4">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span>₹{totals.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>GST (18%)</span>
                <span>₹{totals.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Total</span>
                <span>₹{totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: TERMS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><FiFileText /></div>
            Terms & Conditions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Terms</label>
              <input 
                type="text" 
                value={formData.terms.payment}
                onChange={(e) => setFormData({...formData, terms: {...formData.terms, payment: e.target.value}})}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Delivery Schedule</label>
              <input 
                type="text" 
                value={formData.terms.delivery}
                onChange={(e) => setFormData({...formData, terms: {...formData.terms, delivery: e.target.value}})}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price Validity</label>
              <input 
                type="text" 
                value={formData.terms.validity}
                onChange={(e) => setFormData({...formData, terms: {...formData.terms, validity: e.target.value}})}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium" 
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="bottom-4 z-10">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-black transition-all active:scale-[0.99] flex justify-center items-center gap-2"
          >
            {loading ? 'Generating Quote...' : <><FiSave size={20} /> Generate Quotation PDF</>}
          </button>
        </div>

      </form>
    </div>
  );
}