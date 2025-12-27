'use client';
import { useState, useEffect } from 'react';
import api from '@/utils/api';
import AuthGuard from '@/components/AuthGuard';
import { FiTrendingUp, FiAlertCircle, FiUser, FiBarChart2, FiCalendar } from 'react-icons/fi';

export default function EfficiencyReport() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        // This endpoint will aggregate data from JobCards
        const res = await api.get('/reports/vendor-efficiency');
        setReportData(res.data);
      } catch (err) {
        console.error("Report Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  return (
    <AuthGuard requiredPermission="analytics">
      <div className="p-8 bg-slate-50 min-h-screen">
        
        {/* Header Section */}
        <div className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Material Accountability Report</h1>
            <p className="text-slate-500 font-medium mt-1">Comparing vendor production output vs. material wastage</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
              <FiCalendar className="text-blue-600" />
              <span className="text-sm font-bold text-slate-700">Dec 2025</span>
            </div>
          </div>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><FiBarChart2 size={24}/></div>
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+12% vs last month</span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Avg. Factory Wastage</p>
            <h2 className="text-3xl font-black text-slate-900 mt-1">2.4%</h2>
          </div>
        </div>

        {/* The Efficiency Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-6">Vendor Name</th>
                <th className="p-6">Total Produced</th>
                <th className="p-6">Total Wastage (KG)</th>
                <th className="p-6">Efficiency Rate</th>
                <th className="p-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="p-20 text-center text-slate-400">Calculating vendor metrics...</td></tr>
              ) : reportData.map((vendor, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                        <FiUser />
                      </div>
                      <span className="font-bold text-slate-800">{vendor.name}</span>
                    </div>
                  </td>
                  <td className="p-6 font-black text-slate-900">{vendor.totalProduced} <span className="text-[10px] text-slate-400">PCS</span></td>
                  <td className="p-6 font-black text-red-600">{vendor.totalWastage.toFixed(2)} <span className="text-[10px]">KG</span></td>
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden max-w-[100px]">
                        <div 
                          className={`h-full rounded-full ${vendor.efficiency > 95 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${vendor.efficiency}%` }}
                        ></div>
                      </div>
                      <span className="font-black text-slate-800 text-sm">{vendor.efficiency}%</span>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    {vendor.efficiency < 90 ? (
                      <span className="inline-flex items-center gap-1 text-red-600 font-black text-[10px] uppercase bg-red-50 px-3 py-1 rounded-full border border-red-100">
                        <FiAlertCircle /> High Wastage
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-black text-[10px] uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        <FiTrendingUp /> Optimal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthGuard>
  );
}