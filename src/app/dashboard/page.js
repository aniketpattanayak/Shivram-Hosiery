"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link"; // 🟢 Import Link for Quick Actions
import {
  FiGrid,
  FiActivity,
  FiBox,
  FiArrowUp,
  FiArrowDown,
  FiRefreshCw,
  FiAlertTriangle,
  FiDollarSign,
  FiLayers,
  FiPlusCircle,
  FiFileText,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";

// StatCard Component (Keep as is)
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
  trendDirection,
  isLoading,
}) => (
  <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between h-full transition-all hover:shadow-lg relative overflow-hidden group">
    <div
      className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-5 transition-transform group-hover:scale-150 ${color.bg}`}
    />
    <div className="flex justify-between items-start mb-4">
      <div
        className={`w-12 h-12 rounded-xl ${color.bg} ${color.text} flex items-center justify-center text-xl shadow-sm`}
      >
        <Icon />
      </div>
      {!isLoading && trend && (
        <div
          className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${
            trendDirection === "up"
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {trendDirection === "up" ? (
            <FiArrowUp className="mr-1" />
          ) : (
            <FiArrowDown className="mr-1" />
          )}
          {trend}
        </div>
      )}
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
        {title}
      </p>
      {isLoading ? (
        <div className="h-8 w-24 bg-slate-100 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-extrabold text-slate-800">{value}</p>
      )}
    </div>
  </div>
);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    // 🟢 Added totalRevenue
    metrics: {
      pendingOrders: 0,
      activeJobs: 0,
      inventoryValue: 0,
      lowStockCount: 0,
      totalRevenue: 0,
    },
    lowStockMaterials: [],
    recentActivity: [],
  });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:2121/api/dashboard/stats");
      setData(res.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Executive Dashboard
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            Real-time overview of your factory operations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
          >
            <FiRefreshCw
              className={`${loading ? "animate-spin" : ""}`}
              size={20}
            />
          </button>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>{" "}
            System Live
          </span>
        </div>
      </div>

      {/* 🟢 Quick Actions Bar (New Addition) */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        <Link
          href="/sales"
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:scale-105 transition-transform whitespace-nowrap"
        >
          <FiPlusCircle /> New Order
        </Link>
        <Link
          href="/production"
          className="flex items-center gap-2 px-5 py-3 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 hover:border-blue-300 transition-colors whitespace-nowrap"
        >
          <FiLayers /> Production Plan
        </Link>
        <Link
          href="/finance"
          className="flex items-center gap-2 px-5 py-3 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 hover:border-blue-300 transition-colors whitespace-nowrap"
        >
          <FiFileText /> View Invoices
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Revenue (Replaced Inventory Value or Added) */}
        <StatCard
          title="Total Revenue"
          value={`₹${data.metrics.totalRevenue?.toLocaleString()}`}
          trend="Invoiced"
          trendDirection="up"
          icon={FaRupeeSign}
          color={{ bg: "bg-emerald-600", text: "text-white" }}
          isLoading={loading}
        />

        {/* 2. Pending Orders */}
        <StatCard
          title="Pending Orders"
          value={data.metrics.pendingOrders}
          trend="Needs Action"
          trendDirection={data.metrics.pendingOrders > 5 ? "up" : "down"}
          icon={FiGrid}
          color={{ bg: "bg-blue-600", text: "text-white" }}
          isLoading={loading}
        />

        {/* 3. Active Jobs */}
        <StatCard
          title="Active Jobs (WIP)"
          value={data.metrics.activeJobs}
          trend="Shop Floor"
          trendDirection="up"
          icon={FiLayers}
          color={{ bg: "bg-purple-600", text: "text-white" }}
          isLoading={loading}
        />

        {/* 4. Inventory Value (Moved here instead of Risk) */}
        <StatCard
          title="Inventory Value"
          value={`₹${data.metrics.inventoryValue?.toLocaleString()}`}
          trend="Assets"
          trendDirection="up"
          icon={FiBox}
          color={{ bg: "bg-amber-500", text: "text-white" }}
          isLoading={loading}
        />
      </div>

      {/* Bottom Section: Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Stock List */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FiAlertTriangle className="text-red-500" /> Materials Running Low
          </h3>
          <div className="space-y-4">
            {loading ? (
              <p className="text-slate-400 text-sm">Checking stock...</p>
            ) : data.lowStockMaterials.length === 0 ? (
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold flex items-center gap-2">
                <FiBox /> All materials are well stocked.
              </div>
            ) : (
              data.lowStockMaterials.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-4 bg-red-50/50 rounded-xl border border-red-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="font-bold text-slate-700">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-xs font-black text-red-600 bg-white px-3 py-1 rounded-lg border border-red-100 shadow-sm">
                    {item.current} {item.unit} LEFT
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FiActivity className="text-blue-500" /> Recent Activity
          </h3>
          <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
            {loading ? (
              <p className="pl-6 text-slate-400 text-sm">Loading feed...</p>
            ) : (
              data.recentActivity.map((act, idx) => (
                <div key={idx} className="relative pl-8">
                  <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white bg-blue-500 ring-4 ring-blue-50"></span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    {act.time}
                  </p>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {act.action}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">{act.desc}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
