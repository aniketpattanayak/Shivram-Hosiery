"use client";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import ProductionFunnel from "@/components/ProductionFunnel";
import { FiDollarSign, FiActivity, FiTruck, FiUsers, FiBarChart } from "react-icons/fi";

export default function CommandCenter() {
  const [activeTab, setActiveTab] = useState("SALES");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await api.get("/analytics/command-center");
        setData(res.data);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) return <div className="p-20 text-center font-black text-[10px] uppercase">Booting Command Center...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Factory Control Tower</h1>
        {/* TAB NAVIGATOR */}
        <div className="flex gap-4 mt-6 bg-slate-200 p-1.5 rounded-2xl w-fit">
          {["SALES", "PRODUCTION", "VENDOR", "USER"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? "bg-white text-blue-600 shadow-xl" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab} Dashboard
            </button>
          ))}
        </div>
      </div>

      {/* RENDER DYNAMIC TABS */}
      <div className="animate-in fade-in duration-500">
        
        {/* 📈 SALES TAB */}
        {activeTab === "SALES" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {data.sales.map((item, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item._id}</p>
                   <h2 className="text-2xl font-black text-slate-900 mt-2">₹{item.revenue.toLocaleString()}</h2>
                   <div className="mt-4 pt-4 border-t text-[10px] font-bold text-emerald-600 uppercase">
                     {(item.fulfillmentRate * 100).toFixed(1)}% Fulfillment
                   </div>
                </div>
             ))}
          </div>
        )}

        {/* 🏭 PRODUCTION TAB */}
        {activeTab === "PRODUCTION" && (
          <ProductionFunnel jobs={data.production} />
        )}

        {/* 🚚 VENDOR TAB */}
        {activeTab === "VENDOR" && (
          <div className="bg-white rounded-3xl border shadow-xl overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                   <tr><th className="p-6">Vendor</th><th className="p-6">Units Produced</th><th className="p-6">Rejection %</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {data.vendor.map((v, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                         <td className="p-6 font-bold text-slate-800">{v._id || "In-House"}</td>
                         <td className="p-6 font-black">{v.totalProduced}</td>
                         <td className="p-6 font-black text-red-600">{(v.rejectionRate * 100).toFixed(1)}%</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}

        {/* 👥 USER TAB */}
        {activeTab === "USER" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             {data.users.map((u, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
                   <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <FiUsers size={20} />
                   </div>
                   <h4 className="font-black text-slate-900 text-sm">{u._id || "System User"}</h4>
                   <p className="text-[10px] font-black text-slate-400 uppercase mt-2">{u.totalActions} System Actions</p>
                </div>
             ))}
          </div>
        )}

      </div>
    </div>
  );
}