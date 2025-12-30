"use client";
import { useMemo } from "react";
import { 
  FiScissors, FiLayers, FiShield, FiPackage, FiCheckCircle, FiAlertCircle 
} from "react-icons/fi";

export default function ProductionFunnel({ jobs = [] }) {
  const pipelineStats = useMemo(() => {
    const stats = { Cutting: 0, Stitching: 0, AssemblyQC: 0, Packing: 0, FinalQC: 0, Held: 0 };

    jobs.forEach(job => {
      if (job.status === "QC_HOLD") stats.Held += job.totalQty || 0;

      switch (job._id) { // Grouped by _id from the backend facet
        case "Cutting_Started": stats.Cutting += job.totalUnits || 0; break;
        case "Sewing_Started": stats.Stitching += job.totalUnits || 0; break;
        case "QC_Pending": stats.AssemblyQC += job.totalUnits || 0; break;
        case "Packaging_Started": stats.Packing += job.totalUnits || 0; break;
        case "Final_QC": stats.FinalQC += job.totalUnits || 0; break;
        default: break;
      }
    });
    return stats;
  }, [jobs]);

  const stages = [
    { label: "Cutting", val: pipelineStats.Cutting, color: "bg-amber-500", icon: FiScissors },
    { label: "Stitching", val: pipelineStats.Stitching, color: "bg-indigo-500", icon: FiLayers },
    { label: "Assembly QC", val: pipelineStats.AssemblyQC, color: "bg-blue-500", icon: FiShield },
    { label: "Packing", val: pipelineStats.Packing, color: "bg-purple-500", icon: FiPackage },
    { label: "Final QC", val: pipelineStats.FinalQC, color: "bg-emerald-500", icon: FiCheckCircle },
  ];

  const maxVal = Math.max(...stages.map(s => s.val), 1);

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Production Pipeline</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Volume across active stages</p>
        </div>
        {pipelineStats.Held > 0 && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl border border-red-100 animate-pulse">
            <FiAlertCircle size={14} />
            <span className="text-[10px] font-black uppercase">{pipelineStats.Held} Units on Hold</span>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {stages.map((stage, idx) => (
          <div key={idx} className="group">
            <div className="flex justify-between items-end mb-1 px-1">
              <div className="flex items-center gap-2">
                <stage.icon className="text-slate-400" size={14} />
                <span className="text-[10px] font-black text-slate-500 uppercase">{stage.label}</span>
              </div>
              <span className="font-black text-slate-900 text-sm">{stage.val.toLocaleString()} PCS</span>
            </div>
            <div className="w-full bg-slate-50 h-10 rounded-xl flex items-center px-1 border border-slate-100 overflow-hidden">
              <div 
                className={`h-8 rounded-lg ${stage.color} shadow-lg transition-all duration-1000`}
                style={{ width: `${Math.max((stage.val / maxVal) * 100, 5)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}