'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FiUser, FiMapPin, FiPhone, FiBox, FiSave, FiArrowLeft } from 'react-icons/fi';
import { FaRupeeSign } from "react-icons/fa";
import api from '@/utils/api';

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  
  // Auto-fill Sales Person from logged-in user
  const [user, setUser] = useState({ name: 'Sales Person' });

  const [formData, setFormData] = useState({
    clientName: '',
    contactPerson: '',
    phone: '',
    location: '',
    productCategory: '',
    selectedItem: '',
    expectedQuantity: '',
    offerRate: '',
    status: 'New'
  });

  useEffect(() => {
    // 1. Get User Info
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo) setUser(userInfo);

    // 2. Fetch Products (for Dropdown)
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data);
      } catch (err) { console.error(err); }
    };
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/sales/leads', {
        ...formData,
        salesPerson: user.name
      });
      alert("✅ Lead Added Successfully!");
      router.push('/sales'); // Go back to Sales Hub
    } catch (error) {
      alert("Error: " + (error.response?.data?.msg || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Get Unique Categories for Dropdown
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  
  // Filter Items based on selected Category
  const availableItems = products
    .filter(p => !formData.productCategory || p.category === formData.productCategory)
    .map(p => p.name);

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
          <FiArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Add New Lead</h1>
          <p className="text-slate-500 text-sm">Log a new customer inquiry.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Client Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FiUser /></div>
            Client Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company / Client Name</label>
              <input 
                type="text" name="clientName" required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                placeholder="e.g. Reliance Infra"
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Person</label>
              <input 
                type="text" name="contactPerson"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                placeholder="e.g. Mr. Sharma"
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-3.5 text-slate-400" />
                <input 
                  type="tel" name="phone" required
                  className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder="9876543210"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location / City</label>
              <div className="relative">
                <FiMapPin className="absolute left-3 top-3.5 text-slate-400" />
                <input 
                  type="text" name="location" required
                  className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder="e.g. Mumbai, Maharashtra"
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Requirement */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><FiBox /></div>
            Requirement Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Product Category</label>
              <select 
                name="productCategory"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                onChange={handleChange}
              >
                <option value="">Select Category...</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Interested Item</label>
              <input 
                list="items-list" 
                name="selectedItem"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                placeholder="Type to search..."
                onChange={handleChange}
              />
              <datalist id="items-list">
                {availableItems.map(item => <option key={item} value={item} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expected Quantity</label>
              <input 
                type="text" name="expectedQuantity" required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                placeholder="e.g. 500 Kg"
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Rate (Offer)</label>
              <div className="relative">
                <FaRupeeSign className="absolute left-3 top-3.5 text-slate-400" />
                <input 
                  type="text" name="offerRate" required
                  className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder="e.g. 85.00"
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button 
            type="button" 
            onClick={() => router.back()}
            className="flex-1 py-4 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-transform active:scale-[0.98] flex justify-center items-center gap-2"
          >
            {loading ? 'Saving...' : <><FiSave /> Save Lead</>}
          </button>
        </div>

      </form>
    </div>
  );
}