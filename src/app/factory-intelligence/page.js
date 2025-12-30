"use client";
import { useState, useEffect } from "react";
import api from "@/utils/api";
import ProductionFunnel from "@/components/ProductionFunnel";
import DefectHeatmap from "@/components/DefectHeatmap";
import {
  FiDollarSign,
  FiActivity,
  FiTruck,
  FiUsers,
  FiCalendar,
  FiTarget,
  FiTrendingUp,
  FiArrowUpRight,
  FiPieChart,
  FiBarChart2,
} from "react-icons/fi";

export default function FactoryIntelligence() {
  const [activeTab, setActiveTab] = useState("SALES");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get(
          `/analytics/factory-intelligence?startDate=${dateRange.start}&endDate=${dateRange.end}`
        );
        setData(res.data);
      } catch (e) {
        console.error("Sync Failed:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [dateRange]);

  if (loading)
    return (
      <div className="p-20 text-center font-black uppercase text-xs tracking-[0.3em] text-slate-400 animate-pulse">
        Initializing Hub...
      </div>
    );
  if (!data)
    return (
      <div className="p-20 text-center font-black text-red-500">
        CRITICAL: Server Not Responding
      </div>
    );

  return (
    <div className="p-8 bg-slate-50 min-h-screen space-y-8 animate-in fade-in duration-700">
      {/* 🚀 1. STRATEGIC HEADER & DATE FILTERS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b pb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
            <FiTarget className="text-blue-600" /> Intelligence Hub
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase mt-1 tracking-widest leading-none">
            Enterprise Command Surface
          </p>
        </div>
        <div className="flex gap-2 bg-white p-2 rounded-xl border shadow-sm">
          <FiCalendar className="text-slate-400 ml-2 mt-1" />
          <input
            type="date"
            value={dateRange.start}
            className="text-[10px] font-black outline-none bg-transparent"
            onChange={(e) =>
              setDateRange({ ...dateRange, start: e.target.value })
            }
          />
          <span className="text-slate-300 font-bold">→</span>
          <input
            type="date"
            value={dateRange.end}
            className="text-[10px] font-black outline-none bg-transparent"
            onChange={(e) =>
              setDateRange({ ...dateRange, end: e.target.value })
            }
          />
        </div>
      </div>

      {/* 🚀 2. DASHBOARD NAVIGATION TABS */}
      <div className="flex p-1.5 bg-slate-200 rounded-2xl gap-1 w-fit shadow-inner">
        {[
          { id: "SALES", label: "Sales & Trends", icon: FiDollarSign },
          { id: "PRODUCTION", label: "Production Floor", icon: FiActivity },
          { id: "VENDOR", label: "Vendor Performance", icon: FiTruck },
          { id: "EMPLOYEES", label: "User Audit", icon: FiUsers },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-md scale-105"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon /> {tab.label}
          </button>
        ))}
      </div>

      {/* 🚀 3. DYNAMIC CONTENT AREA */}
      <div className="animate-in slide-in-from-bottom-6 duration-500">
        {/* --- SALES PERFORMANCE DASHBOARD --- */}
        {activeTab === "SALES" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Gross Revenue
                </p>
                <h2 className="text-3xl font-black text-slate-900 mt-2">
                  ₹
                  {data.sales
                    ?.reduce((acc, curr) => acc + curr.revenue, 0)
                    .toLocaleString()}
                </h2>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-blue-600">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Units Shipped
                </p>
                <h2 className="text-3xl font-black mt-2">
                  {data.sales
                    ?.reduce((acc, curr) => acc + curr.units, 0)
                    .toLocaleString()}{" "}
                  <span className="text-xs">PCS</span>
                </h2>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-emerald-600">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Growth Trend
                </p>
                <h2 className="text-3xl font-black mt-2 flex items-center gap-2">
                  <FiTrendingUp /> 14%
                </h2>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Active Arts
                </p>
                <h2 className="text-3xl font-black text-slate-900 mt-2">
                  {data.sales?.length || 0}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* DAILY SALES GRAPH */}
              <div className="lg:col-span-2 bg-white p-8 rounded-3xl border shadow-xl">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">
                    Revenue Velocity (Daily)
                  </h3>
                  <FiBarChart2 className="text-blue-500" size={20} />
                </div>
                <div className="h-64 flex items-end justify-between gap-3 px-2 border-b border-slate-100 pb-2">
                  {data.salesTrends?.length > 0 ? (
                    data.salesTrends.map((day, i) => (
                      <div
                        key={i}
                        className="flex-1 group relative flex flex-col items-center"
                      >
                        <div
                          className="w-full bg-blue-600 rounded-t-lg transition-all duration-700 hover:bg-blue-400 cursor-pointer"
                          style={{
                            height: `${
                              (day.dailyRevenue /
                                Math.max(
                                  ...data.salesTrends.map(
                                    (d) => d.dailyRevenue
                                  ),
                                  1
                                )) *
                              100
                            }%`,
                          }}
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] p-2 rounded shadow-2xl z-20 whitespace-nowrap font-black">
                            ₹{day.dailyRevenue.toLocaleString()}
                          </div>
                        </div>
                        <span className="text-[7px] font-black text-slate-400 mt-2 rotate-45">
                          {day._id.split("-")[2]}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="w-full text-center pb-20 text-slate-300 font-bold uppercase text-xs italic">
                      No Completion logs found for graph
                    </div>
                  )}
                </div>
              </div>

              {/* PRODUCT RANKING */}
              <div className="bg-white rounded-3xl border shadow-xl overflow-hidden flex flex-col">
                <div className="p-6 border-b bg-slate-50/50">
                  <h3 className="font-black text-slate-900 uppercase text-xs">
                    Top Art Numbers
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[400px]">
                  <table className="w-full text-left text-xs">
                    <tbody className="divide-y divide-slate-100">
                      {data.sales?.map((item, i) => (
                        <tr
                          key={i}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="p-4">
                            <p className="font-bold text-slate-800">
                              {item._id}
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold">
                              {item.units} PCS
                            </p>
                          </td>
                          <td className="p-4 text-right font-black text-slate-900">
                            ₹{item.revenue.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- PRODUCTION DASHBOARD --- */}
        {activeTab === "PRODUCTION" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ProductionFunnel jobs={data.production || []} />
            </div>
            <div className="lg:col-span-1">
              <DefectHeatmap defects={data.defectAnalysis || []} />
            </div>
          </div>
        )}

        {/* --- VENDOR PERFORMANCE --- */}
        {activeTab === "VENDOR" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* 📊 1. VENDOR SERVICE KPI STRIP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border shadow-sm border-l-4 border-l-blue-500">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Active Outsource Partners
                </p>
                <h2 className="text-3xl font-black text-slate-900 mt-2">
                  {data.vendor?.length || 0} Vendors
                </h2>
              </div>
              <div className="bg-white p-6 rounded-3xl border shadow-sm border-l-4 border-l-amber-500">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total Pending Pieces (WIP)
                </p>
                <h2 className="text-3xl font-black text-slate-900 mt-2">
                  {data.vendor
                    ?.reduce((acc, curr) => acc + curr.pendingInFloor, 0)
                    .toLocaleString()}{" "}
                  <span className="text-sm">PCS</span>
                </h2>
              </div>
              <div className="bg-white p-6 rounded-3xl border shadow-sm border-l-4 border-l-emerald-500">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Avg. Factory Yield
                </p>
                <h2 className="text-3xl font-black text-emerald-600 mt-2">
                  {(
                    data.vendor?.reduce((acc, curr) => acc + curr.yield, 0) /
                    (data.vendor?.length || 1)
                  ).toFixed(1)}
                  %
                </h2>
              </div>
            </div>

            {/* 📋 2. DETAILED SERVICE & ACCOUNTABILITY TABLE */}
            <div className="bg-white rounded-3xl border shadow-2xl overflow-hidden">
              <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">
                  Vendor Accountability Matrix
                </h3>
                <div className="flex gap-4">
                  <span className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>{" "}
                    Passed
                  </span>
                  <span className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>{" "}
                    Rejected
                  </span>
                </div>
              </div>

              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b">
                  <tr>
                    <th className="p-6">Service Provider</th>
                    <th className="p-6 text-center">Active Job Work</th>
                    <th className="p-6 text-center">Pending PCs (WIP)</th>
                    <th className="p-6 text-center">Passed vs Rejected</th>
                    <th className="p-6 text-right">Service Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.vendor?.map((v, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50/80 transition-all group"
                    >
                      <td className="p-6">
                        <div className="font-black text-slate-900 uppercase text-sm group-hover:text-blue-600 transition-colors">
                          {v._id}
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                          Outsource Partner
                        </div>
                      </td>

                      <td className="p-6 text-center">
                        <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-600">
                          {v.activeJobCards} Cards
                        </span>
                      </td>

                      <td className="p-6 text-center font-black text-amber-600 text-sm">
                        {v.pendingInFloor.toLocaleString()}{" "}
                        <span className="text-[10px] opacity-60">PCS</span>
                      </td>

                      <td className="p-6">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex gap-4 font-black text-xs">
                            <span className="text-emerald-600">{v.passed}</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-red-500">{v.rejected}</span>
                          </div>
                          <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden flex">
                            <div
                              className="h-full bg-emerald-500"
                              style={{
                                width: `${
                                  (v.passed / (v.passed + v.rejected || 1)) *
                                  100
                                }%`,
                              }}
                            ></div>
                            <div
                              className="h-full bg-red-500"
                              style={{
                                width: `${
                                  (v.rejected / (v.passed + v.rejected || 1)) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      <td className="p-6 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={`text-xs font-black uppercase ${
                              v.yield > 95
                                ? "text-emerald-600"
                                : v.yield > 85
                                ? "text-blue-600"
                                : "text-red-600"
                            }`}
                          >
                            {v.yield.toFixed(1)}% Yield
                          </span>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                            Reliability Index
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

{/* --- 👥 RESTORED PREVIOUS CARD UI --- */}
{activeTab === "EMPLOYEES" && (
  <div className="animate-in fade-in duration-500">
    <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Employee Name</th>
            <th className="p-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
            <th className="p-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Pieces Handled</th>
            <th className="p-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Activity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-bold text-xs">
          {data.employees?.map((emp, i) => (
            <tr key={`${emp._id}-${i}`} className="hover:bg-slate-50 transition-colors">
              <td className="p-4 text-slate-900 uppercase tracking-tighter">
                {emp._id}
              </td>
              <td className="p-4 text-center text-blue-600">
                {emp.engagement}
              </td>
              <td className="p-4 text-center text-slate-600">
                {(emp.output || 0).toLocaleString()} PCS
              </td>
              <td className="p-4 text-right text-slate-400">
                {emp.lastSync ? new Date(emp.lastSync).toLocaleTimeString() : "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
      </div>
    </div>
  );
}
