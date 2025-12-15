'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FiCalendar, FiFileText, FiSave, FiArrowLeft, FiTag } from 'react-icons/fi';
import { FaRupeeSign } from "react-icons/fa";

export default function NewExpensePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Auto-fill Sales Person
  const [user, setUser] = useState({ name: 'Sales Person' });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Travel',
    amount: '',
    description: ''
  });

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo) setUser(userInfo);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('http://localhost:2121/api/sales/expenses', {
        ...formData,
        salesPerson: user.name
      });
      alert("✅ Expense Logged Successfully!");
      router.push('/sales'); // Go back to Hub
    } catch (error) {
      alert("Error: " + (error.response?.data?.msg || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
          <FiArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Log Expense</h1>
          <p className="text-slate-500 text-sm">Submit a claim for reimbursement.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        
        {/* Date */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expense Date</label>
          <div className="relative">
            <FiCalendar className="absolute left-3 top-3.5 text-slate-400" />
            <input 
              type="date" name="date" required
              value={formData.date}
              onChange={handleChange}
              className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Category & Amount */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
            <div className="relative">
              <FiTag className="absolute left-3 top-3.5 text-slate-400" />
              <select 
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none appearance-none"
              >
                <option>Travel</option>
                <option>Food</option>
                <option>Lodging</option>
                <option>Fuel</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount (₹)</label>
            <div className="relative">
              <FiDollarSign className="absolute left-3 top-3.5 text-slate-400" />
              <input 
                type="number" name="amount" required min="1"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
                className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description / Client Name</label>
          <div className="relative">
            <FiFileText className="absolute left-3 top-3.5 text-slate-400" />
            <input 
              type="text" name="description" required
              placeholder="e.g. Lunch with Client X"
              value={formData.description}
              onChange={handleChange}
              className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Submit */}
        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-transform active:scale-[0.98] flex justify-center items-center gap-2"
        >
          {loading ? 'Submitting...' : <><FiSave /> Submit Claim</>}
        </button>

      </form>
    </div>
  );
}