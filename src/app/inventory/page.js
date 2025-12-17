"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { FiPlus } from "react-icons/fi";
import AddMaterialModal from "./AddMaterialModal";
import api from '@/utils/api';
import AuthGuard from '@/components/AuthGuard';

export default function InventoryPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const res = await api.get("/inventory/stock");
      setMaterials(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Helper to Get Status Badge
  const getStatusBadge = (status) => {
    const s = status ? status.toUpperCase() : "UNKNOWN";
    if (s === "CRITICAL")
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
          CRITICAL
        </span>
      );
    if (s === "MEDIUM")
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100">
          MEDIUM
        </span>
      );
    if (s === "OPTIMAL")
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
          OPTIMAL
        </span>
      );
    if (s === "EXCESS")
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-600 border border-purple-100">
          EXCESS
        </span>
      );
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
        {s}
      </span>
    );
  };

  return (
    <AuthGuard requiredPermission="inventory">
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Live Inventory
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            Real-time tracking of raw materials and reservations.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
        >
          <FiPlus /> Add Material
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
              <th className="px-6 py-4">Material</th>
              <th className="px-6 py-4">Physical Stock</th>
              <th className="px-6 py-4">Reserved</th>
              <th className="px-6 py-4">Net Available</th>
              <th className="px-6 py-4">Target Level</th>
              <th className="px-6 py-4 text-center">Health %</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {materials.map((item) => {
              // 🟢 1. Calculate Metric: Stock At Least (Target)
              // Formula: Avg Consumption * Lead Time * Safety Stock (Factor)
              const avg = item.avgConsumption || 0;
              const lead = item.leadTime || 0;
              const safetyFactor = item.safetyStock || 0;

              const requiredStock = avg * lead * safetyFactor;

              // 🟢 2. Calculate Net Available
              const current = item.stock?.current || 0;
              const reserved = item.stock?.reserved || 0;
              const netAvailable = current - reserved;

              // 🟢 3. Calculate Health %
              // If requiredStock is 0, avoid division by zero (Assume 100% healthy if we have any stock)
              let healthPercent = 0;
              if (requiredStock > 0) {
                healthPercent = (netAvailable / requiredStock) * 100;
              } else {
                healthPercent = netAvailable > 0 ? 100 : 0;
              }

              // 🟢 4. Determine Dynamic Status
              let dynamicStatus = "HEALTHY";
              if (healthPercent < 33) dynamicStatus = "CRITICAL";
              else if (healthPercent >= 33 && healthPercent < 66)
                dynamicStatus = "MEDIUM";
              else if (healthPercent >= 66 && healthPercent <= 100)
                dynamicStatus = "OPTIMAL";
              else if (healthPercent > 100) dynamicStatus = "EXCESS";

              return (
                <tr
                  key={item._id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{item.name}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {item.materialId}
                    </div>
                  </td>

                  <td className="px-6 py-4 font-mono font-bold text-slate-600">
                    {Number(current).toFixed(2)} {item.unit}
                  </td>

                  <td className="px-6 py-4 font-mono font-bold text-amber-600 bg-amber-50/10">
                    {Number(reserved).toFixed(2)}
                  </td>

                  {/* Net Available with Rounding */}
                  <td className="px-6 py-4 font-mono font-black text-slate-800">
                    {Number(netAvailable).toFixed(2)}
                  </td>

                  {/* 🟢 NEW: Calculated Target Level */}
                  <td className="px-6 py-4 font-mono font-bold text-slate-400">
                    {Number(requiredStock).toFixed(2)}
                  </td>

                  {/* 🟢 NEW: Health % */}
                  <td className="px-6 py-4 text-center font-mono font-bold text-slate-700">
                    {healthPercent.toFixed(0)}%
                  </td>

                  {/* 🟢 NEW: Dynamic Status */}
                  <td className="px-6 py-4 text-center">
                    {getStatusBadge(dynamicStatus)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <AddMaterialModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchStock();
          }}
        />
      )}
    </div>
    </AuthGuard>
  );
}
