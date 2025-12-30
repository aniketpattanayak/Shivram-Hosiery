"use client";
import { FiAlertCircle } from "react-icons/fi";

export default function DefectHeatmap({ defects = [] }) {
  // 🟢 30-YEAR INSIGHT: Always provide a fallback [] and handle empty states
  if (defects.length === 0) return (
    <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Defects Logged</p>
    </div>
  );

  const maxLost = Math.max(...defects.map(d => d.totalLost), 1);

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl animate-in fade-in duration-700">
      <div className="mb-6">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <FiAlertCircle className="text-red-500" /> Root Cause Analysis
        </h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Top 5 Defect Categories by Volume</p>
      </div>

      <div className="space-y-6">
        {defects.map((defect, i) => (
          <div key={i} className="relative">
            <div className="flex justify-between text-[10px] font-black uppercase mb-2">
              <span className="text-slate-600 truncate max-w-[150px]">{defect._id || "Uncategorized"}</span>
              <span className="text-red-600 font-black">{defect.totalLost} PCS Lost</span>
            </div>
            <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100">
              <div 
                className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${(defect.totalLost / maxLost) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}