"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import {
  FiPlus, FiTrash2, FiSave, FiArrowLeft, FiCalendar, FiTag, FiFileText, FiCheckCircle, FiHome
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";

export default function NewExpensePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); // 🟢 Popup State
  const [user, setUser] = useState({ name: "Sales Person" });

  const [rows, setRows] = useState([
    {
      id: 1,
      date: new Date().toISOString().split("T")[0],
      category: "Travel",
      description: "",
      amount: ""
    }
  ]);

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) setUser(JSON.parse(userInfo));
  }, []);

  const addRow = () => {
    setRows([...rows, { id: Date.now(), date: new Date().toISOString().split("T")[0], category: "Travel", description: "", amount: "" }]);
  };

  const removeRow = (id) => {
    if (rows.length === 1) return;
    setRows(rows.filter((r) => r.id !== id));
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const totalAmount = useMemo(() => {
    return rows.reduce((acc, row) => acc + (Number(row.amount) || 0), 0);
  }, [rows]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = rows.map(({ id, ...rest }) => ({
        ...rest,
        amount: Number(rest.amount),
        salesPerson: user.name
      }));

      await api.post("/sales/expenses", payload);
      
      // 🟢 Show Success Popup instead of alert
      setShowSuccess(true); 
    } catch (error) {
      alert("Error: " + (error.response?.data?.msg || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20 p-6 relative">
      
      {/* 🟢 SUCCESS POPUP MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheckCircle size={48} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Submitted!</h2>
            <p className="text-slate-500 mb-6">
              Your expense claims totaling <span className="font-bold text-slate-800">₹{totalAmount.toLocaleString()}</span> have been sent for approval.
            </p>
            <div className="space-y-3">
                <button 
                    onClick={() => router.push("/sales/")}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all"
                >
                    <FiHome /> Back to Dashboard
                </button>
                <button 
                    onClick={() => {
                        setRows([{ id: 1, date: new Date().toISOString().split("T")[0], category: "Travel", description: "", amount: "" }]);
                        setShowSuccess(false);
                    }}
                    className="w-full py-3 text-slate-500 font-semibold hover:text-slate-800 transition-colors"
                >
                    Log More Expenses
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
            <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Log Expenses</h1>
            <p className="text-slate-500 text-sm">Submit multiple claims in one go.</p>
            </div>
        </div>
        <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-slate-400 uppercase">Claiming As</p>
            <p className="text-lg font-bold text-blue-600">{user.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* EXPENSE GRID */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 bg-slate-50 p-4 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-5">Description / Client</div>
                <div className="col-span-2 text-right">Amount (₹)</div>
                <div className="col-span-1 text-center">Action</div>
            </div>

            <div className="divide-y divide-slate-100">
                {rows.map((row) => (
                    <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-start hover:bg-slate-50/50 transition-colors group">
                        {/* Date */}
                        <div className="col-span-12 md:col-span-2">
                            <label className="md:hidden text-[10px] font-bold text-slate-400 uppercase mb-1 block">Date</label>
                            <input 
                                type="date" 
                                value={row.date}
                                onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                                required
                            />
                        </div>

                        {/* Category */}
                        <div className="col-span-12 md:col-span-2">
                            <label className="md:hidden text-[10px] font-bold text-slate-400 uppercase mb-1 block">Category</label>
                            <select 
                                value={row.category}
                                onChange={(e) => updateRow(row.id, 'category', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                            >
                                <option>Travel</option><option>Food</option><option>Lodging</option><option>Fuel</option><option>Other</option>
                            </select>
                        </div>

                        {/* Description */}
                        <div className="col-span-12 md:col-span-5">
                            <label className="md:hidden text-[10px] font-bold text-slate-400 uppercase mb-1 block">Description</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Lunch with Client"
                                value={row.description}
                                onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
                                required
                            />
                        </div>

                        {/* Amount */}
                        <div className="col-span-6 md:col-span-2">
                            <label className="md:hidden text-[10px] font-bold text-slate-400 uppercase mb-1 block">Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-slate-400 text-xs">₹</span>
                                <input 
                                    type="number" min="1"
                                    value={row.amount}
                                    onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                                    className="w-full bg-emerald-50 border border-emerald-100 rounded-lg pl-6 pr-3 py-2 text-sm font-bold text-emerald-900 text-right outline-none focus:ring-2 focus:ring-emerald-200"
                                    required
                                />
                            </div>
                        </div>

                        {/* Delete Action */}
                        <div className="col-span-6 md:col-span-1 flex justify-center pt-1">
                            <button 
                                type="button"
                                onClick={() => removeRow(row.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-0"
                                disabled={rows.length === 1}
                            >
                                <FiTrash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-center">
                <button type="button" onClick={addRow} className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-white px-4 py-2 rounded-full border border-blue-100 shadow-sm hover:bg-blue-50 transition-all">
                    <FiPlus /> Add Another Line
                </button>
            </div>
        </div>

        {/* SUMMARY & SUBMIT */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mt-8">
            <div className="bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-xl flex items-center gap-4 w-full md:w-auto">
                <div className="p-3 bg-white/10 rounded-xl"><FaRupeeSign size={24} /></div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Claim</p>
                    <p className="text-3xl font-black">₹{totalAmount.toLocaleString()}</p>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading || totalAmount <= 0}
                className="w-full md:w-auto px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-2xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
                {loading ? 'Submitting...' : <><FiSave /> Submit All Claims</>}
            </button>
        </div>
      </form>
    </div>
  );
}