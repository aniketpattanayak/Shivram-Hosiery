"use client";
import { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";
import AuthGuard from "@/components/AuthGuard";
import { 
  FiPackage, FiTruck, FiTrendingUp, FiAlertCircle, 
  FiClock, FiSearch, FiLayers, FiInfo 
} from "react-icons/fi";

export default function SurplusDashboard() {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSurplusReport();
  }, []);

  const fetchSurplusReport = async () => {
    try {
      setLoading(true);
      const res = await api.get("/surplus/report");
      setReport(res.data);
    } catch (err) {
      console.error("Failed to fetch surplus report", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReport = useMemo(() => {
    return report.filter(item => 
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, report]);

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-slate-400">CALCULATING SHADOW LEDGER...</div>;

  return (
    <AuthGuard requiredPermission="inventory">
      <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in duration-500 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <FiTrendingUp className="text-orange-600" /> SURPLUS PIECES TRACKER
            </h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">
              Shadow Ledger: Tracking Extra Quantity by Lot Number
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Vendor, Item or Lot..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-orange-50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-orange-600 p-6 rounded-[2rem] text-white shadow-xl">
                <p className="text-[10px] font-black uppercase opacity-70">Total Extra Pieces (Live)</p>
                <h2 className="text-4xl font-black mt-2">
                    {report.reduce((acc, item) => acc + item.remainingSurplus, 0)}
                </h2>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold bg-orange-700/50 w-fit px-3 py-1 rounded-full">
                    <FiLayers /> {report.filter(i => i.remainingSurplus > 0).length} Active Batches
                </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase">Most Frequent Vendor</p>
                <h2 className="text-2xl font-black text-slate-800 mt-2 truncate">
                    {report[0]?.vendorName || "N/A"}
                </h2>
                <p className="text-xs font-bold text-orange-600 mt-1 uppercase">Surplus Specialist</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <p className="text-[10px] font-black uppercase opacity-70">Shadow Integrity</p>
                    <FiInfo className="opacity-50" />
                </div>
                <p className="text-[11px] font-medium leading-relaxed italic opacity-80">
                    "Extra pieces remain at original count until main stock is fully depleted from the lot."
                </p>
            </div>
        </div>

        {/* The Surplus Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-6">Batch / Vendor</th>
                <th className="p-6">Item Details</th>
                <th className="p-6 text-center">Ordered</th>
                <th className="p-6 text-center">Received</th>
                <th className="p-6 text-center">Current Total</th>
                <th className="p-6 text-right">Extra Left</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredReport.map((item) => (
                <tr key={item._id} className={`hover:bg-slate-50 transition-colors ${item.remainingSurplus > 0 ? 'bg-orange-50/20' : ''}`}>
                  <td className="p-6">
                    <p className="font-black text-slate-900 text-sm">{item.lotNumber}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mt-1">
                      <FiTruck /> {item.vendorName}
                    </p>
                  </td>
                  <td className="p-6">
                    <p className="font-bold text-slate-800 text-sm">{item.itemName}</p>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${item.itemType === 'Raw Material' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {item.itemType}
                    </span>
                  </td>
                  <td className="p-6 text-center font-bold text-slate-400">{item.orderedQty}</td>
                  <td className="p-6 text-center font-bold text-slate-900">{item.receivedQty}</td>
                  <td className="p-6 text-center">
                    <div className="flex flex-col items-center">
                        <span className="font-black text-slate-800">{item.currentTotalInLot}</span>
                        <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div 
                                className="h-full bg-orange-500" 
                                style={{ width: `${Math.min(100, (item.currentTotalInLot / item.receivedQty) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex flex-col items-end">
                        <span className={`text-lg font-black ${item.remainingSurplus > 0 ? 'text-orange-600' : 'text-slate-300'}`}>
                            {item.remainingSurplus}
                        </span>
                        <p className="text-[9px] font-black uppercase text-slate-400">
                            of {item.originalSurplus} extra
                        </p>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReport.length === 0 && (
                <tr>
                    <td colSpan="6" className="p-20 text-center text-slate-400 font-bold italic">
                        No Surplus Records Found.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AuthGuard>
  );
}